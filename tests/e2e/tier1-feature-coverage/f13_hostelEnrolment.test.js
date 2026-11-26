import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import { mockAdapter } from '../harness/apiClientMock.js';
import { hostelService } from '../../../src/services/modules/hostelService.js';
import { feeService } from '../../../src/services/modules/feeService.js';
import { assertSuccessEnvelope, assertErrorEnvelope } from '../harness/testHelpers.js';

test('F13-T1-01: Hostel service retrieves hostel blocks with capacities and amenities', async () => {
  mockAdapter.resetDatabase();
  const res = await hostelService.getBlocks();
  assertSuccessEnvelope(res, 'hostelService.getBlocks');
  assert.ok(Array.isArray(res.data));
  assert.ok(res.data.length >= 2);
  const blockA = res.data.find((b) => b.id.includes('BLK-A') || b.name.includes('Block A'));
  assert.ok(blockA, 'Block A must exist');
});

test('F13-T1-02: Hostel service assigns free bed to student and returns active enrolment', async () => {
  mockAdapter.resetDatabase();
  const assignRes = await hostelService.assignHostelBed('STU-105', {
    studentName: 'Vikram Patel',
    gender: 'Male',
    grade: 'Grade 11',
    section: 'A',
    hostelBlockId: 'HOSTEL-BLK-A',
    hostelBlockName: 'Block A - Boys Senior Wing',
    roomNumber: 'A-201',
    bedNumber: 'B3',
    feeAmount: 85000,
  });

  assertSuccessEnvelope(assignRes, 'hostelService.assignHostelBed');
  assert.equal(assignRes.data.studentId, 'STU-105');
  assert.equal(assignRes.data.bedNumber, 'B3');
  assert.equal(assignRes.data.status, 'Active');
  assert.ok(assignRes.data.linkedFeeInvoiceId);
});

test('F13-T1-03: Hostel bed assignment automatically creates linked fee invoice in Fee Management', async () => {
  mockAdapter.resetDatabase();
  const initialInvoices = (await feeService.getInvoices()).data.length;

  const assignRes = await hostelService.assignHostelBed('STU-106', {
    studentName: 'Aman Deep',
    gender: 'Male',
    grade: 'Grade 11',
    section: 'B',
    hostelBlockId: 'HOSTEL-BLK-A',
    hostelBlockName: 'Block A - Boys Senior Wing',
    roomNumber: 'A-201',
    bedNumber: 'B3',
    feeAmount: 90000,
  });
  assertSuccessEnvelope(assignRes);

  const updatedInvoicesRes = await feeService.getInvoices();
  assert.equal(updatedInvoicesRes.data.length, initialInvoices + 1, 'Fee invoices count should increment');

  const invoice = updatedInvoicesRes.data.find((i) => i.id === assignRes.data.linkedFeeInvoiceId);
  assert.ok(invoice, 'Linked fee invoice must exist in Fee Management');
  assert.equal(invoice.studentId, 'STU-106');
  assert.equal(invoice.totalAmount, 90000);
});

test('F13-T1-04: Hostel service vacates active enrolment and releases bed for future allotment', async () => {
  mockAdapter.resetDatabase();
  const assignRes = await hostelService.assignHostelBed('STU-107', {
    studentName: 'Karan Johar',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-201',
    bedNumber: 'B3',
    feeAmount: 75000,
  });
  assertSuccessEnvelope(assignRes);
  const enrolmentId = assignRes.data.id;

  const vacateRes = await hostelService.vacateBed(enrolmentId, {
    remarks: 'Student completed term and vacated hostel room',
  });
  assertSuccessEnvelope(vacateRes, 'hostelService.vacateBed');
  assert.equal(vacateRes.data.status, 'Vacated');

  // Verify that bed B3 can now be re-assigned to another student
  const reassignRes = await hostelService.assignHostelBed('STU-108', {
    studentName: 'Sanjay Dutt',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-201',
    bedNumber: 'B3',
    feeAmount: 75000,
  });
  assertSuccessEnvelope(reassignRes, 'Re-assigning vacated bed should succeed');
  assert.equal(reassignRes.data.studentId, 'STU-108');
});

test('F13-T1-05: Hostel service reports occupancy metrics across blocks', async () => {
  mockAdapter.resetDatabase();
  const statsRes = await hostelService.getHostelOccupancyStats();
  assertSuccessEnvelope(statsRes, 'hostelService.getHostelOccupancyStats');
  assert.ok(typeof statsRes.data.totalBeds === 'number');
  assert.ok(typeof statsRes.data.occupiedBeds === 'number');
  assert.ok(typeof statsRes.data.availableBeds === 'number');
});
