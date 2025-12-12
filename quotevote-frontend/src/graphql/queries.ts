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
 * Get user query
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
 * Get user activity query
 */
export const GET_USER_ACTIVITY = gql`
  query activities(
    $user_id: String!
    $limit: Int!
    $offset: Int!
    $searchKey: String!
    $startDateRange: String
    $endDateRange: String
    $activityEvent: JSON!
  ) {
    activities(
      user_id: $user_id
      limit: $limit
      offset: $offset
      searchKey: $searchKey
      startDateRange: $startDateRange
      endDateRange: $endDateRange
      activityEvent: $activityEvent
    ) {
      entities {
        created
        postId
        userId
        user {
          _id
          name
          username
          avatar
          contributorBadge
        }
        activityType
        content
        post {
          _id
          title
          text
          url
          upvotes
          downvotes
          votes {
            _id
          }
          quotes {
            _id
          }
          comments {
            _id
          }
          messageRoom {
            _id
            messages {
              _id
            }
          }
          bookmarkedBy
          created
          creator {
            _id
            name
            username
            avatar
            contributorBadge
          }
        }
        voteId
        vote {
          _id
          startWordIndex
          endWordIndex
          created
          type
          tags
        }
        commentId
        comment {
          _id
          created
          userId
          content
          startWordIndex
          endWordIndex
        }
        quoteId
        quote {
          _id
          startWordIndex
          endWordIndex
          created
          quote
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
