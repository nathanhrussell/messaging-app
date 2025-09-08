// jest.config.js
module.exports = {
  // Use different configurations for client and server
  projects: [
    {
      displayName: "server",
      testMatch: ["<rootDir>/server/**/*.test.js"],
      testEnvironment: "node",
      // Enable ES modules support for server tests
      transform: {
        "^.+\\.js$": "babel-jest",
      },
      globals: {
        "ts-jest": {
          useESM: true,
        },
      },
    },
    {
      displayName: "client",
      testMatch: ["<rootDir>/client/**/*.test.{js,jsx}"],
      testEnvironment: "jsdom",
      transform: {
        "^.+\\.(js|jsx)$": "babel-jest",
      },
      moduleFileExtensions: ["js", "jsx"],
    },
  ],
  // Global settings
  collectCoverageFrom: [
    "server/**/*.js",
    "client/src/**/*.{js,jsx}",
    "!**/node_modules/**",
    "!**/coverage/**",
  ],
};
