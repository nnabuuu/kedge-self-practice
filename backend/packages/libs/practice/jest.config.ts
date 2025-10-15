/* eslint-disable */
export default {
  displayName: 'practice',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/packages/libs/practice',
  transformIgnorePatterns: [
    'node_modules/(?!(ali-oss)/)',
  ],
};
