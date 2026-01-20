/**
 * Express Types
 * Type extensions for Express Request and Response objects
 */

import type { Request, Response } from 'express';
import type * as Common from '~/types/common';
import type * as Mongoose from '~/types/mongoose';

// ============================================================================
// Extended Request Interface
// ============================================================================

/**
 * Extended Express Request with authentication and custom properties
 */
export interface AuthenticatedRequest<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, string | undefined>,
  Locals extends Record<string, unknown> = Record<string, unknown>,
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  /** Currently authenticated user */
  user?: Common.User;
  /** User document from database (Mongoose) */
  userDoc?: Mongoose.UserDocument;
  /** JWT token */
  token?: string;
  /** Request ID for tracing/logging */
  requestId?: string;
  /** Session data */
  session?: SessionData;
  /** File upload data */
  file?: MulterFile;
  files?: MulterFile[];
}

/**
 * Session data structure
 */
export interface SessionData {
  userId?: string;
  username?: string;
  email?: string;
  isAuthenticated?: boolean;
  createdAt?: Date;
  expiresAt?: Date;
  [key: string]: string | boolean | Date | undefined;
}

/**
 * Multer file upload interface
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

// ============================================================================
// Extended Response Interface
// ============================================================================

/**
 * Extended Express Response with custom helper methods
 */
export interface ExtendedResponse<
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>,
> extends Response<ResBody, Locals> {
  /**
   * Send a success response
   */
  success<T = unknown>(data: T, message?: string, statusCode?: number): this;

  /**
   * Send an error response
   */
  error(message: string, statusCode?: number, details?: unknown): this;

  /**
   * Send a paginated response
   */
  paginated<T = unknown>(data: T[], pagination: Common.Pagination, message?: string): this;
}

// ============================================================================
// Request Handler Types
// ============================================================================

/**
 * Express request handler with authentication
 */
export type AuthRequestHandler<
  TParams = Record<string, string>,
  TResBody = unknown,
  TReqBody = unknown,
  TQuery = Record<string, string | undefined>,
> = (
  req: AuthenticatedRequest<TParams, TResBody, TReqBody, TQuery>,
  res: ExtendedResponse,
  next: NextFunction
) => void | Promise<void>;

/**
 * Express middleware function type
 */
export type MiddlewareFunction = (
  req: AuthenticatedRequest,
  res: ExtendedResponse,
  next: NextFunction
) => void | Promise<void>;

/**
 * Express error handler
 */
export type ErrorHandler = (
  err: Error,
  req: AuthenticatedRequest,
  res: ExtendedResponse,
  next: NextFunction
) => void | Promise<void>;

/**
 * Next function type
 */
export type NextFunction = (err?: unknown) => void;

// ============================================================================
// Route Parameter Types
// ============================================================================

/**
 * Common route parameters
 */
export interface RouteParams {
  id?: string;
  userId?: string;
  postId?: string;
  commentId?: string;
  voteId?: string;
  quoteId?: string;
  messageId?: string;
  messageRoomId?: string;
  notificationId?: string;
  groupId?: string;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Common query parameters for pagination, search and filtering
 */
export interface QueryParams {
  // Pagination
  limit?: string;
  offset?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  // Search
  q?: string;
  query?: string;
  searchKey?: string;
  // Filters
  startDateRange?: string;
  endDateRange?: string;
  userId?: string;
  postId?: string;
  groupId?: string;
  status?: string;
  type?: string;
}

/** @deprecated Use QueryParams instead */
export type PaginationQuery = Pick<
  QueryParams,
  'limit' | 'offset' | 'page' | 'pageSize' | 'sort' | 'order'
>;
/** @deprecated Use QueryParams instead */
export type SearchQuery = Pick<
  QueryParams,
  'limit' | 'offset' | 'page' | 'pageSize' | 'sort' | 'order' | 'q' | 'query' | 'searchKey'
>;
/** @deprecated Use QueryParams instead */
export type FilterQuery = QueryParams;

// ============================================================================
// Response Body Types
// ============================================================================

/**
 * Standard API success response
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard API error response
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: unknown;
  };
  timestamp: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: Common.Pagination;
  message?: string;
  timestamp: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * JWT payload structure
 */
export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  admin?: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Login request body
 */
export interface LoginRequest {
  username: string;
  password: string;
  tos?: boolean;
  coc?: boolean;
}

/**
 * Login response body
 */
export interface LoginResponse {
  user: Common.User;
  token: string;
  expiresIn: number;
}

/**
 * Signup request body
 */
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
  inviteCode?: string;
  tos: boolean;
  coc: boolean;
}

/**
 * Signup response body
 */
export interface SignupResponse {
  user: Common.User;
  token: string;
  expiresIn: number;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if request is authenticated
 */
export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return 'user' in req && req.user !== undefined;
}

/**
 * Type guard to check if user is admin
 */
export function isAdminUser(user: Common.User | undefined): user is Common.User & { admin: true } {
  return user !== undefined && user.admin === true;
}

// ============================================================================
// Module Augmentation
// ============================================================================

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: Common.User;
      userDoc?: Mongoose.UserDocument;
      token?: string;
      requestId?: string;
    }
  }
}
