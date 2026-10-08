import { DEPARTMENTS, PRIORITIES, priorityBadgeColor } from '../../Observations/observationsData'

export { DEPARTMENTS, PRIORITIES, priorityBadgeColor }

export const RCA_STATUSES = [
    'RCA Submitted',
    'Under Review',
    'Approved',
    'Rejected',
    'Pending Review',
]

export const ROOT_CAUSE_CATEGORIES = [
    'Process Failure',
    'Human Error',
    'Equipment Failure',
    'Training Gap',
    'Policy Gap',
    'Resource Constraint',
    'Communication Gap',
]

export const FINAL_STATUSES = ['Approved', 'Rejected', 'Pending Review', 'Under Review']

export const statusBadgeColor = {
    'RCA Submitted': 'bg-[#2196F333] text-[#2196F3]',
    'Under Review': 'bg-[#515DEF33] text-[#515DEF]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
    'Pending Review': 'bg-[#FF980033] text-[#FF9800]',
}

export const categoryBadgeColor = {
    'Process Failure': 'bg-[#515DEF33] text-[#515DEF]',
    'Human Error': 'bg-[#FF980033] text-[#FF9800]',
    'Equipment Failure': 'bg-[#FF000033] text-[#FF0000]',
    'Training Gap': 'bg-[#9C27B033] text-[#9C27B0]',
    'Policy Gap': 'bg-[#2196F333] text-[#2196F3]',
    'Resource Constraint': 'bg-[#66708533] text-[#667085]',
    'Communication Gap': 'bg-[#FFC10733] text-[#FFC107]',
}

const STORAGE_KEY = 'quality-auditor-rca'

const buildApprovalTimeline = (finalStatus, submittedDate = '12-06-2026', submittedTime = '02:30 PM') => {
    const stageConfig = {
        Approved: 4,
        Rejected: 4,
        'Under Review': 2,
        'Pending Review': 1,
        'RCA Submitted': 1,
    }
    const activeIndex = stageConfig[finalStatus] ?? 1

    const dates = [
        { date: submittedDate, time: submittedTime },
        { date: '13-06-2026', time: '10:15 AM' },
        { date: '14-06-2026', time: '11:45 AM' },
        { date: '15-06-2026', time: '04:00 PM' },
    ]

    return [
        'Employee Submitted',
        'Department Head Reviewed',
        'Forwarded to Super Admin',
        'Super Admin Decision',
    ].map((stage, index) => ({
        stage,
        done: index < activeIndex,
        date: index < activeIndex ? dates[index]?.date ?? '' : '',
        time: index < activeIndex ? dates[index]?.time ?? '' : '',
    }))
}

const buildRca = ({
    id,
    observationId,
    auditNumber,
    auditName,
    department,
    section,
    checklistQuestion,
    observationTitle,
    priority,
    status,
    assignedTo,
    reportTo,
    dueDate,
    submittedBy,
    submittedOn,
    submittedOnTime,
    rca,
    evidence,
    approvalTimeline,
    finalStatus,
}) => ({
    id,
    observationId,
    auditNumber,
    auditName,
    department,
    section,
    checklistQuestion,
    observationTitle,
    priority,
    status,
    assignedTo,
    reportTo,
    dueDate,
    submittedBy,
    submittedOn,
    submittedOnTime,
    rca,
    evidence,
    approvalTimeline: approvalTimeline ?? buildApprovalTimeline(finalStatus ?? status, submittedOn, submittedOnTime),
    finalStatus: finalStatus ?? status,
})

const DEFAULT_RCA_RECORDS = [
    buildRca({
        id: 'RCA-PA-2026-005',
        observationId: 'OBS-PA-2026-014',
        auditNumber: 'AUD-PA-2026-043',
        auditName: 'Canteen Hygiene Audit — June 2026',
        department: 'Canteen',
        section: 'Food Storage & Safety',
        checklistQuestion: 'Is the refrigerator temperature log maintained daily?',
        observationTitle: 'Food storage temperature log missing',
        priority: 'Critical',
        status: 'Under Review',
        assignedTo: 'Mr. Ramesh Iyer',
        reportTo: 'Director of Operations',
        dueDate: '18-06-2026',
        submittedBy: 'Mr. Ramesh Iyer',
        submittedOn: '12-06-2026',
        submittedOnTime: '02:30 PM',
        finalStatus: 'Under Review',
        rca: {
            problemStatement:
                'Refrigerator temperature log for the main kitchen cold storage was not maintained for 3 consecutive days during the audit period.',
            rootCause:
                'Kitchen supervisor on leave; relief staff were not briefed on the daily logging SOP. Log register was misplaced during pantry reorganization.',
            rootCauseCategory: 'Process Failure',
            correctiveActionPlan:
                'Reinstate daily temperature log immediately. Conduct spot checks twice daily for 2 weeks. Replace damaged log register.',
            preventiveActionPlan:
                'Cross-train two additional staff on SOP HK-004. Add temperature logging to opening checklist. Display SOP poster at cold storage entry.',
            responsiblePerson: 'Mr. Ramesh Iyer',
            targetCompletionDate: '20-06-2026',
            remarks: 'Replacement log register ordered. First corrective check completed on 13-06-2026.',
        },
        evidence: {
            photos: ['kitchen-temp-log-photo.jpg', 'cold-storage-register.jpg'],
            documents: [{ name: 'SOP-HK-004-Temperature-Log.pdf', url: '#' }],
            videos: ['temp-check-demo.mp4'],
            links: [{ label: 'Vendor maintenance ticket #TKT-4521', url: 'https://example.com/ticket/4521' }],
        },
    }),
    buildRca({
        id: 'RCA-PA-2026-004',
        observationId: 'OBS-PA-2026-011',
        auditNumber: 'AUD-PA-2026-038',
        auditName: 'Transport Safety Audit — June 2026',
        department: 'Transport',
        section: 'Fleet Safety Equipment',
        checklistQuestion: 'Are fire extinguishers within valid inspection date on all active buses?',
        observationTitle: 'Fire extinguisher expired on Bus TN-12-AB-4521',
        priority: 'Critical',
        status: 'Approved',
        assignedTo: 'Mr. Suresh Patel',
        reportTo: 'Director of Operations',
        dueDate: '14-06-2026',
        submittedBy: 'Mr. Suresh Patel',
        submittedOn: '10-06-2026',
        submittedOnTime: '11:00 AM',
        finalStatus: 'Approved',
        rca: {
            problemStatement:
                'Fire extinguisher on Bus TN-12-AB-4521 had an expired inspection tag dated 01-06-2026 while the bus remained in active service.',
            rootCause:
                'Monthly fleet safety checklist did not flag extinguisher expiry separately. Maintenance records were updated only at annual service, not at monthly inspection.',
            rootCauseCategory: 'Equipment Failure',
            correctiveActionPlan:
                'Replace expired extinguisher immediately. Ground bus until replacement verified. Update all fleet extinguishers expiring within 30 days.',
            preventiveActionPlan:
                'Add extinguisher expiry as a separate line item on weekly fleet checklist. Enable automated alerts 30 days before expiry.',
            responsiblePerson: 'Mr. Deepak Verma',
            targetCompletionDate: '12-06-2026',
            remarks: 'Extinguisher replaced and verified on 11-06-2026. Bus returned to service.',
        },
        evidence: {
            photos: ['bus-extinguisher-before.jpg', 'bus-extinguisher-after.jpg'],
            documents: [{ name: 'Fleet-Safety-Checklist-June.pdf', url: '#' }],
            videos: [],
            links: [],
        },
    }),
    buildRca({
        id: 'RCA-PA-2026-003',
        observationId: 'OBS-PA-2026-013',
        auditNumber: 'AUD-PA-2026-041',
        auditName: 'Finance Controls Audit — June 2026',
        department: 'Finance',
        section: 'Petty Cash Management',
        checklistQuestion: 'Are all petty cash vouchers signed by authorized personnel?',
        observationTitle: 'Petty cash voucher unsigned',
        priority: 'High',
        status: 'RCA Submitted',
        assignedTo: 'Mr. Vikram Singh',
        reportTo: 'Finance Manager',
        dueDate: '16-06-2026',
        submittedBy: 'Mr. Vikram Singh',
        submittedOn: '11-06-2026',
        submittedOnTime: '04:45 PM',
        finalStatus: 'Pending Review',
        rca: {
            problemStatement:
                'Three petty cash vouchers dated 08-06-2026 were processed without authorized signatures from the department head.',
            rootCause:
                'Department head was off-campus for a board meeting. Acting approver was not formally delegated signing authority in the system.',
            rootCauseCategory: 'Policy Gap',
            correctiveActionPlan:
                'Obtain retrospective signatures with justification note. Update delegation register for acting approvers.',
            preventiveActionPlan:
                'Define and document acting approver protocol. Enable dual-signature workflow in petty cash module for amounts above ₹5,000.',
            responsiblePerson: 'Ms. Priya Nair',
            targetCompletionDate: '18-06-2026',
            remarks: 'Retrospective signatures obtained for 2 of 3 vouchers. Third pending department head return.',
        },
        evidence: {
            photos: [],
            documents: [
                { name: 'Petty-Cash-Vouchers-0806.pdf', url: '#' },
                { name: 'Delegation-Register-Update.pdf', url: '#' },
            ],
            videos: [],
            links: [{ label: 'Finance policy — Petty Cash SOP', url: 'https://example.com/sop/petty-cash' }],
        },
    }),
    buildRca({
        id: 'RCA-PA-2026-002',
        observationId: 'OBS-PA-2026-012',
        auditNumber: 'AUD-PA-2026-045',
        auditName: 'Housekeeping Compliance Audit — June 2026',
        department: 'Housekeeping',
        section: 'Corridor Maintenance',
        checklistQuestion: 'Is the housekeeping schedule board displayed in each corridor?',
        observationTitle: 'Corridor cleaning schedule not displayed',
        priority: 'Medium',
        status: 'Rejected',
        assignedTo: 'Mr. Ganesh Pillai',
        reportTo: 'Facility Manager',
        dueDate: '17-06-2026',
        submittedBy: 'Mr. Ganesh Pillai',
        submittedOn: '09-06-2026',
        submittedOnTime: '09:20 AM',
        finalStatus: 'Rejected',
        rca: {
            problemStatement:
                'Housekeeping schedule board missing from the 2nd floor corridor as required by SOP HK-001.',
            rootCause:
                'Schedule board removed during wall repainting and not reinstalled. Team assumed temporary exemption during renovation.',
            rootCauseCategory: 'Communication Gap',
            correctiveActionPlan:
                'Reinstall schedule board within 24 hours. Verify all floors for missing boards.',
            preventiveActionPlan:
                'Add board reinstallation to renovation close-out checklist. Notify audit team when boards are temporarily removed.',
            responsiblePerson: 'Ms. Lakshmi Devi',
            targetCompletionDate: '12-06-2026',
            remarks: 'Rejected — corrective action incomplete. Board reinstalled but schedule content outdated.',
        },
        evidence: {
            photos: ['corridor-board-missing.jpg'],
            documents: [],
            videos: [],
            links: [],
        },
    }),
    buildRca({
        id: 'RCA-PA-2026-001',
        observationId: 'OBS-PA-2026-009',
        auditNumber: 'AUD-PA-2026-039',
        auditName: 'IT Infrastructure Audit — June 2026',
        department: 'IT Support',
        section: 'Backup & Recovery',
        checklistQuestion: 'Is the daily backup verification log complete and signed?',
        observationTitle: 'Backup verification log incomplete',
        priority: 'High',
        status: 'Approved',
        assignedTo: 'Mr. Arjun Mehta',
        reportTo: 'IT Manager',
        dueDate: '12-06-2026',
        submittedBy: 'Mr. Arjun Mehta',
        submittedOn: '08-06-2026',
        submittedOnTime: '03:15 PM',
        finalStatus: 'Approved',
        rca: {
            problemStatement:
                'Daily backup verification log missing entries for 03-06 and 04-06-2026, creating a gap in the audit trail.',
            rootCause:
                'Automated backup job completed but verification script failed silently due to storage threshold alert. On-call engineer did not receive escalation notification.',
            rootCauseCategory: 'Equipment Failure',
            correctiveActionPlan:
                'Backfill log entries from system logs. Clear storage threshold. Re-run failed verification jobs.',
            preventiveActionPlan:
                'Configure alert routing to secondary on-call. Add backup verification to daily stand-up checklist.',
            responsiblePerson: 'Ms. Neha Gupta',
            targetCompletionDate: '10-06-2026',
            remarks: 'Approved. Storage expanded and monitoring alerts updated.',
        },
        evidence: {
            photos: ['backup-log-screenshot.png'],
            documents: [{ name: 'Backup-Verification-Log-June.pdf', url: '#' }],
            videos: ['backup-restore-test.mp4'],
            links: [{ label: 'Monitoring dashboard — Backup jobs', url: 'https://example.com/monitoring/backups' }],
        },
    }),
]

export const saveRcaRecords = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getRcaRecords = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    saveRcaRecords(DEFAULT_RCA_RECORDS)
    return DEFAULT_RCA_RECORDS
}

export const getRcaById = (id) =>
    getRcaRecords().find((item) => item.id === id || item.observationId === id) ?? null

export const getRcaByObservationId = (observationId) =>
    getRcaRecords().find((item) => item.observationId === observationId) ?? null
