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
