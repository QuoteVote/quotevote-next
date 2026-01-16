/**
 * Solid Pod Integration Module
 * 
 * This module provides backend support for Solid Pod integration,
 * allowing users to connect their Solid Pods and sync portable user data.
 * 
 * @module solid
 */

// OIDC
export * from './oidc/discovery';
export * from './oidc/authorization';

// Client
export * from './client/solidClient';

// Storage
export * from './storage/encryption';

// Sync
export * from './sync/syncService';

// Schemas
export * from './schemas/portable';
