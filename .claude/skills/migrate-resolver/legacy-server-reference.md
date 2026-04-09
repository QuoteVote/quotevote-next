# Legacy Backend Reference (quotevote-monorepo/server)

Complete catalog of the legacy backend for migration to quotevote-next/quotevote-backend (Express 5, Apollo Server 5, TypeScript, Mongoose 9).

Legacy source: `/Users/mattpolini/Documents/quotevote-monorepo/server/`

---

## Server Entry Point

**File:** `app/server.js`
- Apollo Server v3 + Express
- Port 3000 (configurable via PORT)
- MongoDB via Mongoose (`DATABASE_URL` env var)
- GraphQL subscriptions via WebSocket
- JWT auth in Apollo context (extracts from `Authorization` header, calls `verifyToken()`)
- CORS: localhost:3000, quote.vote, *.netlify.app, *.quote.vote

REST routes:
- `POST /register` → `register()`
- `POST /login` → `login()`
- `POST /authenticate` → `authenticate()`
- `POST /guest` → `createGuestUser()`

---

## Mongoose Models

### UserModel
**Collection:** `users`
```
username: { String, unique, lowercase, trim, required }
name: String
companyName: String
email: { String, unique, lowercase, trim, required }
status: { Number, required }
plan: { String, default: 'personal' }
stripeCustomerId: String
hash_password: String
tokens: { Number, default: 0 }
_wallet: String
avatar: JSON
_followersId: [ObjectId]
_followingId: [ObjectId]
_votesId: ObjectId
favorited: []
joined: { Date, default: Date.now }
admin: { Boolean, default: false }
upvotes: { Number, default: 0 }
downvotes: { Number, default: 0 }
```
Index: `{ content: 'text' }`

### PostModel
**Collection:** `posts`
```
userId: { ObjectId, required }
groupId: { ObjectId, required }
title: { String, required }
text: { String, required }
url: String
bookmarkedBy: Array
rejectedBy: Array
approvedBy: Array
downvotes: { Number, default: 0 }
upvotes: { Number, default: 0 }
created: { Date, default: Date.now }
reported: { Number, default: 0 }
reportedBy: Array
approved: Number
votedBy: Array
dayPoints: { Number, default: 0 }
pointTimestamp: { Date, default: Date.now }
featuredSlot: { Number, min: 1, max: 12, unique, sparse }
messageRoomId: String
urlId: String
deleted: { Boolean, default: false }
```
Indexes: `{ title: 'text', text: 'text' }`, `{ featuredSlot: 1 }` (unique, sparse)

### VoteModel
**Collection:** `votes`
```
postId: { ObjectId, required }
userId: { ObjectId, required }
type: { String, required }          // 'up' or 'down'
tags: { String, required }
content: String
startWordIndex: { Number, required }
endWordIndex: { Number, required }
created: { Date, required }
```

### CommentModel
**Collection:** `comments`
```
content: { String, required }
userId: { ObjectId, required }
created: { Date, required }
startWordIndex: { Number, required }
endWordIndex: { Number, required }
postId: ObjectId
url: String
```

### QuoteModel
**Collection:** `quotes`
```
postId: { ObjectId, required }
quoter: { ObjectId, required }
quoted: { ObjectId, required }
quote: String
created: { Date, required }
startWordIndex: Number
endWordIndex: Number
```

### MessageModel
**Collection:** `Messages`
```
messageRoomId: { ObjectId, required }
userId: { ObjectId, required }
title: String
text: { String, required }
created: { Date, required }
readBy: { [ObjectId], required }
```

### MessageRoomModel
**Collection:** `MessageRoom`
```
users: { [ObjectId], required }
postId: ObjectId
messageType: { String, required }   // 'USER' or 'POST'
created: { Date, default: Date.now }
```

### GroupModel
**Collection:** `groups`
```
creatorId: { ObjectId, required }
adminIds: { [ObjectId], default: [] }
allowedUserIds: { [ObjectId], default: [] }
pendingUserIds: { [ObjectId], default: [] }
title: { String, required }
description: String
url: String
created: { Date, default: Date.now }
privacy: { String, required }
```

### NotificationModel
**Collection:** `notifications`
```
userId: { ObjectId, required }
userIdBy: ObjectId
notificationType: String
postId: ObjectId
label: String
status: { String, default: 'new' }
created: { Date, required }
```

### ActivityModel
**Collection:** `activities`
```
userId: { ObjectId, required }
activityType: { String, required }  // POSTED, COMMENTED, VOTED, QUOTED
postId: { ObjectId, required }
voteId: ObjectId
quoteId: ObjectId
commentId: ObjectId
content: { String, required }
created: { Date, required }
```

### ReactionModel
**Collection:** `reactions`
```
userId: { ObjectId, required }
messageId: ObjectId
actionId: ObjectId
created: { Date, default: Date.now }
emoji: String
```

### VoteLogModel
**Collection:** `VoteLogs`
```
userId: { ObjectId, required }
voteId: { ObjectId, required }
title: String
author: String
description: { String, required }
action: String
tokens: { Number, required }
created: { Date, default: Date.now }
```

### CreatorModel
**Collection:** `creators`
```
name: { String, required }
profileImageUrl: { String, default: 'https://...' }
followers: [ObjectId]
created: { Date, required }
options: JSON
score: { Number, default: 0 }
```

---

## GraphQL Queries

### activities(offset, limit, searchKey, startDateRange, endDateRange, user_id, activityEvent) → Activities
Returns paginated activities for authenticated user with filtering.

### groups(created, key, title, limit) → [Group]
Lists groups with optional filters.

### group(groupId) → Group
Gets single group by ID.

### userInviteRequests() → [UserInvite]
Returns user invite requests.

### post(postId) → Post
Finds post by ID. Returns null if deleted, 404 if not found.

### posts(offset, limit, searchKey, startDateRange, endDateRange, friendsOnly, groupId, userId, approved, deleted) → Posts
Main post listing with stacked filters:
- Text search on title & text (regex, case-insensitive)
- Date range on pointTimestamp
- Friend-only filter (requires auth, filters by _followingId)
- Group/User/Approval/Deleted filters
- Sorted by dayPoints desc, pointTimestamp desc
- Populates creator with name, username, avatar
- Returns paginated results

### featuredPosts() → [Post]
Posts with featuredSlot (1-12) for homepage carousel.

### postMessageRoom(postId) → MessageRoom
Message room associated with a post.

### users() → [User]
All users with userId mapping.

### user(user_id, username, creatorId) → User
Lookup by user_id, username, or creatorId. Falls back to context.user._id. Includes total vote count, deduplicated followers/following.

### getUserFollowInfo(username, filter) → JSON
Follow/follower information for a user.

### checkDuplicateEmail(email) → JSON
Checks for duplicate email.

### verifyUserPasswordResetToken(token) → JSON
Verifies JWT token validity for password reset.

### messages(messageRoomId) → [Message]
All messages in a room.

### messageRooms() → [MessageRoom]
All chat rooms for authenticated user. MongoDB aggregation: matches user in users array, left joins posts, filters to USER rooms or POST rooms where user bookmarked.

### messageRoom(otherUserId) → MessageRoom
Gets or creates DM room with another user.

### messageReactions(messageId) → [Reaction]
Emoji reactions on a message.

### actionReactions(actionId) → [Reaction]
Reactions for a vote/action.

### notifications() → [Notification]
All notifications for authenticated user.

---

## GraphQL Mutations

### addPost(post: PostInput!) → Post
Input: `{ userId, groupId, title, text }`
- Generates URL: `/post{group.url}/{title-slugified}/{nanoid(6)}`
- Auto-creates MessageRoom with type "POST"
- Logs activity: POSTED

### approvePost(postId, userId, remove) → Post
Adds/removes userId from approvedBy array. Auto-removes from rejectedBy if approving.

### rejectPost(postId, userId, remove) → Post
Manages rejectedBy array (inverse of approve).

### updatePostBookmark(postId, userId) → Post
Toggles bookmark in bookmarkedBy array.

### updateFeaturedSlot(postId, featuredSlot: Int) → Post
Sets post to carousel slot (1-12, unique).

### reportPost(postId, userId) → Post
Adds to reportedBy, increments reported counter.

### deletePost(postId) → DeletedPost
Soft-delete (sets deleted: true). Returns `{ deleted: boolean }`.

### addVote(vote: VoteInput!) → Vote
Input: `{ postId, userId, type (up/down), tags, startWordIndex, endWordIndex, content }`
- Creates vote, calls updateScore(), logs activity VOTED, adds notification to post creator.

### addComment(comment: CommentInput!) → Comment
Input: `{ postId, userId, content, startWordIndex, endWordIndex, quote, url, reaction }`
- Creates comment, calls updateTrending(), logs activity COMMENTED, adds notification.

### addQuote(quote: QuoteInput!) → Quote
Creates quote reference. Logs activity QUOTED.

### createMessage(message: MessageInput!) → Message
Input: `{ messageRoomId (optional), componentId, type (USER/POST), title, text }`
- Creates/finds MessageRoom, saves message, publishes 'messageEvent' to PubSub.

### createPostMessageRoom(postId) → MessageRoom
Creates message room for post comments.

### createUserMessageRoom(otherUserId, type) → MessageRoom
Creates DM room between users.

### updateMessageReadBy(messageRoomId) → [Message]
Marks messages as read by current user.

### addMessageReaction(reaction: ReactionInput!) → Reaction
### addActionReactions(reaction: ReactionInput!) → Reaction
### updateReaction(_id, emoji) → Reaction
### updateActionReaction(_id, emoji) → Reaction
### deleteUserReaction(reactionId) → Boolean

### followUser(user_id, action: follow/unfollow) → User
Updates _followingId (current) and _followersId (target). Creates FOLLOW notification.

### updateUser(user: UserInput!) → User
Input: `{ _id, name, username, email, password, quotes, avatar }`

### updateUserPassword(username, password, token) → JSON
Verifies token, updates hash_password.

### updateUserAvatar(user_id, avatarQualities: JSON) → User

### requestUserAccess(requestUserAccessInput) → User
Request access to private groups.

### sendPasswordResetEmail(email) → JSON
Generates 1-hour JWT token, sends HTML email with reset link via nodemailer.

### createGroup(group: GroupInput!) → Group
Input: `{ creatorId, title, description, url, privacy }`

### sendInvestorMail(email) → JSON
Sends investor onboarding email.

### sendUserInviteApproval(userId, inviteStatus) → JSON
Approves/rejects user access request.

### addStripeCustomer(stripeCustomer: StripeCustomerInput!) → JSON
Creates Stripe customer with payment method.

### removeNotification(notificationId) → Notification

---

## GraphQL Subscriptions

### message(messageRoomId: String!) → Message
Listens to `messageEvent`. Filters by messageRoomId matching payload.

### notification(userId: String!) → Notification
Listens to `notificationEvent`. Filters by userId matching payload.

**PubSub events:** `messageEvent`, `notificationEvent`
Uses `withFilter()` for permission-based filtering.

---

## GraphQL Input Types

### PostInput
`{ userId: String!, groupId: String!, title: String!, text: String! }`

### UserInput
`{ _id: String!, name: String, username: String, email: String, password: String, quotes: [String], avatar: String }`

### VoteInput
`{ postId: String!, userId: String, type: String!, tags: String!, startWordIndex: Int!, endWordIndex: Int!, content: String }`

### CommentInput
`{ postId: String!, userId: String!, content: String!, startWordIndex: Int!, endWordIndex: Int!, quote: String, url: String, reaction: String }`

### MessageInput
`{ messageRoomId: String, componentId: String, type: String, title: String!, text: String! }`

### GroupInput
`{ creatorId: String!, title: String!, description: String!, url: String, privacy: String! }`

### QuoteInput
`{ postId: String!, quoter: String!, quoted: String!, quote: String!, startWordIndex: Int, endWordIndex: Int }`

### ReactionInput
`{ userId: String!, messageId: String, actionId: String, emoji: String }`

### StripeCustomerInput
`{ first_name: String, last_name: String, email: String!, card: JSON!, balance: Int, companyName: String }`

### RequestUserAccessInput
`{ groupId: String!, userId: String! }`

---

## GraphQL Output Types

### Post
```
_id, userId, created, groupId, title, text, url, deleted, upvotes, downvotes,
reportedBy, approvedBy, rejectedBy, votedBy, bookmarkedBy, dayPoints, pointTimestamp,
featuredSlot, creator: User, comments: [Comment], votes: [Vote], quotes: [Quote],
messageRoom: MessageRoom
```

### User
```
_id, userId, joined, username, name, email, tokens, _wallet, avatar,
_followersId, _followingId, _votesId, favorited, admin, upvotes, downvotes
```

### Vote
```
_id, created, postId, userId, type, tags, startWordIndex, endWordIndex, user: User
```

### Comment
```
_id, created, content, userId, startWordIndex, endWordIndex, postId, url, reaction, user: User
```

### Quote
```
_id, created, postId, quote, quoted, quoter, startWordIndex, endWordIndex, user: User
```

### Message
```
_id, messageRoomId, userAvatar, userName, userId, title, text, created, type,
mutation_type, user: User, readBy
```

### MessageRoom
```
_id, users, messageType, created, title, avatar, unreadMessages, postId, messages: [Message]
```

### Group
```
_id, creatorId, created, title, description, url, privacy, allowedUserIds, adminIds, pendingUsers: [User]
```

### Activity
```
_id, created, activityType, postId, post: Post, voteId, vote: Vote, quoteId, quote: Quote,
commentId, comment: Comment, content, userId, user: User
```

### Notification
```
_id, userId, userIdBy, userBy: User, post: Post, notificationType, label, status, created
```

### Pagination types
- `Activities { entities: [Activity], pagination: Pagination }`
- `Posts { entities: [Post], pagination: Pagination }`
- `Pagination { total_count, limit, offset }`
- `DeletedPost { deleted: Boolean }`

---

## Relationship Resolvers

### Post relationships
- `creator(post)` → UserModel.findById(post.userId)
- `comments(post)` → CommentModel.find({ postId: post._id })
- `votes(post)` → VoteModel.find({ postId: post._id })
- `quotes(post)` → QuoteModel.find({ postId: post._id })
- `messageRoom(post)` → MessageRoomModel.findOne({ postId: post._id })

### Message relationships
- `user(message)` → UserModel.findById(message.userId)

### Notification relationships
- `userBy(notification)` → UserModel.findById(notification.userIdBy)
- `post(notification)` → PostModel.findById(notification.postId)

### Activity relationships
- `user`, `post`, `vote`, `quote`, `comment` — each resolves by respective ID field

### Vote/Quote/Comment relationships
- `user` → UserModel.findById(entity.userId)

### MessageRoom relationships
- Complex aggregation pipeline for user details, unread counts, etc.

---

## Authentication

### Token generation
```javascript
jwt.sign({
  email, fullName, _id, admin, primary
}, process.env.SECRET, { expiresIn: 60 * 60 * 24 })  // 24 hours
```

### verifyToken(authToken)
Decodes JWT, verifies signature with `process.env.SECRET`. Handles TokenExpiredError, JsonWebTokenError. Returns `{ email, fullName, _id, admin, primary }`.

### Password hashing
`bcrypt.genSaltSync(10)` + `bcrypt.hashSync(password, salt)`

### Public queries (no auth required)
`addStripeCustomer, requestUserAccess, checkDuplicateEmail, sendInvestorMail, sendPasswordResetEmail, verifyUserPasswordResetToken, updateUserPassword, popPrediction, posts, featuredPosts`

---

## Services & Utilities

### addNotification({ userId, userIdBy, notificationType, label, postId })
Creates notification, publishes `notificationEvent` to PubSub.

### logActivity(activityType, ids, content)
Activity types: POSTED, COMMENTED, VOTED, QUOTED. Saves to ActivityModel.

### updateScore(vote)
Recalculates post dayPoints and pointTimestamp based on votes.

### sendEmail(options)
Uses nodemailer with SMTP config from env vars (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL).

### Stripe integration
`createStripeCustomer`, `createStripePaymentMethod`, `getStripeAuth` — Stripe API with STRIPE_SECRET_KEY.

---

## Environment Variables

```
SECRET                 - JWT signing secret
DATABASE_URL           - MongoDB connection string
SMTP_HOST/PORT/USER/PASS - Email server
FROM_EMAIL             - Sender email
STRIPE_SECRET_KEY      - Stripe API key
CLIENT_URL             - Frontend URL (for email links)
PORT                   - Server port (default 3000)
```

---

## Constants

- Activity types: `POSTED`, `COMMENTED`, `VOTED`, `QUOTED`
- Notification types: `FOLLOW`, `UPVOTED`, `DOWNVOTED`, `COMMENTED`
- Message room types: `USER` (DM), `POST` (comment room)
- Vote types: `up`, `down`
- `MUTATION_CREATED` constant for subscription payloads
