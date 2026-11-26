import { SECTIONS, SUBJECTS, getClasses } from '../../Pages/Teacher/AssignedClass/assignedClassData.js'
import { liveArray } from '../RBAC/liveArray.js'
import { appendApprovalDecision } from '../approvals/approvalHistory.js'

const STORAGE_KEY = 'school-erp-lesson-plan-approvals'

export const TEACHER_NAME = 'Mr. Anil Kumar'
export const TEACHER_ROLE = 'Teacher'
export const COORDINATOR_NAME = 'Ms. Priya Nair'
export const COORDINATOR_ROLE = 'Coordinator'

export const SUBJECT_OPTIONS = SUBJECTS
export const getClassOptions = () => getClasses().map((item) => `Grade ${item}`)
export const CLASS_OPTIONS = liveArray(() => getClasses().map((item) => `Grade ${item}`))
export const SECTION_OPTIONS = SECTIONS

export const ACADEMIC_YEAR_OPTIONS = ['2026-27', '2024-2025', '2025-2026', '2026-2027']
export const MONTH_OPTIONS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

export const APPROVAL_STATUSES = ['Draft', 'Pending', 'Coordinator Reviewed', 'Principal Approved', 'Approved', 'Rejected']
export const TRACK_STATUSES = ['On Track', 'Behind Schedule', 'Completed']
export const SUBMITTER_ROLES = ['Teacher', 'Coordinator']

export const approvalStatusColor = {
    Draft: 'bg-[#64748B33] text-[#64748B]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    'Coordinator Reviewed': 'bg-[#2196F333] text-[#2196F3]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

export const approvalStatusBarColor = {
    Draft: '#64748B',
    Pending: '#FF9800',
    'Coordinator Reviewed': '#2196F3',
    Approved: '#4CAF50',
    Rejected: '#FF0000',
}

export const trackStatusColor = {
    'On Track': 'bg-[#4CAF5033] text-[#4CAF50]',
    'Behind Schedule': 'bg-[#FF980033] text-[#FF9800]',
    Completed: 'bg-[#2196F333] text-[#2196F3]',
}

export const markAsDoneBarColor = {
    Done: '#4CAF50',
    Pending: '#2196F3',
}

let _memoryPlans = null

const DEFAULT_LESSON_PLANS = [
    {
        id: 'LP-001',
        subject: 'Mathematics',
        submitterName: 'Mr. Anil Kumar',
        submitterRole: 'Teacher',
        className: 'Grade 10',
        section: 'A',
        title: 'Quadratic Equations & Complex Roots',
        description: 'Comprehensive study of quadratic expressions, factoring, and the quadratic formula.',
        approvalStatus: 'Pending',
        trackStatus: 'On Track',
        academicYear: '2026-27',
        month: 'September',
        weekNo: '1',
        submittedAt: '01-09-2026 10:00 AM',
        planningRows: [
            { day: 'Day 1', mainConcepts: 'Standard Form of Quadratic Equation', teachingMethod: 'Lecture & Board work', evaluationMethod: 'Classwork quiz' },
            { day: 'Day 2', mainConcepts: 'Factorisation method', teachingMethod: 'Interactive solving', evaluationMethod: 'Homework sheet' }
        ],
        approvalHistory: []
    }
]

export const getLessonPlans = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return JSON.parse(stored)
    } catch {
        /* ignore */
    }
    if (_memoryPlans && Array.isArray(_memoryPlans) && _memoryPlans.length > 0) {
        return _memoryPlans
    }
    _memoryPlans = DEFAULT_LESSON_PLANS.map((p) => ({ ...p }))
    return _memoryPlans
}

export const saveLessonPlans = (plans) => {
    _memoryPlans = plans
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
        }
    } catch {
        /* ignore */
    }
}

export const formatSubmittedAt = () => {
    const now = new Date()
    const date = now.toLocaleDateString('en-GB').replace(/\//g, '-')
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${date} ${time}`
}

export const formatPlanDate = (value) => {
    if (!value) return ''
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('en-GB').replace(/\//g, '-')
}

const buildLessonPlanRecord = (plans, payload, submittedAt) => {
    const nextNumber = plans.reduce((max, item) => {
        const match = item.id.match(/^LP-(\d+)$/)
        return match ? Math.max(max, Number(match[1])) : max
    }, 0) + 1

    const planningRows = Array.isArray(payload.planningRows) ? payload.planningRows : []
    const chapterName = (payload.chapterName || payload.title || '').trim()
    const description = (payload.description || planningRows.map((row) => row.mainConcepts).filter(Boolean).join('; ') || chapterName).trim()
    return {
        id: `LP-${String(nextNumber).padStart(3, '0')}`,
        subject: payload.subject,
        submitterName: payload.submitterName,
        submitterRole: payload.submitterRole,
        className: payload.className,
        section: payload.section,
        title: chapterName || `Week ${payload.weekNo || ''}`.trim(),
        academicYear: payload.academicYear ?? '',
        month: payload.month ?? '',
        weekNo: payload.weekNo ?? '',
        numberOfSessions: payload.numberOfSessions ?? '',
        chapterName,
        planningRows,
        specialAttention: payload.specialAttention ?? '',
        classroomSetup: payload.classroomSetup ?? '',
        teacherNotes: payload.teacherNotes ?? '',
        reflection: payload.reflection ?? '',
        subjectMentor: payload.subjectMentor ?? '',
        evaluator: payload.evaluator ?? '',
        coordinatorSignoff: payload.coordinatorSignoff ?? '',
        sdgPlanned: payload.sdgPlanned ?? '',
        sdcPlanned: payload.sdcPlanned ?? '',
        worksheetsPlanned: payload.worksheetsPlanned ?? '',
        description,
        fromDate: payload.fromDate,
        toDate: payload.toDate,
        submittedAt,
        approvalStatus: 'Pending',
        approvalHistory: appendApprovalDecision([], {
            status: 'Submitted',
            actor: payload.submitterName || payload.submitterRole || 'Academic staff',
            actorRole: payload.submitterRole || '',
            remarks: 'Submitted for Director review.',
            decidedAt: new Date().toISOString(),
        }),
        trackStatus: 'On Track',
        markAsDone: false,
        attachment: payload.attachment || '',
    }
}

export const addLessonPlan = (payload) => {
    const plans = getLessonPlans()
    const submittedAt = formatSubmittedAt()
    const record = buildLessonPlanRecord(plans, payload, submittedAt)
    const updated = [record, ...plans]
    saveLessonPlans(updated)
    return record
}

export const addLessonPlans = (payloads) => {
    if (!payloads.length) return []

    const plans = getLessonPlans()
    const submittedAt = formatSubmittedAt()
    const records = []
    let workingPlans = [...plans]

    payloads.forEach((payload) => {
        const record = buildLessonPlanRecord(workingPlans, payload, submittedAt)
        records.push(record)
        workingPlans = [record, ...workingPlans]
    })

    saveLessonPlans(workingPlans)
    return records
}

export const updateLessonPlanStatus = (id, approvalStatus, decision = {}) => {
    const plans = getLessonPlans()
    const updated = plans.map((item) => {
        if (item.id !== id) return item
        const options = typeof decision === 'string' ? { remarks: decision } : decision
        const decidedAt = options.decidedAt || new Date().toISOString()
        const approvalHistory = appendApprovalDecision(getLessonPlanApprovalHistory(item), {
            status: approvalStatus,
            actor: options.actor || 'Director',
            actorRole: options.actorRole || 'Director',
            remarks: options.remarks || '',
            decidedAt,
        })
        if (approvalStatus === 'Approved') {
            return { ...item, approvalStatus, trackStatus: 'Completed', approvalHistory, updatedAt: decidedAt }
        }
        return { ...item, approvalStatus, approvalHistory, rejectionReason: options.remarks || '', updatedAt: decidedAt }
    })
    saveLessonPlans(updated)
    return updated
}

export const getSummaryCounts = (plans) => ({
    pendingApprovals: plans.filter((item) => item.approvalStatus === 'Pending').length,
    onTrack: plans.filter((item) => item.trackStatus === 'On Track').length,
    behindSchedule: plans.filter((item) => item.trackStatus === 'Behind Schedule').length,
    completed: plans.filter((item) => item.trackStatus === 'Completed').length,
})

export const getLessonPlansBySubmitter = (submitterName) =>
    getLessonPlans().filter((item) => item.submitterName === submitterName)

export const getLessonPlanApprovalHistory = (plan) => {
    if (!plan) return []
    if (Array.isArray(plan.approvalHistory) && plan.approvalHistory.length) {
        return plan.approvalHistory
    }

    let history = appendApprovalDecision([], {
        status: 'Submitted',
        actor: plan.submitterName || 'Academic staff',
        actorRole: plan.submitterRole || '',
        remarks: 'Submitted for Director review.',
        decidedAt: plan.submittedAt,
    })
    if (plan.approvalStatus === 'Approved' || plan.approvalStatus === 'Rejected') {
        history = appendApprovalDecision(history, {
            status: plan.approvalStatus,
            actor: 'Director',
            actorRole: 'Director',
            remarks: plan.rejectionReason || (plan.approvalStatus === 'Rejected' ? 'Rejected before rationale tracking was enabled.' : ''),
            decidedAt: plan.updatedAt,
        })
    }
    return history
}

export const getApprovedLessonPlansBySubmitter = (submitterName) =>
    getLessonPlans().filter(
        (item) => item.submitterName === submitterName && item.approvalStatus === 'Approved'
    )

export const markLessonPlanAsDone = (id, completionRemarks = '') => {
    const plans = getLessonPlans()
    const updated = plans.map((item) =>
        item.id === id
            ? {
                ...item,
                markAsDone: true,
                trackStatus: 'Completed',
                completionRemarks: completionRemarks.trim(),
            }
            : item
    )
    saveLessonPlans(updated)
    return updated
}

export const emptyLessonPlanFilters = {
    search: '',
    subject: '',
    className: '',
    section: '',
    approvalStatus: '',
    trackStatus: '',
    submitterRole: '',
    fromDate: null,
    toDate: null,
}

const parseSubmittedAt = (value) => {
    if (!value) return null
    const [datePart] = value.split(' ')
    const [day, month, year] = datePart.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const filterLessonPlans = (plans, filters) => {
    const search = filters.search.trim().toLowerCase()
    const fromDate = filters.fromDate
    const toDate = filters.toDate

    return plans.filter((record) => {
        if (filters.subject && record.subject !== filters.subject) return false
        if (filters.className && record.className !== filters.className) return false
        if (filters.section && record.section !== filters.section) return false
        if (filters.approvalStatus && record.approvalStatus !== filters.approvalStatus) return false
        if (filters.trackStatus && record.trackStatus !== filters.trackStatus) return false
        if (filters.submitterRole && record.submitterRole !== filters.submitterRole) return false

        if (search) {
            const haystack = `${record.id} ${record.subject} ${record.submitterName} ${record.title ?? ''} ${record.description} ${record.className} ${record.section} ${record.fromDate ?? ''} ${record.toDate ?? ''}`.toLowerCase()
            if (!haystack.includes(search)) return false
        }

        const submitted = parseSubmittedAt(record.submittedAt)
        if (fromDate && submitted) {
            const start = new Date(fromDate)
            start.setHours(0, 0, 0, 0)
            if (submitted < start) return false
        }
        if (toDate && submitted) {
            const end = new Date(toDate)
            end.setHours(23, 59, 59, 999)
            if (submitted > end) return false
        }

        return true
    })
}

export const getActiveFilterLabels = (filters) => {
    const labels = []
    if (filters.subject) labels.push(`Subject: ${filters.subject}`)
    if (filters.className) labels.push(`Class: ${filters.className}`)
    if (filters.section) labels.push(`Section: ${filters.section}`)
    if (filters.approvalStatus) labels.push(`Status: ${filters.approvalStatus}`)
    if (filters.trackStatus) labels.push(`Track: ${filters.trackStatus}`)
    if (filters.submitterRole) labels.push(`Role: ${filters.submitterRole}`)
    if (filters.search.trim()) labels.push(`Search: ${filters.search.trim()}`)
    if (filters.fromDate || filters.toDate) labels.push('Date range applied')
    return labels
}

export const buildLessonPlanGroupKey = (submitterName, subject) =>
    `${submitterName}::${subject}`

export const buildLessonPlanGroupHref = (routePrefix, submitterName, subject, variant = 'submissions') => {
    const encodedTeacher = encodeURIComponent(submitterName)
    const encodedSubject = encodeURIComponent(subject)
    if (variant === 'mark-as-done') {
        return `${routePrefix}/lesson-plan/my-lesson-plan/group/${encodedTeacher}/${encodedSubject}`
    }
    return `${routePrefix}/lesson-plan-approval/group/${encodedTeacher}/${encodedSubject}`
}

export const getGroupApprovalStatusSummary = (plans) => {
    const counts = { Pending: 0, Approved: 0, Rejected: 0 }
    plans.forEach((plan) => {
        counts[plan.approvalStatus] = (counts[plan.approvalStatus] ?? 0) + 1
    })

    const parts = []
    if (counts.Pending) parts.push(`${counts.Pending} Pending`)
    if (counts.Approved) parts.push(`${counts.Approved} Approved`)
    if (counts.Rejected) parts.push(`${counts.Rejected} Rejected`)

    return {
        counts,
        label: parts.join(', ') || '—',
        dominantStatus:
            counts.Pending > 0
                ? 'Pending'
                : counts.Rejected > 0
                  ? 'Rejected'
                  : counts.Approved > 0
                    ? 'Approved'
                    : '—',
    }
}

export const getGroupMarkAsDoneSummary = (plans) => {
    const doneCount = plans.filter((plan) => plan.markAsDone).length
    const total = plans.length
    const pendingCount = total - doneCount

    let label = 'Pending'
    if (doneCount === total && total > 0) label = 'All Done'
    else if (doneCount > 0) label = `${doneCount} Done, ${pendingCount} Pending`

    return { doneCount, pendingCount, total, label }
}

export const groupLessonPlansByTeacherSubject = (plans) => {
    const groupMap = new Map()

    plans.forEach((plan) => {
        const key = buildLessonPlanGroupKey(plan.submitterName, plan.subject)
        if (!groupMap.has(key)) {
            groupMap.set(key, {
                key,
                submitterName: plan.submitterName,
                submitterRole: plan.submitterRole,
                subject: plan.subject,
                plans: [],
            })
        }
        groupMap.get(key).plans.push(plan)
    })

    return Array.from(groupMap.values())
        .map((group) => {
            const approvalSummary = getGroupApprovalStatusSummary(group.plans)
            const markAsDoneSummary = getGroupMarkAsDoneSummary(group.plans)
            const latestSubmittedAt = group.plans.reduce((latest, plan) => {
                if (!latest) return plan.submittedAt
                return plan.submittedAt > latest ? plan.submittedAt : latest
            }, '')

            return {
                ...group,
                planCount: group.plans.length,
                approvalSummary,
                markAsDoneSummary,
                latestSubmittedAt,
            }
        })
        .sort((a, b) => {
            const subjectCompare = a.subject.localeCompare(b.subject)
            if (subjectCompare !== 0) return subjectCompare
            return a.submitterName.localeCompare(b.submitterName)
        })
}

export const getLessonPlansForGroup = (submitterName, subject, sourcePlans) =>
    sourcePlans.filter(
        (plan) => plan.submitterName === submitterName && plan.subject === subject
    )

export const parsePlanDateString = (value) => {
    if (!value) return null
    const [day, month, year] = value.split('-').map(Number)
    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
}

export const getFilterChipItems = (filters) => {
    const items = []
    if (filters.search.trim()) {
        items.push({ key: 'search', label: `Search: ${filters.search.trim()}` })
    }
    if (filters.subject) items.push({ key: 'subject', label: `Subject: ${filters.subject}` })
    if (filters.className) items.push({ key: 'className', label: `Class: ${filters.className}` })
    if (filters.section) items.push({ key: 'section', label: `Section: ${filters.section}` })
    if (filters.approvalStatus) items.push({ key: 'approvalStatus', label: `Status: ${filters.approvalStatus}` })
    if (filters.trackStatus) items.push({ key: 'trackStatus', label: `Track: ${filters.trackStatus}` })
    if (filters.submitterRole) items.push({ key: 'submitterRole', label: `Role: ${filters.submitterRole}` })
    if (filters.fromDate || filters.toDate) items.push({ key: 'dateRange', label: 'Date range' })
    return items
}

export const clearFilterChip = (filters, chipKey) => {
    if (chipKey === 'dateRange') {
        return { ...filters, fromDate: null, toDate: null }
    }
    if (chipKey === 'search') {
        return { ...filters, search: '' }
    }
    return { ...filters, [chipKey]: '' }
}


export const advanceLessonPlanTier = ({ id, decision, actor, actorRole, remarks }) => {
    const plans = getLessonPlans()
    const target = plans.find((p) => p.id === id)
    if (!target) throw new Error(`Lesson plan not found: ${id}`)

    let nextStatus = 'Approved'
    if (decision === 'Rejected') {
        nextStatus = 'Rejected'
    } else {
        const current = target.approvalStatus
        if (current === 'Pending' || current === 'Draft') {
            nextStatus = 'Coordinator Reviewed'
        } else if (current === 'Coordinator Reviewed') {
            nextStatus = 'Principal Approved'
        } else {
            nextStatus = 'Approved'
        }
    }

    return updateLessonPlanStatus(id, nextStatus, {
        actor,
        actorRole,
        remarks
    })
}
