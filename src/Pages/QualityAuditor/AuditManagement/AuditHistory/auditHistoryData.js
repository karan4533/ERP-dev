import { DEPARTMENTS } from '../MyAudits/myAuditsData'

import { loadCampusJson, saveCampusJson, hydrateCampusKey, usesCampusApiForKey } from '../../../../services/campusJsonStore'
export { DEPARTMENTS }

export const CAMPUSES = ['Main Campus', 'North Campus', 'South Campus', 'East Campus']

export const HISTORY_STATUSES = ['Completed', 'Approved', 'Closed']

export const RESULTS = ['Pass', 'Partial', 'Fail']

export const statusBadgeColor = {
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Approved: 'bg-[#515DEF33] text-[#515DEF]',
    Closed: 'bg-[#66708533] text-[#667085]',
}

export const resultBadgeColor = {
    Pass: 'bg-[#4CAF5033] text-[#4CAF50]',
    Partial: 'bg-[#FF980033] text-[#FF9800]',
    Fail: 'bg-[#FF000033] text-[#FF0000]',
}

const STORAGE_KEY = 'quality-auditor-audit-history'

const buildHistory = ({
    auditNumber,
    auditName,
    department,
    campus,
    status,
    auditDate,
    completedOn,
    compliancePercent,
    observations,
    result,
}) => ({
    id: auditNumber,
    auditNumber,
    auditName,
    department,
    campus,
    status,
    auditDate,
    completedOn,
    compliancePercent,
    observations,
    result,
})

const DEFAULT_AUDIT_HISTORY = [
    buildHistory({
        auditNumber: 'AUD-QA-2026-038',
        auditName: 'Fleet Maintenance & Trip Logs',
        department: 'Transport',
        campus: 'Main Campus',
        status: 'Approved',
        auditDate: '01-06-2026',
        completedOn: '05-06-2026',
        compliancePercent: 88,
        observations: 2,
        result: 'Pass',
    }),
    buildHistory({
        auditNumber: 'AUD-QA-2026-039',
        auditName: 'Data Backup & Access Control Policy',
        department: 'IT Support',
        campus: 'Main Campus',
        status: 'Closed',
        auditDate: '05-06-2026',
        completedOn: '08-06-2026',
        compliancePercent: 94,
        observations: 0,
        result: 'Pass',
    }),
    buildHistory({
        auditNumber: 'AUD-QA-2026-031',
        auditName: 'Canteen Hygiene & Food Safety Audit',
        department: 'Canteen',
        campus: 'Main Campus',
        status: 'Completed',
        auditDate: '22-05-2026',
        completedOn: '24-05-2026',
        compliancePercent: 72,
        observations: 5,
        result: 'Partial',
    }),
    buildHistory({
        auditNumber: 'AUD-QA-2026-029',
        auditName: 'Store Inventory & Stock Control',
        department: 'Store',
        campus: 'North Campus',
        status: 'Approved',
        auditDate: '15-05-2026',
        completedOn: '17-05-2026',
        compliancePercent: 91,
        observations: 1,
        result: 'Pass',
    }),
    buildHistory({
        auditNumber: 'AUD-QA-2026-025',
        auditName: 'HR Onboarding & Documentation Review',
        department: 'HR',
        campus: 'Main Campus',
        status: 'Closed',
        auditDate: '08-05-2026',
        completedOn: '10-05-2026',
        compliancePercent: 86,
        observations: 3,
        result: 'Pass',
    }),
    buildHistory({
        auditNumber: 'AUD-QA-2026-022',
        auditName: 'Finance Petty Cash Reconciliation',
        department: 'Finance',
        campus: 'Main Campus',
        status: 'Completed',
        auditDate: '01-05-2026',
        completedOn: '03-05-2026',
        compliancePercent: 58,
        observations: 8,
        result: 'Fail',
    }),
    buildHistory({
        auditNumber: 'AUD-QA-2026-018',
        auditName: 'Housekeeping Standards — Academic Block',
        department: 'Housekeeping',
        campus: 'South Campus',
        status: 'Approved',
        auditDate: '20-04-2026',
        completedOn: '22-04-2026',
        compliancePercent: 81,
        observations: 4,
        result: 'Pass',
    }),
    buildHistory({
        auditNumber: 'AUD-QA-2026-015',
        auditName: 'Examination Cell Process Compliance',
        department: 'Academic',
        campus: 'East Campus',
        status: 'Closed',
        auditDate: '10-04-2026',
        completedOn: '12-04-2026',
        compliancePercent: 67,
        observations: 6,
        result: 'Partial',
    }),
    buildHistory({
        auditNumber: 'AUD-QA-2026-012',
        auditName: 'Laboratory Safety & Equipment Check',
        department: 'Academic',
        campus: 'Main Campus',
        status: 'Completed',
        auditDate: '28-03-2026',
        completedOn: '30-03-2026',
        compliancePercent: 95,
        observations: 0,
        result: 'Pass',
    }),
    buildHistory({
        auditNumber: 'AUD-QA-2026-008',
        auditName: 'Security & Visitor Management Audit',
        department: 'Academic',
        campus: 'North Campus',
        status: 'Closed',
        auditDate: '15-03-2026',
        completedOn: '17-03-2026',
        compliancePercent: 52,
        observations: 11,
        result: 'Fail',
    }),
]

export const saveAuditHistory = (records) => {
    saveCampusJson(STORAGE_KEY, records)
}

export const getAuditHistory = () => {
    try {
        const stored = loadCampusJson(STORAGE_KEY, null)
    if (stored) return stored
    } catch {
        /* ignore */
    }
    saveAuditHistory(DEFAULT_AUDIT_HISTORY)
    return DEFAULT_AUDIT_HISTORY
}

export const getHistoryById = (id) =>
    getAuditHistory().find((item) => item.id === id || item.auditNumber === id) ?? null

export const appendAuditHistory = (entry) => {
    const record = buildHistory({
        auditNumber: entry.auditNumber,
        auditName: entry.auditName,
        department: entry.department,
        campus: entry.campus,
        status: entry.status || 'Completed',
        auditDate: entry.auditDate,
        completedOn: entry.completedOn || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        compliancePercent: entry.compliancePercent ?? 0,
        observations: entry.observations ?? 0,
        result: entry.result || 'Partial',
    })
    const enriched = {
        ...record,
        building: entry.building || '',
        area: entry.area || '',
        findings: entry.findings || null,
        evidenceSummary: entry.evidenceSummary || null,
        generalRemarks: entry.generalRemarks || '',
        auditStream: 'QUALITY',
    }
    const current = Array.isArray(getAuditHistory()) ? getAuditHistory() : []
    const next = [enriched, ...current.filter((item) => item.id !== enriched.id && item.auditNumber !== enriched.auditNumber)]
    saveAuditHistory(next)
    return enriched
}

export const hydrateFromApi = (seed = DEFAULT_AUDIT_HISTORY) => hydrateCampusKey(STORAGE_KEY, seed)
export const usesApiStore = () => usesCampusApiForKey(STORAGE_KEY)
