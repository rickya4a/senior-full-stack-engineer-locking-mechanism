import { jest, beforeEach } from '@jest/globals';

// Extend timeout for all tests
jest.setTimeout(10000);

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});