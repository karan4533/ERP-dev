/**
 * Tier 4: Real-World Application Scenario Test Suite
 * Scenario 1: Annual CBSE Recognition & Statutory Compliance Renewal Cycle
 *
 * Operational Flow:
 * 1. PRO checks annual compliance calendar and identifies upcoming CBSE affiliation renewal.
 * 2. Inward communication logged from Board demanding physical land title deeds & building safety certificates.
 * 3. Physical deed files checked out from File Room Vault under Executive MD authorization.
 * 4. Regulatory inspection commission conducted with findings recorded.
 * 5. Statutory permit renewed with updated validity dates, and physical deed safely returned to File Room.
 */

import '../harness/setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mockAdapter } from '../harness/apiClientMock.js';
import { proService } from '../../../src/services/modules/proService.js';
import { fileRoomService } from '../../../src/services/modules/fileRoomService.js';

test.beforeEach(() => {
  mockAdapter.resetDatabase();
});

test('Scenario PRO-01: Compliance calendar inspection identifies upcoming statutory renewals', async () => {
  const calRes = await proService.getComplianceCalendar();
  assert.strictEqual(calRes.success, true);
  assert.ok(Array.isArray(calRes.data));
  assert.ok(calRes.data.length > 0);

  // Check stats overview
  const statsRes = await proService.getComplianceStats();
  assert.strictEqual(statsRes.success, true);
  assert.ok(statsRes.data.totalCorrespondence >= 1);
  assert.ok(statsRes.data.activePermits >= 1);
});

test('Scenario PRO-02: Logging statutory communication and MD-authorized physical deed checkout from File Room', async () => {
  // Step 1: Log inward communication from CBSE Regional Office
  const corrRes = await proService.createCorrespondence({
    direction: 'Inward',
    governmentDepartment: 'CBSE Regional Office Chennai',
    subject: 'Mandatory Physical Inspection of Original Campus Land Deeds for Affiliation Extension',
    referenceNumber: 'CBSE/RO-CHN/AFF/2026/089',
    category: 'Affiliation',
    receivedOrDispatchedDate: '2026-02-15',
    handlingOfficer: 'Mr. R. Raghavan (PRO)',
    actionRequired: 'Retrieve original deed from executive archive for board inspection commission',
  });
  assert.strictEqual(corrRes.success, true);
  const corrId = corrRes.data.id;

  // Step 2: Request checkout of strictly confidential deed FILE-2026-002 with MD sign-off
  const checkoutRes = await fileRoomService.requestCheckout({
    fileId: 'FILE-2026-002',
    requestedById: 'EMP-PRO-01',
    requestedByName: 'Mr. R. Raghavan (PRO)',
    department: 'Public Relations Office',
    purpose: `CBSE Affiliation Extension Commission Review (Ref: ${corrId})`,
    approvalRole: 'director',
    approvedBy: 'Dr. V. Thirunavukkarasu (Managing Director)',
    custodianName: 'File Room Custodian',
  });

  assert.strictEqual(checkoutRes.success, true);
  assert.strictEqual(checkoutRes.data.file.currentLocationStatus, 'Checked Out / Issued');
  assert.strictEqual(checkoutRes.data.file.heldByUserName, 'Mr. R. Raghavan (PRO)');
});

test('Scenario PRO-03: Conducting board inspection, updating permit validity, and returning original deed', async () => {
  // Step 1: Checkout deed
  const checkoutRes = await fileRoomService.requestCheckout({
    fileId: 'FILE-2026-002',
    requestedById: 'EMP-PRO-01',
    requestedByName: 'Mr. R. Raghavan (PRO)',
    department: 'PRO',
    purpose: 'Commission Inspection',
    approvalRole: 'director',
  });
  const issueId = checkoutRes.data.issueRecord.id;

  // Step 2: Log inspection outcome
  const inspRes = await proService.createInspection({
    inspectionDate: '2026-02-20',
    inspectingBody: 'CBSE Commission',
    purpose: 'Comprehensive 5-Year Affiliation Extension Inspection',
    status: 'Completed',
    findings: 'All physical land deeds, structural stability, and fire NOCs verified in pristine order.',
    recommendation: 'Recommended unconditional extension of Senior Secondary affiliation for 5 years.',
  });
  assert.strictEqual(inspRes.success, true);
  assert.strictEqual(inspRes.data.status, 'Completed');

  // Step 3: Renew Fire & Safety Statutory Permit
  const permitsRes = await proService.getPermits();
  const firePermit = permitsRes.data.find((p) => p.permitType.toLowerCase().includes('fire') || p.permitNumber.includes('NOC'));
  if (firePermit) {
    const renewRes = await proService.renewPermit(firePermit.id, {
      expiryDate: '2027-03-31',
      renewalNotes: 'Renewed following successful annual joint inspection.',
    });
    assert.strictEqual(renewRes.success, true);
    assert.strictEqual(renewRes.data.expiryDate, '2027-03-31');
  }

  // Step 4: Safely return physical deed back to executive vault
  const returnRes = await fileRoomService.returnPhysicalFile(issueId, {
    receivedByCustodian: 'File Room Custodian',
    returnCondition: 'Intact / Pristine',
    notes: 'Returned by PRO after successful board commission inspection.',
  });

  assert.strictEqual(returnRes.success, true);
  assert.strictEqual(returnRes.data.issue.status, 'Returned');
  assert.strictEqual(returnRes.data.file.currentLocationStatus, 'In File Room');
  assert.strictEqual(returnRes.data.file.heldByUserId, null);
});
