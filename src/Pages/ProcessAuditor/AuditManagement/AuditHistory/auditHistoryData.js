import { DEPARTMENTS } from '../MyAudits/myAuditsData'

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

const STORAGE_KEY = 'process-auditor-audit-history'

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
        auditNumber: 'AUD-PA-2026-038',
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
        auditNumber: 'AUD-PA-2026-039',
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
        auditNumber: 'AUD-PA-2026-031',
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
        auditNumber: 'AUD-PA-2026-029',
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
        auditNumber: 'AUD-PA-2026-025',
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
        auditNumber: 'AUD-PA-2026-022',
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
        auditNumber: 'AUD-PA-2026-018',
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
        auditNumber: 'AUD-PA-2026-015',
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
        auditNumber: 'AUD-PA-2026-012',
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
        auditNumber: 'AUD-PA-2026-008',
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getAuditHistory = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    saveAuditHistory(DEFAULT_AUDIT_HISTORY)
    return DEFAULT_AUDIT_HISTORY
}

export const getHistoryById = (id) =>
    getAuditHistory().find((item) => item.id === id || item.auditNumber === id) ?? null
