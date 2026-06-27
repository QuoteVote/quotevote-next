# Quote.Vote Frontend

A modern, type-safe frontend application built with Next.js 16, React 19, and TypeScript. This project represents a complete migration from a React 17/Vite codebase to a Next.js 16 App Router architecture.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16.0.4 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.x (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4.x
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (New York style)
- **Icons**: [lucide-react](https://lucide.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) 5.0.8
- **GraphQL Client**: [Apollo Client](https://www.apollographql.com/) 4.0.9
- **Testing**: [Jest](https://jestjs.io/) 30.2.0 + [React Testing Library](https://testing-library.com/react) 16.3.0; [Playwright](https://playwright.dev/) for E2E
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## 🎨 Design Resources

- **[Quote.Vote UI Design (Figma)](https://www.figma.com/design/b4zMmypvTj7R9HgcWUwGHM/Quote.Vote-User-Interface-Design)**
- **[UI Design Specifications (Zeplin)](https://zpl.io/VDlzXPg)**

## 📋 Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: Latest version (install with `npm install -g pnpm`)

## 🛠️ Getting Started

### Clone Repository

```bash
# clone repository
git clone https://github.com/QuoteVote/quotevote-next
```

### Installation

```bash
# Navigate to the project directory
cd quotevote-next/quotevote-frontend
```

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file in the root directory with the following variable:

```env
# GraphQL endpoint URL (must be prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
```

The server URL is automatically derived from the GraphQL endpoint by removing the `/graphql` suffix.

## 🎯 Path Aliases

This project uses TypeScript path aliases for clean imports. Always use these aliases instead of relative paths:

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

### Example Usage

```typescript
// ✅ GOOD - Using path aliases
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import type { UserState } from '@/types/store'

// ❌ BAD - Using relative paths
import { Button } from '../../../components/ui/button'
```

## 🧪 Testing

### Unit tests (Jest)

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

### E2E tests (Playwright)

End-to-end specs live in `e2e/` and run against a real browser. Playwright starts the dev server automatically (or reuse one already on `:3000`).

**One-time setup:**

```bash
pnpm exec playwright install chromium
cp .env.e2e.example .env.e2e.local
# Edit .env.e2e.local — set E2E_AUTHOR_PASSWORD and E2E_PUBLIC_GROUP_NAME
```

**Run commands:**

```bash
# All E2E (desktop + mobile viewports)
pnpm test:e2e

# One spec file
pnpm test:e2e post-submission.spec.ts

# By test sheet ID
pnpm test:e2e --grep "E2E-POST-001"

# One viewport only
pnpm test:e2e --project=desktop post-submission.spec.ts
pnpm test:e2e --project=mobile post-submission.spec.ts

# Debug
pnpm test:e2e:headed post-submission.spec.ts
pnpm test:e2e:ui

# Dev server already running
PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm test:e2e post-submission.spec.ts
```

See [`.env.e2e.example`](.env.e2e.example) for env vars and the full command reference.

### Test Requirements

**Unit tests (Jest)**

- **Location**: `src/__tests__/`
- **Naming**: `.test.tsx` or `.test.ts`
- **Organization**:
  - Foundation: `src/__tests__/foundation/`
  - Components: `src/__tests__/components/`
  - Utilities: `src/__tests__/utils/`

**E2E tests (Playwright)**

- **Location**: `e2e/` (specs use `.spec.ts`)
- **Helpers**: `e2e/helpers/`
- **Config**: `playwright.config.ts` (desktop + mobile projects)
- **Auth state**: generated at runtime in `e2e/.auth/` (gitignored)

- **Testing is MANDATORY**: After each phase or component group migration, unit tests must pass before proceeding

### Test Structure

```typescript
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## 🏗️ Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 📝 Code Quality

### TypeScript Requirements

- **Strict Mode**: All TypeScript strict mode checks must pass
- **No `any` Types**: Never use `any` - use proper types or `unknown`
- **Type Definitions**: All types must be placed in `src/types/` directory
- **Type Imports**: Use `@/types/` path alias for importing types

### Code Standards

- **Clean Code**: Write readable, self-documenting code
- **Modularity**: Keep components small and focused
- **Single Responsibility**: Each function/component should have one clear purpose
- **DRY Principle**: Extract common logic into reusable utilities or hooks

### Linting and Formatting

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Check TypeScript types
pnpm type-check

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## 🎨 Component Guidelines

### UI Design & Inspiration

The UI design is a work in progress and serves as a source of inspiration for the implementation:

- **[Quote.Vote UI Design (Figma)](https://www.figma.com/design/b4zMmypvTj7R9HgcWUwGHM/Quote.Vote-User-Interface-Design)**
- **[UI Design Specifications (Zeplin)](https://zpl.io/VDlzXPg)**

**Note**: The Figma design is not fully completed. Use it as a reference and inspiration for:
- Color schemes and theming direction
- Component styling approaches and layout ideas
- Spacing and typography concepts
- Responsive design patterns

Feel free to adapt and improve upon the designs as needed during implementation.

### Server vs Client Components

**Server Components (Default)**:
- Use for components that don't need interactivity
- Can directly access server-side data
- Cannot use hooks, event handlers, or browser APIs

**Client Components**:
- Must be marked with `'use client'` directive at the top
- Use for components with interactivity, hooks, or browser APIs

**Best Practice**: Start with Server Components, add `'use client'` only when needed.

### Component Structure

```typescript
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store'
import type { UserState } from '@/types/store'

interface MyComponentProps {
  prop1: string
  prop2?: number
}

export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  const store = useAppStore()
  // Component logic
  return <div>...</div>
}
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint issues |
| `pnpm type-check` | Check TypeScript types |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check code formatting |
| `pnpm test` | Run unit tests (Jest) |
| `pnpm test:watch` | Run unit tests in watch mode |
| `pnpm test:coverage` | Run unit tests with coverage |
| `pnpm test:ci` | Run unit tests in CI mode |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm test:e2e:headed` | Run E2E tests in a visible browser |
| `pnpm test:e2e:ui` | Open Playwright UI for debugging E2E |

## 📚 Key Conventions

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase starting with `use` (e.g., `useUserData.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types/Interfaces**: PascalCase (e.g., `UserProfile`, `ApiResponse`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)

### File Organization

- **Shared components**: `src/components/`
- **Page-specific components**: `src/app/components/`
- **shadcn/ui components**: `src/components/ui/`
- **Custom hooks**: `src/hooks/`
- **Type definitions**: `src/types/` (MANDATORY)
- **Unit test files**: `src/__tests__/`
- **E2E test files**: `e2e/`

### State Management

- **Zustand**: Use `@/store` for state management
- **No Provider Needed**: Zustand doesn't require a provider
- **Usage**: `import { useAppStore } from '@/store'`

### GraphQL

- **Apollo Client**: Configured in `src/lib/apollo/`
- **GraphQL Operations**: Place in `src/graphql/`
- **Usage**: Use `useQuery`, `useMutation` from `@apollo/client` in Client Components

## 🚫 Common Pitfalls to Avoid

- ❌ Using `any` type
- ❌ Defining types inline in component files (must use `src/types/`)
- ❌ Placing Jest unit tests outside `src/__tests__/`
- ❌ Using relative imports when path aliases are available
- ❌ Using `npm` or `yarn` instead of `pnpm`
- ❌ Using `'use client'` unnecessarily (prefer Server Components)
- ❌ Using Material-UI components (must use shadcn/ui)
- ❌ Importing React unnecessarily (React 19 automatic JSX transform)

## 📖 Additional Resources

### Documentation

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev/blog/2024/04/25/react-19)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/react)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Apollo Client Next.js Guide](https://www.apollographql.com/docs/react/integrations/integrations/)

### Migration Documentation

For detailed migration rules and guidelines, see [Migration-Rules.md](../docs/Migration-Rules.md).

### Legacy Codebase

This project is a complete migration from the legacy React 17/Vite codebase. The original codebase is available for reference:

- **[Legacy Frontend Repository](https://github.com/QuoteVote/quotevote-monorepo/tree/main/client)** - Original React 17/Vite codebase

When migrating components or features:
- Reference the legacy codebase for business logic and functionality
- Adapt the code to Next.js 16 App Router patterns
- Convert to TypeScript with proper type definitions
- Update styling to use Tailwind CSS and shadcn/ui components
- Follow the UI design guidelines from the Figma file

## 🤝 Contributing

Before submitting a PR, ensure:

- [ ] All unit tests pass (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code is formatted (`pnpm format:check`)
- [ ] No `any` types are used
- [ ] All types are defined in `src/types/` directory
- [ ] Unit test files are in `src/__tests__/`
- [ ] Path aliases are used for all imports
- [ ] Dependencies installed with `pnpm`

---

**Built with ❤️ using Next.js 16, React 19, and TypeScript**
