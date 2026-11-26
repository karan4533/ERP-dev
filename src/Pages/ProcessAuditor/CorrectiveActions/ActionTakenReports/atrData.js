import { DEPARTMENTS } from '../../Observations/observationsData'

export { DEPARTMENTS }

export const ATR_STATUSES = [
    'Submitted',
    'Under Review',
    'Approved',
    'Rejected',
    'Verified',
    'Closed',
]

export const SUPER_ADMIN_DECISIONS = ['Approved', 'Rejected', 'Pending']

export const STATUS_TIMELINE_STAGES = [
    'Assigned',
    'RCA Submitted',
    'Department Head Reviewed',
    'Forwarded to Super Admin',
    'Approved / Rejected',
    'Visible to Process Audit',
    'Visible to Quality Audit',
]

export const statusBadgeColor = {
    Submitted: 'bg-[#2196F333] text-[#2196F3]',
    'Under Review': 'bg-[#515DEF33] text-[#515DEF]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
    Verified: 'bg-[#9C27B033] text-[#9C27B0]',
    Closed: 'bg-[#66708533] text-[#667085]',
}

export const decisionBadgeColor = {
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
}

const STORAGE_KEY = 'process-auditor-atr'

const buildStatusTimeline = (completedStages = 7) =>
    STATUS_TIMELINE_STAGES.map((stage, index) => ({
        stage,
        done: index < completedStages,
    }))

const buildAtr = ({
    id,
    atrNumber,
    observationId,
    auditNumber,
    department,
    assignedTo,
    reportTo,
    status,
    submittedBy,
    submittedOn,
    submittedOnTime,
    actionTaken,
    evidence,
    verification,
    statusTimeline,
}) => ({
    id,
    atrNumber,
    observationId,
    auditNumber,
    department,
    assignedTo,
    reportTo,
    status,
    submittedBy,
    submittedOn,
    submittedOnTime,
    actionTaken,
    evidence,
    verification,
    statusTimeline: statusTimeline ?? buildStatusTimeline(),
})

const DEFAULT_ATR_RECORDS = [
    buildAtr({
        id: 'ATR-PA-2026-005',
        atrNumber: 'ATR-PA-2026-005',
        observationId: 'OBS-PA-2026-011',
        auditNumber: 'AUD-PA-2026-038',
        department: 'Transport',
        assignedTo: 'Mr. Suresh Patel',
        reportTo: 'Director of Operations',
        status: 'Approved',
        submittedBy: 'Mr. Suresh Patel',
        submittedOn: '16-06-2026',
        submittedOnTime: '10:30 AM',
        actionTaken: {
            actionTaken:
                'Replaced expired fire extinguisher on Bus TN-12-AB-4521. Conducted full fleet safety sweep for all extinguishers expiring within 30 days.',
            solutionImplemented:
                'New ABC-type extinguisher installed and pressure-verified. Updated fleet maintenance register. Added weekly extinguisher check to driver pre-trip checklist.',
            completionDate: '12-06-2026',
            responsiblePerson: 'Mr. Deepak Verma',
            outcomeResult:
                'Bus returned to service on 12-06-2026. All 18 fleet extinguishers verified compliant. No further safety violations identified.',
            additionalRemarks: 'Maintenance vendor invoice attached. Driver briefing completed on 13-06-2026.',
        },
        evidence: {
            beforePhotos: ['bus-extinguisher-expired.jpg', 'fleet-yard-before.jpg'],
            afterPhotos: ['bus-extinguisher-replaced.jpg', 'fleet-checklist-updated.jpg'],
            documents: [
                { name: 'Extinguisher-Replacement-Invoice.pdf', url: '#' },
                { name: 'Fleet-Safety-Verification-Report.pdf', url: '#' },
            ],
            videos: ['extinguisher-pressure-test.mp4'],
            links: [{ label: 'Fleet maintenance register — June 2026', url: 'https://example.com/fleet/register' }],
        },
        verification: {
            departmentHead: 'Mr. Suresh Patel',
            acknowledgedOn: '16-06-2026',
            acknowledgedOnTime: '11:00 AM',
            superAdminDecision: 'Approved',
            decisionOn: '17-06-2026',
            decisionOnTime: '02:15 PM',
            superAdminRemarks:
                'Corrective action verified complete. Fleet safety protocol update approved for institution-wide rollout.',
        },
        statusTimeline: buildStatusTimeline(7),
    }),
    buildAtr({
        id: 'ATR-PA-2026-004',
        atrNumber: 'ATR-PA-2026-004',
        observationId: 'OBS-PA-2026-014',
        auditNumber: 'AUD-PA-2026-043',
        department: 'Canteen',
        assignedTo: 'Mr. Ramesh Iyer',
        reportTo: 'Director of Operations',
        status: 'Under Review',
        submittedBy: 'Mr. Ramesh Iyer',
        submittedOn: '18-06-2026',
        submittedOnTime: '03:45 PM',
        actionTaken: {
            actionTaken:
                'Reinstated daily refrigerator temperature log. Replaced damaged log register. Conducted refresher training for all kitchen staff on SOP HK-004.',
            solutionImplemented:
                'New laminated temperature log mounted at cold storage entry. Two staff cross-trained on logging procedure. Spot checks scheduled twice daily for 14 days.',
            completionDate: '17-06-2026',
            responsiblePerson: 'Mr. Ramesh Iyer',
            outcomeResult:
                'Temperature logs complete for 5 consecutive days post-implementation. Cold storage readings within acceptable range (2–4°C).',
            additionalRemarks: 'Relief staff briefing deck created. SOP poster reinstalled at pantry entrance.',
        },
        evidence: {
            beforePhotos: ['kitchen-temp-log-missing.jpg'],
            afterPhotos: ['temp-log-reinstated.jpg', 'sop-poster-installed.jpg'],
            documents: [{ name: 'Staff-Training-Attendance-Sheet.pdf', url: '#' }],
            videos: [],
            links: [{ label: 'SOP HK-004 — Temperature Logging', url: 'https://example.com/sop/hk-004' }],
        },
        verification: {
            departmentHead: 'Mr. Ramesh Iyer',
            acknowledgedOn: '18-06-2026',
            acknowledgedOnTime: '04:00 PM',
            superAdminDecision: 'Pending',
            decisionOn: '',
            decisionOnTime: '',
            superAdminRemarks: '',
        },
        statusTimeline: buildStatusTimeline(5),
    }),
    buildAtr({
        id: 'ATR-PA-2026-003',
        atrNumber: 'ATR-PA-2026-003',
        observationId: 'OBS-PA-2026-009',
        auditNumber: 'AUD-PA-2026-039',
        department: 'IT Support',
        assignedTo: 'Mr. Arjun Mehta',
        reportTo: 'IT Manager',
        status: 'Verified',
        submittedBy: 'Mr. Arjun Mehta',
        submittedOn: '11-06-2026',
        submittedOnTime: '09:00 AM',
        actionTaken: {
            actionTaken:
                'Backfilled missing backup verification log entries from system logs. Cleared storage threshold on backup array. Re-ran failed verification jobs for 03-06 and 04-06.',
            solutionImplemented:
                'Storage expanded by 500 GB. Alert routing updated to secondary on-call. Backup verification added to daily IT stand-up checklist.',
            completionDate: '10-06-2026',
            responsiblePerson: 'Ms. Neha Gupta',
            outcomeResult:
                'All backup jobs verified successful for 7 consecutive days. No data loss confirmed. Monitoring dashboard shows green status.',
            additionalRemarks: 'Q3 storage expansion project initiated as preventive measure.',
        },
        evidence: {
            beforePhotos: ['backup-log-gap-screenshot.png'],
            afterPhotos: ['backup-log-complete.png', 'monitoring-dashboard-green.png'],
            documents: [{ name: 'Backup-Verification-Report-June.pdf', url: '#' }],
            videos: ['backup-restore-test.mp4'],
            links: [{ label: 'IT monitoring — Backup jobs dashboard', url: 'https://example.com/monitoring/backups' }],
        },
        verification: {
            departmentHead: 'Mr. Arjun Mehta',
            acknowledgedOn: '11-06-2026',
            acknowledgedOnTime: '09:30 AM',
            superAdminDecision: 'Approved',
            decisionOn: '12-06-2026',
            decisionOnTime: '11:45 AM',
            superAdminRemarks: 'Action verified. Storage expansion approved for Q3 budget cycle.',
        },
        statusTimeline: buildStatusTimeline(7),
    }),
    buildAtr({
        id: 'ATR-PA-2026-002',
        atrNumber: 'ATR-PA-2026-002',
        observationId: 'OBS-PA-2026-012',
        auditNumber: 'AUD-PA-2026-045',
        department: 'Housekeeping',
        assignedTo: 'Mr. Ganesh Pillai',
        reportTo: 'Facility Manager',
        status: 'Rejected',
        submittedBy: 'Mr. Ganesh Pillai',
        submittedOn: '14-06-2026',
        submittedOnTime: '02:00 PM',
        actionTaken: {
            actionTaken:
                'Reinstalled housekeeping schedule board on 2nd floor corridor. Updated schedule content for current week.',
            solutionImplemented:
                'Board mounted at corridor entrance. Schedule printed and laminated. Team notified of display requirement.',
            completionDate: '12-06-2026',
            responsiblePerson: 'Ms. Lakshmi Devi',
            outcomeResult:
                'Board physically reinstalled but schedule content was outdated — did not reflect current cleaning rotation.',
            additionalRemarks: 'Resubmitting with updated schedule after verification walkthrough.',
        },
        evidence: {
            beforePhotos: ['corridor-board-missing.jpg'],
            afterPhotos: ['corridor-board-reinstalled.jpg'],
            documents: [],
            videos: [],
            links: [],
        },
        verification: {
            departmentHead: 'Mr. Ganesh Pillai',
            acknowledgedOn: '14-06-2026',
            acknowledgedOnTime: '02:30 PM',
            superAdminDecision: 'Rejected',
            decisionOn: '15-06-2026',
            decisionOnTime: '10:00 AM',
            superAdminRemarks:
                'Board reinstalled but schedule content outdated. Resubmit ATR with current week schedule verified by facility manager.',
        },
        statusTimeline: buildStatusTimeline(5),
    }),
    buildAtr({
        id: 'ATR-PA-2026-001',
        atrNumber: 'ATR-PA-2026-001',
        observationId: 'OBS-PA-2026-013',
        auditNumber: 'AUD-PA-2026-041',
        department: 'Finance',
        assignedTo: 'Mr. Vikram Singh',
        reportTo: 'Finance Manager',
        status: 'Submitted',
        submittedBy: 'Mr. Vikram Singh',
        submittedOn: '19-06-2026',
        submittedOnTime: '04:15 PM',
        actionTaken: {
            actionTaken:
                'Obtained retrospective signatures on 2 of 3 unsigned petty cash vouchers. Updated delegation register for acting approvers during department head absence.',
            solutionImplemented:
                'Acting approver protocol documented. Dual-signature workflow enabled for amounts above ₹5,000 in petty cash module.',
            completionDate: '18-06-2026',
            responsiblePerson: 'Ms. Priya Nair',
            outcomeResult:
                '2 vouchers signed and filed. Third voucher pending department head return on 20-06-2026.',
            additionalRemarks: 'Finance policy update circulated to all department petty cash custodians.',
        },
        evidence: {
            beforePhotos: ['unsigned-vouchers-photo.jpg'],
            afterPhotos: ['signed-vouchers-photo.jpg'],
            documents: [
                { name: 'Delegation-Register-Update.pdf', url: '#' },
                { name: 'Petty-Cash-Policy-Amendment.pdf', url: '#' },
            ],
            videos: [],
            links: [{ label: 'Finance SOP — Petty Cash Management', url: 'https://example.com/sop/petty-cash' }],
        },
        verification: {
            departmentHead: 'Mr. Vikram Singh',
            acknowledgedOn: '19-06-2026',
            acknowledgedOnTime: '04:30 PM',
            superAdminDecision: 'Pending',
            decisionOn: '',
            decisionOnTime: '',
            superAdminRemarks: '',
        },
        statusTimeline: buildStatusTimeline(3),
    }),
]

export const saveAtrRecords = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getAtrRecords = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    saveAtrRecords(DEFAULT_ATR_RECORDS)
    return DEFAULT_ATR_RECORDS
}

export const getAtrById = (id) =>
    getAtrRecords().find((item) => item.id === id || item.atrNumber === id) ?? null

export const getAtrByObservationId = (observationId) =>
    getAtrRecords().find((item) => item.observationId === observationId) ?? null
