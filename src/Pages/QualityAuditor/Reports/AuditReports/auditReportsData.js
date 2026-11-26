import { DEPARTMENTS, CAMPUSES } from '../../AuditManagement/AuditHistory/auditHistoryData'

export { DEPARTMENTS, CAMPUSES }

export const REPORT_STATUSES = ['Completed', 'Approved', 'Closed']

export const statusBadgeColor = {
    Completed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Approved: 'bg-[#515DEF33] text-[#515DEF]',
    Closed: 'bg-[#66708533] text-[#667085]',
}

export const priorityBadgeColor = {
    Low: 'bg-[#2196F333] text-[#2196F3]',
    Medium: 'bg-[#FF980033] text-[#FF9800]',
    High: 'bg-[#FF000033] text-[#FF0000]',
    Critical: 'bg-[#9C27B033] text-[#9C27B0]',
}

export const observationStatusBadgeColor = {
    Closed: 'bg-[#4CAF5033] text-[#4CAF50]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Open: 'bg-[#2196F333] text-[#2196F3]',
    Assigned: 'bg-[#515DEF33] text-[#515DEF]',
    Resolved: 'bg-[#4CAF5033] text-[#4CAF50]',
}

const STORAGE_KEY = 'quality-auditor-audit-reports'

const buildAuditReport = ({
    auditNumber,
    auditName,
    department,
    campus,
    building,
    auditor,
    auditDate,
    status,
    compliancePercent,
    findings,
    statistics,
    checklistSummary,
    observationSummary,
    recommendations,
    generalRemarks,
}) => ({
    id: auditNumber,
    auditNumber,
    auditName,
    department,
    campus,
    building,
    auditor,
    auditDate,
    status,
    compliancePercent,
    findings,
    statistics,
    checklistSummary,
    observationSummary,
    recommendations,
    generalRemarks,
})

const DEFAULT_AUDIT_REPORTS = [
    buildAuditReport({
        auditNumber: 'AUD-PA-2026-041',
        auditName: 'Classroom Cleanliness & Facilities Audit',
        department: 'Academic',
        campus: 'Main Campus',
        building: 'Academic Block A',
        auditor: 'Rajesh Kumar',
        auditDate: '10-Jun-2026',
        status: 'Completed',
        compliancePercent: 92,
        findings: 4,
        statistics: {
            complianceScore: 92,
            totalQuestions: 24,
            passed: 20,
            failed: 4,
            observationsRaised: 4,
            closed: 3,
            pending: 1,
        },
        checklistSummary: [
            { section: 'Classroom', passed: 6, failed: 1, na: 0, compliance: 86 },
            { section: 'Safety', passed: 7, failed: 0, na: 0, compliance: 100 },
            { section: 'Documentation', passed: 5, failed: 2, na: 1, compliance: 71 },
            { section: 'Facilities', passed: 2, failed: 1, na: 0, compliance: 67 },
        ],
        observationSummary: [
            { observationId: 'OBS-001', observation: 'Board Not Clean', priority: 'High', assignedTo: 'Teacher - Grade 5', status: 'Closed' },
            { observationId: 'OBS-002', observation: 'Dustbin Overflow', priority: 'Medium', assignedTo: 'Housekeeping Staff', status: 'Pending' },
            { observationId: 'OBS-003', observation: 'Attendance Register Incomplete', priority: 'High', assignedTo: 'Coordinator - Primary', status: 'Closed' },
            { observationId: 'OBS-004', observation: 'Fire Extinguisher Tag Missing', priority: 'Critical', assignedTo: 'Facility Manager', status: 'Closed' },
        ],
        recommendations:
            'Implement daily classroom inspection checklist for all Grade 5 homerooms. Schedule monthly fire safety equipment verification with facilities team. Reinforce attendance register completion protocol during coordinator weekly review meetings.',
        generalRemarks:
            'Overall audit compliance is satisfactory at 92%. Classroom hygiene standards met in 5 of 6 inspected rooms. One room requires follow-up on whiteboard maintenance. Documentation section needs improvement — attendance registers and safety signage require attention. All critical safety observations have been addressed except dustbin overflow in Room 12A.',
    }),
    buildAuditReport({
        auditNumber: 'AUD-PA-2026-038',
        auditName: 'Fleet Maintenance & Trip Logs',
        department: 'Transport',
        campus: 'Main Campus',
        building: 'Transport Office',
        auditor: 'Rajesh Kumar',
        auditDate: '01-Jun-2026',
        status: 'Approved',
        compliancePercent: 88,
        findings: 2,
        statistics: {
            complianceScore: 88,
            totalQuestions: 18,
            passed: 16,
            failed: 2,
            observationsRaised: 2,
            closed: 2,
            pending: 0,
        },
        checklistSummary: [
            { section: 'Vehicle Safety', passed: 8, failed: 1, na: 0, compliance: 89 },
            { section: 'Trip Logs', passed: 5, failed: 1, na: 0, compliance: 83 },
            { section: 'Driver Compliance', passed: 3, failed: 0, na: 1, compliance: 100 },
        ],
        observationSummary: [
            { observationId: 'OBS-PA-2026-011', observation: 'Fire extinguisher expired on Bus TN-12-AB-4521', priority: 'Critical', assignedTo: 'Transport Manager', status: 'Closed' },
            { observationId: 'OBS-PA-2026-010', observation: 'Trip log unsigned for Route 3', priority: 'Medium', assignedTo: 'Transport Manager', status: 'Closed' },
        ],
        recommendations: 'Enable automated fleet maintenance alerts 30 days before equipment expiry. Mandate daily trip log sign-off before route departure.',
        generalRemarks: 'Transport department demonstrated strong driver compliance. Both observations resolved within SLA. Recommend quarterly fleet safety audits.',
    }),
    buildAuditReport({
        auditNumber: 'AUD-PA-2026-043',
        auditName: 'Canteen Hygiene & Food Safety Audit',
        department: 'Canteen',
        campus: 'Main Campus',
        building: 'Canteen Building',
        auditor: 'Rajesh Kumar',
        auditDate: '08-Jun-2026',
        status: 'Completed',
        compliancePercent: 74,
        findings: 5,
        statistics: {
            complianceScore: 74,
            totalQuestions: 20,
            passed: 15,
            failed: 5,
            observationsRaised: 5,
            closed: 2,
            pending: 3,
        },
        checklistSummary: [
            { section: 'Food Storage', passed: 4, failed: 2, na: 0, compliance: 67 },
            { section: 'Kitchen Hygiene', passed: 6, failed: 2, na: 0, compliance: 75 },
            { section: 'Staff Compliance', passed: 5, failed: 1, na: 0, compliance: 83 },
        ],
        observationSummary: [
            { observationId: 'OBS-PA-2026-014', observation: 'Food storage temperature log missing', priority: 'Critical', assignedTo: 'Canteen Manager', status: 'Pending' },
            { observationId: 'OBS-PA-2026-007', observation: 'Staff hygiene compliance below standard', priority: 'Medium', assignedTo: 'Canteen Manager', status: 'Closed' },
        ],
        recommendations: 'Mandatory daily temperature logging with supervisor verification. Increase hygiene training frequency to monthly sessions.',
        generalRemarks: 'Canteen hygiene audit identified critical gaps in cold storage monitoring. Immediate corrective action required for temperature log compliance.',
    }),
    buildAuditReport({
        auditNumber: 'AUD-PA-2026-039',
        auditName: 'Data Backup & Access Control Policy',
        department: 'IT Support',
        campus: 'Main Campus',
        building: 'IT Server Room',
        auditor: 'Rajesh Kumar',
        auditDate: '05-Jun-2026',
        status: 'Closed',
        compliancePercent: 94,
        findings: 1,
        statistics: {
            complianceScore: 94,
            totalQuestions: 16,
            passed: 15,
            failed: 1,
            observationsRaised: 1,
            closed: 1,
            pending: 0,
        },
        checklistSummary: [
            { section: 'Backup & Recovery', passed: 6, failed: 1, na: 0, compliance: 86 },
            { section: 'Access Control', passed: 5, failed: 0, na: 0, compliance: 100 },
            { section: 'Policy Compliance', passed: 4, failed: 0, na: 0, compliance: 100 },
        ],
        observationSummary: [
            { observationId: 'OBS-PA-2026-009', observation: 'Backup verification log incomplete', priority: 'High', assignedTo: 'IT Support Manager', status: 'Closed' },
        ],
        recommendations: 'Continue quarterly access control reviews. Expand storage capacity proactively before threshold alerts.',
        generalRemarks: 'IT infrastructure audit passed with minor backup logging gap now resolved. Access control policies fully compliant.',
    }),
    buildAuditReport({
        auditNumber: 'AUD-PA-2026-045',
        auditName: 'Housekeeping Standards — Academic Block',
        department: 'Housekeeping',
        campus: 'South Campus',
        building: 'Main Academic Block',
        auditor: 'Rajesh Kumar',
        auditDate: '12-Jun-2026',
        status: 'Approved',
        compliancePercent: 81,
        findings: 3,
        statistics: {
            complianceScore: 81,
            totalQuestions: 14,
            passed: 11,
            failed: 3,
            observationsRaised: 3,
            closed: 1,
            pending: 2,
        },
        checklistSummary: [
            { section: 'Corridor Maintenance', passed: 4, failed: 1, na: 0, compliance: 80 },
            { section: 'Restroom Hygiene', passed: 4, failed: 1, na: 0, compliance: 80 },
            { section: 'Waste Management', passed: 3, failed: 1, na: 0, compliance: 75 },
        ],
        observationSummary: [
            { observationId: 'OBS-PA-2026-012', observation: 'Corridor cleaning schedule not displayed', priority: 'Medium', assignedTo: 'Housekeeping Supervisor', status: 'Pending' },
        ],
        recommendations: 'Display housekeeping schedules on all floors. Implement weekly supervisor walkthrough with photo evidence.',
        generalRemarks: 'Housekeeping standards generally maintained. Schedule board compliance needs improvement on upper floors.',
    }),
]

export const saveAuditReports = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getAuditReports = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    saveAuditReports(DEFAULT_AUDIT_REPORTS)
    return DEFAULT_AUDIT_REPORTS
}

export const getAuditReportById = (id) =>
    getAuditReports().find((item) => item.id === id || item.auditNumber === id) ?? null
