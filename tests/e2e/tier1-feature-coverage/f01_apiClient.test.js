import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { apiClient, mockAdapter } from '../harness/apiClientMock.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';
import {
  createSuccessResponse,
  createErrorResponse,
  isApiResponse,
  paginateResults,
} from '../../../src/services/api/responseEnvelope.js';

test('F01-T1-01: Central API client executes GET requests returning valid response envelope', async () => {
  mockAdapter.resetDatabase();
  const res = await apiClient.get('/api/v1/pro/correspondence');
  assertSuccessEnvelope(res, 'GET /api/v1/pro/correspondence');
  assert.ok(Array.isArray(res.data), 'Expected data to be an array of correspondence');
  assert.ok(res.data.length > 0, 'Seed data should provide correspondence items');
});

test('F01-T1-02: Central API client executes POST requests and returns newly created entity with assigned ID', async () => {
  mockAdapter.resetDatabase();
  const payload = {
    name: 'Precision Vernier Caliper 150mm',
    category: 'Physics Laboratory Equipment',
    currentStock: 25,
    minStockLevel: 5,
    unitOfMeasure: 'Pieces',
    unitPrice: 850,
  };
  const res = await apiClient.post('/api/v1/inventory/catalog', payload);
  assertSuccessEnvelope(res, 'POST /api/v1/inventory/catalog');
  assert.ok(res.data.id, 'Created entity must contain an auto-generated id');
  assert.equal(res.data.name, payload.name);
  assert.equal(res.data.currentStock, 25);
});

test('F01-T1-03: Central API client executes PUT and PATCH requests to update entity records', async () => {
  mockAdapter.resetDatabase();
  const postRes = await apiClient.post('/api/v1/inventory/catalog', {
    name: 'Chemistry Test Tube Rack',
    category: 'Chemistry Laboratory Equipment',
    currentStock: 10,
    minStockLevel: 2,
    unitOfMeasure: 'Pieces',
    unitPrice: 200,
  });
  assertSuccessEnvelope(postRes);
  const createdId = postRes.data.id;

  // PUT update
  const putRes = await apiClient.put(`/api/v1/inventory/catalog/${createdId}`, {
    name: 'Chemistry Test Tube Rack (Heavy Duty Wooden)',
    currentStock: 15,
  });
  assertSuccessEnvelope(putRes, 'PUT /api/v1/inventory/catalog/:id');
  assert.equal(putRes.data.name, 'Chemistry Test Tube Rack (Heavy Duty Wooden)');
  assert.equal(putRes.data.currentStock, 15);

  // PATCH partial update
  const patchRes = await apiClient.patch(`/api/v1/inventory/catalog/${createdId}`, {
    unitPrice: 250,
  });
  assertSuccessEnvelope(patchRes, 'PATCH /api/v1/inventory/catalog/:id');
  assert.equal(patchRes.data.unitPrice, 250);
});

test('F01-T1-04: Central API client executes DELETE requests and removes entity from database', async () => {
  mockAdapter.resetDatabase();
  const postRes = await apiClient.post('/api/v1/inventory/catalog', {
    name: 'Obsolete Voltmeter Prototype',
    category: 'Electronics',
    currentStock: 1,
    unitPrice: 100,
  });
  assertSuccessEnvelope(postRes);
  const itemId = postRes.data.id;

  // Execute DELETE
  const deleteRes = await apiClient.delete(`/api/v1/inventory/catalog/${itemId}`);
  assertSuccessEnvelope(deleteRes, 'DELETE /api/v1/inventory/catalog/:id');
  assert.equal(deleteRes.data.id, itemId, 'Deleted response should return removed record');

  // Verify subsequent fetch returns 404/error
  const fetchRes = await apiClient.get(`/api/v1/inventory/catalog/${itemId}`);
  assertErrorEnvelope(fetchRes, /not found/i, 'Deleted item should not be found');
});

test('F01-T1-05: Central API client supports file upload and download abstraction helpers', async () => {
  const uploadPayload = {
    name: 'cbse_affiliation_sanction_2026.pdf',
    size: 2048576,
  };
  const uploadRes = await apiClient.upload('/api/v1/upload', uploadPayload);
  assertSuccessEnvelope(uploadRes, 'apiClient.upload');
  assert.ok(uploadRes.data.fileUrl, 'Upload response must include fileUrl');
  assert.ok(uploadRes.data.fileId, 'Upload response must include fileId');

  const downloadRes = await apiClient.download(uploadRes.data.fileUrl);
  assertSuccessEnvelope(downloadRes, 'apiClient.download');
  assert.ok(downloadRes.data.downloadUrl, 'Download response must include downloadUrl');
});

test('F01-T1-06: Envelope utilities create standardized success and error structures and pagination meta', () => {
  const successEnv = createSuccessResponse({ key: 'val' }, { total: 100, page: 2, pageSize: 25 });
  assert.equal(isApiResponse(successEnv), true);
  assert.equal(successEnv.success, true);
  assert.equal(successEnv.meta.total, 100);
  assert.equal(successEnv.meta.page, 2);
  assert.equal(successEnv.meta.pageSize, 25);

  const errorEnv = createErrorResponse('Statutory permit expired');
  assert.equal(isApiResponse(errorEnv), true);
  assert.equal(errorEnv.success, false);
  assert.equal(errorEnv.data, null);
  assert.equal(errorEnv.error, 'Statutory permit expired');

  const items = Array.from({ length: 15 }, (_, i) => ({ id: i + 1 }));
  const paged = paginateResults(items, { page: 2, pageSize: 5 });
  assert.equal(paged.items.length, 5);
  assert.equal(paged.items[0].id, 6);
  assert.equal(paged.meta.total, 15);
  assert.equal(paged.meta.page, 2);
  assert.equal(paged.meta.pageSize, 5);
});
