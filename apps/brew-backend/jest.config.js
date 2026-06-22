/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.(e2e-)?spec\\.ts$',
  testTimeout: 20000,
  moduleNameMapper: {
    '^@brew/contracts$': '<rootDir>/../../../packages/brew-contracts/src/index.ts',
  },
};
