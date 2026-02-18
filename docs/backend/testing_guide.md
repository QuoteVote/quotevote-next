# Backend Testing Guide

## Overview

This document describes the testing strategy and coverage standards for the QuoteVote backend utility modules.

## Test Coverage Standards

### Current Coverage (as of Feb 2026)

- **Statement Coverage**: 97.81%
- **Branch Coverage**: 99.42%
- **Function Coverage**: 100%
- **Total Tests**: 224 passing across 20 test suites

### Coverage Thresholds

Configured in [`jest.config.ts`](../../quotevote-backend/jest.config.ts):

```typescript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
  './app/data/utils/': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

**All utility modules must maintain ≥90% coverage.**

## Utility Module Test Coverage

### ✅ 100% Coverage Modules

| Module                             | Test File                                | Purpose                            |
| ---------------------------------- | ---------------------------------------- | ---------------------------------- |
| `authentication.ts`                | `__tests__/unit/authentication.test.ts`  | JWT auth, login, register, refresh |
| `logger.ts`                        | `__tests__/unit/logger.test.ts`          | Winston logging utilities          |
| `requireAuth.ts`                   | `__tests__/unit/requireAuth.test.ts`     | Auth middleware                    |
| `send-grid-mail.ts`                | `__tests__/unit/send-grid-mail.test.ts`  | Email sending via SendGrid         |
| `pubsub.ts`                        | `__tests__/unit/pubsub.test.ts`          | GraphQL subscriptions              |
| `constants.ts`                     | `__tests__/unit/constants.test.ts`       | App constants                      |
| `presence/cleanupStalePresence.ts` | `__tests__/cleanupStalePresence.test.ts` | User presence cleanup              |

### ⚠️ Intentional Coverage Gaps

#### `rateLimiter.ts` (97.22%)

- **Line 95**: `setInterval(cleanupRateLimitMap, 300000)`
- **Reason**: Guarded by `if (process.env.NODE_ENV !== 'test')` to prevent background intervals during tests
- **Status**: ✅ Correct behavior

#### `index.ts` (0%)

- **Reason**: Export-only file, excluded via `jest.config.ts`
- **Status**: ✅ No logic to test

## Testing Best Practices

### 1. Mock External Dependencies

Always mock network I/O and external services:

```typescript
// Mock SendGrid
jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

// Mock database
jest.mock("~/data/models/User", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
```

### 2. Test Edge Cases

Cover happy paths, error conditions, and edge cases:

```typescript
describe("authentication", () => {
  it("should login with valid credentials", async () => {
    /* ... */
  });
  it("should reject invalid password", async () => {
    /* ... */
  });
  it("should handle missing username", async () => {
    /* ... */
  });
  it("should handle database errors", async () => {
    /* ... */
  });
});
```

### 3. Use Fake Timers for Time-Based Logic

```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it("should expire after window", () => {
  // ... setup
  jest.advanceTimersByTime(60000);
  // ... assertions
});
```

### 4. Test Integration Points

Include integration tests for critical flows:

```typescript
// __tests__/integration/auth.integration.test.ts
it("should complete full signup -> login -> refresh flow", async () => {
  // Test entire authentication lifecycle
});
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Run Specific Test File

```bash
npm test -- __tests__/unit/authentication.test.ts
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

## CI/CD Integration

Tests run automatically on every push via GitHub Actions (`.github/workflows/ci.yml`).

**Coverage reports** are generated and can be viewed in the CI logs.

## Adding New Utility Tests

When adding a new utility module:

1. **Create test file**: `__tests__/unit/<module-name>.test.ts`
2. **Mock dependencies**: Use `jest.mock()` for external I/O
3. **Cover edge cases**: Happy path + error conditions
4. **Run coverage**: Ensure ≥90% coverage for utilities
5. **Update this doc**: Add module to coverage table

## Troubleshooting

### Tests Failing Locally

```bash
# Clear Jest cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose
```

### Coverage Below Threshold

```bash
# View detailed coverage report
npm test -- --coverage --verbose

# Check which lines are uncovered
open coverage/lcov-report/index.html
```

## References

- [Jest Documentation](https://jestjs.io/)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://testingjavascript.com/)
