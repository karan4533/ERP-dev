import { loadCampusJson, saveCampusJson, hydrateCampusKey, usesCampusApiForKey } from '../../../../services/campusJsonStore'

const STORAGE_KEY = 'process-auditor-compliance-reports'

export const COMPLIANCE_SUMMARY = {
    overall: 91,
    departments: [
        { label: 'Academic', value: 94 },
        { label: 'Transport', value: 88 },
        { label: 'HR', value: 97 },
        { label: 'Accounts', value: 95 },
    ],
}

const DEFAULT_DEPARTMENT_ROWS = [
    { department: 'Academic', totalAudits: 12, compliance: 94, pendingFindings: 3, closedFindings: 18 },
    { department: 'Transport', totalAudits: 8, compliance: 88, pendingFindings: 5, closedFindings: 11 },
    { department: 'HR', totalAudits: 6, compliance: 97, pendingFindings: 1, closedFindings: 9 },
    { department: 'Accounts', totalAudits: 10, compliance: 95, pendingFindings: 2, closedFindings: 14 },
    { department: 'Canteen', totalAudits: 9, compliance: 76, pendingFindings: 8, closedFindings: 12 },
    { department: 'Housekeeping', totalAudits: 7, compliance: 83, pendingFindings: 4, closedFindings: 10 },
    { department: 'IT Support', totalAudits: 5, compliance: 92, pendingFindings: 1, closedFindings: 7 },
    { department: 'Store', totalAudits: 4, compliance: 89, pendingFindings: 2, closedFindings: 5 },
]

const DEFAULT_COMPLIANCE_DATA = {
    summary: COMPLIANCE_SUMMARY,
    departments: DEFAULT_DEPARTMENT_ROWS,
}

export const getComplianceColor = (value) => {
    if (value >= 90) return '#4CAF50'
    if (value >= 75) return '#FF9800'
    return '#FF0000'
}

const summaryFromDepartments = (rows) => {
    const departments = Array.isArray(rows) ? rows : []
    const overall = departments.length
        ? Math.round(departments.reduce((sum, row) => sum + (Number(row.compliance) || 0), 0) / departments.length)
        : COMPLIANCE_SUMMARY.overall
    return {
        overall,
        departments: departments.slice(0, 4).map((row) => ({
            label: row.department || row.label || 'Department',
            value: Number(row.compliance ?? row.value) || 0,
        })),
    }
}

/** Normalize API/local payloads: array of dept rows OR { summary, departments }. */
export const normalizeComplianceData = (stored) => {
    if (Array.isArray(stored)) {
        const departments = stored.filter((row) => row && typeof row === 'object')
        return {
            summary: summaryFromDepartments(departments),
            departments: departments.length ? departments : DEFAULT_DEPARTMENT_ROWS,
        }
    }
    if (stored && typeof stored === 'object') {
        const departments = Array.isArray(stored.departments)
            ? stored.departments.filter((row) => row && typeof row === 'object')
            : DEFAULT_DEPARTMENT_ROWS
        const summary = stored.summary && typeof stored.summary === 'object'
            ? {
                overall: Number(stored.summary.overall) || summaryFromDepartments(departments).overall,
                departments: Array.isArray(stored.summary.departments)
                    ? stored.summary.departments
                    : summaryFromDepartments(departments).departments,
            }
            : summaryFromDepartments(departments)
        return { summary, departments: departments.length ? departments : DEFAULT_DEPARTMENT_ROWS }
    }
    return {
        summary: { ...COMPLIANCE_SUMMARY, departments: [...COMPLIANCE_SUMMARY.departments] },
        departments: DEFAULT_DEPARTMENT_ROWS.map((row) => ({ ...row })),
    }
}

export const saveComplianceData = (data) => {
    saveCampusJson(STORAGE_KEY, normalizeComplianceData(data))
}

export const getComplianceData = () => {
    try {
        const stored = loadCampusJson(STORAGE_KEY, null)
        if (stored != null) return normalizeComplianceData(stored)
    } catch {
        /* ignore */
    }
    const data = normalizeComplianceData(DEFAULT_COMPLIANCE_DATA)
    saveComplianceData(data)
    return data
}

export const hydrateFromApi = (seed = DEFAULT_COMPLIANCE_DATA) => hydrateCampusKey(STORAGE_KEY, seed)
export const usesApiStore = () => usesCampusApiForKey(STORAGE_KEY)
