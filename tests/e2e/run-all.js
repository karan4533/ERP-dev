/**
 * Master E2E Test Suite Runner
 * Executes all 5 tiers of tests:
 * - Tier 1: Feature Coverage (22 suites, 129 tests)
 * - Tier 2: Boundary & Corner Cases (20 suites, 104 tests)
 * - Tier 3: Cross-Feature Integration (5 suites, 16 tests)
 * - Tier 4: Real-World Scenarios (5 suites, 15 tests)
 * - Tier 5: Adversarial Hardening (2 suites, 13 tests)
 * Total: 277 tests
 */

import './harness/setup.js';

// ============================================================================
// Tier 1: Feature Coverage (22 files)
// ============================================================================
import './tier1-feature-coverage/f01_apiClient.test.js';
import './tier1-feature-coverage/f02_dataModels.test.js';
import './tier1-feature-coverage/f03_rbacInstitutional.test.js';
import './tier1-feature-coverage/f04_maintenanceNav.test.js';
import './tier1-feature-coverage/f05_driverSpecialization.test.js';
import './tier1-feature-coverage/f06_bookManagementNav.test.js';
import './tier1-feature-coverage/f07_roleDashboards.test.js';
import './tier1-feature-coverage/f08_proLiaison.test.js';
import './tier1-feature-coverage/f09_fileRoom.test.js';
import './tier1-feature-coverage/f10_cctvManagement.test.js';
import './tier1-feature-coverage/f11_lostFound.test.js';
import './tier1-feature-coverage/f12_academicExams.test.js';
import './tier1-feature-coverage/f13_hostelEnrolment.test.js';
import './tier1-feature-coverage/f14_purchaseOrder.test.js';
import './tier1-feature-coverage/f15_starAwards.test.js';
import './tier1-feature-coverage/f16_storesInventory.test.js';
import './tier1-feature-coverage/f17_feeCollection.test.js';
import './tier1-feature-coverage/f18_fileRoomEnhancements.test.js';
import './tier1-feature-coverage/f19_cctvRecords.test.js';
import './tier1-feature-coverage/f20_proLicensingAndReports.test.js';
import './tier1-feature-coverage/f21_transportNoc.test.js';
import './tier1-feature-coverage/f22_globalModulesAndReports.test.js';

// ============================================================================
// Tier 2: Boundary & Corner Cases (20 files)
// ============================================================================
import './tier2-boundary-corner/f01_apiClient_boundary.test.js';
import './tier2-boundary-corner/f02_dataModels_boundary.test.js';
import './tier2-boundary-corner/f03_rbacInstitutional_boundary.test.js';
import './tier2-boundary-corner/f04_maintenanceNav_boundary.test.js';
import './tier2-boundary-corner/f05_driverSpecialization_boundary.test.js';
import './tier2-boundary-corner/f06_bookManagementNav_boundary.test.js';
import './tier2-boundary-corner/f07_roleDashboards_boundary.test.js';
import './tier2-boundary-corner/f08_proLiaison_boundary.test.js';
import './tier2-boundary-corner/f09_fileRoom_boundary.test.js';
import './tier2-boundary-corner/f10_cctvManagement_boundary.test.js';
import './tier2-boundary-corner/f11_lostFound_boundary.test.js';
import './tier2-boundary-corner/f12_academicExams_boundary.test.js';
import './tier2-boundary-corner/f13_hostelEnrolment_boundary.test.js';
import './tier2-boundary-corner/f14_purchaseOrder_boundary.test.js';
import './tier2-boundary-corner/f15_starAwards_boundary.test.js';
import './tier2-boundary-corner/f16_storesInventory_boundary.test.js';
import './tier2-boundary-corner/f17_feeCollection_boundary.test.js';
import './tier2-boundary-corner/f18_fileRoom_boundary.test.js';
import './tier2-boundary-corner/f19_cctvRecords_boundary.test.js';
import './tier2-boundary-corner/f21_transportNoc_boundary.test.js';

// ============================================================================
// Tier 3: Cross-Feature Integration (5 files)
// ============================================================================
import './tier3-cross-feature/cross_hostel_fee.test.js';
import './tier3-cross-feature/cross_po_finance.test.js';
import './tier3-cross-feature/cross_pro_fileroom_finance.test.js';
import './tier3-cross-feature/cross_cctv_governance.test.js';
import './tier3-cross-feature/cross_stores_central_inventory.test.js';

// ============================================================================
// Tier 4: Real-World Scenarios (5 files)
// ============================================================================
import './tier4-application-scenarios/scenario_pro_compliance_cycle.test.js';
import './tier4-application-scenarios/scenario_cctv_incident_investigation.test.js';
import './tier4-application-scenarios/scenario_student_admission_hostel_fee.test.js';
import './tier4-application-scenarios/scenario_examination_term_report_cards.test.js';
import './tier4-application-scenarios/scenario_star_annual_selection.test.js';

// ============================================================================
// Tier 5: Adversarial Hardening (2 files)
// ============================================================================
import './tier5-adversarial/tier5_m1_m2_hardening.test.js';
import './tier5-adversarial/tier5_m3_e2e_hardening.test.js';

