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
      id
      buddyId
      status
      createdAt
    }
  }
`

/**
 * Accept buddy request mutation
 */
export const ACCEPT_BUDDY = gql`
  mutation AcceptBuddy($rosterId: ID!) {
    acceptBuddy(rosterId: $rosterId) {
      id
      status
      updatedAt
    }
  }
`

/**
 * Decline buddy request mutation
 */
export const DECLINE_BUDDY = gql`
  mutation DeclineBuddy($rosterId: ID!) {
    declineBuddy(rosterId: $rosterId) {
      id
      status
      updatedAt
    }
  }
`

/**
 * Block buddy mutation
 */
export const BLOCK_BUDDY = gql`
  mutation BlockBuddy($buddyId: ID!) {
    blockBuddy(buddyId: $buddyId) {
      id
      status
      updatedAt
    }
  }
`

/**
 * Unblock buddy mutation
 */
export const UNBLOCK_BUDDY = gql`
  mutation UnblockBuddy($buddyId: ID!) {
    unblockBuddy(buddyId: $buddyId) {
      id
      status
      updatedAt
    }
  }
`

/**
 * Remove buddy mutation
 */
export const REMOVE_BUDDY = gql`
  mutation RemoveBuddy($buddyId: ID!) {
    removeBuddy(buddyId: $buddyId) {
      success
      message
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
    }
  }
`

/**
 * Delete comment mutation
 */
export const DELETE_COMMENT = gql`
  mutation DeleteComment($commentId: ID!) {
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
  mutation UpdateComment($commentId: ID!, $content: String!) {
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
  mutation UpdateActionReaction($_id: ID!, $emoji: String!) {
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