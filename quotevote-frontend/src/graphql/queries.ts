import { gql } from '@apollo/client'

/**
 * Get buddy list query
 */
export const GET_BUDDY_LIST = gql`
  query GetBuddyList {
    buddyList {
      id
      buddyId
      status
      buddy {
        id
        username
        avatar
      }
    }
  }
`

/**
 * Get all messages for a chat room
 * Used by the conversation view (MessageItemList)
 */
export const GET_ROOM_MESSAGES = gql`
    query getRoomMessages($messageRoomId: String!) {
      messages(messageRoomId: $messageRoomId) {
        _id
        messageRoomId
        userId
        userName
        title
        text
        created
        type
      }
    }
  `

/**
 * Get roster query (includes pending requests and blocked users)
 */
export const GET_ROSTER = gql`
  query GetRoster {
    roster {
      buddies {
        id
        buddyId
        status
        buddy {
          id
          username
          avatar
        }
      }
      pendingRequests {
        id
        buddyId
        status
        buddy {
          id
          username
          avatar
        }
      }
      blockedUsers {
        id
        username
        avatar
      }
    }
  }
`

/**
 * Verify password reset token query
 */
export const VERIFY_PASSWORD_RESET_TOKEN = gql`
  query VerifyUserPasswordResetToken($token: String!) {
    verifyUserPasswordResetToken(token: $token)
  }
`

/**
 * Get groups query for post creation
 */
export const GROUPS_QUERY = gql`
  query groups($limit: Int!) {
    groups(limit: $limit) {
      _id
      creatorId
      adminIds
      allowedUserIds
      privacy
      title
      url
      description
    }
  }
`

/**
 * Get a single group by ID
 */
export const GET_GROUP = gql`
  query getGroup($groupId: String!) {
    group(groupId: $groupId) {
      _id
      title
    }
  }
`

/**
 * Get action reactions query
 */
export const GET_ACTION_REACTIONS = gql`
  query GetActionReactions($actionId: ID!) {
    actionReactions(actionId: $actionId) {
      _id
      userId
      actionId
      emoji
    }
  }
`
/**
 * Get paginated list of posts with filters
 */
export const GET_TOP_POSTS = gql`
  query GetTopPosts(
    $limit: Int!
    $offset: Int!
    $searchKey: String
    $startDateRange: String
    $endDateRange: String
    $friendsOnly: Boolean
    $interactions: Boolean
    $userId: String
    $sortOrder: String
    $groupId: String
    $approved: Int
  ) {
    posts(
      limit: $limit
      offset: $offset
      searchKey: $searchKey
      startDateRange: $startDateRange
      endDateRange: $endDateRange
      friendsOnly: $friendsOnly
      interactions: $interactions
      userId: $userId
      sortOrder: $sortOrder
      groupId: $groupId
      approved: $approved
    ) {
      entities {
        _id
        id
        title
        text
        url
        created
        createdAt
        enable_voting
        creator {
          name
          username
          avatar {
            url
            color
            initials
          }
        }
        userId
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
          content
          tags
          startWordIndex
          endWordIndex
        }
        approvedBy
        rejectedBy
        reportedBy
        likesCount
        commentsCount
        isLiked
        isAuthor
      }
      pagination {
        total_count
        offset
        limit
      }
    }
  }
`

/**
 * Get single post by ID
 */
export const GET_POST = gql`
  query GetPost($postId: ID!) {
    post(id: $postId) {
      _id
      id
      title
      text
      url
      created
      createdAt
      enable_voting
      creator {
        name
        username
        avatar {
          url
          color
          initials
        }
      }
      userId
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
        content
        tags
        startWordIndex
        endWordIndex
      }
      approvedBy
      rejectedBy
      reportedBy
      likesCount
      commentsCount
      isLiked
      isAuthor
    }
  }
`

/**
 * Get post by ID (for post detail page)
 */
export const GET_POST_BY_ID_QUERY = gql`
  query GetPostById($postId: ID!) {
    post(id: $postId) {
      _id
      id
      title
      text
      content
      url
      created
      createdAt
      enable_voting
      creator {
        name
        username
        avatar {
          url
          color
          initials
        }
      }
      userId
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
        content
        tags
        startWordIndex
        endWordIndex
      }
      approvedBy
      rejectedBy
      reportedBy
      likesCount
      commentsCount
      isLiked
      isAuthor
    }
  }
`

/**
 * Get all users (for admin tooltips)
 */
export const GET_USERS = gql`
  query GetUsers {
    users {
      _id
      username
      name
      email
      avatar {
        url
        color
        initials
      }
    }
  }
`

/**
 * Get user activity feed
 */
export const GET_USER_ACTIVITY = gql`
  query GetUserActivity(
    $limit: Int!
    $offset: Int!
    $searchKey: String
    $activityEvent: [String!]
    $user_id: String
    $startDateRange: String
    $endDateRange: String
  ) {
    userActivity(
      limit: $limit
      offset: $offset
      searchKey: $searchKey
      activityEvent: $activityEvent
      user_id: $user_id
      startDateRange: $startDateRange
      endDateRange: $endDateRange
    ) {
      entities {
        _id
        type
        created
        post {
          _id
          title
          text
        }
        user {
          _id
          username
          name
          avatar {
            url
            color
            initials
          }
        }
      }
      pagination {
        total_count
        offset
        limit
      }
    }
  }
`
