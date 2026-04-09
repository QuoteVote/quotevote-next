/**
 * Jest configuration for backend testing.
 * Implements coverage thresholds for utility modules.
 */

import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/app/$1',
  },

  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.next/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  
  // Coverage collection settings to focus on backend utilities and environment configuration.
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'app/data/utils/**/*.{ts,tsx}',
    '!app/data/utils/index.ts',
    '!app/data/utils/sample.ts',
    'app/types/environment.ts',
    'app/data/resolvers/utils/**/*.{ts,tsx}',
    '!app/data/resolvers/utils/index.ts',
    '!app/data/resolvers/utils/stripe/index.ts',
  ],
  // Strict coverage thresholds for utility modules to maintain professional quality.
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
  },
};

export default config;
