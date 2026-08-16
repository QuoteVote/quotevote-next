export const Mutation = `type Mutation {

  " Start Solid connection authorization flow "
  solidStartConnect(issuer: String!): SolidConnectResult

  " Finish Solid connection authentication "
  solidFinishConnect(code: String!, state: String!, redirectUri: String!): SolidConnectResult

  " Disconnect from Solid pod "
  solidDisconnect: Boolean

  " Pull portable state from Solid pod "
  solidPullPortableState: PortableState

  " Push portable state to Solid pod "
  solidPushPortableState(input: PortableStateInput!): Boolean

  " Append activity event to Solid pod "
  solidAppendActivityEvent(input: ActivityEventInput!): Boolean

  " Create a new post "
  addPost(post: PostInput!): Post

  " Approve a post (admin only) "
  approvePost(postId: String!, userId: String!, remove: Boolean): Post

  " Reject a post (admin only) "
  rejectPost(postId: String!, userId: String!, remove: Boolean): Post

  " Bookmark or unbookmark a post "
  updatePostBookmark(postId: String!, userId: String!): Post

  " Update a post's featured slot (admin only) "
  updateFeaturedSlot(postId: String!, featuredSlot: Int): Post

  " Create a group "
  createGroup(group: GroupInput!): Group

  " Add or update a vote "
  addVote(vote: VoteInput!): Vote

  " Delete a vote "
  deleteVote(voteId: String!): DeletedVote

  " Create a new comment "
  addComment(comment: CommentInput!): Comment

  " Delete a comment "
  deleteComment(commentId: String!): DeletedComment

  " Create a new quote "
  addQuote(quote: QuoteInput!): Quote

  " Delete a quote "
  deleteQuote(quoteId: String!): DeletedQuote

  " Create a new chat message "
  createMessage(message: MessageInput!): Message

  " Delete a chat message "
  deleteMessage(messageId: String!): DeletedMessage

  " Create a chat room for a post "
  createPostMessageRoom(postId: String!): MessageRoom
   
  " Update messages as read in a room "
  updateMessageReadBy(messageRoomId: String!): [Message]

  " Create a Stripe customer record "
  addStripeCustomer(stripeCustomer: StripeCustomerInput!): JSON

  " Follow or unfollow a user "
  followUser(user_id: String!, action: String!): User

  " Request user access "
  requestUserAccess(requestUserAccessInput: RequestUserAccessInput!): User

  " Send investor email "
  sendInvestorMail(email: String!): JSON

  " Send password reset link email "
  sendPasswordResetEmail(email: String!): JSON

  " Reset user password with token "
  updateUserPassword(username: String, password: String, token: String): JSON

  " Update user profile details "
  updateUser(user: UserInput!): User

  " Approve or reject user access invite (admin only) "
  sendUserInviteApproval(userId: String!, inviteStatus: String!): JSON

  " Update user avatar image "
  updateUserAvatar(user_id: String!, avatarQualities: JSON): User
    
  " Remove user notification "
  removeNotification(notificationId: String!): Notification

  " Add reaction to a chat message "
  addMessageReaction(reaction: ReactionInput!): Reaction

  " Add reaction to an action/post "
  addActionReaction(reaction: ReactionInput!): Reaction

  " Update an existing chat message reaction "
  updateReaction(_id: String!, emoji: String!): Reaction

  " Update an existing action/post reaction "
  updateActionReaction(_id: String!, emoji: String!): Reaction

  " Delete an action/post reaction "
  deleteActionReaction(_id: String!): Boolean

  " Report a post "
  reportPost(postId: String!, userId: String!): Post

  " Soft-delete a post "
  deletePost(postId: String!): DeletedPost

  " Send a user invitation "
  sendUserInvite(email: String!): JSON

  " Submit a user report "
  reportUser(reportUserInput: ReportUserInput!): JSON

  " Recalculate user reputation metrics "
  recalculateReputation(userId: String!): JSON

  " Toggle voting capabilities on a post "
  toggleVoting(postId: String!): Post

  " Report a user account as a bot "
  reportBot(userId: String!, reporterId: String!): JSON

  " Disable a user account (admin only) "
  disableUser(userId: String!): User

  " Enable a user account (admin only) "
  enableUser(userId: String!): User

  " Update user presence status "
  updatePresence(presence: PresenceInput!): Presence
  
  " Send heartbeat to keep presence active "
  heartbeat: HeartbeatResponse
  
  " Clear presence status (on logout) "
  clearPresence: Boolean

  " Add buddy request "
  addBuddy(roster: RosterInput!): Roster
  
  " Accept buddy request "
  acceptBuddy(rosterId: String!): Roster
  
  " Decline buddy request "
  declineBuddy(rosterId: String!): DeletedRoster
  
  " Block a buddy/user "
  blockBuddy(buddyId: String!): Roster
  
  " Unblock a buddy/user "
  unblockBuddy(buddyId: String!): Roster
  
  " Remove a buddy "
  removeBuddy(buddyId: String!): DeletedRoster

  " Update typing status in chat room "
  updateTyping(typing: TypingInput!): TypingResponse

}`;
