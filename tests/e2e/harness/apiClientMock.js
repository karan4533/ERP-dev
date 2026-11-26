/**
 * tests/e2e/harness/apiClientMock.js
 * Centralized mock harness re-exporting apiClient and mockAdapter with test resets.
 */
import './setup.js';
import { apiClient } from '../../../src/services/api/apiClient.js';
import { mockAdapter } from '../../../src/services/api/mockAdapter.js';

export { apiClient, mockAdapter };

/**
 * Resets the entire mock database back to initial seed data.
 */
export function resetMockDatabase() {
  mockAdapter.resetDatabase();
}
