/**
 * GraphQL Type Definitions for Solid Pod Integration
 */

export const solidTypeDefs = `#graphql
  # Solid Connection Status
  type SolidConnectionStatus {
    connected: Boolean!
    webId: String
    issuer: String
    lastSyncAt: String
  }

  # Solid Connection Result
  type SolidConnectionResult {
    success: Boolean!
    webId: String
    issuer: String
    message: String
  }

  # Authorization URL Response
  type AuthorizationUrlResponse {
    authorizationUrl: String!
  }

  # Portable Profile
  type PortableProfile {
    displayName: String!
    avatarUrl: String
    bio: String
  }

  # Notification Preferences
  type NotificationPreferences {
    email: Boolean!
    push: Boolean!
    inApp: Boolean!
  }

  # Accessibility Preferences
  type AccessibilityPreferences {
    reduceMotion: Boolean!
    fontScale: String!
  }

  # Portable Preferences
  type PortablePreferences {
    theme: String!
    notifications: NotificationPreferences!
    accessibility: AccessibilityPreferences!
  }

  # Portable State
  type PortableState {
    portableSchemaVersion: String!
    profile: PortableProfile!
    preferences: PortablePreferences!
    updatedAt: String!
  }

  # Input Types
  input PortableProfileInput {
    displayName: String
    avatarUrl: String
    bio: String
  }

  input NotificationPreferencesInput {
    email: Boolean
    push: Boolean
    inApp: Boolean
  }

  input AccessibilityPreferencesInput {
    reduceMotion: Boolean
    fontScale: String
  }

  input PortablePreferencesInput {
    theme: String
    notifications: NotificationPreferencesInput
    accessibility: AccessibilityPreferencesInput
  }

  input PortableStateInput {
    profile: PortableProfileInput
    preferences: PortablePreferencesInput
  }

  input ActivityEventInput {
    type: String!
    instanceId: String!
    resourceUrl: String!
    payload: String!
  }

  # Queries
  extend type Query {
    solidConnectionStatus: SolidConnectionStatus!
  }

  # Mutations
  extend type Mutation {
    solidStartConnect(issuer: String!): AuthorizationUrlResponse!
    solidFinishConnect(
      code: String!
      state: String!
      redirectUri: String!
    ): SolidConnectionResult!
    solidDisconnect: Boolean!
    solidPullPortableState: PortableState!
    solidPushPortableState(input: PortableStateInput!): Boolean!
    solidAppendActivityEvent(input: ActivityEventInput!): Boolean!
  }
`;
