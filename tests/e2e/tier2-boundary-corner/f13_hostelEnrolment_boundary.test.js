/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Feature F13: Hostel Management & Enrolment (Double-Booking, Idempotency, Vacation)
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { hostelService } from '../../../src/services/modules/hostelService.js';
import { feeService } from '../../../src/services/modules/feeService.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('F13-T2-01: assignHostelBed rejects booking when bed is already occupied by another student', async () => {
  // Bed B1 in Room A-201 is already occupied by STU-001 in seed data
  const res = await hostelService.assignHostelBed('STU-9999', {
    studentName: 'New Student Beta',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-201',
    bedNumber: 'B1',
    feeAmount: 60000,
  });

  assert.strictEqual(res.success, false);
  assert.match(res.error, /already occupied/i);
});

test('F13-T2-02: student actively enrolled cannot take another bed without vacating', async () => {
  // STU-001 is already actively enrolled in A-201 Bed B1
  const conflictRes = await hostelService.assignHostelBed('STU-001', {
    studentName: 'Aarav Sharma',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-202',
    bedNumber: 'B2',
  });

  assert.strictEqual(conflictRes.success, false);
  assert.match(conflictRes.error, /already actively enrolled/i);
});

test('F13-T2-03: idempotent re-allocation of same bed returns existing enrolment without duplicate invoices', async () => {
  const invResBefore = await feeService.getInvoices();
  const countBefore = (invResBefore.data || []).length;

  // STU-001 re-allocated to the exact same bed A-201 B1
  const res1 = await hostelService.assignHostelBed('STU-001', {
    studentName: 'Aarav Sharma',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-201',
    bedNumber: 'B1',
    feeAmount: 75000,
  });

  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.data.studentId, 'STU-001');

  // Invoice count must not increase
  const invResAfter = await feeService.getInvoices();
  assert.strictEqual(invResAfter.data.length, countBefore);
});

test('F13-T2-04: assignHostelBed rejects missing required fields (studentId, block, room, bed)', async () => {
  const noStudent = await hostelService.assignHostelBed(null, {
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-201',
    bedNumber: 'B3',
  });
  assert.strictEqual(noStudent.success, false);

  const noBed = await hostelService.assignHostelBed('STU-1001', {
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-201',
    // Missing bedNumber
  });
  assert.strictEqual(noBed.success, false);
});

test('F13-T2-05: vacateBed transitions status to Vacated and resets room bed occupancy', async () => {
  // Enrolment HSTL-ENR-2026-001 is for STU-001 in HOSTEL-BLK-A, A-201, B1
  const vacateRes = await hostelService.vacateBed('HSTL-ENR-2026-001', {
    remarks: 'Graduated from campus',
  });
  assert.strictEqual(vacateRes.success, true);
  assert.strictEqual(vacateRes.data.status, 'Vacated');

  // Verify bed is now free for another student
  const roomsRes = await hostelService.getRooms();
  const room = roomsRes.data.find((r) => r.blockId === 'HOSTEL-BLK-A' && r.roomNumber === 'A-201');
  const bed = room.beds.find((b) => b.bedNumber === 'B1');
  assert.strictEqual(bed.occupied, false);

  // Another student can now be assigned to this bed
  const newEnr = await hostelService.assignHostelBed('STU-9999', {
    studentName: 'New Student Gamma',
    hostelBlockId: 'HOSTEL-BLK-A',
    roomNumber: 'A-201',
    bedNumber: 'B1',
  });
  assert.strictEqual(newEnr.success, true);
});
