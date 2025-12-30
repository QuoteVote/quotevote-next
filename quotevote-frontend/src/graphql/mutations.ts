import { gql } from '@apollo/client'

// ============================================
// PRESENCE & HEARTBEAT
// ============================================

export const HEARTBEAT = gql`
  mutation Heartbeat {
    heartbeat {
      success
      timestamp
    }
  }
`

// ============================================
// BUDDY/ROSTER MUTATIONS
// ============================================

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

export const ACCEPT_BUDDY = gql`
  mutation AcceptBuddy($rosterId: ID!) {
    acceptBuddy(rosterId: $rosterId) {
      id
      status
      updatedAt
    }
  }
`

export const DECLINE_BUDDY = gql`
  mutation DeclineBuddy($rosterId: ID!) {
    declineBuddy(rosterId: $rosterId) {
      id
      status
      updatedAt
    }
  }
`

export const BLOCK_BUDDY = gql`
  mutation BlockBuddy($buddyId: ID!) {
    blockBuddy(buddyId: $buddyId) {
      id
      status
      updatedAt
    }
  }
`

export const UNBLOCK_BUDDY = gql`
  mutation UnblockBuddy($buddyId: ID!) {
    unblockBuddy(buddyId: $buddyId) {
      id
      status
      updatedAt
    }
  }
`

export const REMOVE_BUDDY = gql`
  mutation RemoveBuddy($buddyId: ID!) {
    removeBuddy(buddyId: $buddyId) {
      success
      message
    }
  }
`

// ============================================
// TYPING INDICATOR
// ============================================

export const UPDATE_TYPING = gql`
  mutation UpdateTyping($typing: TypingInput!) {
    updateTyping(typing: $typing) {
      success
      messageRoomId
      isTyping
    }
  }
`

// ============================================
// PASSWORD RESET MUTATIONS
// ============================================

export const SEND_PASSWORD_RESET_EMAIL = gql`
  mutation SendPasswordResetEmail($email: String!) {
    sendPasswordResetEmail(email: $email)
  }
`

export const UPDATE_USER_PASSWORD = gql`
  mutation UpdateUserPassword(
    $username: String!
    $password: String!
    $token: String!
  ) {
    updateUserPassword(username: $username, password: $password, token: $token)
  }
`

// ============================================
// USER MUTATIONS
// ============================================

export const UPDATE_USER = gql`
  mutation UpdateUser($user: UserInput!) {
    updateUser(user: $user) {
      _id
      username
      email
      name
      avatar
      admin
      created
      updated
    }
  }
`

export const UPDATE_USER_AVATAR = gql`
  mutation UpdateUserAvatar($userId: ID!, $avatar: AvatarInput!) {
    updateUserAvatar(userId: $userId, avatar: $avatar) {
      _id
      avatar
    }
  }
`

export const DELETE_USER = gql`
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId) {
      success
      message
    }
  }
`


// ============================================
// GROUP MUTATIONS
// ============================================

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

// ============================================
// POST MUTATIONS
// ============================================

export const SUBMIT_POST = gql`
  mutation addPost($post: PostInput!) {
    addPost(post: $post) {
      _id
      url
    }
  }
`

export const VOTE = gql`
  mutation AddVote($vote: VoteInput!) {
    addVote(vote: $vote) {
      _id
      votedBy {
        userId
        type
        deleted
        content
        tags
        startWordIndex
        endWordIndex
        created
      }
      votes {
        userId
        type
        deleted
      }
    }
  }
`

export const ADD_QUOTE = gql`
  mutation AddQuote($quote: QuoteInput!) {
    addQuote(quote: $quote) {
      _id
      quote
      created
      quoter
      quoted
      postId
      startWordIndex
      endWordIndex
    }
  }
`

export const REPORT_POST = gql`
  mutation ReportPost($postId: ID!, $userId: ID!) {
    reportPost(postId: $postId, userId: $userId) {
      _id
      reportedBy
    }
  }
`

export const APPROVE_POST = gql`
  mutation ApprovePost($postId: ID!, $userId: ID!, $remove: Boolean) {
    approvePost(postId: $postId, userId: $userId, remove: $remove) {
      _id
      approvedBy
      rejectedBy
    }
  }
`

export const REJECT_POST = gql`
  mutation RejectPost($postId: ID!, $userId: ID!, $remove: Boolean) {
    rejectPost(postId: $postId, userId: $userId, remove: $remove) {
      _id
      approvedBy
      rejectedBy
    }
  }
`

export const DELETE_POST = gql`
  mutation DeletePost($postId: ID!) {
    deletePost(postId: $postId) {
      _id
    }
  }
`

export const TOGGLE_VOTING = gql`
  mutation ToggleVoting($postId: ID!) {
    toggleVoting(postId: $postId) {
      _id
      enable_voting
    }
  }
`

// ============================================
// COMMENT MUTATIONS
// ============================================

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

export const UPDATE_COMMENT = gql`
  mutation UpdateComment($commentId: ID!, $content: String!) {
    updateComment(commentId: $commentId, content: $content) {
      _id
      content
    }
  }
`

export const DELETE_COMMENT = gql`
  mutation DeleteComment($commentId: ID!) {
    deleteComment(commentId: $commentId) {
      _id
    }
  }
`

// ============================================
// ACTION REACTION MUTATIONS
// ============================================

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
