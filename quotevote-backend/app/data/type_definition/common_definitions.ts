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

  input RosterInput {
    buddyId: String!
  }

  input TypingInput {
    messageRoomId: String!
    isTyping: Boolean!
  }
`;
