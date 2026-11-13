import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { apiClient, mockAdapter } from '../harness/apiClientMock.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';
import { paginateResults } from '../../../src/services/api/responseEnvelope.js';
import { generateUniqueId } from '../../../src/services/models/index.js';

test('F01-T2-01: Pre-aborted AbortSignal immediately halts API client request with error envelope', async () => {
  const ctrl = new AbortController();
  ctrl.abort('User cancelled action');

  const res = await apiClient.get('/api/v1/pro/correspondence', { signal: ctrl.signal });
  assertErrorEnvelope(res, /cancelled|aborted/i);
  assert.equal(res.data, null);
});

test('F01-T2-02: AbortSignal triggered during simulated network latency rejects pending request', async () => {
  const ctrl = new AbortController();
  const reqPromise = apiClient.get('/api/v1/pro/correspondence', {
    delayMs: 120,
    signal: ctrl.signal,
  });

  setTimeout(() => ctrl.abort('Network timeout occurred'), 25);
  const res = await reqPromise;

  assertErrorEnvelope(res, /timeout|aborted/i);
});

test('F01-T2-03: Requesting non-existent API endpoint returns 404 error envelope without throwing uncaught exception', async () => {
  const res = await apiClient.get('/api/v1/nonexistent/endpoint/path');
  assertErrorEnvelope(res, /not found|unsupported/i);
});

test('F01-T2-04: paginateResults handles edge cases (pageSize 0, negative page numbers, out of bounds page)', () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

  // Page out of bounds
  const outOfBounds = paginateResults(items, { page: 99, pageSize: 10 });
  assert.equal(outOfBounds.items.length, 0);
  assert.equal(outOfBounds.meta.total, 3);
  assert.equal(outOfBounds.meta.page, 99);

  // Negative page clamped to 1
  const negativePage = paginateResults(items, { page: -5, pageSize: 2 });
  assert.equal(negativePage.meta.page, 1);
  assert.equal(negativePage.items.length, 2);

  // PageSize 0 or negative clamped to default 10
  const zeroPageSize = paginateResults(items, { page: 1, pageSize: 0 });
  assert.equal(zeroPageSize.meta.pageSize, 10);
  assert.equal(zeroPageSize.items.length, 3);
});

test('F01-T2-05: generateUniqueId produces zero collisions across 1,000 rapid synchronous invocations', () => {
  const set = new Set();
  const count = 1000;
  for (let i = 0; i < count; i++) {
    set.add(generateUniqueId('E2E-COLLISION-TEST'));
  }
  assert.equal(set.size, count, 'Every generated ID across 1,000 invocations must be globally unique');
});

test('F01-T2-06: File upload abstraction with aborted signal returns error envelope', async () => {
  const ctrl = new AbortController();
  ctrl.abort('Upload cancelled by client');
  const res = await apiClient.upload('/api/v1/upload', { name: 'test.pdf' }, { signal: ctrl.signal });
  assertErrorEnvelope(res, /cancelled|aborted/i);
});
