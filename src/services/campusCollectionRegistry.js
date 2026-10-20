/**
 * Maps browser localStorage keys used by ops/audit demos to campus API collections.
 * kind: 'ops' → /api/v1/ops/{collection}
 * kind: 'audit' → /api/v1/campus-audit/{collection}
 */
export const CAMPUS_COLLECTION_BY_STORAGE_KEY = {
    // Gate / security
    'schoolerp-security-visitors-v1': { kind: 'ops', collection: 'gate-visitors' },
    'schoolerp-security-registers-v1': { kind: 'ops', collection: 'gate-registers' },
    'schoolerp-security-handover-v1': { kind: 'ops', collection: 'gate-handover' },
    'schoolerp-security-vendors-v1': { kind: 'ops', collection: 'gate-vendors' },
    'schoolerp-security-incidents-v1': { kind: 'ops', collection: 'gate-incidents' },
    // Housekeeping registers
    'schoolerp-housekeeping-schedules-v1': { kind: 'ops', collection: 'hk-schedules' },
    'schoolerp-housekeeping-som-v1': { kind: 'ops', collection: 'hk-star-of-month' },
    'schoolerp-housekeeping-ro-testing-v1': { kind: 'ops', collection: 'hk-ro-testing' },
    'schoolerp-housekeeping-lost-found-v1': { kind: 'ops', collection: 'hk-lost-found' },
    'schoolerp-housekeeping-duty-v1': { kind: 'ops', collection: 'hk-duty-allotments' },
    // Shared inventory / procurement demos
    'schoolerp-inventory-v1': { kind: 'ops', collection: 'shared-inventory' },
    'schoolerp-inventory-movements-v1': { kind: 'ops', collection: 'shared-inventory-movements' },
    'schoolerp-inventory-requirements-v1': { kind: 'ops', collection: 'shared-inventory-requirements' },
    'schoolerp-procurement-requests-v1': { kind: 'ops', collection: 'shared-procurement' },
    // Biometric
    'schoolerp-biometric-attendance-v1': { kind: 'ops', collection: 'biometric-attendance' },
    // Library
    'schoolerp-library-books-v1': { kind: 'ops', collection: 'library-books' },
    'schoolerp-library-issues-v1': { kind: 'ops', collection: 'library-issues' },
    'schoolerp-library-members-v1': { kind: 'ops', collection: 'library-members' },
    // Transport
    'schoolerp-transport-vehicles-v1': { kind: 'ops', collection: 'transport-vehicles' },
    'schoolerp-transport-drivers-v1': { kind: 'ops', collection: 'transport-drivers' },
    'schoolerp-transport-routes-v1': { kind: 'ops', collection: 'transport-routes' },
    'schoolerp-transport-students-v1': { kind: 'ops', collection: 'transport-student-assignments' },
    'schoolerp-transport-duties-v1': { kind: 'ops', collection: 'transport-duties' },
    'schoolerp-transport-maintenance-v1': { kind: 'ops', collection: 'transport-maintenance' },
    'schoolerp-transport-expenses-v1': { kind: 'ops', collection: 'transport-expenses' },
    'schoolerp-transport-budget-requests-v1': { kind: 'ops', collection: 'transport-budget-requests' },
    'schoolerp-transport-approvals-v1': { kind: 'ops', collection: 'transport-approval-requests' },
    'schoolerp-transport-service-centers-v1': { kind: 'ops', collection: 'transport-service-centers' },
    // Canteen
    'schoolerp-canteen-menu-v1': { kind: 'ops', collection: 'canteen-menu' },
    'schoolerp-canteen-inventory-v1': { kind: 'ops', collection: 'canteen-inventory' },
    'schoolerp-canteen-orders-v1': { kind: 'ops', collection: 'canteen-orders' },
    'schoolerp-canteen-requests-v1': { kind: 'ops', collection: 'canteen-requests' },
    // IT
    'school-erp-it-assets-v1': { kind: 'ops', collection: 'it-assets' },
    'schoolerp-it-tickets-v1': { kind: 'ops', collection: 'it-support-tickets' },
    'schoolerp-it-requests-v1': { kind: 'ops', collection: 'it-requests' },
    // Stationery
    'schoolerp-stationery-inventory-v1': { kind: 'ops', collection: 'stationery-inventory' },
    'schoolerp-stationery-requests-v1': { kind: 'ops', collection: 'stationery-requests' },
    // JD
    'schoolerp-jd-meetings-v1': { kind: 'ops', collection: 'jd-meetings' },
    'schoolerp-jd-approvals-v1': { kind: 'ops', collection: 'jd-request-approvals' },
    'schoolerp-jd-escalations-v1': { kind: 'ops', collection: 'jd-escalations' },
    'schoolerp-jd-assets-v1': { kind: 'ops', collection: 'jd-assets' },
    // Process auditor
    'process-auditor-my-audits': { kind: 'audit', collection: 'process-my-audits' },
    'process-auditor-audit-schedule': { kind: 'audit', collection: 'process-audit-schedule' },
    'process-auditor-execute-audit-draft': { kind: 'audit', collection: 'process-execute-draft' },
    'process-auditor-audit-templates': { kind: 'audit', collection: 'process-audit-templates' },
    'process-auditor-audit-history': { kind: 'audit', collection: 'process-audit-history' },
    'process-auditor-observations': { kind: 'audit', collection: 'process-observations' },
    'process-auditor-rca': { kind: 'audit', collection: 'process-rca' },
    'process-auditor-atr': { kind: 'audit', collection: 'process-atr' },
    'process-auditor-escalations': { kind: 'audit', collection: 'process-escalations' },
    'process-auditor-audit-reports': { kind: 'audit', collection: 'process-audit-reports' },
    'process-auditor-actions-reports': { kind: 'audit', collection: 'process-actions-reports' },
    'process-auditor-compliance-reports': { kind: 'audit', collection: 'process-compliance-reports' },
    // Quality auditor
    'quality-auditor-my-audits': { kind: 'audit', collection: 'quality-my-audits' },
    'quality-auditor-audit-schedule': { kind: 'audit', collection: 'quality-audit-schedule' },
    'quality-auditor-execute-audit-draft': { kind: 'audit', collection: 'quality-execute-draft' },
    'quality-auditor-audit-templates': { kind: 'audit', collection: 'quality-audit-templates' },
    'quality-auditor-audit-history': { kind: 'audit', collection: 'quality-audit-history' },
    'quality-auditor-observations': { kind: 'audit', collection: 'quality-observations' },
    'quality-auditor-rca': { kind: 'audit', collection: 'quality-rca' },
    'quality-auditor-atr': { kind: 'audit', collection: 'quality-atr' },
    'quality-auditor-escalations': { kind: 'audit', collection: 'quality-escalations' },
    'quality-auditor-audit-reports': { kind: 'audit', collection: 'quality-audit-reports' },
    'quality-auditor-actions-reports': { kind: 'audit', collection: 'quality-actions-reports' },
    'quality-auditor-compliance-reports': { kind: 'audit', collection: 'quality-compliance-reports' },
    // Shared audit demo
    'schoolerp-audit-components-v1': { kind: 'audit', collection: 'audit-components' },
    'schoolerp-audit-shared-deviations-v1': { kind: 'audit', collection: 'audit-shared-deviations' },
    'schoolerp-jd-audit-templates-v1': { kind: 'audit', collection: 'audit-templates' },
    'schoolerp-jd-audit-plans-v1': { kind: 'audit', collection: 'audit-plans' },
    'schoolerp-jd-audit-findings-v1': { kind: 'audit', collection: 'audit-findings' },
    'schoolerp-hk-inventory-v1': { kind: 'ops', collection: 'hk-inventory' },
    'schoolerp-hk-requests-v1': { kind: 'ops', collection: 'hk-requests' },
    'schoolerp-stationery-issue-returns-v1': { kind: 'ops', collection: 'stationery-issue-returns' },
    'school-erp-it-asset-service-v1': { kind: 'ops', collection: 'it-asset-service' },
    'school-erp-it-asset-transfers-v1': { kind: 'ops', collection: 'it-asset-transfers' },
    'schoolerp-transport-driver-fuel-v1': { kind: 'ops', collection: 'transport-driver-fuel' },
    'schoolerp-transport-driver-maintenance-v1': { kind: 'ops', collection: 'transport-driver-maintenance' },
    'schoolerp-transport-route-stops-v1': { kind: 'ops', collection: 'transport-route-stops' },
    'schoolerp-transport-student-attendance-v1': { kind: 'ops', collection: 'transport-student-attendance' },
    'schoolerp-transport-driver-my-duties-v1': { kind: 'ops', collection: 'transport-driver-my-duties' },
    'schoolerp-jd-tasks-v1': { kind: 'ops', collection: 'jd-tasks' },
    'schoolerp-jd-employee-views-v1': { kind: 'ops', collection: 'jd-employee-views' },
    'schoolerp-jd-audit-monitoring-v1': { kind: 'audit', collection: 'audit-monitoring' },
    'schoolerp-jd-audit-checklist-sections-v1': { kind: 'audit', collection: 'audit-checklist-sections' },
    'schoolerp-jd-audit-question-bank-v1': { kind: 'audit', collection: 'audit-question-bank' },
    'schoolerp-jd-audit-response-types-v1': { kind: 'audit', collection: 'audit-response-types' },
    'schoolerp-jd-audit-scoring-rules-v1': { kind: 'audit', collection: 'audit-scoring-rules' },
    'schoolerp-jd-audit-workflow-rules-v1': { kind: 'audit', collection: 'audit-workflow-rules' },
    'schoolerp-jd-audit-visibility-rules-v1': { kind: 'audit', collection: 'audit-visibility-rules' },
    'schoolerp-jd-audit-template-versions-v1': { kind: 'audit', collection: 'audit-template-versions' },
    'schoolerp-jd-audit-published-templates-v1': { kind: 'audit', collection: 'audit-published-templates' },
}

export const resolveCampusCollection = (storageKey) =>
    CAMPUS_COLLECTION_BY_STORAGE_KEY[storageKey] || null
