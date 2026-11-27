import { DEPARTMENTS } from '../AuditManagement/MyAudits/myAuditsData'

import {
    loadCampusJson,
    saveCampusJson,
    persistCampusJson,
    hydrateCampusKey,
    usesCampusApiForKey,
    getCampusLoadState,
} from '../../../services/campusJsonStore'
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
    grade = '',
    section = '',
    subject = '',
    referenceNumber,
    title,
    description,
    priority,
    severity,
    recipient,
    recipientRole = '',
    recipientDepartment = '',
    responsibleDepartment,
    responsiblePerson,
    assignTo,
    reportTo,
    evidence,
    evidenceFile = null,
    componentId = '',
    dueDate,
    status,
    createdDate = '10-06-2026',
    createdTime = '10:30 AM',
}) => ({
    id: observationId,
    observationId,
    referenceNumber: referenceNumber || observationId,
    auditReference,
    auditStream: 'PROCESS',
    department,
    location,
    category,
    grade,
    section,
    subject,
    title,
    description,
    priority,
    severity,
    recipient: recipient || responsiblePerson || '',
    recipientRole,
    recipientDepartment,
    responsibleDepartment,
    responsiblePerson,
    assignTo: assignTo ?? responsiblePerson,
    reportTo: reportTo ?? '',
    evidence: evidence ?? '',
    evidenceFile,
    componentId,
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
    saveCampusJson(STORAGE_KEY, records)
}

const belongsToProcessStream = (item) => {
    const stream = String(item?.auditStream || item?.stream || '').trim().toUpperCase()
    if (stream === 'QUALITY') return false
    if (stream === 'PROCESS') return true
    const blob = [
        item?.id,
        item?.observationId,
        item?.auditReference,
        item?.auditNumber,
        item?.atrNumber,
        item?.scheduleId,
    ].join(' ')
    if (/\b(OBS|AUD|ATR|SCH|RCA)-QA\b/.test(blob)) return false
    return true
}

export const getObservations = () => {
    try {
        const stored = loadCampusJson(STORAGE_KEY, null)
        if (Array.isArray(stored)) return stored.filter(belongsToProcessStream)
    } catch {
        /* ignore */
    }
    // Server mode: an unloaded or failed register is not data — never show demo rows.
    if (usesCampusApiForKey(STORAGE_KEY)) return []
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
    const prefix = `OBS-PA-${new Date().getFullYear()}-`
    const max = getObservations().reduce((acc, item) => {
        const id = String(item.observationId || item.id || '')
        if (!id.startsWith(prefix)) return acc
        const num = Number(id.slice(prefix.length))
        return Number.isFinite(num) ? Math.max(acc, num) : acc
    }, 0)
    return `${prefix}${String(max + 1).padStart(3, '0')}`
}

/** Grade / Section / Subject are optional: a cleared field is stored as '' and never refilled. */
const optionalText = (value) => (value == null ? '' : String(value).trim())

export const emptyObservationForm = () => ({
    auditReference: '',
    department: '',
    location: '',
    category: '',
    grade: '',
    section: '',
    subject: '',
    referenceNumber: '',
    title: '',
    description: '',
    priority: 'Medium',
    severity: 'Medium',
    recipient: '',
    recipientRole: '',
    recipientDepartment: '',
    responsibleDepartment: '',
    responsiblePerson: '',
    evidence: '',
    evidenceFile: null,
    attachmentName: '',
    componentId: '',
    dueDate: '',
    status: 'Open',
})

const buildNewObservation = (form) => {
    const observationId = form.observationId || generateObservationId()
    const now = new Date()
    const createdDate = form.createdDate || now.toLocaleDateString('en-GB').replace(/\//g, '-')
    const createdTime = form.createdTime || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const title = form.title?.trim() || form.category || form.description?.slice(0, 80) || observationId

    return buildObservation({
        observationId,
        ...form,
        title,
        grade: optionalText(form.grade),
        section: optionalText(form.section),
        subject: optionalText(form.subject),
        referenceNumber: form.referenceNumber?.trim() || observationId,
        recipient: form.recipient || form.responsiblePerson || '',
        responsiblePerson: form.responsiblePerson || form.recipient || '',
        status: form.status || 'Open',
        createdDate,
        createdTime,
    })
}

const withoutRecord = (list, record) =>
    list.filter((item) => item.id !== record.id && item.observationId !== record.observationId)

export const createObservation = (form) => {
    const record = buildNewObservation(form)
    saveObservations([record, ...withoutRecord(getObservations(), record)])
    return record
}

/** Create from the Create Observation page: resolves only after the server confirms the save. */
export const createObservationAsync = async (form) => {
    const loadState = getObservationsLoadState()
    if (loadState.api && loadState.status !== 'loaded') {
        return { success: false, message: loadState.error || 'Observations have not loaded yet. Refresh and try again.' }
    }
    const record = buildNewObservation(form)
    const result = await persistCampusJson(STORAGE_KEY, [record, ...withoutRecord(getObservations(), record)])
    if (result?.success === false) return { success: false, message: result.message || 'Could not save the observation.' }
    return { success: true, record }
}

/** Upsert observation into campus-audit process-observations (by id / observationId). */
export const getObservationsLoadState = () => getCampusLoadState(STORAGE_KEY)

export const upsertObservation = (form) => {
    const existingId = form.id || form.observationId
    const loadState = getObservationsLoadState()
    if (loadState.api && loadState.status !== 'loaded') {
        // The register replace needs the real server list; refuse rather than overwrite it.
        return { ...form, observationId: existingId, saveBlocked: true, message: loadState.error || 'Observations have not loaded yet.' }
    }
    const current = getObservations()
    const match = existingId
        ? current.find((item) => item.id === existingId || item.observationId === existingId)
        : null

    if (match?.auditReference && form.auditReference && match.auditReference !== form.auditReference) {
        return { ...form, saveBlocked: true, message: `Observation ${existingId} already belongs to audit ${match.auditReference}.` }
    }
    if (match) {
        const record = {
            ...match,
            ...form,
            id: match.id,
            observationId: match.observationId,
            auditStream: 'PROCESS',
        }
        const next = [record, ...current.filter((item) => item.id !== match.id && item.observationId !== match.observationId)]
        saveObservations(next)
        return record
    }

    return createObservation({ ...form, auditStream: 'PROCESS' })
}

export const hydrateFromApi = (seed = DEFAULT_OBSERVATIONS) => hydrateCampusKey(STORAGE_KEY, seed)
export const usesApiStore = () => usesCampusApiForKey(STORAGE_KEY)
