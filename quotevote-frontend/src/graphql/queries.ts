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
 * Get a single post by ID
 */
export const GET_POST = gql`
  query post($postId: String!) {
    post(postId: $postId) {
      _id
      userId
      created
      groupId
      title
      text
      url
      upvotes
      downvotes
      approvedBy
      rejectedBy
      reportedBy
      bookmarkedBy
      enable_voting
      creator {
        _id
        name
        avatar
        username
        contributorBadge
      }
      comments {
        _id
        created
        userId
        content
        startWordIndex
        endWordIndex
        postId
        url
        reaction
        user {
          _id
          username
          name
          avatar
          contributorBadge
        }
      }
      votes {
        _id
        startWordIndex
        endWordIndex
        created
        type
        tags
        content
        user {
          _id
          username
          name
          avatar
          contributorBadge
        }
      }
      quotes {
        _id
        startWordIndex
        endWordIndex
        created
        quote
        user {
          _id
          username
          name
          avatar
          contributorBadge
        }
      }
      messageRoom {
        _id
        users
        postId
        messageType
        created
      }
    }
  }
`

/**
 * Get top posts query
 */
export const GET_TOP_POSTS = gql`
  query topPosts(
    $limit: Int!
    $offset: Int!
    $searchKey: String!
    $startDateRange: String
    $endDateRange: String
    $friendsOnly: Boolean
    $interactions: Boolean
    $userId: String
    $sortOrder: String
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
    ) {
      entities {
        _id
        userId
        groupId
        title
        text
        upvotes
        downvotes
        bookmarkedBy
        created
        url
        rejectedBy
        approvedBy
        creator {
          name
          username
          avatar
          _id
          contributorBadge
        }
        votes {
          _id
          startWordIndex
          endWordIndex
          type
        }
        comments {
          _id
        }
        quotes {
          _id
        }
        messageRoom {
          _id
          messages {
            _id
          }
        }
      }
      pagination {
        total_count
        limit
        offset
      }
    }
  }
`

/**
 * Paginated version of GET_TOP_POSTS for page-based pagination
 */
export const GET_PAGINATED_POSTS = gql`
  query paginatedPosts(
    $limit: Int!
    $offset: Int!
    $searchKey: String!
    $startDateRange: String
    $endDateRange: String
    $friendsOnly: Boolean
    $interactions: Boolean
    $userId: String
    $sortOrder: String
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
    ) {
      entities {
        _id
        userId
        groupId
        title
        text
        upvotes
        downvotes
        bookmarkedBy
        created
        url
        rejectedBy
        approvedBy
        creator {
          name
          username
          avatar
          _id
          contributorBadge
        }
        votes {
          _id
          startWordIndex
          endWordIndex
          type
        }
        comments {
          _id
        }
        quotes {
          _id
        }
        messageRoom {
          _id
          messages {
            _id
          }
        }
      }
      pagination {
        total_count
        limit
        offset
      }
    }
  }
`

/**
 * Get friends posts query
 */
export const GET_FRIENDS_POSTS = gql`
  query friendsPosts(
    $limit: Int!
    $offset: Int!
    $searchKey: String!
    $startDateRange: String
    $endDateRange: String
    $friendsOnly: Boolean
    $interactions: Boolean
  ) {
    posts(
      limit: $limit
      offset: $offset
      searchKey: $searchKey
      startDateRange: $startDateRange
      endDateRange: $endDateRange
      friendsOnly: $friendsOnly
      interactions: $interactions
    ) {
      entities {
        _id
        userId
        title
        text
        upvotes
        downvotes
        bookmarkedBy
        created
        url
        creator {
          name
          username
          avatar
          _id
          contributorBadge
        }
        votes {
          _id
          startWordIndex
          endWordIndex
          type
        }
        comments {
          _id
        }
        quotes {
          _id
        }
        messageRoom {
          _id
          messages {
            _id
          }
        }
      }
      pagination {
        total_count
        limit
        offset
      }
    }
  }
`

/**
 * Get featured posts query
 */
export const GET_FEATURED_POSTS = gql`
  query featuredPosts(
    $limit: Int
    $offset: Int
    $searchKey: String
    $startDateRange: String
    $endDateRange: String
    $friendsOnly: Boolean
    $groupId: String
    $userId: String
    $approved: Boolean
    $deleted: Boolean
    $interactions: Boolean
    $sortOrder: String
  ) {
    featuredPosts(
      limit: $limit
      offset: $offset
      searchKey: $searchKey
      startDateRange: $startDateRange
      endDateRange: $endDateRange
      friendsOnly: $friendsOnly
      groupId: $groupId
      userId: $userId
      approved: $approved
      deleted: $deleted
      interactions: $interactions
      sortOrder: $sortOrder
    ) {
      entities {
        _id
        userId
        groupId
        title
        text
        upvotes
        downvotes
        bookmarkedBy
        created
        url
        creator {
          name
          username
          avatar
          _id
          contributorBadge
        }
        votes {
          _id
          startWordIndex
          endWordIndex
          type
        }
        comments {
          _id
        }
        quotes {
          _id
        }
        messageRoom {
          _id
          messages {
            _id
          }
        }
      }
      pagination {
        total_count
        limit
        offset
      }
    }
  }
`

/**
 * Get latest quotes query
 */
export const GET_LATEST_QUOTES = gql`
  query latestQuotes($limit: Int!) {
    latestQuotes(limit: $limit) {
      _id
      quote
      created
      user {
        _id
        username
        contributorBadge
      }
    }
  }
`

/**
 * Get user by username query
 */
export const GET_USER = gql`
  query user($username: String!) {
    user(username: $username) {
      _id
      name
      username
      upvotes
      downvotes
      _followingId
      _followersId
      avatar
      contributorBadge
      reputation {
        _id
        overallScore
        inviteNetworkScore
        conductScore
        activityScore
        metrics {
          totalInvitesSent
          totalInvitesAccepted
          totalInvitesDeclined
          averageInviteeReputation
          totalReportsReceived
          totalReportsResolved
          totalUpvotes
          totalDownvotes
          totalPosts
          totalComments
        }
        lastCalculated
      }
    }
  }
`

/**
 * Get user follow info (followers or following)
 */
export const GET_FOLLOW_INFO = gql`
  query getUserFollowInfo($username: String!, $filter: String!) {
    getUserFollowInfo(username: $username, filter: $filter) {
      id
      username
      name
      avatar
      numFollowers
      numFollowing
    }
  }
`

/**
 * Get chat room between two users
 */
export const GET_CHAT_ROOM = gql`
  query getChatRoom($otherUserId: String!) {
    messageRoom(otherUserId: $otherUserId) {
      _id
      users
      postId
      messageType
      created
      title
      avatar
    }
  }
`

/**
 * Get all chat rooms for the current user
 * Used for chat sidebar counts and room lists
 */
export const GET_CHAT_ROOMS = gql`
  query getChatRooms {
    messageRooms {
      _id
      users
      messageType
      created
      title
      avatar
      lastMessageTime
      lastActivity
      unreadMessages
      postDetails {
        title
        text
      }
    }
  }
`

/**
 * Search users by name or username
 */
export const SEARCH_USERNAMES = gql`
  query searchUsernames($query: String!) {
    searchUser(query: $query) {
      _id
      username
      name
      avatar
      contributorBadge
    }
  }
`

/**
 * Get message reactions query
 * Used by PostChatReactions component
 */
export const GET_MESSAGE_REACTIONS = gql`
  query messageReactions($messageId: String!) {
    messageReactions(messageId: $messageId) {
      _id
      emoji
      messageId
      userId
    }
  }
`
