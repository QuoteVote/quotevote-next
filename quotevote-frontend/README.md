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
- **Testing**: [Jest](https://jestjs.io/) 30.2.0 + [React Testing Library](https://testing-library.com/react) 16.3.0
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)

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

Create a `.env.local` file in the root directory with the following variables:

```env
# Client-side variables (must be prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000
```

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

### Test Requirements

- **Test Location**: All test files **MUST** be in `src/__tests__/` directory
- **Test Naming**: Use `.test.tsx` or `.test.ts` extensions
- **Test Organization**:
  - Foundation tests: `src/__tests__/foundation/`
  - Component tests: `src/__tests__/components/`
  - Utility tests: `src/__tests__/utils/`
- **Testing is MANDATORY**: After each phase or component group migration, all tests must pass before proceeding

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

- **[Quote.Vote UI Design (Figma)](https://www.figma.com/design/b4zMmypvTj7R9HgcWUwGHM/Quote.Vote-User-Interface-Design)** - Design inspiration and UI patterns (work in progress)

**Note**: The Figma design is not fully completed. Use it as a reference and inspiration for:
- Color schemes and theming direction
- Component styling approaches and layout ideas
- Spacing and typography concepts
- Interactive states and animation ideas
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
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:ci` | Run tests in CI mode |

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
- **Test files**: `src/__tests__/` (MANDATORY)

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
- ❌ Placing test files outside `src/__tests__/`
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

- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code is formatted (`pnpm format:check`)
- [ ] No `any` types are used
- [ ] All types are defined in `src/types/` directory
- [ ] All test files are in `src/__tests__/` directory
- [ ] Path aliases are used for all imports
- [ ] Dependencies installed with `pnpm`

---

**Built with ❤️ using Next.js 16, React 19, and TypeScript**
