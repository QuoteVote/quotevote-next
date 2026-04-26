import { gql } from '@apollo/client'

/**
 * Heartbeat mutation to keep presence alive
 */
export const HEARTBEAT = gql`
  mutation Heartbeat {
    heartbeat {
      success
      timestamp
    }
  }
`

/**
 * Update current user's presence (status + message)
 */
export const UPDATE_PRESENCE = gql`
  mutation updatePresence($presence: PresenceInput!) {
    updatePresence(presence: $presence) {
      _id
      userId
      status
      statusMessage
      lastHeartbeat
      lastSeen
    }
  }
`

/**
 * Add buddy mutation (send friend request)
 */
export const ADD_BUDDY = gql`
  mutation AddBuddy($roster: RosterInput!) {
    addBuddy(roster: $roster) {
      _id
      buddyId
      status
      created
    }
  }
`

/**
 * Accept buddy request mutation
 */
export const ACCEPT_BUDDY = gql`
  mutation AcceptBuddy($rosterId: String!) {
    acceptBuddy(rosterId: $rosterId) {
      _id
      status
      updated
    }
  }
`

/**
 * Decline buddy request mutation
 */
export const DECLINE_BUDDY = gql`
  mutation DeclineBuddy($rosterId: String!) {
    declineBuddy(rosterId: $rosterId) {
      _id
    }
  }
`

/**
 * Block buddy mutation
 */
export const BLOCK_BUDDY = gql`
  mutation BlockBuddy($buddyId: String!) {
    blockBuddy(buddyId: $buddyId) {
      _id
      status
      updated
    }
  }
`

/**
 * Unblock buddy mutation
 */
export const UNBLOCK_BUDDY = gql`
  mutation UnblockBuddy($buddyId: String!) {
    unblockBuddy(buddyId: $buddyId) {
      _id
      status
      updated
    }
  }
`

/**
 * Remove buddy mutation
 */
export const REMOVE_BUDDY = gql`
  mutation RemoveBuddy($buddyId: String!) {
    removeBuddy(buddyId: $buddyId) {
      _id
    }
  }
`

/**
 * Update typing indicator mutation
 */
export const UPDATE_TYPING = gql`
  mutation UpdateTyping($typing: TypingInput!) {
    updateTyping(typing: $typing) {
      success
      messageRoomId
      isTyping
    }
  }
`

/**
 * Send password reset email mutation
 */
export const SEND_PASSWORD_RESET_EMAIL = gql`
  mutation SendPasswordResetEmail($email: String!) {
    sendPasswordResetEmail(email: $email)
  }
`

/**
 * Send investor email mutation
 */
export const SEND_INVESTOR_EMAIL = gql`
  mutation sendInvestorMail($email: String!) {
    sendInvestorMail(email: $email)
  }
`

/**
 * Update user password mutation
 */
export const UPDATE_USER_PASSWORD = gql`
  mutation UpdateUserPassword(
    $username: String!
    $password: String!
    $token: String!
  ) {
    updateUserPassword(username: $username, password: $password, token: $token)
  }
`

/**
 * Create group mutation
 */
export const CREATE_GROUP = gql`
  mutation createGroup($group: GroupInput!) {
    createGroup(group: $group) {
      _id
      title
      description
      url
      created
    }
  }
`

/**
 * Submit post mutation
 */
export const SUBMIT_POST = gql`
  mutation addPost($post: PostInput!) {
    addPost(post: $post) {
      _id
      url
      citationUrl
    }
  }
`

/**
 * Delete comment mutation
 */
export const DELETE_COMMENT = gql`
  mutation DeleteComment($commentId: String!) {
    deleteComment(commentId: $commentId) {
      _id
    }
  }
`

/**
 * Add comment mutation
 */
export const ADD_COMMENT = gql`
  mutation AddComment($comment: CommentInput!) {
    addComment(comment: $comment) {
      _id
      userId
      content
      created
      user {
        _id
        username
        avatar
      }
    }
  }
`

/**
 * Update comment mutation
 */
export const UPDATE_COMMENT = gql`
  mutation UpdateComment($commentId: String!, $content: String!) {
    updateComment(commentId: $commentId, content: $content) {
      _id
      content
    }
  }
`

/**
 * Add action reaction mutation
 */
export const ADD_ACTION_REACTION = gql`
  mutation AddActionReaction($reaction: ReactionInput!) {
    addActionReaction(reaction: $reaction) {
      _id
      userId
      actionId
      emoji
    }
  }
`

/**
 * Update action reaction mutation
 */
export const UPDATE_ACTION_REACTION = gql`
  mutation UpdateActionReaction($_id: String!, $emoji: String!) {
    updateActionReaction(_id: $_id, emoji: $emoji) {
      _id
      userId
      actionId
      emoji
    }
  }
`

/**
 * Approve post mutation
 */
export const APPROVE_POST = gql`
  mutation approvePost($postId: String!, $userId: String!, $remove: Boolean) {
    approvePost(postId: $postId, userId: $userId, remove: $remove) {
      _id
      approvedBy
      rejectedBy
    }
  }
`

/**
 * Reject post mutation
 */
export const REJECT_POST = gql`
  mutation rejectPost($postId: String!, $userId: String!, $remove: Boolean) {
    rejectPost(postId: $postId, userId: $userId, remove: $remove) {
      _id
      approvedBy
      rejectedBy
    }
  }
`

/**
 * Delete post mutation
 */
export const DELETE_POST = gql`
  mutation deletePost($postId: String!) {
    deletePost(postId: $postId) {
      _id
    }
  }
`

/**
 * Update post bookmark mutation
 */
export const UPDATE_POST_BOOKMARK = gql`
  mutation updatePostBookmark($postId: String!, $userId: String!) {
    updatePostBookmark(postId: $postId, userId: $userId) {
      _id
      bookmarkedBy
    }
  }
`

/**
 * Toggle voting on a post mutation
 */
export const TOGGLE_VOTING = gql`
  mutation toggleVoting($postId: String!) {
    toggleVoting(postId: $postId) {
      _id
      enable_voting
    }
  }
`

/**
 * Update featured slot mutation
 */
export const UPDATE_FEATURED_SLOT = gql`
  mutation updateFeaturedSlot($postId: String!, $featuredSlot: Int) {
    updateFeaturedSlot(postId: $postId, featuredSlot: $featuredSlot) {
      _id
      featuredSlot
    }
  }
`

/**
 * Report post mutation
 */
export const REPORT_POST = gql`
  mutation reportPost($postId: String!, $userId: String!) {
    reportPost(postId: $postId, userId: $userId) {
      _id
      reportedBy
    }
  }
`

/**
 * Add vote mutation
 */
export const VOTE = gql`
  mutation addVote($vote: VoteInput!) {
    addVote(vote: $vote) {
      postId
      type
    }
  }
`

/**
 * Delete vote mutation
 */
export const DELETE_VOTE = gql`
  mutation deleteVote($voteId: String!) {
    deleteVote(voteId: $voteId) {
      _id
    }
  }
`

/**
 * Add quote mutation
 */
export const ADD_QUOTE = gql`
  mutation addQuote($quote: QuoteInput!) {
    addQuote(quote: $quote) {
      _id
    }
  }
`

/**
 * Delete quote mutation
 */
export const DELETE_QUOTE = gql`
  mutation deleteQuote($quoteId: String!) {
    deleteQuote(quoteId: $quoteId) {
      _id
    }
  }
`

/**
 * Send user invite mutation
 */
export const SEND_USER_INVITE = gql`
  mutation sendUserInvite($email: String!) {
    sendUserInvite(email: $email) {
      code
      message
    }
  }
`

/**
 * Report user mutation
 */
export const REPORT_USER = gql`
  mutation reportUser($reportUserInput: ReportUserInput!) {
    reportUser(reportUserInput: $reportUserInput) {
      code
      message
    }
  }
`

/**
 * Report bot mutation
 */
export const REPORT_BOT = gql`
  mutation reportBot($userId: String!, $reporterId: String!) {
    reportBot(userId: $userId, reporterId: $reporterId)
  }
`
export const SEND_MESSAGE = gql`
  mutation chat($message: MessageInput!) {
    createMessage(message: $message) {
      _id
      userId
      userName
      messageRoomId
      title
      text
      type
      created
      user {
        _id
        name
        username
        avatar
        contributorBadge
      }
    }
  }
`


export const DELETE_MESSAGE = gql`
  mutation deleteMessage($messageId: String!) {
    deleteMessage(messageId: $messageId) {
      _id
    }
  }
`

export const READ_MESSAGES = gql`
  mutation updateMessageReadBy($messageRoomId: String!) {
    updateMessageReadBy(messageRoomId: $messageRoomId) {
      messageRoomId
      readBy
    }
  }
`

/**
 * Add message reaction mutation
 * Used by PostChatReactions component
 */
export const ADD_MESSAGE_REACTION = gql`
  mutation addMessageReaction($reaction: ReactionInput!) {
    addMessageReaction(reaction: $reaction) {
      userId
      messageId
      emoji
    }
  }
`

/**
 * Update message reaction mutation
 * Used by PostChatReactions component
 */
export const UPDATE_MESSAGE_REACTION = gql`
  mutation updateReaction($_id: String!, $emoji: String!) {
    updateReaction(_id: $_id, emoji: $emoji) {
      _id
      emoji
    }
  }
`

/**
 * Create post message room mutation
 * Used when bookmarking a post to create a chat room
 */
export const CREATE_POST_MESSAGE_ROOM = gql`
  mutation createPostMessageRoom($postId: String!) {
    createPostMessageRoom(postId: $postId) {
      _id
      users
      messageType
      created
      title
      avatar
    }
  }
`

/**
 * Follow user mutation
 * Used for following/unfollowing users
 */
export const FOLLOW_USER = gql`
  mutation followUser($user_id: String!, $action: String!) {
    followUser(user_id: $user_id, action: $action) {
      _id
      name
    }
  }
`

/**
 * Delete notification mutation
 */
export const DELETE_NOTIFICATION = gql`
  mutation removeNotification($notificationId: String!) {
    removeNotification(notificationId: $notificationId) {
      _id
      status
    }
  }
`

/**
 * Request user access mutation
 * Used for requesting platform access via email invitation
 */
export const REQUEST_USER_ACCESS_MUTATION = gql`
  mutation requestUserAccess($requestUserAccessInput: RequestUserAccessInput!) {
    requestUserAccess(requestUserAccessInput: $requestUserAccessInput) {
      _id
      email
    }
  }
`

/**
 * Update user invite status mutation (admin only)
 */
export const UPDATE_USER_INVITE_STATUS = gql`
  mutation sendUserInviteApproval($userId: String!, $inviteStatus: String!) {
    sendUserInviteApproval(userId: $userId, inviteStatus: $inviteStatus)
  }
`

/**
 * Disable user account mutation (admin only)
 * Used for admin moderation tools
 */
export const DISABLE_USER = gql`
  mutation disableUser($userId: String!) {
    disableUser(userId: $userId) {
      _id
      accountStatus
    }
  }
`

/**
 * Enable user account mutation (admin only)
 * Used for admin moderation tools
 */
export const ENABLE_USER = gql`
  mutation enableUser($userId: String!) {
    enableUser(userId: $userId) {
      _id
      accountStatus
    }
  }
`

/**
 * Login mutation — authenticates a user and returns a token + user object.
 */
export const LOGIN_MUTATION = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        _id
        id
        username
        email
        name
        avatar
        admin
        accountStatus
      }
    }
  }
`

/**
 * Register/signup mutation — creates a new user account.
 */
export const SIGNUP_MUTATION = gql`
  mutation register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      token
      user {
        _id
        id
        username
        email
        name
        avatar
        admin
        accountStatus
      }
    }
  }
`

/**
 * Update user profile mutation
 * Used by Settings component for updating user information
 */
export const UPDATE_USER = gql`
  mutation updateUser($user: UserInput!) {
    updateUser(user: $user) {
      _id
      username
      email
      name
      avatar
      admin
      accountStatus
      themePreference
      contributorBadge
    }
  }
`

/**
 * Update user avatar mutation
 * Used by AvatarEditor for updating avatar qualities (topType, hairColor, etc.)
 */
export const UPDATE_USER_AVATAR = gql`
  mutation updateUserAvatar($user_id: String!, $avatarQualities: JSON) {
    updateUserAvatar(user_id: $user_id, avatarQualities: $avatarQualities) {
      _id
      username
      name
      email
      avatar
    }
  }
`
