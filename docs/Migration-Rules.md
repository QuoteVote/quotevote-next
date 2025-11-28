# Migration Rules: Client → QuoteVote Frontend

This document outlines the rules and best practices for migrating code from the `client` (React 17/Vite) project to `quotevote-frontend` (Next.js 16/TypeScript) project.

## Migration Philosophy

This is a **complete framework replacement**, not a parallel setup:
- **Complete Removal**: Vite, React Router, and old build system will be completely removed
- **Full Next.js Adoption**: Next.js 16 App Router is the only framework after migration
- **Fresh Codebase Approach**: Components are migrated to a fresh Next.js codebase in logical groups
- **No Legacy Code**: Old framework files will be deleted after migration is complete

## Table of Contents
- [General Principles](#general-principles)
- [Code Quality Standards](#code-quality-standards)
- [TypeScript Requirements](#typescript-requirements)
- [Package Management](#package-management)
- [Project Structure & Modularity](#project-structure--modularity)
- [Issue Implementation Guidelines](#issue-implementation-guidelines)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Migration-Specific Guidelines](#migration-specific-guidelines)
- [React 19 Considerations](#react-19-considerations)
- [Next.js 16 App Router Guidelines](#nextjs-16-app-router-guidelines)
- [Phase-Based Migration](#phase-based-migration)

---

## General Principles

### 1. Clean Code
- **Readability First**: Write code that is self-documenting and easy to understand
- **Single Responsibility**: Each function, component, or module should have one clear purpose
- **DRY (Don't Repeat Yourself)**: Extract common logic into reusable utilities or hooks
- **Meaningful Names**: Use descriptive variable, function, and component names
- **Small Functions**: Keep functions focused and concise (ideally < 50 lines)
- **Consistent Formatting**: Follow the project's Prettier and ESLint configurations

### 2. Modularity
- **Component Isolation**: Components should be self-contained with clear interfaces
- **Separation of Concerns**: Separate business logic from presentation logic
- **Reusable Utilities**: Extract shared functionality into utility functions or custom hooks
- **Feature-Based Organization**: Group related components, hooks, and utilities together
- **Dependency Management**: Minimize dependencies between modules; prefer composition over inheritance

### 3. Code Review Before Implementation
- **Self-Review**: Review your own code before committing
- **Check for**: Typos, unused imports, console.logs, commented code, and adherence to these rules
- **Refactor**: If you notice improvements while implementing, make them (within scope)

---

## Code Quality Standards

### Code Organization
- Follow Next.js 16.0.4 conventions and file structure
- Use the App Router pattern (`app/` directory) for routing
- **Shared components**: Place in `src/components/` (use `@/components/` alias)
- **Page-specific components**: Place in `src/app/components/` (also accessible via `@/components/` alias)
- **shadcn/ui components**: Place in `src/components/ui/` (use `@/components/ui/` alias)
- **Custom hooks**: Use `src/hooks/` (use `@/hooks/` alias)
- **Utility functions**: Use `src/lib/utils.ts` (use `@/lib/utils` alias)
- **Third-party configs**: Use `src/lib/` (use `@/lib/` alias)
- **State management**: Use `src/store/` for Zustand stores (use `@/store/` alias)
- **Type definitions**: Use `src/types/` (use `@/types/` alias)
- **GraphQL operations**: Use `src/graphql/` (use `@/graphql/` alias)
- **Configuration**: Use `src/config/` (use `@/config/` alias)
- **Constants**: Use `src/constants/` (use `@/constants/` alias)
- **Context providers**: Use `src/context/` (use `@/context/` alias)
- **Test files**: Use `src/__tests__/` directory (MANDATORY)

### Component Structure
```typescript
// Preferred component structure
import type { ComponentProps } from 'react'
// Use path aliases for imports
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import type { UserState } from '@/types/store'

interface MyComponentProps {
  // Define all props with proper types
  prop1: string
  prop2?: number
}

export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // Hooks first
  const store = useAppStore()
  // State declarations
  // Effects
  // Event handlers
  // Render logic
  return <div>...</div>
}
```

### Path Aliases (MANDATORY)
Always use path aliases configured in `tsconfig.json`:
- `@/*` → `./src/*` (general alias)
- `@/components/*` → `./src/app/components/*` (page components)
- `@/components/ui/*` → `./src/components/ui/*` (shadcn/ui)
- `@/hooks/*` → `./src/hooks/*`
- `@/lib/*` → `./src/lib/*`
- `@/store/*` → `./src/store/*`
- `@/types/*` → `./src/types/*`
- `@/graphql/*` → `./src/graphql/*`
- `@/config/*` → `./src/config/*`
- `@/context/*` → `./src/context/*`
- `@/constants/*` → `./src/constants/*`

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase starting with `use` (e.g., `useUserData.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types/Interfaces**: PascalCase (e.g., `UserProfile`, `ApiResponse`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Files**: Match the exported name (e.g., `UserProfile.tsx` exports `UserProfile`)

---

## TypeScript Requirements

### Type Safety
- **NEVER use `any` type**: Always provide proper types or use `unknown` if the type is truly unknown
- **Strict Mode**: All TypeScript strict mode checks must pass
- **Type Definitions**: Define interfaces/types for all props, function parameters, and return values
- **Generic Types**: Use generics when creating reusable components or utilities

### Type Examples
```typescript
// ❌ BAD - Using 'any'
function processData(data: any) {
  return data.value
}

// ✅ GOOD - Proper typing
interface Data {
  value: string
  id: number
}

function processData(data: Data): string {
  return data.value
}

// ✅ GOOD - Using 'unknown' when type is truly unknown
function safeParse(json: string): unknown {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}
```

### Required Type Coverage
- All function parameters must be typed
- All function return types should be explicit (or inferred clearly)
- All component props must have interfaces/types
- API responses must have type definitions
- State variables must be typed (use `useState<Type>()`)

### Type Definition Location
- **All type definitions must be placed in `src/types/` directory**
- **Use the `@/types/` path alias** for importing types (configured in `tsconfig.json`)
- **Organize types by domain**: Create separate files for related types (e.g., `store.ts`, `api.ts`, `components.ts`)
- **Export types from dedicated files**: Don't define types inline in component files; export them from `src/types/`

**Type Organization Examples**:
```typescript
// ✅ GOOD - Types in src/types/store.ts
// src/types/store.ts
export interface UserState {
  id: string;
  username: string;
}

// Component file
import type { UserState } from '@/types/store';

// ❌ BAD - Types defined inline in component
// Component file
interface UserState {
  id: string;
  username: string;
}
```

**Type File Naming**:
- Use descriptive names: `store.ts`, `api.ts`, `graphql.ts`, `components.ts`
- Group related types together
- Use `*.d.ts` for declaration files (e.g., `jest-dom.d.ts`)

---

## Package Management

### Use pnpm (Not npm or yarn)
- **Always use `pnpm`** for installing dependencies
- **Never commit `package-lock.json`** (we use `pnpm-lock.yaml`)
- **Never use `npm install`** or `yarn install` in this project

### Commands
```bash
# Install dependencies
pnpm install

# Add a new dependency
pnpm add <package-name>

# Add a dev dependency
pnpm add -D <package-name>

# Remove a dependency
pnpm remove <package-name>

# Update dependencies
pnpm update
```

### Why pnpm?
- Faster installation times
- Better disk space efficiency
- Stricter dependency resolution
- Consistent lockfile format

---

## Project Structure & Modularity

### Directory Structure
```
quotevote-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages and layouts
│   │   ├── components/         # Page-specific components
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx             # Home page
│   │   └── globals.css          # Global styles (Tailwind CSS)
│   ├── __tests__/               # Test files (MANDATORY location)
│   │   ├── foundation/          # Foundation/configuration tests
│   │   └── utils/               # Test utilities
│   ├── components/              # Shared React components
│   │   ├── ui/                  # shadcn/ui components
│   │   └── ErrorBoundary.tsx    # Error boundary component
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Third-party library configs
│   │   ├── apollo/              # Apollo Client setup
│   │   └── utils.ts             # Utility functions (cn, etc.)
│   ├── store/                   # State management (Zustand)
│   │   ├── useAppStore.ts       # Main Zustand store
│   │   └── index.ts             # Store exports
│   ├── types/                   # TypeScript type definitions (MUST use this directory)
│   ├── graphql/                 # GraphQL queries, mutations, subscriptions
│   ├── config/                  # Configuration files
│   ├── context/                 # React Context providers
│   └── constants/               # Application constants
├── public/                      # Static assets
├── components.json              # shadcn/ui configuration
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Jest setup and mocks
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

**Important**: 
- All TypeScript type definitions **MUST** be placed in `src/types/` and imported using the `@/types/` path alias
- All test files **MUST** be placed in `src/__tests__/` directory
- Shared components go in `src/components/`, page-specific components go in `src/app/components/`

### Component Modularity
- **Single Responsibility**: Each component should do one thing well
- **Composition**: Prefer composition over large monolithic components
- **Props Interface**: Always define a clear props interface
- **Default Props**: Use default parameters or default values in destructuring

### Example: Modular Component
```typescript
// ✅ GOOD - Modular, reusable component
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      className={cn('button', `button-${variant}`, `button-${size}`)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
```

---

## Issue Implementation Guidelines

### Scope Control
- **Implement ONLY what is specified in the issue**: Do not add extra features or "nice-to-have" improvements
- **Do not go beyond the issue scope**: If the issue says "add a button", don't add styling, animations, or additional functionality unless explicitly requested
- **Do not implement less than required**: Ensure all requirements in the issue are met
- **Stay focused**: Resist the urge to refactor unrelated code

### Before Starting
1. **Read the issue carefully**: Understand all requirements
2. **Identify the scope**: List what needs to be implemented
3. **Check dependencies**: Ensure you understand what other parts of the codebase might be affected
4. **Plan the implementation**: Break it down into small, testable steps

### During Implementation
1. **Follow the issue step-by-step**: Implement features in the order specified (if any)
2. **Test as you go**: Write tests alongside implementation
3. **Keep commits focused**: Each commit should represent a logical unit of work
4. **Document complex logic**: Add comments for non-obvious business logic

### After Implementation
1. **Verify all requirements**: Check that every requirement in the issue is met
2. **Remove unused code**: Clean up any temporary code or comments
3. **Run all tests**: Ensure existing tests pass and new tests are added
4. **Self-review**: Review your code before creating a PR

---

## Testing Requirements

### MANDATORY: Testing After Each Phase/Group

**Testing is MANDATORY after each phase or component group completion.** This is non-negotiable.

After migrating each group or completing each phase, you MUST:
- ✅ **Write test scripts** for all changes
- ✅ **Functionality Testing**: Verify all features work correctly
- ✅ **Integration Testing**: Test components work together
- ✅ **Regression Testing**: Ensure no existing functionality breaks
- ✅ **Test Suite Execution**: Run full test suite before proceeding
- ✅ **Fix all failing tests** before moving to the next phase/group

**Testing Strategy**:
- Write tests **immediately after** each migration step
- Test **before** moving to the next phase
- Maintain test coverage throughout migration
- Use automated testing where possible
- Manual testing for visual/UX validation

### Test Coverage
- **All new features must have tests**: Write tests for new components, hooks, and utilities
- **Bug fixes must include regression tests**: Ensure the bug doesn't happen again
- **Critical paths must be tested**: User flows, authentication, data fetching, etc.
- **Component groups must be tested**: After migrating each component group, write comprehensive tests

### Test Types
1. **Unit Tests**: Test individual functions, hooks, and utilities in isolation
2. **Component Tests**: Test React components with React Testing Library
3. **Integration Tests**: Test interactions between components
4. **E2E Tests**: Test complete user flows (if applicable)
5. **Visual Regression Tests**: Ensure UI matches expected design

### Test Quality
- **Tests must be meaningful**: Test behavior, not implementation details
- **Tests must be maintainable**: Use clear test names and organize tests logically
- **Tests must be fast**: Avoid slow operations; use mocks when necessary
- **Tests must be independent**: Each test should be able to run in isolation

### Before Pull Request
- **All tests must pass**: Run `pnpm test` and ensure 100% pass rate
- **No skipped tests**: Fix or remove any skipped tests
- **Coverage requirements**: Maintain or improve test coverage
- **Test new code**: Ensure new code has appropriate test coverage
- **Phase/Group tests pass**: All tests for the migrated phase/group must pass

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests in CI mode
pnpm test:ci

# Run a specific test file
pnpm test src/__tests__/foundation/layout.test.tsx
```

### Testing Framework: Jest (Not Vitest)
- **Framework**: Jest 30.2.0 with Next.js integration (`next/jest`)
- **Test Location**: **MANDATORY** - All tests must be in `src/__tests__/` directory
- **Test File Naming**: Use `.test.tsx` or `.test.ts` extensions
- **Test Organization**: 
  - Foundation tests: `src/__tests__/foundation/`
  - Component tests: `src/__tests__/components/`
  - Utility tests: `src/__tests__/utils/`
- **Setup**: `jest.setup.js` for global test configuration and mocks
- **Testing Library**: React Testing Library 16.3.0 for component tests
- **Test Utilities**: Use `src/__tests__/utils/test-utils.tsx` for custom render functions
- **Path Aliases**: Jest automatically resolves `@/*` aliases from `tsconfig.json`

### Test Structure Requirements
- **Foundation Tests**: Test configuration, providers, routing, Apollo, Zustand, etc.
- **Component Tests**: Test individual components with React Testing Library
- **Integration Tests**: Test component interactions
- **Test Utilities**: Custom render functions with all providers in `src/__tests__/utils/test-utils.tsx`

---

## Pull Request Process

### Pre-PR Checklist
- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code is formatted (`pnpm format` or `pnpm format:check`)
- [ ] All issue requirements are implemented
- [ ] No `any` types are used
- [ ] All types are defined in `src/types/` directory
- [ ] Types are imported using `@/types/` path alias
- [ ] All test files are in `src/__tests__/` directory
- [ ] Path aliases are used for all imports (not relative paths)
- [ ] Self-review completed
- [ ] No console.logs or debug code
- [ ] No commented-out code
- [ ] Dependencies installed with `pnpm` (not npm)

### PR Description Template
```markdown
## Description
Brief description of what was implemented

## Issue Reference
Closes #<issue-number>

## Changes Made
- List of specific changes
- Each change should be clear and concise

## Testing
- [ ] Unit tests added/updated
- [ ] All existing tests pass
- [ ] Manual testing completed (if applicable)

## Type Safety
- [ ] No `any` types used
- [ ] All types properly defined
- [ ] TypeScript compiles without errors
```

### Code Review Requirements
1. **Self-Review First**: Review your own code before requesting review
2. **Request Review**: Only request review after all tests pass and checklist is complete
3. **Address Feedback**: Respond to all review comments and make necessary changes
4. **Re-test After Changes**: Run tests again after addressing feedback

### PR Approval Criteria
- All tests pass
- Code follows these migration rules
- Issue requirements are fully met
- Code is clean and maintainable
- No type safety issues
- Proper test coverage

---

## Migration-Specific Guidelines

### Complete Framework Replacement

This migration is a **complete framework replacement**:
- **Vite → Next.js 16**: Complete removal of Vite, Next.js is the only build system
- **React Router v5 → Next.js App Router**: All routing uses Next.js file-based routing
- **Material-UI v4 → shadcn/ui**: Complete UI library replacement
- **React 17 → React 19**: Upgrade to React 19 (required by Next.js 16)
- **JavaScript → TypeScript**: All code must be TypeScript

### From React 17 to React 19 (via Next.js 16)

**React 19 Key Changes**:
- **Automatic JSX Transform**: No need to `import React` in most files
- **New `use()` Hook**: For async operations and promises
- **Enhanced Server Components**: Better Server Component support
- **Form Handling**: New `useFormStatus` and `useFormState` hooks
- **Ref as Prop**: `ref` can now be a prop, not just a callback
- **Better Hydration**: Improved hydration error messages

**Migration Considerations**:
- Remove unnecessary `React` imports (automatic JSX transform)
- Update ref usage where applicable
- Test all hooks for React 19 compatibility
- Update error boundaries if needed
- Use new form hooks when appropriate

### From React Router v5 to Next.js 16 App Router

**Routing Migration**:
- **File-Based Routing**: Routes are defined by file structure in `app/` directory
- **Route Groups**: Use `(groupName)` for route organization without affecting URL
- **Layouts**: Use `layout.tsx` files for shared layouts
- **Navigation**: 
  - `useHistory()` → `useRouter()` from `next/navigation`
  - `useLocation()` → `usePathname()` from `next/navigation`
  - `useParams()` → `params` prop in page components
  - `<Link>` from `react-router-dom` → `<Link>` from `next/link`
- **Route Guards**: Convert `PrivateRoute` → Next.js middleware or layout-based auth checks

### Server vs Client Components

**Server Components (Default)**:
- Use for components that don't need interactivity
- Can directly access server-side data
- Cannot use hooks, event handlers, or browser APIs
- Automatically rendered on the server

**Client Components**:
- Must be marked with `'use client'` directive at the top
- Use for components with:
  - Interactivity (onClick, onChange, etc.)
  - React hooks (useState, useEffect, etc.)
  - Browser APIs (window, document, localStorage, etc.)
  - Event listeners
  - Third-party libraries that require client-side

**Best Practice**: Start with Server Components, add `'use client'` only when needed.

### From Redux to Zustand

**State Management Migration**:
- **Zustand 5.0.8**: Currently used in the project (simpler API, better Next.js compatibility)
- **Store Location**: All stores in `src/store/` (use `@/store/` alias)
- **Main Store**: `src/store/useAppStore.ts` - Main Zustand store
- **Store Exports**: Export from `src/store/index.ts`
- **No Provider Needed**: Zustand doesn't require a provider - import and use directly
- **Usage**: `import { useAppStore } from '@/store'`
- **Store Organization**: Keep stores focused and modular
- **Type Definitions**: Store types in `src/types/store.ts` (use `@/types/store` alias)
- **SSR Considerations**: Zustand works seamlessly with Next.js Server/Client Components

### Apollo Client Configuration

**GraphQL Client Setup**:
- **Apollo Client v4.0.9**: Currently used in the project
- **Location**: Apollo setup in `src/lib/apollo/` (use `@/lib/apollo` alias)
- **Files**:
  - `src/lib/apollo/apollo-client.ts` - Apollo Client instance
  - `src/lib/apollo/apollo-provider.tsx` - Apollo Provider wrapper (`ApolloProviderWrapper`)
  - `src/lib/apollo/error-handler.ts` - Error handling utilities
  - `src/lib/apollo/index.ts` - Exports
- **Provider Setup**: `ApolloProviderWrapper` is used in `src/app/layout.tsx` root layout
- **GraphQL Operations**: Place queries, mutations, and subscriptions in `src/graphql/` (use `@/graphql/` alias)
- **GraphQL Version**: graphql 16.12.0
- **SSR Support**: Configured for Next.js App Router with Server/Client Components
- **Usage in Components**: 
  ```typescript
  'use client' // Required for hooks
  import { useQuery, useMutation } from '@apollo/client'
  ```

### From Material-UI v4 to shadcn/ui

**Component Migration Strategy**:
- **Replace MUI Components**: Use shadcn/ui components or build custom with Radix UI primitives
- **Component Location**: All shadcn/ui components go in `src/components/ui/`
- **shadcn/ui Config**: Configured in `components.json` with:
  - Style: "new-york"
  - RSC: true (React Server Components support)
  - Icons: lucide-react
  - Tailwind: CSS variables enabled
- **Styling**: Convert `makeStyles`, JSS, and SCSS to Tailwind CSS v4 classes
- **Icons**: Replace `@material-ui/icons` with `lucide-react` (configured in components.json)
- **Theme**: Use Tailwind CSS variables in `src/app/globals.css`
- **Component Mapping**: See component migration checklist in Roadmap.md
- **Import Path**: Use `@/components/ui/` alias for shadcn/ui components

**Common MUI → shadcn/ui Mappings**:
- `Button` → `@/components/ui/button` (shadcn/ui)
- `TextField` → `@/components/ui/input` + `@/components/ui/label` (shadcn/ui)
- `Dialog` → `@/components/ui/dialog` (shadcn/ui)
- `Card` → `@/components/ui/card` (shadcn/ui)
- `Snackbar` → `Toast` (use `sonner` or similar)
- `Typography` → Native HTML + Tailwind classes

**shadcn/ui Installation**:
- Components are installed via `npx shadcn@latest add [component]`
- Components are automatically placed in `src/components/ui/`
- Utility function `cn()` is in `@/lib/utils` (for className merging)

### From Vite to Next.js

**Build System Migration**:
- **Next.js 16.0.4**: Current version being used
- **No Vite Config**: Next.js handles building - remove `vite.config.js`
- **No `index.html` in root**: Next.js uses `app/layout.tsx` and `app/page.tsx`
- **Configuration**: `next.config.ts` with TypeScript
- **Environment Variables**: 
  - `REACT_APP_*` → `NEXT_PUBLIC_*` for client-side variables
  - Server-only variables don't need prefix
  - Environment config: `src/config/env.ts` (use `@/config/env` alias)
- **Asset Handling**: 
  - Use `next/image` for images (automatic optimization)
  - Static assets in `public/` directory
  - SVG imports handled by Next.js
- **Global Styles**: `src/app/globals.css` (Tailwind CSS v4)
- **Fonts**: Use Next.js font optimization (e.g., `next/font/google`)

### TypeScript Migration

**Type Conversion**:
- **Convert JSX to TSX**: All `.jsx` files should become `.tsx` files
- **Add Types**: Add proper types to all migrated code
- **Type Definitions**: Create type definitions for:
  - API responses (GraphQL queries/mutations)
  - Component props
  - Function parameters and return values
  - State management stores
  - Utility function inputs/outputs
- **Type Location**: **ALL types must be placed in `src/types/` directory**
- **Type Imports**: Use `@/types/` path alias for importing types
- **Type Organization**: Organize types by domain (e.g., `store.ts`, `api.ts`, `graphql.ts`)
- **Avoid `any`**: Never use `any` - use proper types or `unknown`
- **Strict Mode**: Enable all TypeScript strict mode checks

**Type Definition Example**:
```typescript
// ✅ GOOD - Types in src/types/api.ts
// src/types/api.ts
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

// Component file
import type { ApiResponse, User } from '@/types/api';

// ❌ BAD - Types defined inline or in wrong location
// Component file (WRONG)
interface User {
  id: string;
  username: string;
}
```

### Testing Migration

**From Vitest to Jest**:
- **Framework**: Jest 30.2.0 with Next.js integration (`next/jest`)
- **Test Files**: Use `.test.tsx` or `.test.ts` extensions
- **Test Location**: **MANDATORY** - All tests in `src/__tests__/` directory
- **Test Organization**:
  - Foundation tests: `src/__tests__/foundation/`
  - Component tests: `src/__tests__/components/`
  - Utility tests: `src/__tests__/utils/`
- **Testing Library**: React Testing Library 16.3.0
- **Test Utilities**: Custom render in `src/__tests__/utils/test-utils.tsx`
- **Setup**: `jest.setup.js` for global test configuration and mocks
- **Path Aliases**: Jest automatically resolves `@/*` aliases from `tsconfig.json`
- **Coverage**: Configured in `jest.config.js` with coverage directory `coverage/`

---

## React 19 Considerations

### Automatic JSX Transform
- **No React Import Needed**: Most components don't need `import React from 'react'`
- **Exception**: Only needed when using React types explicitly (e.g., `React.FC`)

### New Hooks
- **`use()` Hook**: For async operations and promises
  ```typescript
  // ✅ GOOD - Using use() hook
  const data = use(fetchData())
  ```
- **`useFormStatus()`**: Access form submission status
- **`useFormState()`**: Manage form state with actions

### Ref as Prop
- **Ref can be a prop**: In React 19, `ref` can be passed as a regular prop
  ```typescript
  // ✅ GOOD - Ref as prop (React 19)
  <Component ref={myRef} />
  ```

### Context API Changes
- **`useContext` behavior**: May have updated behavior in React 19
- **Test thoroughly**: Ensure context providers work correctly

### Error Boundaries
- **Improved error handling**: React 19 has better error boundary support
- **Update if needed**: Review error boundary implementations

---

## Next.js 16 App Router Guidelines

### File-Based Routing
- **Route Structure**: Routes are defined by file structure in `app/` directory
- **Page Files**: `page.tsx` files define routes
- **Layout Files**: `layout.tsx` files define shared layouts
- **Route Groups**: Use `(groupName)` for organization without affecting URL
- **Dynamic Routes**: Use `[param]` for dynamic segments
- **Catch-All Routes**: Use `[...slug]` for catch-all routes

### Route Organization
```
app/
├── (auth)/
│   ├── layout.tsx
│   ├── login/
│   │   └── page.tsx
│   └── signup/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── search/
│   │   └── page.tsx
│   └── profile/
│       └── page.tsx
└── layout.tsx
```

### Data Fetching
- **Server Components**: Can directly fetch data (default)
- **Client Components**: Use hooks (useEffect, SWR, React Query) or Server Actions
- **Server Actions**: Use for mutations and form submissions
- **Caching**: Leverage Next.js caching strategies

### Navigation
- **`useRouter()`**: From `next/navigation` (not `next/router`)
- **`usePathname()`**: Get current pathname
- **`useSearchParams()`**: Access search parameters
- **`<Link>`**: From `next/link` (not `react-router-dom`)

### Metadata API
- **Replace `react-helmet-async`**: Use Next.js Metadata API
- **Export `metadata`**: In page or layout files
  ```typescript
  export const metadata: Metadata = {
    title: 'Page Title',
    description: 'Page description',
  }
  ```

---

## Phase-Based Migration

### Migration Approach: Fresh Codebase Strategy

This migration uses a **fresh Next.js codebase approach**:
- Components are migrated in **logical groups** based on functionality
- Each group is tested before moving to the next
- Old code remains in `client/` until migration is complete
- Complete removal of old framework after migration

### Phase Completion Requirements

After completing each phase:
- ✅ All tests pass
- ✅ No console errors
- ✅ TypeScript compiles without errors
- ✅ All functionality verified
- ✅ Integration with previous phases tested
- ✅ Documentation updated (if needed)

---

## Common Pitfalls to Avoid

### ❌ Don't Do This
- Use `any` type
- Define types inline in component files (must use `src/types/`)
- Place test files outside `src/__tests__/` directory
- Use relative imports when path aliases are available
- Use `npm` or `yarn` instead of `pnpm`
- Implement features beyond the issue scope
- Skip writing tests (MANDATORY after each phase/group)
- Commit code with failing tests
- Move to next phase/group without testing current one
- Use `'use client'` unnecessarily (prefer Server Components)
- Mix React Router and Next.js routing
- Keep Vite or React Router dependencies
- Use Material-UI components (must use shadcn/ui)
- Place shadcn/ui components outside `src/components/ui/`
- Use console.log in production code
- Leave commented-out code
- Create large, monolithic components
- Mix business logic with presentation logic
- Import React unnecessarily (React 19 automatic JSX transform)

### ✅ Do This Instead
- Use proper TypeScript types
- Place all types in `src/types/` directory and import using `@/types/` alias
- Organize types by domain in separate files (e.g., `store.ts`, `api.ts`)
- Place all test files in `src/__tests__/` directory
- Use path aliases (`@/*`) for all imports instead of relative paths
- Always use `pnpm` for package management
- Implement exactly what the issue specifies
- Write comprehensive tests (MANDATORY after each phase/group)
- Ensure all tests pass before moving to next phase/group
- Test each component group before proceeding
- Use Server Components by default, add `'use client'` only when needed
- Use Next.js 16.0.4 App Router exclusively (no React Router)
- Use shadcn/ui components in `src/components/ui/` (no Material-UI)
- Use Zustand store from `@/store` (no provider needed)
- Use Apollo Client from `@/lib/apollo`
- Remove old framework dependencies completely
- Use proper logging (if needed, use a logger utility)
- Remove unused code immediately
- Create small, focused components
- Separate concerns properly
- Leverage React 19.2.0 features (automatic JSX transform, new hooks)
- Use Tailwind CSS v4 classes for styling

---

## Quality Checklist

Before submitting any PR, ensure:

- [ ] Code follows clean code principles
- [ ] Components are modular and reusable
- [ ] No `any` types are used
- [ ] All types are defined in `src/types/` directory
- [ ] Types are imported using `@/types/` path alias
- [ ] All dependencies installed with `pnpm`
- [ ] All tests pass
- [ ] New code has test coverage
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] Code is properly formatted
- [ ] Issue requirements are fully met
- [ ] No scope creep (didn't go beyond issue)
- [ ] Self-review completed
- [ ] PR description is clear and complete

---

## Additional Resources

### Documentation
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [React 19 Documentation](https://react.dev/blog/2024/04/25/react-19)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/react)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Apollo Client Next.js Guide](https://www.apollographql.com/docs/react/integrations/integrations/)

### Migration Guides
- [React Router to Next.js](https://nextjs.org/docs/app/building-your-application/routing/migrating)
- [Material-UI Migration Guide](https://mui.com/material-ui/migration/migration-v4/)
- [Vite to Next.js](https://nextjs.org/docs/app/building-your-application/upgrading)
- [React 17 to React 19 Migration](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Next.js 15 to 16 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-16)


---

## Questions or Issues?

If you encounter issues or have questions about these rules:
1. Review this document first
2. Check existing code in `quotevote-frontend` for examples
3. Ask for clarification in team discussions
4. Update this document if you find gaps or improvements

---

---

## Key Reminders

1. **Complete Framework Replacement**: This is a full migration, not a parallel setup. Old frameworks will be completely removed.

2. **Fresh Codebase Approach**: Components are migrated to a fresh Next.js codebase in logical groups.

3. **Mandatory Testing**: Testing is REQUIRED after each phase/group. All tests must be in `src/__tests__/` directory.

4. **React 19.2.0**: Next.js 16.0.4 uses React 19.2.0. Be aware of React 19 changes and leverage new features.

5. **Server Components First**: Default to Server Components, use Client Components only when needed.

6. **TypeScript Strict**: No `any` types. All code must be properly typed. All types in `src/types/`.

7. **Path Aliases**: Always use path aliases (`@/*`) configured in `tsconfig.json`, never relative imports.

8. **Test Location**: All test files MUST be in `src/__tests__/` directory.

9. **Component Organization**: 
   - Shared components: `src/components/`
   - Page components: `src/app/components/`
   - shadcn/ui: `src/components/ui/`

10. **pnpm Only**: Always use `pnpm`, never `npm` or `yarn`.

11. **Scope Control**: Implement exactly what's in the issue, nothing more or less.

12. **Quality Over Speed**: Take the time to write clean, well-tested, properly-typed code that follows these rules. It will save time in the long run.

## Current Project Stack

- **Next.js**: 16.0.4
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.x
- **Zustand**: 5.0.8
- **Apollo Client**: 4.0.9
- **Jest**: 30.2.0
- **React Testing Library**: 16.3.0
- **shadcn/ui**: New York style with lucide-react icons

---

**Remember**: This migration is a complete framework replacement. Follow the phase-based approach, test thoroughly after each phase, and maintain high code quality throughout the process.

