import test from 'node:test';
import assert from 'node:assert/strict';
import '../harness/setup.js';
import {
  validateRequired,
  isValidDate,
  isNonNegativeNumber,
  isValidEmail,
  isValidEnum,
  createStorageLocation,
  calculateGst,
  computeGrade,
  CONFIDENTIALITY_TIERS,
  FILE_STATUS,
  CCTV_CAMERA_STATUS,
  CCTV_APPROVAL_TIER,
  REFUND_STATUS,
  PO_STATUS,
  CBSE_GRADE_SCALE,
  generateUniqueId,
} from '../../../src/services/models/index.js';

test('F02-T1-01: validateRequired passes when all required attributes are populated', () => {
  const model = {
    fileRefNo: 'LEG/DEED/2026/01',
    fileName: 'School Land Title Deed',
    category: 'Legal',
    ownerDepartment: 'Administration',
  };
  const result = validateRequired(model, ['fileRefNo', 'fileName', 'category', 'ownerDepartment']);
  assert.equal(result.valid, true);
  assert.equal(Object.keys(result.errors).length, 0);
});

test('F02-T1-02: isValidDate and isValidEmail validate date and email formats', () => {
  assert.equal(isValidDate('2026-03-31'), true);
  assert.equal(isValidDate('2026-03-31T10:00:00.000Z'), true);
  assert.equal(isValidDate('not-a-date'), false);
  assert.equal(isValidDate(''), false);

  assert.equal(isValidEmail('pro@school.edu'), true);
  assert.equal(isValidEmail('admin.desk@domain.co.in'), true);
  assert.equal(isValidEmail('invalid-email'), false);
  assert.equal(isValidEmail(''), false);
});

test('F02-T1-03: createStorageLocation constructs normalized 4-tier storage coordinates', () => {
  const loc = createStorageLocation({
    building: 'Main Administrative Wing',
    room: 'Strong Vault 101',
    rackNo: 'Rack R-03',
    shelfNo: 'Shelf S-02',
    boxNo: 'Box B-09',
  });
  assert.equal(loc.building, 'Main Administrative Wing');
  assert.equal(loc.room, 'Strong Vault 101');
  assert.equal(loc.rackNo, 'Rack R-03');
  assert.equal(loc.shelfNo, 'Shelf S-02');
  assert.equal(loc.boxNo, 'Box B-09');

  // Default fallback behavior
  const defaultLoc = createStorageLocation();
  assert.ok(defaultLoc.building);
  assert.ok(defaultLoc.room);
  assert.ok(defaultLoc.rackNo);
  assert.ok(defaultLoc.shelfNo);
});

test('F02-T1-04: calculateGst computes accurate tax slabs (5%, 12%, 18%, 28%)', () => {
  const slab5 = calculateGst(1000, 5);
  assert.equal(slab5.baseAmount, 1000);
  assert.equal(slab5.gstAmount, 50);
  assert.equal(slab5.totalAmount, 1050);

  const slab12 = calculateGst(5000, 12);
  assert.equal(slab12.baseAmount, 5000);
  assert.equal(slab12.gstAmount, 600);
  assert.equal(slab12.totalAmount, 5600);

  const slab18 = calculateGst(10000, 18);
  assert.equal(slab18.baseAmount, 10000);
  assert.equal(slab18.gstAmount, 1800);
  assert.equal(slab18.totalAmount, 11800);

  const slab28 = calculateGst(20000, 28);
  assert.equal(slab28.baseAmount, 20000);
  assert.equal(slab28.gstAmount, 5600);
  assert.equal(slab28.totalAmount, 25600);
});

test('F02-T1-05: computeGrade maps numerical performance to CBSE letter grades and grade points', () => {
  assert.deepEqual(computeGrade(95), { min: 91, max: 100, grade: 'A1', gradePoint: 10.0, description: 'Outstanding' });
  assert.deepEqual(computeGrade(85), { min: 81, max: 90, grade: 'A2', gradePoint: 9.0, description: 'Excellent' });
  assert.deepEqual(computeGrade(75), { min: 71, max: 80, grade: 'B1', gradePoint: 8.0, description: 'Very Good' });
  assert.deepEqual(computeGrade(65), { min: 61, max: 70, grade: 'B2', gradePoint: 7.0, description: 'Good' });
  assert.deepEqual(computeGrade(55), { min: 51, max: 60, grade: 'C1', gradePoint: 6.0, description: 'Fair' });
  assert.deepEqual(computeGrade(45), { min: 41, max: 50, grade: 'C2', gradePoint: 5.0, description: 'Average' });
  assert.deepEqual(computeGrade(35), { min: 33, max: 40, grade: 'D', gradePoint: 4.0, description: 'Pass' });
  assert.deepEqual(computeGrade(25), { min: 0, max: 32, grade: 'E', gradePoint: 0.0, description: 'Needs Improvement / Essential Repeat' });
});

test('F02-T1-06: Domain enums and generateUniqueId satisfy institutional requirements', () => {
  assert.equal(CONFIDENTIALITY_TIERS.STANDARD, 'General');
  assert.equal(CONFIDENTIALITY_TIERS.DEPARTMENT_RESTRICTED, 'Restricted');
  assert.equal(CONFIDENTIALITY_TIERS.EXECUTIVE_CONFIDENTIAL, 'Executive Confidential');
  assert.equal(CONFIDENTIALITY_TIERS.STRICTLY_CONFIDENTIAL, 'Strictly Confidential');

  assert.equal(FILE_STATUS.IN_ARCHIVE, 'In File Room');
  assert.equal(FILE_STATUS.CHECKED_OUT, 'Checked Out / Issued');

  assert.equal(CCTV_CAMERA_STATUS.ONLINE, 'Online / Active');
  assert.equal(CCTV_CAMERA_STATUS.OFFLINE, 'Offline');

  assert.equal(REFUND_STATUS.REQUESTED, 'Requested');
  assert.equal(REFUND_STATUS.DISBURSED, 'Disbursed');

  assert.equal(PO_STATUS.DRAFT, 'Draft');
  assert.equal(PO_STATUS.APPROVED, 'Approved');

  const id = generateUniqueId('PO');
  assert.ok(id.startsWith('PO-'));
});
