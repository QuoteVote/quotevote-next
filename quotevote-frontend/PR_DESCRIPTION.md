# Fix Apollo MockedProvider Tests & Enhance Profile Components

### Summary
This PR resolves critical issues with Apollo Client's `MockedProvider` in our testing environment, ensuring that GraphQL mocks are correctly typed and cached. It specifically targets failing tests in `UserPosts` and `ProfileView`. Additionally, it includes necessary UI components (`Badge`, `Tooltip`) and updates to `ProfileController` and `PostCard` to support robust profile viewing features.

### Fixes
Fixes #43

### Key Changes

**Testing & Mocks**
*   **`UserPosts.test.tsx`**:
    *   Corrected `MockedProvider` imports.
    *   Added missing `__typename` fields to all mock data objects (`Post`, `User`, `MessageRoom`, `PaginatedPosts`). This fixes Apollo Client's cache identification issues during tests.
    *   Updated `next/navigation` mocks to include `usePathname` and `useSearchParams`.
*   **`ProfileView.test.tsx`**:
    *   Fixed import paths for `MockedProvider`.
    *   Refined assertions to handle multiple elements (e.g., using `getAllByText` for reputation scores).

**Component Updates**
*   **`PostCard.tsx`**:
    *   Switched `useQuery` import to `@apollo/client/react` for consistency.
    *   Fixed TypeScript linting errors (unused variables, proper type casting for `groupData`).
*   **`ProfileController.tsx`**:
    *   Updated `useQuery` import.
    *   Resolved linting issues regarding unused event handlers and `userData` typing.
*   **`PaginatedPostsList.tsx`**:
    *   Fixed `useQuery` import.
    *   Added type assertion for `data.posts` to resolve property access errors.
*   **`PaginatedList.tsx`**: Removed temporary debug logging.

**New Features & Config**
*   **UI Components**: Added `Badge` and `Tooltip` components from `shadcn/ui` to support the `ReputationDisplay` component.
*   **GraphQL**: Added `GET_TOP_POSTS`, `GET_USER`, and `GET_USER_ACTIVITY` queries to `src/graphql/queries.ts`.
*   **TypeScript**: Updated `tsconfig.json` to correctly map `@/components/*` aliases.

### Verification
*   Ran `npm test UserPosts ProfileView` to verify fixes.
*   **Result**: All 8 tests passed successfully.
    *   `UserPosts`: Verified loading, empty, and populated states.
    *   `ProfileView`: Verified loading, invalid user, and valid user profile rendering.
