module.exports = {
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': ['@swc/jest', { module: { type: 'commonjs' } }] },
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
