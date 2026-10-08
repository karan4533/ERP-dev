import { getAuditById } from '../MyAudits/myAuditsData'

export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export const OBSERVATION_PRIORITIES = ['Critical', 'High', 'Medium', 'Low']

export const ASSIGN_TO_EMPLOYEES = [
    'Teacher - Grade 5',
    'Coordinator - Primary',
    'Library Manager',
    'Gatekeeper',
    'Transport Manager',
    'HR Executive',
    'Account Assistant',
]

/** @deprecated use ASSIGN_TO_EMPLOYEES */
export const ASSIGN_TO_OPTIONS = ASSIGN_TO_EMPLOYEES

export const REPORT_TO_MAP = {
    'Teacher - Grade 5': 'Director of Academics',
    'Coordinator - Primary': 'Director of Academics',
    'Library Manager': 'Principal',
    Gatekeeper: 'Security Manager',
    'Transport Manager': 'Director of Operations',
    'HR Executive': 'HR Manager',
    'Account Assistant': 'Finance Manager',
}

export const OBSERVATION_STATUSES = [
    'Pending Assignment',
    'Assigned',
    'Action Pending',
    'ATR Submitted',
    'Under Review',
    'Approved',
    'Rejected',
    'Closed',
]

export const observationStatusBadgeColor = {
    'Pending Assignment': 'bg-[#FF980033] text-[#FF9800]',
    Assigned: 'bg-[#2196F333] text-[#2196F3]',
    'Action Pending': 'bg-[#515DEF33] text-[#515DEF]',
    'ATR Submitted': 'bg-[#9C27B033] text-[#9C27B0]',
    'Under Review': 'bg-[#FFC10733] text-[#FFC107]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
    Closed: 'bg-[#66708533] text-[#667085]',
}

const OBS_NUMBER_COUNTER_KEY = 'process-auditor-inline-obs-counter'

export const resolveReportTo = (assignTo) => REPORT_TO_MAP[assignTo] ?? ''

export const generateObservationNumber = () => {
    const year = new Date().getFullYear()
    let counter = Number(localStorage.getItem(OBS_NUMBER_COUNTER_KEY) ?? 151)
    counter += 1
    localStorage.setItem(OBS_NUMBER_COUNTER_KEY, String(counter))
    return `OBS-${year}-${String(counter).padStart(5, '0')}`
}

export const formatAssignedDate = (date = new Date()) => {
    const d = date instanceof Date ? date : new Date(date)
    return d
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        .replace(/ /g, '-')
}

export const AUDIT_STATUS_STAGES = [
    'Draft',
    'Assigned',
    'In Progress',
    'Submitted',
    'Under Review',
    'Approved',
    'Closed',
]

export const TIMELINE_STAGES = ['Assigned', 'Started', 'Saved Draft', 'Submitted', 'Verified', 'Closed']

export const CHECKLIST_RESPONSE_OPTIONS = ['Yes', 'No', 'Error']

export const RESPONSE_TYPE_LABELS = {
    yes_no: 'Yes / No',
    pass_fail: 'Pass / Fail',
    scale: '0 / 0.5 / 1',
    dropdown: 'Dropdown',
    checkbox: 'Checkbox',
    number: 'Number',
    text: 'Text',
    textarea: 'Textarea',
    date: 'Date',
    time: 'Time',
    photo: 'Photo Upload',
    document: 'Document Upload',
}

export const SOP_LIBRARY = {
    'HK-SOP-001': {
        code: 'HK-SOP-001',
        title: 'HK SOP 001 — Classroom Housekeeping',
        objective: 'Ensure classrooms are clean, hygienic, and ready before each academic session.',
        procedure: 'Inspect floors, boards, furniture, and waste bins. Log findings and escalate non-compliance within 2 hours.',
        reference: 'Housekeeping Manual — Section 4.2',
        expectedResult: 'All classroom surfaces clean, dustbins emptied, and no visible debris.',
    },
    'IT-SOP-014': {
        code: 'IT-SOP-014',
        title: 'IT SOP 014 — Classroom AV Equipment',
        objective: 'Verify projector and AV systems are operational before teaching hours.',
        procedure: 'Power on projector, test input sources, check remote and cabling. Report faults to IT helpdesk.',
        reference: 'IT Operations Guide — AV Checklist',
        expectedResult: 'Projector displays clearly with no connectivity issues.',
    },
    'FAC-SOP-008': {
        code: 'FAC-SOP-008',
        title: 'FAC SOP 008 — Electrical & Lighting',
        objective: 'Maintain safe and functional lighting and fan systems in classrooms.',
        procedure: 'Test all switches, fans, and tube lights. Note burnt-out fixtures for maintenance ticket.',
        reference: 'Facilities Maintenance SOP — Electrical',
        expectedResult: 'All lights and fans operational; no exposed wiring.',
    },
    'SAF-SOP-003': {
        code: 'SAF-SOP-003',
        title: 'SAF SOP 003 — Fire Safety Equipment',
        objective: 'Ensure fire extinguishers and emergency exits meet safety standards.',
        procedure: 'Verify extinguisher pressure gauge, accessibility, and exit route clearance.',
        reference: 'Safety Compliance Manual — Fire Safety',
        expectedResult: 'Extinguisher accessible, pressurized, and exit routes unobstructed.',
    },
    'SAF-SOP-005': {
        code: 'SAF-SOP-005',
        title: 'SAF SOP 005 — First Aid Readiness',
        objective: 'Maintain adequate first aid supplies in designated areas.',
        procedure: 'Count stock against checklist. Replace expired items. Log replenishment date.',
        reference: 'Safety Compliance Manual — First Aid',
        expectedResult: 'First aid kit fully stocked with no expired items.',
    },
    'FAC-SOP-012': {
        code: 'FAC-SOP-012',
        title: 'FAC SOP 012 — Electrical Panel Inspection',
        objective: 'Assess condition of electrical panels and distribution boards.',
        procedure: 'Visual inspection for damage, overheating signs, and proper labeling.',
        reference: 'Facilities Maintenance SOP — Electrical Panels',
        expectedResult: 'Panel in good condition with clear labeling and no safety hazards.',
    },
    'ACD-SOP-021': {
        code: 'ACD-SOP-021',
        title: 'ACD SOP 021 — Academic Records',
        objective: 'Ensure attendance and academic records are maintained accurately.',
        procedure: 'Verify register entries, supervisor signatures, and daily updates.',
        reference: 'Academic Operations Manual — Records',
        expectedResult: 'Registers updated daily with authorized signatures.',
    },
    'SEC-SOP-004': {
        code: 'SEC-SOP-004',
        title: 'SEC SOP 004 — Visitor Management',
        objective: 'Track all visitors entering campus facilities.',
        procedure: 'Maintain visitor log with name, purpose, time in/out, and escort details.',
        reference: 'Security Operations Manual',
        expectedResult: 'Complete visitor log for the current day.',
    },
    'AUD-SOP-001': {
        code: 'AUD-SOP-001',
        title: 'AUD SOP 001 — Audit Documentation',
        objective: 'Standardize audit evidence collection and reporting.',
        procedure: 'Record timestamps, attach evidence, and document observations at point of finding.',
        reference: 'Process Audit Framework — Documentation',
        expectedResult: 'Complete audit trail with evidence for each parameter.',
    },
    'AUD-SOP-002': {
        code: 'AUD-SOP-002',
        title: 'AUD SOP 002 — Evidence Collection',
        objective: 'Define acceptable evidence types for audit findings.',
        procedure: 'Attach photos, documents, video links, or URLs supporting each finding.',
        reference: 'Process Audit Framework — Evidence',
        expectedResult: 'Verifiable evidence attached for all non-compliant items.',
    },
}

export const DEPARTMENT_INFO = {
    Academic: {
        departmentHead: 'Dr. Meera Sharma',
        coordinator: 'Prof. Anil Kapoor',
        location: 'Main Academic Block',
        frequency: 'Monthly',
        previousScore: 85,
        previousAuditDate: '10-05-2026',
    },
    Finance: {
        departmentHead: 'Mr. Vikram Singh',
        coordinator: 'Ms. Priya Nair',
        location: 'Admin Block — Finance Wing',
        frequency: 'Monthly',
        previousScore: 92,
        previousAuditDate: '05-05-2026',
    },
    HR: {
        departmentHead: 'Ms. Kavita Rao',
        coordinator: 'Mr. Rohit Menon',
        location: 'Admin Block — HR Office',
        frequency: 'Quarterly',
        previousScore: 78,
        previousAuditDate: '01-04-2026',
    },
    Transport: {
        departmentHead: 'Mr. Suresh Patel',
        coordinator: 'Mr. Deepak Verma',
        location: 'Transport Office & Fleet Yard',
        frequency: 'Monthly',
        previousScore: 88,
        previousAuditDate: '01-06-2026',
    },
    'IT Support': {
        departmentHead: 'Mr. Arjun Mehta',
        coordinator: 'Ms. Neha Gupta',
        location: 'IT Server Room & Helpdesk',
        frequency: 'Quarterly',
        previousScore: 91,
        previousAuditDate: '05-05-2026',
    },
    Canteen: {
        departmentHead: 'Mr. Ramesh Iyer',
        coordinator: 'Ms. Sunita Das',
        location: 'Canteen Building',
        frequency: 'Monthly',
        previousScore: 74,
        previousAuditDate: '08-05-2026',
    },
    Housekeeping: {
        departmentHead: 'Mr. Ganesh Pillai',
        coordinator: 'Ms. Lakshmi Devi',
        location: 'Main Academic Block',
        frequency: 'Monthly',
        previousScore: 81,
        previousAuditDate: '12-05-2026',
    },
    Store: {
        departmentHead: 'Mr. Mohan Das',
        coordinator: 'Mr. Ajay Kumar',
        location: 'Store Room — Ground Floor',
        frequency: 'Quarterly',
        previousScore: 86,
        previousAuditDate: '15-04-2026',
    },
}

const DEFAULT_CHECKLIST_SECTIONS = [
    {
        id: 'section-classroom',
        title: 'Classroom Cleanliness',
        parameters: [
            { id: 'cls-01', label: 'Classroom Clean', responseType: 'yes_no', referenceSop: 'HK-SOP-001' },
            { id: 'cls-02', label: 'Board Clean', responseType: 'yes_no', referenceSop: 'HK-SOP-001' },
            { id: 'cls-03', label: 'Projector Working', responseType: 'yes_no', referenceSop: 'IT-SOP-014' },
            { id: 'cls-04', label: 'Lights Working', responseType: 'yes_no', referenceSop: 'FAC-SOP-008' },
            { id: 'cls-05', label: 'Fan Working', responseType: 'yes_no', referenceSop: 'FAC-SOP-008' },
            { id: 'cls-06', label: 'Dustbin Clean', responseType: 'yes_no', referenceSop: 'HK-SOP-001' },
        ],
    },
    {
        id: 'section-safety',
        title: 'Safety & Equipment',
        parameters: [
            { id: 'saf-01', label: 'Fire Extinguisher Accessible', responseType: 'pass_fail', referenceSop: 'SAF-SOP-003' },
            { id: 'saf-02', label: 'Emergency Exit Clear', responseType: 'pass_fail', referenceSop: 'SAF-SOP-003' },
            { id: 'saf-03', label: 'First Aid Kit Stock Level', responseType: 'scale', referenceSop: 'SAF-SOP-005' },
            { id: 'saf-04', label: 'Electrical Panel Condition', responseType: 'dropdown', referenceSop: 'FAC-SOP-012', dropdownOptions: ['Good', 'Fair', 'Poor', 'Not Applicable'] },
        ],
    },
    {
        id: 'section-documentation',
        title: 'Documentation & Records',
        parameters: [
            { id: 'doc-01', label: 'Attendance Register Updated', responseType: 'checkbox', referenceSop: 'ACD-SOP-021' },
            { id: 'doc-02', label: 'Visitor Log Count (Today)', responseType: 'number', referenceSop: 'SEC-SOP-004' },
            { id: 'doc-03', label: 'Last Maintenance Date', responseType: 'date', referenceSop: 'FAC-SOP-008' },
            { id: 'doc-04', label: 'Inspection Time Logged', responseType: 'time', referenceSop: 'AUD-SOP-001' },
            { id: 'doc-05', label: 'Supervisor Name on Record', responseType: 'text', referenceSop: 'ACD-SOP-021' },
            { id: 'doc-06', label: 'Additional Notes', responseType: 'textarea', referenceSop: 'AUD-SOP-001' },
            { id: 'doc-07', label: 'Area Photo Evidence', responseType: 'photo', referenceSop: 'AUD-SOP-002' },
            { id: 'doc-08', label: 'Signed Checklist Copy', responseType: 'document', referenceSop: 'AUD-SOP-002' },
        ],
    },
]

const AUDIT_TEMPLATES = {
    default: DEFAULT_CHECKLIST_SECTIONS,
    Transport: [
        {
            id: 'section-transport-fleet',
            title: 'Fleet & Vehicle Safety',
            parameters: [
                { id: 'trn-01', label: 'Vehicle Fitness Certificate Valid', responseType: 'yes_no', referenceSop: 'SAF-SOP-003' },
                { id: 'trn-02', label: 'Fire Extinguisher in Bus', responseType: 'pass_fail', referenceSop: 'SAF-SOP-003' },
                { id: 'trn-03', label: 'Driver License Verified', responseType: 'yes_no', referenceSop: 'AUD-SOP-001' },
                { id: 'trn-04', label: 'Trip Log Maintained', responseType: 'pass_fail', referenceSop: 'AUD-SOP-001' },
            ],
        },
        {
            id: 'section-transport-ops',
            title: 'Transport Operations',
            parameters: [
                { id: 'trn-05', label: 'Route Compliance Score', responseType: 'scale', referenceSop: 'AUD-SOP-001' },
                { id: 'trn-06', label: 'GPS Tracking Active', responseType: 'yes_no', referenceSop: 'IT-SOP-014' },
            ],
        },
    ],
    Library: [
        {
            id: 'section-library',
            title: 'Library Standards',
            parameters: [
                { id: 'lib-01', label: 'Catalog System Updated', responseType: 'yes_no', referenceSop: 'ACD-SOP-021' },
                { id: 'lib-02', label: 'Issue/Return Register', responseType: 'pass_fail', referenceSop: 'ACD-SOP-021' },
                { id: 'lib-03', label: 'Reading Area Cleanliness', responseType: 'yes_no', referenceSop: 'HK-SOP-001' },
            ],
        },
    ],
    'IT Support': [
        {
            id: 'section-it',
            title: 'IT Infrastructure',
            parameters: [
                { id: 'it-01', label: 'Backup Completed (Last 24h)', responseType: 'yes_no', referenceSop: 'IT-SOP-014' },
                { id: 'it-02', label: 'Access Control Policy Compliance', responseType: 'pass_fail', referenceSop: 'AUD-SOP-001' },
                { id: 'it-03', label: 'Server Room Temperature Log', responseType: 'number', referenceSop: 'FAC-SOP-008' },
            ],
        },
    ],
    Housekeeping: [
        {
            id: 'section-housekeeping',
            title: 'Housekeeping Standards',
            parameters: [
                { id: 'hk-01', label: 'Corridor Cleanliness', responseType: 'yes_no', referenceSop: 'HK-SOP-001' },
                { id: 'hk-02', label: 'Restroom Hygiene Score', responseType: 'scale', referenceSop: 'HK-SOP-001' },
                { id: 'hk-03', label: 'Cleaning Schedule Displayed', responseType: 'pass_fail', referenceSop: 'HK-SOP-001' },
            ],
        },
    ],
    Finance: [
        {
            id: 'section-finance',
            title: 'Financial Controls',
            parameters: [
                { id: 'fin-01', label: 'Petty Cash Reconciled', responseType: 'yes_no', referenceSop: 'AUD-SOP-001' },
                { id: 'fin-02', label: 'Voucher Authorization', responseType: 'pass_fail', referenceSop: 'AUD-SOP-001' },
                { id: 'fin-03', label: 'Bank Reconciliation Status', responseType: 'dropdown', referenceSop: 'AUD-SOP-001', dropdownOptions: ['Good', 'Fair', 'Poor', 'Not Applicable'] },
            ],
        },
    ],
    Canteen: [
        {
            id: 'section-canteen',
            title: 'Food Safety & Hygiene',
            parameters: [
                { id: 'cnt-01', label: 'Kitchen Cleanliness', responseType: 'yes_no', referenceSop: 'HK-SOP-001' },
                { id: 'cnt-02', label: 'Food Storage Temperature Log', responseType: 'pass_fail', referenceSop: 'SAF-SOP-005' },
                { id: 'cnt-03', label: 'Staff Hygiene Compliance', responseType: 'scale', referenceSop: 'SAF-SOP-003' },
            ],
        },
    ],
}

const TEMPLATE_STORAGE_KEY = 'process-auditor-audit-templates'
const STORAGE_KEY = 'process-auditor-execute-audit-draft'

export const DEFAULT_AUDIT_HEADER = {
    auditNumber: 'AUD-PA-2026-041',
    auditName: 'Classroom Cleanliness & Facilities Audit',
    department: 'Academic',
    campus: 'Main Campus',
    building: 'Academic Block A',
    floor: '2nd Floor',
    area: 'Classrooms 10-A to 10-C',
    auditorName: 'Rajesh Kumar',
    auditDate: '10-06-2026',
    auditTime: '09:30 AM',
    version: 'v1.2',
    templateName: 'Academic Audit Checklist',
    templateVersion: '1.2',
    status: 'In Progress',
}

export const getStoredTemplates = () => {
    try {
        const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY)
        if (stored) return { ...AUDIT_TEMPLATES, ...JSON.parse(stored) }
    } catch {
        /* ignore */
    }
    return AUDIT_TEMPLATES
}

export const loadChecklistSections = (audit) => {
    const templates = getStoredTemplates()
    if (!audit) return templates.default

    const byDepartment = templates[audit.department]
    if (byDepartment) return byDepartment

    const byType = templates[audit.auditType]
    if (byType) return byType

    return templates.default
}

export const getDepartmentInfo = (department) =>
    DEPARTMENT_INFO[department] ?? {
        departmentHead: '—',
        coordinator: '—',
        location: '—',
        frequency: 'Monthly',
        previousScore: 80,
        previousAuditDate: '—',
    }

export const emptyStructuredRecommendations = () => ({
    immediateAction: '',
    preventiveAction: '',
    followUpRequired: '',
    finalRecommendation: '',
})

const migrateRecommendations = (rec) => {
    if (!rec || typeof rec === 'string') {
        return { ...emptyStructuredRecommendations(), finalRecommendation: rec ?? '' }
    }
    return { ...emptyStructuredRecommendations(), ...rec }
}

export const isResponseAnswered = (_responseType, value) =>
    CHECKLIST_RESPONSE_OPTIONS.includes(value)

export const computeProgress = (sections, responses) => {
    let total = 0
    let answered = 0

    sections.forEach((section) => {
        section.parameters.forEach((param) => {
            total += 1
            const response = responses[param.id]?.response
            if (isResponseAnswered(param.responseType, response)) answered += 1
        })
    })

    return {
        total,
        answered,
        unanswered: total - answered,
        progressPercent: total ? Math.round((answered / total) * 100) : 0,
    }
}

export const getUnansweredQuestions = (sections, responses) => {
    const unanswered = []
    sections.forEach((section) => {
        section.parameters.forEach((param) => {
            const response = responses[param.id]?.response
            if (!isResponseAnswered(param.responseType, response)) {
                unanswered.push({ sectionId: section.id, sectionTitle: section.title, parameter: param })
            }
        })
    })
    return unanswered
}

export const getParameterVisualStatus = (parameter, value, observation) => {
    const result = getScoreResult(parameter.responseType, value?.response)

    if (result === 'pass') return 'passed'
    if (result === 'partial') return 'partial'
    if (result !== 'fail') return 'pending'

    const priority = observation?.priority ?? value?.severity
    if (priority === 'Critical') return 'critical'
    if (priority === 'High') return 'high'
    if (priority === 'Medium') return 'medium'
    return 'failed'
}

export const countSectionFindings = (section, responses, observations) => {
    let count = 0
    section.parameters.forEach((param) => {
        if (isNonCompliant(param.responseType, responses[param.id]?.response)) count += 1
    })
    const obsInSection = observations.filter((obs) => obs.sectionTitle === section.title).length
    return Math.max(count, obsInSection)
}

export const buildSectionStats = (sections, responses, observations) => {
    const stats = {}
    sections.forEach((section) => {
        const answered = section.parameters.filter((p) =>
            isResponseAnswered(p.responseType, responses[p.id]?.response),
        ).length
        stats[section.id] = {
            total: section.parameters.length,
            answered,
            findings: countSectionFindings(section, responses, observations),
        }
    })
    return stats
}

export const buildHeaderFromAudit = (audit) => {
    const [building = audit.location, area = ''] = (audit.location ?? '').split('—').map((part) => part.trim())
    const deptInfo = getDepartmentInfo(audit.department)

    return {
        auditId: audit.id,
        auditNumber: audit.auditId,
        auditName: audit.auditName,
        department: audit.department,
        campus: 'Main Campus',
        building,
        floor: area ? 'Ground Floor' : '—',
        area: area || building,
        auditorName: 'Rajesh Kumar',
        auditDate: audit.scheduledDate,
        auditTime: '09:30 AM',
        version: 'v1.0',
        templateName: `${audit.department} Audit Checklist`,
        templateVersion: '1.2',
        status: audit.status === 'Pending' || audit.status === 'Overdue' ? 'Assigned' : 'In Progress',
        frequency: audit.frequency ?? deptInfo.frequency,
    }
}

export const emptyEvidence = () => ({
    photo: '',
    file: '',
    video: '',
    url: '',
})

export const emptyParameterValue = () => ({
    response: '',
    comments: '',
    evidence: emptyEvidence(),
    severity: '',
    remarks: '',
})

export const buildEmptyResponses = (sections) => {
    const responses = {}
    sections.forEach((section) => {
        section.parameters.forEach((param) => {
            responses[param.id] = emptyParameterValue()
        })
    })
    return responses
}

export const buildDefaultTimeline = (auditDate = '10-06-2026') => [
    { stage: 'Assigned', date: auditDate, time: '08:00 AM', done: true },
    { stage: 'Started', date: auditDate, time: '09:15 AM', done: true },
    { stage: 'Saved Draft', date: '', time: '', done: false },
    { stage: 'Submitted', date: '', time: '', done: false },
    { stage: 'Verified', date: '', time: '', done: false },
    { stage: 'Closed', date: '', time: '', done: false },
]

export const formatNow = () => {
    const now = new Date()
    const date = now.toLocaleDateString('en-GB').replace(/\//g, '-')
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    return { date, time }
}

export const markTimelineStage = (timeline, stage) => {
    const { date, time } = formatNow()
    return timeline.map((item) =>
        item.stage === stage ? { ...item, date, time, done: true } : item,
    )
}

export const emptyObservation = (parameter, sectionTitle, auditReference = '') => ({
    id: `obs-${Date.now()}`,
    parameterId: parameter.id,
    parameterLabel: parameter.label,
    sectionTitle,
    title: parameter.label,
    description: '',
    priority: 'Medium',
    assignTo: '',
    reportTo: '',
    observationNumber: '',
    auditReference,
    assignedDate: '',
    status: '',
    evidence: emptyEvidence(),
    saved: false,
    submitted: false,
    createdAt: new Date().toISOString(),
})

export const migrateObservation = (obs, auditReference = '') => ({
    ...emptyObservation(
        { id: obs.parameterId, label: obs.parameterLabel ?? obs.title ?? '' },
        obs.sectionTitle ?? '',
        obs.auditReference || auditReference,
    ),
    ...obs,
    title: obs.title || obs.parameterLabel || '',
    reportTo: obs.reportTo || resolveReportTo(obs.assignTo),
    auditReference: obs.auditReference || auditReference,
})

const migrateResponses = (responses, sections) => {
    const empty = buildEmptyResponses(sections)
    const migrated = { ...empty }

    Object.keys(empty).forEach((id) => {
        const existing = responses?.[id]
        if (!existing) return

        migrated[id] = {
            ...emptyParameterValue(),
            ...existing,
            evidence: typeof existing.evidence === 'string'
                ? { ...emptyEvidence(), url: existing.evidence }
                : { ...emptyEvidence(), ...existing.evidence },
        }
    })

    return migrated
}

export const loadExecuteAuditDraft = (auditId) => {
    const audit = auditId ? getAuditById(auditId) : null
    const header = audit ? buildHeaderFromAudit(audit) : DEFAULT_AUDIT_HEADER
    const sections = loadChecklistSections(audit)

    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            const sameAudit = !auditId || parsed.header?.auditId === auditId || parsed.header?.auditNumber === audit?.auditId
            if (sameAudit) {
                const mergedSections = parsed.sections ?? sections
                return {
                    ...parsed,
                    sections: mergedSections,
                    header: { ...header, ...parsed.header, auditId: header.auditId },
                    responses: migrateResponses(parsed.responses, mergedSections),
                    timeline: parsed.timeline ?? buildDefaultTimeline(header.auditDate),
                    observations: (parsed.observations ?? []).map((obs) =>
                        migrateObservation(obs, header.auditNumber),
                    ),
                    recommendations: migrateRecommendations(parsed.recommendations),
                    lastSavedAt: parsed.lastSavedAt ?? null,
                }
            }
        }
    } catch {
        /* ignore */
    }

    return {
        header,
        sections,
        responses: buildEmptyResponses(sections),
        observations: [],
        timeline: buildDefaultTimeline(header.auditDate),
        recommendations: emptyStructuredRecommendations(),
        generalRemarks: '',
        lastSavedAt: null,
    }
}

export const saveExecuteAuditDraft = (draft) => {
    const payload = { ...draft, lastSavedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return payload
}

export const getScoreResult = (_responseType, value) => {
    if (value === 'Yes') return 'pass'
    if (value === 'No' || value === 'Error') return 'fail'
    return 'na'
}

export const isNonCompliant = (_responseType, value) => value === 'No' || value === 'Error'

export const computeScores = (sections, responses) => {
    let passed = 0
    let failed = 0
    let na = 0
    let partial = 0

    sections.forEach((section) => {
        section.parameters.forEach((param) => {
            const value = responses[param.id]?.response ?? ''
            const result = getScoreResult(param.responseType, value)

            if (result === 'pass') passed += 1
            else if (result === 'fail') failed += 1
            else if (result === 'partial') partial += 1
            else na += 1
        })
    })

    const scorable = passed + failed + partial
    const overallCompliance = scorable
        ? Math.round(((passed + partial * 0.5) / scorable) * 100)
        : 0

    return { passed, failed, na, partial, overallCompliance }
}

export const computeFindings = (sections, responses, observations) => {
    const scores = computeScores(sections, responses)

    let yes = 0
    let no = 0
    let error = 0

    sections.forEach((section) => {
        section.parameters.forEach((param) => {
            const response = responses[param.id]?.response
            if (response === 'Yes') yes += 1
            else if (response === 'No') no += 1
            else if (response === 'Error') error += 1
        })
    })

    const criticalAnswered = observations.filter(
        (obs) => obs.priority === 'Critical' && (obs.submitted || (obs.saved && obs.title?.trim())),
    ).length

    return {
        ...scores,
        totalFindings: no + error,
        yes,
        no,
        criticalAnswered,
        observationsRaised: observations.length,
    }
}

export const getStatusProgressIndex = (status) => {
    const index = AUDIT_STATUS_STAGES.indexOf(status)
    return index >= 0 ? index : 1
}

export const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Not saved yet'
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'Just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin === 1) return '1 minute ago'
    if (diffMin < 60) return `${diffMin} minutes ago`
    const diffHr = Math.floor(diffMin / 60)
    return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`
}

export const getSopDetails = (code) =>
    SOP_LIBRARY[code] ?? {
        code,
        title: code,
        objective: 'Standard operating procedure reference for this audit parameter.',
        procedure: 'Follow the documented procedure for this area during inspection.',
        reference: 'Process Audit SOP Library',
        expectedResult: 'Compliance with institutional standards.',
    }
