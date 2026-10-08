import { DEPARTMENTS } from '../AuditManagement/MyAudits/myAuditsData'

export { DEPARTMENTS }

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export const OBSERVATION_STATUSES = ['Open', 'Assigned', 'In Review', 'Resolved', 'Closed']

export const OPEN_STATUSES = ['Open', 'Assigned', 'In Review']

export const CLOSED_STATUSES = ['Resolved', 'Closed']

export const CATEGORIES = [
    'Process Compliance',
    'Safety & Hygiene',
    'Documentation',
    'Equipment Failure',
    'Financial Control',
    'IT Security',
    'Housekeeping',
    'Transport',
]

export const TIMELINE_STAGES = [
    'Created',
    'Assigned',
    'Department Response',
    'RCA Submitted',
    'ATR Submitted',
    'Verified',
    'Closed',
]

export const RESPONSIBLE_PERSONS = [
    'Dr. Meera Sharma',
    'Mr. Vikram Singh',
    'Mr. Ganesh Pillai',
    'Mr. Arjun Mehta',
    'Mr. Suresh Patel',
    'Ms. Kavita Rao',
    'Mr. Ramesh Iyer',
    'Prof. Anil Kapoor',
]

export const statusBadgeColor = {
    Open: 'bg-[#2196F333] text-[#2196F3]',
    Assigned: 'bg-[#FF980033] text-[#FF9800]',
    'In Review': 'bg-[#515DEF33] text-[#515DEF]',
    Resolved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Closed: 'bg-[#66708533] text-[#667085]',
}

export const priorityBadgeColor = {
    Low: 'bg-[#2196F333] text-[#2196F3]',
    Medium: 'bg-[#FF980033] text-[#FF9800]',
    High: 'bg-[#FF000033] text-[#FF0000]',
    Critical: 'bg-[#9C27B033] text-[#9C27B0]',
}

const STORAGE_KEY = 'process-auditor-observations'

const stageIndexForStatus = {
    Open: 0,
    Assigned: 1,
    'In Review': 2,
    Resolved: 5,
    Closed: 6,
}

export const buildTimeline = (status, createdDate = '10-06-2026', createdTime = '10:30 AM') => {
    const activeIndex = stageIndexForStatus[status] ?? 0
    const stageDates = [
        { date: createdDate, time: createdTime },
        { date: '11-06-2026', time: '09:00 AM' },
        { date: '12-06-2026', time: '02:15 PM' },
        { date: '14-06-2026', time: '11:00 AM' },
        { date: '16-06-2026', time: '04:30 PM' },
        { date: '18-06-2026', time: '10:00 AM' },
        { date: '20-06-2026', time: '03:45 PM' },
    ]

    return TIMELINE_STAGES.map((stage, index) => ({
        stage,
        done: index <= activeIndex,
        date: index <= activeIndex ? stageDates[index]?.date ?? '' : '',
        time: index <= activeIndex ? stageDates[index]?.time ?? '' : '',
    }))
}

const buildObservation = ({
    observationId,
    auditReference,
    department,
    location,
    category,
    title,
    description,
    priority,
    severity,
    responsibleDepartment,
    responsiblePerson,
    assignTo,
    reportTo,
    evidence,
    dueDate,
    status,
    createdDate = '10-06-2026',
    createdTime = '10:30 AM',
}) => ({
    id: observationId,
    observationId,
    auditReference,
    department,
    location,
    category,
    title,
    description,
    priority,
    severity,
    responsibleDepartment,
    responsiblePerson,
    assignTo: assignTo ?? responsiblePerson,
    reportTo: reportTo ?? '',
    evidence: evidence ?? '',
    dueDate,
    status,
    timeline: buildTimeline(status, createdDate, createdTime),
    createdDate,
    createdTime,
})

const DEFAULT_OBSERVATIONS = [
    buildObservation({
        observationId: 'OBS-PA-2026-014',
        auditReference: 'AUD-PA-2026-043',
        department: 'Canteen',
        location: 'Canteen Building — Kitchen',
        category: 'Safety & Hygiene',
        title: 'Food storage temperature log missing',
        description: 'Refrigerator temperature log not maintained for the past 3 days. Immediate corrective action required.',
        priority: 'Critical',
        severity: 'Critical',
        responsibleDepartment: 'Canteen',
        responsiblePerson: 'Mr. Ramesh Iyer',
        assignTo: 'Canteen Manager',
        reportTo: 'Director of Operations',
        dueDate: '12-06-2026',
        status: 'Open',
        createdDate: '10-06-2026',
    }),
    buildObservation({
        observationId: 'OBS-PA-2026-013',
        auditReference: 'AUD-PA-2026-041',
        department: 'Finance',
        location: 'Admin Block — Room 102',
        category: 'Financial Control',
        title: 'Petty cash voucher unsigned',
        description: 'Three petty cash vouchers dated 08-06-2026 found without authorized signatures.',
        priority: 'High',
        severity: 'High',
        responsibleDepartment: 'Finance',
        responsiblePerson: 'Mr. Vikram Singh',
        assignTo: 'Account Assistant',
        reportTo: 'Finance Manager',
        evidence: 'voucher-scan-0806.pdf',
        dueDate: '14-06-2026',
        status: 'Assigned',
        createdDate: '09-06-2026',
    }),
    buildObservation({
        observationId: 'OBS-PA-2026-012',
        auditReference: 'AUD-PA-2026-045',
        department: 'Housekeeping',
        location: 'Main Academic Block — 2nd Floor',
        category: 'Housekeeping',
        title: 'Corridor cleaning schedule not displayed',
        description: 'Housekeeping schedule board missing from the 2nd floor corridor as per SOP HK-001.',
        priority: 'Medium',
        severity: 'Medium',
        responsibleDepartment: 'Housekeeping',
        responsiblePerson: 'Mr. Ganesh Pillai',
        assignTo: 'Housekeeping Supervisor',
        reportTo: 'Facility Manager',
        evidence: '',
        dueDate: '16-06-2026',
        status: 'In Review',
        createdDate: '05-06-2026',
    }),
    buildObservation({
        observationId: 'OBS-PA-2026-011',
        auditReference: 'AUD-PA-2026-038',
        department: 'Transport',
        location: 'Transport Office — Fleet Yard',
        category: 'Transport',
        title: 'Fire extinguisher expired on Bus TN-12-AB-4521',
        description: 'Fire extinguisher inspection tag shows expiry date 01-06-2026. Bus still in active service.',
        priority: 'Critical',
        severity: 'Critical',
        responsibleDepartment: 'Transport',
        responsiblePerson: 'Mr. Suresh Patel',
        assignTo: 'Transport Manager',
        reportTo: 'Director of Operations',
        evidence: 'bus-extinguisher-photo.jpg',
        dueDate: '08-06-2026',
        status: 'Assigned',
        createdDate: '06-06-2026',
    }),
    buildObservation({
        observationId: 'OBS-PA-2026-009',
        auditReference: 'AUD-PA-2026-039',
        department: 'IT Support',
        location: 'IT Server Room',
        category: 'IT Security',
        title: 'Backup verification log incomplete',
        description: 'Daily backup verification log missing entries for 03-06 and 04-06-2026.',
        priority: 'High',
        severity: 'High',
        responsibleDepartment: 'IT Support',
        responsiblePerson: 'Mr. Arjun Mehta',
        assignTo: 'IT Support Manager',
        reportTo: 'IT Manager',
        evidence: 'backup-log-screenshot.png',
        dueDate: '10-06-2026',
        status: 'Resolved',
        createdDate: '01-06-2026',
    }),
    buildObservation({
        observationId: 'OBS-PA-2026-007',
        auditReference: 'AUD-PA-2026-031',
        department: 'Canteen',
        location: 'Canteen Building',
        category: 'Safety & Hygiene',
        title: 'Staff hygiene compliance below standard',
        description: 'Two kitchen staff observed without hair nets during food preparation hours.',
        priority: 'Medium',
        severity: 'Medium',
        responsibleDepartment: 'Canteen',
        responsiblePerson: 'Mr. Ramesh Iyer',
        assignTo: 'Canteen Manager',
        reportTo: 'Director of Operations',
        evidence: 'hygiene-audit-photo.jpg',
        dueDate: '28-05-2026',
        status: 'Closed',
        createdDate: '22-05-2026',
    }),
    buildObservation({
        observationId: 'OBS-PA-2026-005',
        auditReference: 'AUD-PA-2026-022',
        department: 'Finance',
        location: 'Admin Block — Finance Wing',
        category: 'Financial Control',
        title: 'Bank reconciliation pending approval',
        description: 'May 2026 bank reconciliation completed but pending sign-off from department head.',
        priority: 'Low',
        severity: 'Low',
        responsibleDepartment: 'Finance',
        responsiblePerson: 'Mr. Vikram Singh',
        assignTo: 'Account Assistant',
        reportTo: 'Finance Manager',
        evidence: 'bank-recon-may.pdf',
        dueDate: '05-06-2026',
        status: 'Closed',
        createdDate: '01-05-2026',
    }),
    buildObservation({
        observationId: 'OBS-PA-2026-003',
        auditReference: 'AUD-PA-2026-018',
        department: 'Academic',
        location: 'Examination Cell',
        category: 'Documentation',
        title: 'Answer script register incomplete',
        description: 'Answer script issue register missing entries for Class 10 Mathematics paper.',
        priority: 'High',
        severity: 'High',
        responsibleDepartment: 'Academic',
        responsiblePerson: 'Prof. Anil Kapoor',
        assignTo: 'Coordinator - Primary',
        reportTo: 'Director of Academics',
        evidence: '',
        dueDate: '25-04-2026',
        status: 'Closed',
        createdDate: '20-04-2026',
    }),
]

export const saveObservations = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const getObservations = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    saveObservations(DEFAULT_OBSERVATIONS)
    return DEFAULT_OBSERVATIONS
}

export const getObservationById = (id) =>
    getObservations().find((item) => item.id === id || item.observationId === id) ?? null

export const getOpenObservations = () =>
    getObservations().filter((item) => OPEN_STATUSES.includes(item.status))

export const getClosedObservations = () =>
    getObservations().filter((item) => CLOSED_STATUSES.includes(item.status))

export const generateObservationId = () => {
    const list = getObservations()
    const max = list.reduce((acc, item) => {
        const num = Number(item.observationId.split('-').pop())
        return Number.isNaN(num) ? acc : Math.max(acc, num)
    }, 0)
    return `OBS-PA-2026-${String(max + 1).padStart(3, '0')}`
}

export const emptyObservationForm = () => ({
    auditReference: '',
    department: '',
    location: '',
    category: '',
    title: '',
    description: '',
    priority: 'Medium',
    severity: 'Medium',
    responsibleDepartment: '',
    responsiblePerson: '',
    evidence: '',
    dueDate: '',
    status: 'Open',
})

export const createObservation = (form) => {
    const observationId = generateObservationId()
    const now = new Date()
    const createdDate = now.toLocaleDateString('en-GB').replace(/\//g, '-')
    const createdTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const record = buildObservation({
        observationId,
        ...form,
        status: form.status || 'Open',
        createdDate,
        createdTime,
    })

    const next = [record, ...getObservations()]
    saveObservations(next)
    return record
}

export const AUDIT_REFERENCES = [
    'AUD-PA-2026-041',
    'AUD-PA-2026-042',
    'AUD-PA-2026-043',
    'AUD-PA-2026-044',
    'AUD-PA-2026-038',
    'AUD-PA-2026-039',
    'AUD-PA-2026-045',
    'AUD-PA-2026-046',
]
