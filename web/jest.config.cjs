module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { jsc: { transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }],
  },
  moduleNameMapper: { '\\.(css|scss)$': 'identity-obj-proxy' },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.stories.tsx', '!src/entry-*.tsx'],
};
