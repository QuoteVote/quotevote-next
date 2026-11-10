# Quote.Vote Backend

A modern, type-safe backend API built with Express, TypeScript, and GraphQL. This project represents a complete migration from a JavaScript/Babel codebase to a fully TypeScript-based architecture.

## 🚀 Tech Stack

- **Runtime**: Node.js 20.x+
- **Framework**: [Express](https://expressjs.com/) 5.3.0
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.9.3 (Strict Mode)
- **GraphQL**: [Apollo Server](https://www.apollographql.com/docs/apollo-server/) (to be migrated)
- **Database**: MongoDB with Mongoose (to be migrated)
- **CORS**: [cors](https://github.com/expressjs/cors) 2.8.6
- **Logging**: [Winston](https://github.com/winstonjs/winston) 3.19.0
- **Development**: [tsx](https://github.com/privatenumber/tsx) 4.23.15 (`pnpm dev` runs `tsx watch`)
- **Package Manager**: [pnpm](https://pnpm.io/)

## 📋 Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: Latest version (install with `npm install -g pnpm`)
- **MongoDB**: Local instance or connection string

## 🛠️ Getting Started

### Clone Repository

```bash
# Clone repository
git clone https://github.com/QuoteVote/quotevote-next
```

### Installation

```bash
# Navigate to the project directory
cd quotevote-next/quotevote-backend
```

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start development server with hot reload
pnpm dev
```

The server will be available at [http://localhost:4000](http://localhost:4000).

### Environment Variables

#### This will be update after the backend fully setuped.

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=mongodb://localhost:27017/quotevote

# Security
SECRET=your_jwt_secret_key

# CORS
CLIENT_URL=http://localhost:3000

# Proxies in front of the server (1 on the hosting platform). Leave unset locally.
# Per-visitor rate limits only apply when this is set.
TRUST_PROXY=1

# Email (if using SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key

# Other environment variables
# Add additional variables as needed
```

## 🎯 Path Aliases

This project uses TypeScript path aliases for clean imports. Always use these aliases instead of relative paths:

- `~/*` → `./app/*` (general alias)

### Example Usage

```typescript
// ✅ GOOD - Using path aliases
import { User } from '~/data/models/User';
import type { UserType } from '~/types/user';
import { authenticate } from '~/data/utils/auth';

// ❌ BAD - Using relative paths
import { User } from '../../../data/models/User';
```

**Note**: Path aliases are configured in `tsconfig.json`. Additional aliases can be added as the project grows.

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
pnpm test app/__tests__/utils/auth.test.ts
```

### Test Requirements

- **Test Location**: All test files **MUST** be in `app/__tests__/` directory
- **Test Naming**: Use `.test.ts` or `.spec.ts` extensions
- **Test Organization**:
  - Unit tests: `app/__tests__/unit/`
  - Integration tests: `app/__tests__/integration/`
  - Utility tests: `app/__tests__/utils/`
- **Testing is MANDATORY**: After each phase or module migration, all tests must pass before proceeding

### Test Structure

```typescript
import { describe, it, expect } from '@jest/globals';
import { authenticate } from '~/data/utils/auth';

describe('authenticate', () => {
  it('should authenticate valid user', () => {
    const result = authenticate('valid-token');
    expect(result).toBeDefined();
  });
});
```

## 🏗️ Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

The compiled JavaScript will be in the `dist/` directory.

## 📝 Code Quality

### TypeScript Requirements

- **Strict Mode**: All TypeScript strict mode checks must pass
- **No `any` Types**: Never use `any` - use proper types or `unknown`
- **Type Definitions**: All types must be placed in `app/types/` directory
- **Type Imports**: Use `import type` for type-only imports
- **Explicit Return Types**: Functions should have explicit return types when not obvious

### Code Standards

- **Clean Code**: Write readable, self-documenting code
- **Modularity**: Keep modules small and focused
- **Single Responsibility**: Each function/module should have one clear purpose
- **DRY Principle**: Extract common logic into reusable utilities
- **Error Handling**: Always handle errors appropriately
- **Async/Await**: Prefer async/await over promises

### Type Definition Examples

```typescript
// ✅ GOOD - Types in app/types/user.ts
// app/types/user.ts
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export type UserInput = Omit<User, 'id' | 'createdAt'>;

// Usage in controller
import type { User, UserInput } from '~/types/user';

// ❌ BAD - Types defined inline
// Controller file (WRONG)
interface User {
  id: string;
  username: string;
}
```

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

## 🎨 Architecture Guidelines

### Express Middleware

- **Order Matters**: Middleware is executed in the order it's defined
- **Error Handling**: Use error-handling middleware at the end
- **Security**: Security headers aren't set yet; they're part of the security pass (#107)
- **CORS**: Configure CORS properly for your frontend URL

### Route Structure

```typescript
// ✅ GOOD - Organized route structure
// app/routes/users.ts
import { Router } from 'express';
import { getUsers, createUser } from '~/controllers/userController';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);

export default router;
```

### Controller Pattern

```typescript
// ✅ GOOD - Controller with proper types
// app/controllers/userController.ts
import type { Request, Response } from 'express';
import type { UserInput } from '~/types/user';
import { UserService } from '~/services/userService';

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await UserService.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Service Layer

```typescript
// ✅ GOOD - Service with business logic
// app/services/userService.ts
import { User } from '~/data/models/User';
import type { UserInput } from '~/types/user';

export class UserService {
  static async getAll(): Promise<User[]> {
    return User.find();
  }

  static async create(input: UserInput): Promise<User> {
    return User.create(input);
  }
}
```

## 🔧 Available Scripts

| Script               | Description                              |
| -------------------- | ---------------------------------------- |
| `pnpm dev`           | Start development server with hot reload |
| `pnpm build`         | Build TypeScript to JavaScript           |
| `pnpm start`         | Start production server                  |
| `pnpm lint`          | Run ESLint                               |
| `pnpm lint:fix`      | Fix ESLint issues                        |
| `pnpm type-check`    | Check TypeScript types                   |
| `pnpm format`        | Format code with Prettier                |
| `pnpm format:check`  | Check code formatting                    |
| `pnpm test`          | Run tests                                |
| `pnpm test:watch`    | Run tests in watch mode                  |
| `pnpm test:coverage` | Run tests with coverage                  |
| `pnpm data:check`    | Read-only record and index check (#183)  |

## 📚 Key Conventions

### Naming Conventions

- **Files**: camelCase (e.g., `userController.ts`)
- **Classes**: PascalCase (e.g., `UserService`)
- **Functions**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase (e.g., `User`, `ApiResponse`)
- **Models**: PascalCase, singular (e.g., `User`, `Post`)

### File Organization

- **Controllers**: `app/controllers/`
- **Services**: `app/services/`
- **Models**: `app/data/models/`
- **Routes**: `app/routes/`
- **Middleware**: `app/middleware/`
- **Resolvers**: `app/data/resolvers/`
- **Utilities**: `app/data/utils/`
- **Type definitions**: `app/types/` (MANDATORY)
- **Test files**: `app/__tests__/` (MANDATORY)
- **GraphQL**: `app/graphql/`

### Error Handling

```typescript
// ✅ GOOD - Proper error handling
try {
  const result = await someAsyncOperation();
  res.json(result);
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}
```

### Async/Await

```typescript
// ✅ GOOD - Using async/await
export async function getUser(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.params.id);
  res.json(user);
}

// ❌ BAD - Using promises
export function getUser(req: Request, res: Response): void {
  User.findById(req.params.id).then((user) => {
    res.json(user);
  });
}
```

## 🚫 Common Pitfalls to Avoid

- ❌ Using `any` type
- ❌ Defining types inline in files (must use `app/types/`)
- ❌ Placing test files outside `app/__tests__/`
- ❌ Using relative imports when path aliases are available
- ❌ Using `npm` or `yarn` instead of `pnpm`
- ❌ Not handling errors properly
- ❌ Using promises instead of async/await
- ❌ Not using explicit return types
- ❌ Mixing JavaScript and TypeScript files
- ❌ Not using `import type` for type-only imports
- ❌ Leaving console.log statements in production code

## 🔄 Migration from Old Server

This backend is a complete migration from the old `server` directory:

### Key Changes

- **JavaScript → TypeScript**: Complete type safety
- **Babel → TypeScript Compiler**: Native TypeScript compilation
- **CommonJS → ES Modules**: Modern module system
- **Express 4 → Express 5**: Latest Express version
- **Manual Setup → Structured Architecture**: Organized code structure

### Migration Approach

- **Complete Framework Replacement**: Old codebase will be completely removed after migration
- **Fresh Codebase Strategy**: Code is migrated in logical groups
- **TypeScript First**: All new code must be TypeScript
- **Testing Required**: Tests must pass after each migration phase

### Legacy Codebase

The original backend codebase is available for reference during migration:

- **[Legacy Backend Repository](https://github.com/QuoteVote/quotevote-monorepo/tree/main/server)** - Original JavaScript/Babel/Express 4 codebase

When migrating features or modules:

- Reference the legacy codebase for business logic and API endpoints
- Convert JavaScript to TypeScript with proper type definitions
- Update to Express 5 patterns and modern async/await
- Restructure code following the new architecture guidelines
- Ensure all tests pass before proceeding to the next migration phase

## 📖 Additional Resources

### Documentation

- [Express Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Jest Documentation](https://jestjs.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Migration Documentation

For detailed migration rules and guidelines, see [Migration-Rules.md](../docs/Migration-Rules.md) (frontend migration rules apply similarly to backend).

## 🤝 Contributing

Before submitting a PR, ensure:

- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compiles without errors (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code is formatted (`pnpm format:check`)
- [ ] No `any` types are used
- [ ] All types are defined in `app/types/` directory
- [ ] All test files are in `app/__tests__/` directory
- [ ] Path aliases are used for all imports
- [ ] Dependencies installed with `pnpm`
- [ ] Error handling is implemented
- [ ] Async/await is used instead of promises

## 🔒 Security

- **Security headers**: not set yet, part of the security pass (#107)
- **CORS**: Properly configured for frontend
- **Environment Variables**: Sensitive data in `.env` (not committed)
- **Input Validation**: Validate all user inputs
- **Error Messages**: Don't expose sensitive information in error messages

---

**Built with ❤️ using Express, TypeScript, and Node.js**
