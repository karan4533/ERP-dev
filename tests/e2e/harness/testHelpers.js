/**
 * tests/e2e/harness/testHelpers.js
 * Assertion utilities, schema checkers, and mock factories for E2E tests.
 */
import assert from 'node:assert/strict';
import { isApiResponse } from '../../../src/services/api/responseEnvelope.js';

/**
 * Asserts that the response is a successful API envelope.
 * @param {any} res
 * @param {string} [msg]
 */
export function assertSuccessEnvelope(res, msg = 'Expected API response to be successful') {
  assert.ok(res, `${msg}: response is null/undefined`);
  assert.equal(isApiResponse(res), true, `${msg}: response is not a valid ApiResponse envelope`);
  assert.equal(res.success, true, `${msg}: res.success is not true`);
  assert.equal(res.error, null, `${msg}: res.error should be null`);
  assert.notEqual(res.data, null, `${msg}: res.data should not be null`);
}

/**
 * Asserts that the response is an error API envelope.
 * @param {any} res
 * @param {RegExp|string} [expectedErrorMatch]
 * @param {string} [msg]
 */
export function assertErrorEnvelope(res, expectedErrorMatch, msg = 'Expected API response to indicate error') {
  assert.ok(res, `${msg}: response is null/undefined`);
  assert.equal(isApiResponse(res), true, `${msg}: response is not a valid ApiResponse envelope`);
  assert.equal(res.success, false, `${msg}: res.success should be false`);
  assert.notEqual(res.error, null, `${msg}: res.error should contain an error message`);
  if (expectedErrorMatch) {
    if (expectedErrorMatch instanceof RegExp) {
      assert.match(res.error, expectedErrorMatch, `${msg}: error message did not match pattern`);
    } else {
      assert.ok(res.error.toLowerCase().includes(String(expectedErrorMatch).toLowerCase()),
        `${msg}: error message does not include "${expectedErrorMatch}"`);
    }
  }
}

/**
 * Validates that an object contains all specified required fields.
 * @param {Record<string, any>} obj
 * @param {string[]} requiredFields
 * @param {string} [context]
 */
export function assertRequiredFields(obj, requiredFields, context = 'Entity') {
  assert.ok(obj && typeof obj === 'object', `${context} must be an object`);
  for (const field of requiredFields) {
    assert.ok(
      obj[field] !== undefined && obj[field] !== null,
      `${context} is missing required field: ${field}`
    );
  }
}

/**
 * Asserts that a storage location adheres to the 4-tier coordinate structure.
 * @param {any} location
 */
export function assertStorageLocationStructure(location) {
  assert.ok(location, 'Storage location must exist');
  assert.ok(location.rackNo, 'Storage location must have rackNo');
  assert.ok(location.shelfNo, 'Storage location must have shelfNo');
}

/**
 * Mock factory for student data.
 */
export function createMockStudent(overrides = {}) {
  return {
    studentId: `STU-TEST-${Date.now().toString().slice(-4)}`,
    fullName: 'Test Student',
    grade: 'Grade 10',
    section: 'A',
    rollNumber: '10-A-99',
    parentContact: {
      fatherName: 'Father Name',
      fatherPhone: '+91 99999 88888',
      email: 'parent.test@example.com',
    },
    ...overrides,
  };
}

/**
 * Mock factory for purchase order line items.
 */
export function createMockLineItem(overrides = {}) {
  return {
    itemName: 'Test Laboratory Equipment',
    quantity: 10,
    unitPrice: 500,
    gstRatePercent: 18,
    ...overrides,
  };
}
