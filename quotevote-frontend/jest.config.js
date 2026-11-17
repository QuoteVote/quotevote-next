// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jsdom',

  // Setup files after environment is created
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/src/types/', '/e2e/'],

  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  clearMocks: true,
  restoreMocks: true,
  // Reduce workers to prevent SIGSEGV errors
  maxWorkers: '50%',
  // Increase timeout for slower tests
  testTimeout: 10000,
  // Worker configuration to prevent crashes
  workerIdleMemoryLimit: '512MB',
}

// next/jest leaves node_modules untransformed; DiceBear (#722) ships ES modules only,
// so let it through (also under pnpm's .pnpm folder) and keep next/jest's other patterns.
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)()
  config.transformIgnorePatterns = [
    '/node_modules/(?!(\\.pnpm/@dicebear|@dicebear))',
    ...config.transformIgnorePatterns.filter((pattern) => !pattern.includes('node_modules')),
  ]
  return config
}
