export const CommonDefinitions = `
  scalar DateTime
  scalar ObjectId

  type Content {
    _id: String
    creatorId: String
    domainId: String
    title: String
    text: String
    url: String
    score: Int
    created: Date
    creator: Creator
  }

  type Creator {
    _id: String
    name: String
    profileImageUrl: String
    score: Int
    created: Date
  }

  type SolidConnectionStatus {
    connected: Boolean
    webId: String
    issuer: String
    lastSyncAt: String
  }

  type SolidConnectResult {
    authorizationUrl: String
    success: Boolean
    webId: String
    issuer: String
    message: String
  }

  type PortableState {
    version: String
    collections: [JSON]
  }

  input PortableStateInput {
    version: String
    collections: [JSON]
  }

  input ActivityEventInput {
    type: String!
    payload: JSON!
    timestamp: String
  }

  input RosterInput {
    buddyId: String!
  }

  input TypingInput {
    messageRoomId: String!
    isTyping: Boolean!
  }

  " A staff decision: who did what, to whom, and when (#616) "
  type StaffAction {
    _id: String!
    " role_granted, role_revoked, invite_approved, invite_declined, invite_reset, user_disabled, user_enabled or content_removed "
    action: String!
    actorId: String!
    actor: User
    targetId: String
    " The user acted on, when the target is a user "
    target: User
    " Extra context, such as the role granted or revoked "
    detail: String
    createdAt: DateTime
  }
`;
