# Legacy Frontend Reference (quotevote-monorepo/client)

Complete catalog of the legacy React 17/Vite frontend for migration to quotevote-next/quotevote-frontend (Next.js 16, React 19, TypeScript, shadcn/ui, Zustand).

Legacy source: `/Users/mattpolini/Documents/quotevote-monorepo/client/src/`

---

## Core Layout Components

### Scoreboard (`layouts/Scoreboard.jsx`)
Main authenticated app layout. Renders MainNavBar, Sidebar, PrivateRoute-wrapped pages, Snackbar. Handles token validation and page routing. Mobile sidebar toggle.

### Auth (`layouts/Auth.jsx`)
Authentication page layout. Renders AuthNavbar, Footer, route-based auth pages. Detects active route, conditionally hides navbar/footer.

---

## Page/View Components

### SearchPage (`views/SearchPage/index.jsx`)
Main search & discover page. **Core page of the app.**
- State: searchKey, filterMode ('all'|'friends'|'interactions'), dateRangeFilter, offset, showResults, isGuestMode
- Guest mode: carousel of featured/popular posts (no auth required)
- Filter by friends (requires auth, client-side filter by _followingId)
- Filter by interactions (client-side sort by comments+votes+quotes count)
- Date range filtering with react-datepicker
- Real-time polling: GET_TOP_POSTS every 3 seconds
- Renders: Carousel (featured posts), PostsList, filter UI
- MUI makeStyles with extensive custom styles

### Homepage (`views/Homepage/Homepage.jsx`)
Simple wrapper rendering Activity component with `showSubHeader=true`.

### PostPage (`views/PostsPage/PostPage.jsx`)
Post creation page with SubmitPostForm and group selection autocomplete.

### Profile (`views/Profile/`)
User profile page. Shows stats (upvotes, downvotes, followers), activity feed, follow/unfollow.

### RequestAccessPage (`views/RequestAccessPage/RequestAccessPage.jsx`)
Plan selection (Personal, Business, Investor) and form filling.

---

## Feature Components

### Post (`components/Post/Post.jsx`)
Individual post card. **Core component.**
- Props: `post, user, postHeight, postActions`
- State: selectedText, open, anchorEl, popoverType, openInvite, showVoteButtons
- Uses VotingBoard for text selection
- Mutations: VOTE, ADD_COMMENT, ADD_QUOTE, REPORT_POST, APPROVE_POST, REJECT_POST, DELETE_POST
- Manages vote buttons visibility via localStorage
- Updates Apollo cache on mutations
- Renders: post title, creator info, voting counts, VotingBoard, VotingPopup

### PostCard (`components/Post/PostCard.jsx`)
Simplified post display for carousels/lists.

### PostsList (`components/Post/PostsList.jsx`)
- Props: `data, loading, limit, fetchMore, variables`
- Infinite scroll with fetchMore

### PostSkeleton (`components/Post/PostSkeleton.jsx`)
Loading placeholder.

### VotingBoard (`components/VotingComponents/VotingBoard.jsx`)
**Critical component** for text-based voting.
- Props: `topOffset, onSelect, highlights, content, children`
- Detects text selection, calculates startWordIndex/endWordIndex using parser utility
- Word-by-word highlighting of selected text
- Shows SelectionPopover on selection

### VotingPopup (`components/VotingComponents/VotingPopup.jsx`)
Popup modal after text selection. Options: upvote, downvote, quote.

### SelectionPopover (`components/VotingComponents/SelectionPopover.jsx`)
Popover for voting options after text selection.

### ChatContent (`components/Chat/ChatContent.jsx`)
Main chat interface container.

### ChatMenu (`components/Chat/ChatMenu.jsx`)
List of chat rooms.

### ChatSearchInput (`components/Chat/ChatSearchInput.jsx`)
Search chat rooms.

### MessageItem (`components/Chat/MessageItem.jsx`)
- Props: `message`
- Avatar + message bubble, different style for own messages (checks message.userId === user._id)

### MessageItemList (`components/Chat/MessageItemList.jsx`)
List of messages in a chat room.

### MessageBox (`components/Chat/MessageBox.jsx`)
Input field for sending messages.

### MessageSend (`components/Chat/MessageSend.jsx`)
Send message button with SEND_MESSAGE mutation.

### Comment (`components/Comment/Comment.jsx`)
- Props: `comment, postUrl, selected`
- Comment card with avatar, content, creation date. Copy to clipboard with custom URL.

### CommentList (`components/Comment/CommentList.jsx`)
List of comments.

### CommentReactions (`components/Comment/CommentReactions.jsx`)
Emoji reactions on comments.

### Activity (`components/Activity/Activity.jsx`)
- Props: `showSubHeader, userId`
- State: offset, selectedEvent, dateRangeFilter, selectAll
- Query: GET_USER_ACTIVITY with filters

### ActivityList (`components/Activity/ActivityList.jsx`)
Paginated list of activities.

### ActivityEmptyList (`components/Activity/ActivityEmptyList.jsx`)
Empty state display.

### Login (`components/Login/Login.jsx`)
Container using useGuestGuard hook. Renders LoginForm.

### LoginForm (inner component)
- Props: `onSubmit, loading, loginError`
- Fields: username/email, password. Validation via react-hook-form.

### SignupForm (`components/SignupForm/SignupForm.jsx`)
Registration form.

### ForgotPassword (`components/ForgotPassword/ForgotPassword.jsx`)
Password reset request.

### PasswordReset (`components/PasswordReset/PasswordReset.jsx`)
Password reset form with token verification.

### ProfileAvatar (`components/Profile/ProfileAvatar.jsx`)
Avatar editor with upload.

### SimpleAvatarEditor (`components/Profile/SimpleAvatarEditor.jsx`)
Avatar cropper/editor.

### FollowInfo (`components/Profile/FollowInfo.jsx`)
Followers/following display and management.

### UserFollowDisplay (`components/Profile/UserFollowDisplay.jsx`)
Modal/list of followers/following.

### Notifications (`components/Notifications/Notifications.jsx`)
Notification badge in navbar.

### NotificationMenu (`components/Notifications/NotificationMenu.jsx`)
Dropdown menu of notifications.

### NotificationMobileView (`components/Notifications/NotificationMobileView.jsx`)
Full-page notifications view.

### Notification (`components/Notifications/Notification.jsx`)
Individual notification item.

### SubmitPost (`components/SubmitPost/SubmitPost.jsx`)
Post creation UI wrapper.

### SubmitPostForm (`components/SubmitPost/SubmitPostForm.jsx`)
Form with title, content, group selection. Uses react-hook-form. Mutations: CREATE_GROUP, SUBMIT_POST.

### HighlightText (`components/HighlightText/index.jsx`)
Highlights searched text in results using react-highlight-words.

### Carousel (`components/Carousel/Carousel.jsx`)
Generic carousel with navigation buttons using react-material-ui-carousel.

### PersonalPlanCarousel, BusinessPlanCarousel, InvestorPlanCarousel
Plan-specific carousels for onboarding.

### PersonalForm (`components/RequestAccess/PersonalForm/PersonalForm.jsx`)
Basic info form.

### BusinessForm (`components/RequestAccess/BusinessForm/BusinessForm.jsx`)
Company info form.

### PaymentMethod (`components/RequestAccess/PaymentMethod/PaymentMethod.jsx`)
Credit card input with Stripe.

### RequestInviteDialog (`components/RequestInviteDialog.jsx`)
Dialog to request invite when unauthorized.

### SubHeader (`components/SubHeader.jsx`)
Filter buttons and header for pages.

### Alert, AlertList, Avatar, BuddyList, Loader, LatestQuotes
Supporting UI components.

### Custom Buttons
ApproveButton, RejectButton, FollowButton, BookmarkIconButton, InvestButton, ManageInviteButton, GetAccessButton, SelectPlansButton, SettingsIconButton, SettingsSaveButton, SignOutButton, DoubleArrowIconButton

---

## Custom Hooks

### useGuestGuard (`utils/useGuestGuard.js`)
Returns function that validates token and redirects to /search if invalid. Uses Redux dispatch and React Router history.

---

## Redux Store

### Configuration (`store/store.js`)
- Combines 4 reducers: user, ui, chat, filter
- Redux Toolkit with configureStore
- redux-persist with localForage storage

### User Slice (`store/user.js`)
```
State:
  loading: false
  loginError: null
  data: {}

Actions:
  USER_LOGIN_REQUEST, USER_LOGIN_SUCCESS, USER_LOGIN_FAILURE
  USER_LOGOUT, USER_TOKEN_VALIDATION, USER_TOKEN_VALIDATED
  USER_UPDATE_AVATAR, SET_USER_DATA, UPDATE_FOLLOWING

Async thunks:
  userLogin(username, password, dispatch, history)
  tokenValidator(dispatch)
  clearToken(dispatch)
  updateAvatar(dispatch, avatar)
  updateFollowing(dispatch, following)
```

### UI Slice (`store/ui.js`)
```
State:
  filter: { visibility: false, value: '' }
  date: { visibility: false, value: '' }
  search: { visibility: false, value: '' }
  selectedPost: { id: null }
  selectedPage: 'home'
  hiddenPosts: []
  snackbar: { open: false, type: '', message: '' }
  selectedPlan: 'personal'
  focusedComment: null
  sharedComment: null

Actions:
  SET_SELECTED_POST, SET_SELECTED_PAGE, SET_HIDDEN_POSTS
  SET_SNACKBAR, SET_SELECTED_PLAN, SET_FOCUSED_COMMENT, SET_SHARED_COMMENT
```

### Chat Slice (`store/chat.js`)
```
State:
  submitting: false
  selectedRoom: null
  open: false

Actions:
  CHAT_SUBMITTING, SELECTED_CHAT_ROOM, SET_CHAT_OPEN
```

### Filter Slice (`store/filter.js`)
```
State:
  filter: { visibility: false, value: ['POSTED'] }
  date: { visibility: false, value: '' }
  search: { visibility: false, value: '' }

Actions:
  FILTER_VISIBILITY, FILTER_VALUE, DATE_VISIBILITY
  DATE_VALUE, SEARCH_VISIBILITY, SEARCH_VALUE
```

---

## GraphQL Operations

### Queries (`graphql/query.jsx`)
```
GROUPS_QUERY(limit) → groups
USER_INVITE_REQUESTS → userInviteRequests
GET_USERS → users
GET_POST(postId) → post
SEARCH(text) → search
GET_CHAT_ROOM(otherUserId) → messageRoom
GET_CHAT_ROOMS → messageRooms
GET_ROOM_MESSAGES(messageRoomId) → messages
GET_MESSAGE_REACTIONS(messageId) → messageReactions
GET_ACTION_REACTIONS(actionId) → actionReactions
GET_TOP_POSTS(limit, offset, searchKey, startDateRange, endDateRange, friendsOnly) → posts
GET_FRIENDS_POSTS(limit, offset, searchKey, startDateRange, endDateRange, friendsOnly) → posts
GET_USER(username) → user
GET_USER_ACTIVITY(user_id, limit, offset, searchKey, startDateRange, endDateRange, activityEvent) → activities
GET_CHECK_DUPLICATE_EMAIL(email) → checkDuplicateEmail
VERIFY_PASSWORD_RESET_TOKEN(token) → verifyUserPasswordResetToken
GET_FOLLOW_INFO(username, filter) → getUserFollowInfo
GET_NOTIFICATIONS → notifications
GET_LATEST_QUOTES(limit) → quotes
GET_FEATURED_POSTS → featuredPosts
```

### Mutations (`graphql/mutations.jsx`)
```
CREATE_GROUP(group) → createGroup
SUBMIT_POST(post) → addPost
APPROVE_POST(postId, userId, remove) → approvePost
REJECT_POST(postId, userId, remove) → rejectPost
UPDATE_USER_INVITE_STATUS(userId, inviteStatus) → sendUserInviteApproval
VOTE(vote) → addVote
ADD_COMMENT(comment) → addComment
ADD_QUOTE(quote) → addQuote
UPDATE_POST_BOOKMARK(postId, userId) → updatePostBookmark
SEND_MESSAGE(message) → createMessage
FOLLOW_MUTATION(user_id, action) → followUser
REQUEST_USER_ACCESS_MUTATION(requestUserAccessInput) → requestUserAccess
SEND_INVESTOR_EMAIL(email) → sendInvestorMail
SEND_PASSWORD_RESET_EMAIL(email) → sendPasswordResetEmail
UPDATE_USER_PASSWORD(username, password, token) → updateUserPassword
UPDATE_USER(user) → updateUser
UPDATE_USER_AVATAR(user_id, avatarQualities) → updateUserAvatar
CREATE_POST_MESSAGE_ROOM(postId) → createPostMessageRoom
READ_MESSAGES(messageRoomId) → updateMessageReadBy
DELETE_NOTIFICATION(notificationId) → removeNotification
ADD_MESSAGE_REACTION(reaction) → addMessageReaction
ADD_ACTION_REACTION(reaction) → addActionReactions
UPDATE_MESSAGE_REACTION(_id, emoji) → updateReaction
UPDATE_ACTION_REACTION(_id, emoji) → updateActionReaction
REPORT_POST(postId, userId) → reportPost
DELETE_POST(postId) → deletePost
UPDATE_FEATURED_SLOT(postId, featuredSlot) → updateFeaturedSlot
```

### Subscriptions (`graphql/subscription.jsx`)
```
NEW_MESSAGE_SUBSCRIPTION(messageRoomId) → message
  Returns: _id, messageRoomId, userId, userName, title, text, created, type, mutation_type

NEW_NOTIFICATION_SUBSCRIPTION(userId) → notification
  Returns: _id, userId, userIdBy, userBy, label, status, created, notificationType, post
```

---

## Routes

```javascript
{ path: 'Home', component: HomePage, layout: '/' }
{ path: 'search', component: SearchPage, layout: '/' }
{ path: 'post', component: PostPage, layout: '/' }
{ path: 'Notifications', component: NotificationMobileView, layout: '/', requiresAuth: true }
{ path: 'Profile', component: Profile, layout: '/', requiresAuth: true }
{ path: '/logout', component: LogoutPage, layout: '/logout' }
{ path: 'ControlPanel', component: ControlPanel, layout: '/', requiresAuth: true }
```

Layout routes: `/` (authenticated/Scoreboard), `/auth/*` (auth pages), `/logout`, `/unauth` (token expired)

---

## Authentication (Client-Side)

- Tokens in localStorage as `token`
- JWT decoded with jwt-decode for expiration check
- Token validation on app load via `tokenValidator()`
- Apollo authLink adds token to every GraphQL request header
- PrivateRoute wraps authenticated routes, redirects to /search if invalid
- Guest mode: SearchPage shows limited view without auth

---

## Real-Time Features

### WebSocket Connection (`config/apollo.js`)
```javascript
const wsLink = new GraphQLWsLink(createClient({
  url: WS_URL + '/graphql',
  connectionParams: () => ({ authToken: localStorage.getItem('token') }),
  retryAttempts: 5,
  shouldRetry: () => true,
}))
```

### Subscriptions
- `NEW_MESSAGE_SUBSCRIPTION(messageRoomId)` — real-time messages
- `NEW_NOTIFICATION_SUBSCRIPTION(userId)` — real-time notifications

### Polling
- SearchPage polls GET_TOP_POSTS every 3 seconds

---

## Key Utilities

### parser (`utils/parser.js`)
```javascript
parser(doc, selected, select) → { startIndex, endIndex, text, points }
```
Calculates word indices for text selection in VotingBoard.

### objectIdSerializer (`utils/objectIdSerializer.js`)
Recursively serializes MongoDB ObjectID objects in GraphQL responses.

### momentUtils (`utils/momentUtils.jsx`)
Date formatting helpers using moment.js.

### Other utilities
- `display.jsx` — display helpers
- `getCardBackgroundColor.jsx` — theme colors
- `getTopPostsVoteHighlights.jsx` — vote visualization
- `getActivityContent.jsx` — format activity descriptions
- `replaceGqlError.jsx` — error message formatting

---

## Styling

### Material-UI v4
- Primary styling via `makeStyles` hooks
- Theme provider with custom colors
- Colors: Primary green (#00CF6E), Secondary purple (#791E89), Error red (#FF6060), Background (#EEF4F9)
- Font: Montserrat
- Grid system for responsive layout
- Hidden components for responsive nav

### Migration mapping (MUI v4 → shadcn/ui)
- `Button` → `@/components/ui/button`
- `TextField` → `@/components/ui/input` + `@/components/ui/label`
- `Dialog` → `@/components/ui/dialog`
- `Card` → `@/components/ui/card`
- `Snackbar` → `sonner` (toast)
- `Typography` → Native HTML + Tailwind
- `makeStyles` → Tailwind CSS classes
- `Grid` → Tailwind flex/grid
- `Hidden` → Tailwind responsive classes
- `@material-ui/icons` → `lucide-react`

---

## File Structure

```
src/
├── assets/          — SCSS, JSS, SVG, images
├── components/      — React components (by feature)
│   ├── Activity/, Chat/, Comment/, Post/, VotingComponents/
│   ├── Profile/, Login/, SignupForm/, ForgotPassword/, PasswordReset/
│   ├── Carousel/, Notifications/, SubmitPost/, HighlightText/
│   ├── RequestAccess/, CustomButtons/, Navbars/, common/
│   └── SubHeader.jsx, Alert.jsx, Avatar.jsx, BuddyList/
├── config/          — Apollo client config
├── graphql/         — Queries, mutations, subscriptions
├── hoc/             — Higher-order components (withUser)
├── layouts/         — Scoreboard (main), Auth
├── store/           — Redux (user, ui, chat, filter)
├── styles/          — Global styles
├── themes/          — Theme definitions
├── utils/           — Utility functions
├── variables/       — Constants
├── views/           — Page components
├── main.jsx         — App entry point
└── routes.jsx       — Route definitions
```
