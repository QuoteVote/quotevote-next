export const Subscription = `
# Subscription
type Subscription {    
    # Create message subscription
    message(messageRoomId: String!): Message   
    
    # Create notification subscription
    notification(userId: String!): Notification
    
    # ===== Presence Subscriptions =====
    # Subscribe to presence updates
    presence(userId: String): PresenceUpdate
    
    # ===== Typing Subscriptions =====
    # Subscribe to typing indicators in a room
    typing(messageRoomId: String!): TypingIndicator
}
`;
