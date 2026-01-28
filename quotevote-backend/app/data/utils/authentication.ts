import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { GraphQLError } from 'graphql';
import type { Request, Response } from 'express';
import { logger } from './logger';
import User from '../models/User';
import type { JWTPayload } from '../../types/express';


/**
 * Environment Variables correctly typed via process.env augmentation
 * as per app/types/environment.ts
 */
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        logger.error('CRITICAL: process.env.JWT_SECRET is not defined. Authentication is insecure.');
        throw new Error('process.env.JWT_SECRET must be defined in production.');
    } else {
        logger.warn('NOTICE: process.env.JWT_SECRET is not defined. Using development fallback secret.');
    }
}

const safeSecret = JWT_SECRET || 'dev_jwt_secret_fallback_do_not_use_in_prod';

/**
 * Formats a string to title case (e.g., "fast_food" -> "Fast_food").
 * @param str The string to format.
 * @returns The formatted string.
 */
const toTitleCase = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Creates a guest user with a random username and password.
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves when the user is created.
 */
export const createGuestUser = async (req: Request, res: Response): Promise<void> => {
    logger.info('Creating guest user', { body: req.body });

    try {
        const randomUser = crypto.randomBytes(20).toString('hex');
        // const hashPassword = await generateHashPassword(randomUser); // Unused

        const newUser = await User.create({
            name: 'guest',
            username: randomUser,
            email: `${randomUser}@gmail.com`,
            password: randomUser,
        });
        res.status(201).json(newUser);
    } catch (err) {
        logger.error('createGuestUser error', { error: err instanceof Error ? err.message : String(err) });
        res.status(500).json({ message: 'Internal server error while creating guest user' });
    }
};

/**
 * Registers a new user after validating required fields and checking for existing usernames.
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves to void.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    logger.info('Registering new user', { username: req.body.username });
    try {
        const requiredFields = ['name', 'email', 'username', 'password'];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                res.status(400).json({
                    error_message: `${toTitleCase(field)} is required.`,
                });
                return;
            }
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            res.status(409).json({
                error_message: `Username ${existingUser.username} already exists!`,
            });
            return;
        }

        const { name, email, username, password, status } = req.body;

        const user = await User.create({
            name,
            email,
            username,
            password,
            accountStatus: status === 'disabled' ? 'disabled' : 'active',
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
            },
        });
    } catch (err) {
        logger.error('Registration error', { error: err });
        res.status(500).json({
            error_message: 'Error saving user',
        });
    }
};

/**
 * Generates a bcrypt hash for a given password.
 * @param password The plain-text password.
 * @returns A promise that resolves to the hashed password.
 */
export const generateHashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

const invalidUserPassword = (res: Response) => {
    return res.status(401).json({ message: 'Invalid username or password.' });
};

interface AddCreatorToUserParams {
    username: string;
    password?: string;
    requirePassword?: boolean;
}

/**
 * Internal helper to generate a JWT token and handle user authentication response.
 * @param params Authentication parameters including username and password.
 * @param res Express response object.
 * @param authenticate Whether to return only the tokens or the full user object.
 * @param expiresIn Access token expiration time in seconds (default 15m).
 * @param tokenOnly If true, returns only the access token string.
 * @returns A promise that resolves to the response or token string.
 */
export const addCreatorToUser = async (
    { username, password, requirePassword }: AddCreatorToUserParams,
    res: Response,
    authenticate: boolean,
    expiresIn: number = 60 * 15, // Default 15 minutes for access token
    tokenOnly: boolean = false
): Promise<Response | string | void> => {
    const isEmail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(username);
    const user = await User.findOne(isEmail ? { email: username } : { username });

    if (!user) {
        return invalidUserPassword(res);
    }

    // Check if account is disabled
    if (user.accountStatus === 'disabled') {
        return res.status(403).json({
            message:
                'Your account has been flagged as a bot and temporarily disabled. If you believe this is a mistake, please email admin@quote.vote to appeal.',
            accountDisabled: true,
        });
    }

    if (requirePassword) {
        if (!password) return invalidUserPassword(res);
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return invalidUserPassword(res);
    }

    const payload: JWTPayload = {
        email: user.email,
        username: user.username,
        userId: user._id.toString(),
        admin: user.admin,
    };

    const accessToken = jwt.sign(payload, safeSecret, { expiresIn });
    const refreshToken = generateRefreshToken(payload);

    if (tokenOnly) {
        return accessToken;
    }

    if (authenticate) {
        return res.json({
            accessToken,
            refreshToken,
        });
    }

    return res.json({
        accessToken,
        refreshToken,
        user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            admin: user.admin,
            accountStatus: user.accountStatus,
        },
    });
};

/**
 * Handles user login and returns a JWT token.
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves to the response.
 */
export const login = async (req: Request, res: Response): Promise<Response | void> => {
    const { username, password } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }
    if (!password) {
        return res.status(400).json({ message: 'Password is required.' });
    }

    return addCreatorToUser(
        { username, password, requirePassword: true },
        res,
        false
    ) as Promise<Response | void>;
};

/**
 * Authenticates a user and returns a JWT token (strict mode).
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves to the response.
 */
export const authenticate = async (req: Request, res: Response): Promise<Response | void> => {
    logger.info('Performing strict authentication', { username: req.body.username });
    const { username, password } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }
    if (!password) {
        return res.status(400).json({ message: 'Password is required.' });
    }

    return addCreatorToUser(
        { username, password, requirePassword: true },
        res,
        true
    ) as Promise<Response | void>;
};

/**
 * Generates a long-lived refresh token.
 * @param payload The JWT payload.
 * @returns The signed refresh token.
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
    // Refresh tokens typically don't have sensitive info beyond ID
    const refreshPayload = {
        userId: payload.userId,
        type: 'refresh',
    };
    return jwt.sign(refreshPayload, safeSecret, { expiresIn: '7d' });
};

/**
 * Endpoint handler to issue a new access token using a refresh token.
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves to the response.
 */
export const refresh = async (req: Request, res: Response): Promise<Response | void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required.' });
    }

    try {
        const decoded = jwt.verify(refreshToken, safeSecret) as { userId: string; type: string };

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ message: 'Invalid refresh token type.' });
        }

        const user = await User.findById(decoded.userId);
        if (!user || user.accountStatus === 'disabled') {
            return res.status(401).json({ message: 'User not found or account disabled.' });
        }

        const payload: JWTPayload = {
            email: user.email,
            username: user.username,
            userId: user._id.toString(),
            admin: user.admin,
        };

        const accessToken = jwt.sign(payload, safeSecret, { expiresIn: '15m' });

        return res.json({
            accessToken,
            refreshToken, // Sending same or could rotate
        });
    } catch {
        // Log error if needed, or just suppress
        return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }
};

/**
 * Verifies a JWT token and returns the decoded payload.
 * Throws GraphQLError if verification fails, suitable for GraphQL context usage.
 * @param authToken Raw authorization header or token string.
 * @returns Decoded JWT payload.
 * @throws GraphQLError if token is invalid or expired.
 */
export const verifyToken = async (authToken: string): Promise<JWTPayload> => {
    // Remove 'Bearer ' prefix if present
    const token = authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken;

    try {
        const decoded = jwt.verify(token, safeSecret) as JWTPayload;
        return decoded;
    } catch (err: unknown) {
        const error = err as Error;
        logger.error('Token verification failed', { error: error.message });

        if (error.message === 'invalid issuer') {
            throw new GraphQLError('Token issued cannot be used in this endpoint.', {
                extensions: { code: 'UNAUTHENTICATED' },
            });
        }

        if (error.name === 'JsonWebTokenError' || error.message === 'invalid signature') {
            throw new GraphQLError(`Invalid access token: ${error.message}`, {
                extensions: { code: 'UNAUTHENTICATED' },
            });
        } else if (error.name === 'TokenExpiredError') {
            throw new GraphQLError('Access token has expired', {
                extensions: { code: 'UNAUTHENTICATED' },
            });
        }

        throw new GraphQLError('Authentication failed', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};
