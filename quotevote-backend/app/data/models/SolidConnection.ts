import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface for Solid Connection document
 */
export interface ISolidConnection extends Document {
    userId: mongoose.Types.ObjectId;
    webId: string;
    issuer: string;
    encryptedTokens: string; // Encrypted JSON containing access/refresh tokens
    scopes: string[];
    idTokenClaims?: Record<string, unknown>;
    tokenExpiry?: Date;
    resourceUris?: {
        profile?: string;
        preferences?: string;
        activityLedger?: string;
    };
    lastSyncAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Solid Connection Schema
 * Stores encrypted credentials and metadata for user's Solid Pod connection
 */
const SolidConnectionSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        webId: {
            type: String,
            required: true,
        },
        issuer: {
            type: String,
            required: true,
        },
        encryptedTokens: {
            type: String,
            required: true,
        },
        scopes: {
            type: [String],
            default: [],
        },
        idTokenClaims: {
            type: Schema.Types.Mixed,
            default: {},
        },
        tokenExpiry: {
            type: Date,
        },
        resourceUris: {
            profile: String,
            preferences: String,
            activityLedger: String,
        },
        lastSyncAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
SolidConnectionSchema.index({ userId: 1 });
SolidConnectionSchema.index({ webId: 1 });

export const SolidConnection = mongoose.model<ISolidConnection>(
    'SolidConnection',
    SolidConnectionSchema
);
