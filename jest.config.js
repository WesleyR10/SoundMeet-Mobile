// jest-expo é o preset oficial recomendado pela Expo para SDK 56/New
// Architecture — transforma JS/TS/JSX igual ao Metro e já traz mocks dos
// módulos nativos Expo, então serve tanto para os testes de lógica pura de
// hoje quanto para testes de componente no futuro, sem precisar de um
// segundo config.
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/remotion/',
  ],
};
