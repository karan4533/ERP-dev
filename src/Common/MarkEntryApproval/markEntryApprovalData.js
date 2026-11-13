import { CLASSES, SECTIONS, SUBJECTS } from '../../Pages/Teacher/AssignedClass/assignedClassData.js'
import { getStudentsList } from '../../Pages/Teacher/StudentsList/studentsListData.js'
import { PARENT_CHILD_PROFILES } from '../../Pages/Parent/parentStudentProfiles.js'
import { appendApprovalDecision } from '../approvals/approvalHistory.js'

export { CLASSES, SECTIONS, SUBJECTS }

export const ACADEMIC_YEARS = ['2026 - 2027', '2025 - 2026']
export const TERMS = ['Term 1', 'Term 2', 'Term 3']

export const EXAM_OPTIONS = [
    { name: 'Mid Term', maxMarks: 100 },
    { name: 'Continuous Assessment 1 (CA-1)', maxMarks: 50 },
    { name: 'Continuous Assessment 2 (CA-2)', maxMarks: 50 },
    { name: 'Periodic Continuous Assessment (PCA)', maxMarks: 50 },
    { name: 'Unit Test', maxMarks: 50 },
    { name: 'Annual Examination', maxMarks: 100 },
    { name: 'Pre-Board Examination', maxMarks: 100 },
]

export const STATUS_FILTERS = ['All', 'Pending', 'Entered', 'Absent']
export const APPROVAL_STATUSES = ['Pending', 'Coordinator Reviewed', 'Principal Approved', 'Approved', 'Rejected']

export const PASS_MARK_PERCENT = 33

const STORAGE_KEY = 'teacher-mark-entry-sessions'

/** Optional aliases for parent-portal student IDs (empty after Academics wipe). */
const STUDENT_MARK_ID_ALIASES = {}

export const resolveStudentIdForMarks = (studentId) =>
    STUDENT_MARK_ID_ALIASES[studentId] ?? studentId

const getEncouragementName = (studentId) => {
    const parentProfile = PARENT_CHILD_PROFILES[studentId]
    if (parentProfile?.name) return parentProfile.name.split(' ')[0]

    const resolvedId = resolveStudentIdForMarks(studentId)
    const student = getStudentsList().find((item) => item.id === resolvedId)
    return student?.name?.split(' ')[0] ?? 'Student'
}

export const formatClassLabel = (className) => `Grade ${className}`

export const approvalStatusColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    'Coordinator Reviewed': 'bg-[#00BCD433] text-[#00BCD4]',
    'Principal Approved': 'bg-[#3F51B533] text-[#3F51B5]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

export const getGradeFromPercentage = (percentage) => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C'
    if (percentage >= PASS_MARK_PERCENT) return 'D'
    return 'F'
}

export const computeMarkEntry = ({ obtainedMarks, maxMarks, absent }) => {
    if (absent) {
        return { grade: '—', percentage: null, displayPercent: '—', result: 'Absent' }
    }

    if (obtainedMarks === null || obtainedMarks === '' || Number.isNaN(Number(obtainedMarks))) {
        return { grade: '—', percentage: null, displayPercent: '—', result: '—' }
    }

    const obtained = Number(obtainedMarks)
    const percentage = (obtained / maxMarks) * 100
    const grade = getGradeFromPercentage(percentage)
    const result = percentage >= PASS_MARK_PERCENT ? 'Pass' : 'Fail'

    return {
        grade,
        percentage,
        displayPercent: `${Math.round(percentage)}%`,
        result,
    }
}

export const buildContextKey = (context) =>
    [
        context.academicYear,
        context.term,
        context.exam,
        context.className,
        context.section,
        context.subject,
    ].join('|')

export const encodeContextKey = (contextKey) => encodeURIComponent(contextKey)

export const decodeContextKey = (encoded) => decodeURIComponent(encoded)

export const getExamMaxMarks = (examName) =>
    EXAM_OPTIONS.find((item) => item.name === examName)?.maxMarks ?? 100

export const getStudentsForMarkEntry = (className, section) => {
    const norm = String(className || '').replace(/^Class\s*/i, '').trim()
    const students = getStudentsList().filter((student) => {
        const studentNorm = String(student.className || '').replace(/^Class\s*/i, '').trim()
        const sectionMatch = !section || student.section === section
        return (studentNorm === norm || student.className === className) && sectionMatch
    })

    return [...students].sort((a, b) => {
        const rollA = parseInt(String(a.rollNumber).replace(/\D/g, ''), 10) || 0
        const rollB = parseInt(String(b.rollNumber).replace(/\D/g, ''), 10) || 0
        return rollA - rollB
    })
}

const defaultEntry = () => ({
    obtainedMarks: null,
    absent: false,
    remarks: '',
})

export const createEmptyEntries = (students) => {
    const entries = {}
    students.forEach((student) => {
        entries[student.id] = defaultEntry()
    })
    return entries
}

let _memoryMarkSessions = null

const getInitialMarkSessions = () => {
    const students = getStudentsForMarkEntry('10', 'A')
    if (!students.length) return {}

    const createEntries = (marksMap) => {
        const res = {}
        students.forEach((stu) => {
            const val = marksMap[stu.id]
            res[stu.id] = {
                obtainedMarks: val !== undefined ? val : 85,
                absent: val === null,
                remarks: val >= 90 ? 'Outstanding performance' : val >= 80 ? 'Very good comprehension' : 'Good effort',
            }
        })
        return res
    }

    const s1 = {
        academicYear: '2026 - 2027',
        term: 'Term 1',
        exam: 'Mid Term',
        className: '10',
        section: 'A',
        subject: 'Mathematics',
        maxMarks: 100,
        examDate: '2026-10-10',
        status: 'submitted',
        approvalStatus: 'Pending',
        submittedByRole: 'Teacher',
        submittedAt: '2026-10-12T09:00:00.000Z',
        students,
        entries: createEntries({ 'STU-2024-1042': 94, 'STU-2024-1087': 88, 'STU-2024-1156': 91 }),
        approvalHistory: [
            { status: 'Submitted', actor: 'Mathematics Teacher', actorRole: 'Teacher', remarks: 'Mid Term evaluation complete for Grade 10-A.', decidedAt: '2026-10-12T09:00:00.000Z' },
        ],
    }
    s1.contextKey = buildContextKey(s1)

    const s2 = {
        academicYear: '2026 - 2027',
        term: 'Term 1',
        exam: 'Periodic Continuous Assessment (PCA)',
        className: '10',
        section: 'A',
        subject: 'Science',
        maxMarks: 50,
        examDate: '2026-10-14',
        status: 'submitted',
        approvalStatus: 'Coordinator Reviewed',
        submittedByRole: 'Teacher',
        submittedAt: '2026-10-15T10:00:00.000Z',
        students,
        entries: createEntries({ 'STU-2024-1042': 47, 'STU-2024-1087': 44, 'STU-2024-1156': 46 }),
        approvalHistory: [
            { status: 'Submitted', actor: 'Science Teacher', actorRole: 'Teacher', remarks: 'PCA science assessments submitted.', decidedAt: '2026-10-15T10:00:00.000Z' },
            { status: 'Coordinator Reviewed', actor: 'Senior Academic Coordinator', actorRole: 'Coordinator', remarks: 'Verified lab practical marks and theory totals.', decidedAt: '2026-10-16T11:00:00.000Z' },
        ],
    }
    s2.contextKey = buildContextKey(s2)

    const s3 = {
        academicYear: '2026 - 2027',
        term: 'Term 1',
        exam: 'Continuous Assessment 1 (CA-1)',
        className: '10',
        section: 'A',
        subject: 'English',
        maxMarks: 50,
        examDate: '2026-10-18',
        status: 'submitted',
        approvalStatus: 'Principal Approved',
        submittedByRole: 'Teacher',
        submittedAt: '2026-10-19T08:30:00.000Z',
        students,
        entries: createEntries({ 'STU-2024-1042': 48, 'STU-2024-1087': 45, 'STU-2024-1156': 44 }),
        approvalHistory: [
            { status: 'Submitted', actor: 'English Teacher', actorRole: 'Teacher', remarks: 'CA-1 English scores submitted.', decidedAt: '2026-10-19T08:30:00.000Z' },
            { status: 'Coordinator Reviewed', actor: 'Senior Academic Coordinator', actorRole: 'Coordinator', remarks: 'Grammar and literature evaluations verified.', decidedAt: '2026-10-20T09:15:00.000Z' },
            { status: 'Principal Approved', actor: 'Principal', actorRole: 'Principal', remarks: 'Approved for final Director sign-off and portal publication.', decidedAt: '2026-10-21T14:00:00.000Z' },
        ],
    }
    s3.contextKey = buildContextKey(s3)

    const s4 = {
        academicYear: '2026 - 2027',
        term: 'Term 1',
        exam: 'Unit Test',
        className: '10',
        section: 'A',
        subject: 'Social Studies',
        maxMarks: 50,
        examDate: '2026-09-25',
        status: 'submitted',
        approvalStatus: 'Approved',
        published: true,
        approvedAt: '2026-09-28T16:00:00.000Z',
        approvedBy: 'Director of Academics',
        submittedByRole: 'Teacher',
        submittedAt: '2026-09-26T10:00:00.000Z',
        students,
        entries: createEntries({ 'STU-2024-1042': 46, 'STU-2024-1087': 42, 'STU-2024-1156': 45 }),
        approvalHistory: [
            { status: 'Submitted', actor: 'Social Studies Teacher', actorRole: 'Teacher', remarks: 'Unit Test scores entered.', decidedAt: '2026-09-26T10:00:00.000Z' },
            { status: 'Coordinator Reviewed', actor: 'Senior Academic Coordinator', actorRole: 'Coordinator', remarks: 'Verified.', decidedAt: '2026-09-27T11:00:00.000Z' },
            { status: 'Principal Approved', actor: 'Principal', actorRole: 'Principal', remarks: 'Approved.', decidedAt: '2026-09-28T12:00:00.000Z' },
            { status: 'Approved', actor: 'Director of Academics', actorRole: 'Director', remarks: 'Final approval granted. Published to student and guardian portals.', decidedAt: '2026-09-28T16:00:00.000Z' },
        ],
    }
    s4.contextKey = buildContextKey(s4)

    return {
        [s1.contextKey]: s1,
        [s2.contextKey]: s2,
        [s3.contextKey]: s3,
        [s4.contextKey]: s4,
    }
}

const readSessions = () => {
    if (_memoryMarkSessions) return _memoryMarkSessions
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            if (Object.keys(parsed).length > 0) {
                _memoryMarkSessions = parsed
                return parsed
            }
        }
    } catch {
        /* ignore */
    }
    const initial = getInitialMarkSessions()
    _memoryMarkSessions = initial
    return initial
}

const writeSessions = (sessions) => {
    _memoryMarkSessions = sessions
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
        }
    } catch {
        /* ignore */
    }
}

export const getAllMarkSessions = () =>
    Object.values(readSessions()).sort(
        (a, b) => new Date(b.submittedAt || b.updatedAt || 0) - new Date(a.submittedAt || a.updatedAt || 0),
    )

export const getMarkSessionByKey = (contextKey) => readSessions()[contextKey] ?? null

export const getMarkApprovalHistory = (session) => {
    if (!session) return []
    if (Array.isArray(session.approvalHistory) && session.approvalHistory.length) {
        return session.approvalHistory
    }

    let history = []
    if (session.submittedAt) {
        history = appendApprovalDecision(history, {
            status: 'Submitted',
            actor: session.submittedByRole || 'Academic staff',
            actorRole: session.submittedByRole || '',
            remarks: 'Submitted for Director review.',
            decidedAt: session.submittedAt,
        })
    }
    if (session.approvalStatus === 'Approved' || session.approvalStatus === 'Rejected') {
        history = appendApprovalDecision(history, {
            status: session.approvalStatus,
            actor: session.approvedBy || 'Director',
            actorRole: 'Director',
            remarks: session.rejectionReason || '',
            decidedAt: session.approvedAt || session.updatedAt,
        })
    }
    return history
}

export const getPendingMarkSessions = () =>
    getAllMarkSessions().filter(
        (session) => session.status === 'submitted' && session.approvalStatus === 'Pending',
    )

export const getPendingApprovalCount = () => getPendingMarkSessions().length

export const loadMarkEntrySession = (context) => {
    const contextKey = buildContextKey(context)
    const sessions = readSessions()
    const existing = sessions[contextKey]

    if (existing) {
        return { ...existing, contextKey }
    }

    const students = getStudentsForMarkEntry(context.className, context.section)
    return {
        contextKey,
        ...context,
        maxMarks: context.maxMarks ?? getExamMaxMarks(context.exam),
        status: 'draft',
        approvalStatus: null,
        entries: createEmptyEntries(students),
        students,
    }
}

export const saveMarkEntrySession = (session) => {
    const sessions = readSessions()
    sessions[session.contextKey] = {
        ...session,
        updatedAt: new Date().toISOString(),
    }
    writeSessions(sessions)
    return session
}

export const submitMarkEntrySession = (session, { submittedByRole = 'Teacher' } = {}) => {
    const submittedAt = new Date().toISOString()
    const submitted = {
        ...session,
        status: 'submitted',
        approvalStatus: 'Pending',
        submittedByRole,
        submittedAt,
        approvedAt: null,
        approvedBy: null,
        rejectionReason: null,
        approvalHistory: appendApprovalDecision(getMarkApprovalHistory(session), {
            status: 'Submitted',
            actor: submittedByRole,
            actorRole: submittedByRole,
            remarks: 'Submitted for Director review.',
            decidedAt: submittedAt,
        }),
    }
    saveMarkEntrySession(submitted)
    return submitted
}

export const updateMarkSessionApproval = (contextKey, approvalStatus, decision = {}) => {
    const sessions = readSessions()
    const session = sessions[contextKey]
    if (!session) return null

    const options = typeof decision === 'string' ? { remarks: decision } : decision
    const decidedAt = options.decidedAt || new Date().toISOString()
    const remarks = String(options.remarks || '').trim()
    const actor = options.actor || 'Director'

    const updated = {
        ...session,
        approvalStatus,
        published: approvalStatus === 'Approved',
        approvedAt: approvalStatus === 'Approved' ? decidedAt : session.approvedAt,
        approvedBy: approvalStatus === 'Approved' ? actor : session.approvedBy,
        rejectionReason: approvalStatus === 'Rejected' ? remarks : null,
        approvalHistory: appendApprovalDecision(getMarkApprovalHistory(session), {
            status: approvalStatus,
            actor,
            actorRole: options.actorRole || 'Director',
            remarks,
            decidedAt,
        }),
        updatedAt: decidedAt,
    }

    sessions[contextKey] = updated
    writeSessions(sessions)
    return updated
}

export const filterMarkSessions = (sessions, { search = '', approvalStatus = '' } = {}) => {
    const query = search.trim().toLowerCase()

    return sessions.filter((session) => {
        if (session.status !== 'submitted') return false
        if (approvalStatus && session.approvalStatus !== approvalStatus) return false

        if (!query) return true

        const haystack = [
            session.exam,
            session.subject,
            session.className,
            session.section,
            session.term,
            session.academicYear,
            session.submittedByRole,
        ].join(' ').toLowerCase()

        return haystack.includes(query)
    })
}

export const getEntryWithComputed = (entry, maxMarks) => {
    const computed = computeMarkEntry({
        obtainedMarks: entry.obtainedMarks,
        maxMarks,
        absent: entry.absent,
    })
    return { ...entry, ...computed }
}

export const isEntryComplete = (entry) =>
    entry.absent || (entry.obtainedMarks !== null && entry.obtainedMarks !== '' && !Number.isNaN(Number(entry.obtainedMarks)))

export const getMarkEntryStats = (students, entries) => {
    let marksEntered = 0
    let pending = 0
    let absent = 0
    const obtainedValues = []

    students.forEach((student) => {
        const entry = entries[student.id] ?? defaultEntry()
        if (entry.absent) {
            absent += 1
            marksEntered += 1
            return
        }
        if (isEntryComplete(entry)) {
            marksEntered += 1
            obtainedValues.push(Number(entry.obtainedMarks))
            return
        }
        pending += 1
    })

    const averageMark = obtainedValues.length
        ? (obtainedValues.reduce((sum, value) => sum + value, 0) / obtainedValues.length).toFixed(1)
        : '—'
    const highestMark = obtainedValues.length ? Math.max(...obtainedValues) : '—'
    const lowestMark = obtainedValues.length ? Math.min(...obtainedValues) : '—'

    return {
        totalStudents: students.length,
        marksEntered,
        pending,
        absent,
        averageMark,
        highestMark,
        lowestMark,
    }
}

export const filterStudentsForTable = (students, entries, { search, statusFilter }) => {
    const query = search.trim().toLowerCase()

    return students.filter((student) => {
        const entry = entries[student.id] ?? defaultEntry()

        if (query) {
            const haystack = `${student.name} ${student.rollNumber} ${student.admissionNumber}`.toLowerCase()
            if (!haystack.includes(query)) return false
        }

        if (statusFilter === 'Pending') return !isEntryComplete(entry)
        if (statusFilter === 'Entered') return isEntryComplete(entry) && !entry.absent
        if (statusFilter === 'Absent') return entry.absent

        return true
    })
}

export const resultBadgeColor = {
    Pass: 'bg-[#4CAF5033] text-[#4CAF50]',
    Fail: 'bg-[#FF000033] text-[#FF0000]',
    Absent: 'bg-[#FF980033] text-[#FF9800]',
    '—': 'bg-[#66708533] text-[#667085]',
}

export const getApprovedMarksForStudent = (studentId) => {
    const resolvedId = resolveStudentIdForMarks(studentId)
    const rows = []

    getAllMarkSessions()
        .filter((session) => session.approvalStatus === 'Approved')
        .forEach((session) => {
            const entry = session.entries?.[resolvedId]
            if (!entry || !isEntryComplete(entry)) return

            const computed = getEntryWithComputed(entry, session.maxMarks)
            rows.push({
                id: `${session.contextKey}|${studentId}`,
                examName: session.exam,
                subject: session.subject,
                term: session.term,
                academicYear: session.academicYear,
                totalMarks: session.maxMarks,
                obtainedMarks: entry.absent ? '—' : entry.obtainedMarks,
                grade: computed.grade,
                percentage: computed.displayPercent,
                resultStatus: computed.result,
                teacherRemarks: entry.remarks || '—',
                examDate: session.examDate,
            })
        })

    return rows.sort((a, b) => {
        if (a.examName !== b.examName) return a.examName.localeCompare(b.examName)
        return a.subject.localeCompare(b.subject)
    })
}

export const getStudentResultSummary = (studentId) => {
    const approvedRows = getApprovedMarksForStudent(studentId)
    const staticFallback = {
        examAppeared: 0,
        averagePercent: 0,
        highestMark: '—',
        highestSubject: '—',
        overallGrade: '—',
        encouragementName: getEncouragementName(studentId),
    }

    if (!approvedRows.length) {
        return staticFallback
    }

    const numericRows = approvedRows.filter(
        (row) => row.resultStatus !== 'Absent' && row.obtainedMarks !== '—',
    )

    const percentages = numericRows.map((row) => {
        const match = String(row.percentage).match(/(\d+)/)
        return match ? Number(match[1]) : 0
    })

    const averagePercent = percentages.length
        ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
        : 0

    let highestRow = numericRows[0]
    numericRows.forEach((row) => {
        const current = Number(row.obtainedMarks)
        const highest = Number(highestRow?.obtainedMarks ?? 0)
        if (current > highest) highestRow = row
    })

    const overallGrade = averagePercent
        ? getGradeFromPercentage(averagePercent)
        : '—'

    const encouragementName = getEncouragementName(studentId)

    return {
        examAppeared: approvedRows.length,
        averagePercent,
        highestMark: highestRow
            ? `${highestRow.obtainedMarks}/${highestRow.totalMarks}`
            : '—',
        highestSubject: highestRow?.subject ?? '—',
        overallGrade,
        encouragementName,
    }
}

export const getSessionDisplayLabel = (session) =>
    `${session.exam} — ${formatClassLabel(session.className)} Section ${session.section} — ${session.subject}`

export const isSessionLocked = (session) =>
    session?.status === 'submitted'
    && (session.approvalStatus === 'Pending' || session.approvalStatus === 'Coordinator Reviewed' || session.approvalStatus === 'Principal Approved' || session.approvalStatus === 'Approved')

export const getSessionStatusLabel = (session) => {
    if (session?.status !== 'submitted') return 'Draft'
    if (session.approvalStatus === 'Pending') return 'Pending Coordinator Review'
    if (session.approvalStatus === 'Coordinator Reviewed') return 'Pending Principal Approval'
    if (session.approvalStatus === 'Principal Approved') return 'Pending Director / DA Approval'
    if (session.approvalStatus === 'Approved') return 'Approved & Published'
    if (session.approvalStatus === 'Rejected') return 'Rejected — Revise & Resubmit'
    return 'Submitted'
}

export const getSessionStatusColor = (session) => {
    if (session?.status !== 'submitted') return 'bg-[#FF980033] text-[#FF9800]'
    if (session.approvalStatus === 'Pending') return 'bg-[#FF980033] text-[#FF9800]'
    if (session.approvalStatus === 'Coordinator Reviewed') return 'bg-[#00BCD433] text-[#00BCD4]'
    if (session.approvalStatus === 'Principal Approved') return 'bg-[#3F51B533] text-[#3F51B5]'
    if (session.approvalStatus === 'Approved') return 'bg-[#4CAF5033] text-[#4CAF50]'
    if (session.approvalStatus === 'Rejected') return 'bg-[#FF000033] text-[#FF0000]'
    return 'bg-[#66708533] text-[#667085]'
}


export const advanceMarkEntryTier = ({ contextKey, decision, actor, actorRole, remarks, targetStatus }) => {
    const session = getMarkSessionByKey(contextKey)
    if (!session) throw new Error(`Mark entry session not found: ${contextKey}`)

    let nextStatus = 'Approved'
    if (decision === 'Rejected') {
        nextStatus = 'Rejected'
    } else if (targetStatus) {
        nextStatus = targetStatus
    } else {
        const current = session.approvalStatus
        if (current === 'Pending' || !current) {
            nextStatus = 'Coordinator Reviewed'
        } else if (current === 'Coordinator Reviewed') {
            nextStatus = 'Principal Approved'
        } else {
            nextStatus = 'Approved'
        }
    }

    const decidedAt = new Date().toISOString()
    const updatedHistory = appendApprovalDecision(session.approvalHistory || [], {
        status: nextStatus,
        actor: actor || 'Approver',
        actorRole: actorRole || '',
        remarks: remarks || '',
        decidedAt
    })

    const updated = {
        ...session,
        approvalStatus: nextStatus,
        published: nextStatus === 'Approved',
        approvalHistory: updatedHistory,
        approvedBy: actor,
        approvedAt: nextStatus === 'Approved' ? decidedAt : session.approvedAt,
        rejectionReason: decision === 'Rejected' ? remarks : ''
    }

    const sessions = readSessions()
    sessions[contextKey] = updated
    writeSessions(sessions)
    return updated
}

export const computeClassRankList = (session) => {
    if (!session || !session.students) return []
    const students = session.students
    const entries = session.entries || {}
    const maxMarks = session.maxMarks || 100

    const scored = students.map((stu) => {
        const entry = entries[stu.id] || defaultEntry()
        const computed = getEntryWithComputed(entry, maxMarks)
        const numMarks = entry.absent || entry.obtainedMarks === null || entry.obtainedMarks === '' ? -1 : Number(entry.obtainedMarks)
        return {
            studentId: stu.id,
            name: stu.name,
            rollNumber: stu.rollNumber,
            admissionNumber: stu.admissionNumber,
            obtainedMarks: entry.absent ? 'Absent' : (entry.obtainedMarks ?? '—'),
            rawScore: numMarks,
            maxMarks,
            percentage: computed.percentage,
            displayPercent: computed.displayPercent,
            grade: computed.grade,
            result: computed.result,
            remarks: entry.remarks || '—',
        }
    })

    scored.sort((a, b) => b.rawScore - a.rawScore)

    let currentRank = 1
    return scored.map((item, index) => {
        if (item.rawScore < 0) {
            return { ...item, classRank: '—' }
        }
        if (index > 0 && scored[index - 1].rawScore === item.rawScore) {
            return { ...item, classRank: 'Rank ' + currentRank }
        }
        currentRank = index + 1
        return { ...item, classRank: 'Rank ' + currentRank }
    })
}
