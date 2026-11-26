import { applyWorkflowDecision, WORKFLOW_TYPES } from '../approvals/approvalEngine.js'
const STORAGE_KEY = 'school-erp-activities'

export const MD_APPROVAL_STATUS = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
}

export const mdApprovalBadgeColor = {
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

const DEFAULT_ACTIVITIES = [
    {
        id: 'ACT-SPT-001',
        type: 'sports',
        eventName: 'APAR SPORTS ACADEMY 3rd DISTRICT LEVEL OPEN & CHILDRENs CHESS TOURNAMENT',
        eventType: 'Chess Tournament',
        className: 'All Students',
        eventDate: '15-08-2025',
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        venue: 'APAR Sports Academy Indoor Hall',
        coordinator: '',
        coach: 'APAR Sports Academy',
        description: 'District level open and children chess tournament.',
        submittedBy: 'Admin',
        approvalStatus: 'Approved',
        mdApprovalStatus: MD_APPROVAL_STATUS.APPROVED,
        isFeeApplicable: false,
        feeAmount: 0,
        feeCategory: 'None',
        participants: [
            { studentId: 'STU-001', studentName: 'Kabir Singh', className: '10-A', attended: true, result: 'Winner', award: 'Gold Trophy' },
            { studentId: 'STU-002', studentName: 'Meera Nair', className: '11-B', attended: true, result: 'Runner Up', award: 'Silver Medal' },
            { studentId: 'STU-003', studentName: 'Ananya Iyer', className: '9-C', attended: true, result: 'Third Place', award: 'Bronze Medal' }
        ],
        approvalHistory: [
            { id: 'H1', tierNumber: 1, tierName: 'Front Office Verification', status: 'Approved', actor: 'PRM Officer', actorRole: 'prm', remarks: 'Event logistics and venue booking cleared.', decidedAt: '2025-08-02T10:00:00.000Z' },
            { id: 'H2', tierNumber: 2, tierName: 'Principal Endorsement', status: 'Approved', actor: 'Dr. Ramanathan (Principal)', actorRole: 'principal', remarks: 'Approved for inter-school sports schedule.', decidedAt: '2025-08-03T11:30:00.000Z' },
            { id: 'H3', tierNumber: 3, tierName: 'Director Sanction', status: 'Approved', actor: 'Director of Academics', actorRole: 'director', remarks: 'Final sanction granted.', decidedAt: '2025-08-04T15:00:00.000Z' }
        ],
        submittedDate: '01-08-2025',
        participantCount: 64,
        players: [
            { id: 'PLY-001', rank: 1, name: 'Kabir Singh', category: 'Open', className: 'Class 10 - A', school: 'APAR Sports Academy', rating: '1325', score: '5.5/6', tieBreak: '24.0', result: 'Winner' },
            { id: 'PLY-002', rank: 2, name: 'Meera Nair', category: 'Open', className: 'Class 11 - B', school: 'APAR Sports Academy', rating: '1262', score: '5/6', tieBreak: '22.5', result: 'Runner Up' },
            { id: 'PLY-003', rank: 3, name: 'Ananya Iyer', category: 'Under 15', className: 'Class 9 - C', school: 'APAR Sports Academy', rating: '1210', score: '4.5/6', tieBreak: '21.0', result: 'Third Place' },
            { id: 'PLY-004', rank: 4, name: 'Vivaan Rao', category: 'Under 13', className: 'Class 7 - A', school: 'APAR Sports Academy', rating: '1188', score: '4/6', tieBreak: '19.5', result: 'Completed' },
            { id: 'PLY-005', rank: 5, name: 'Diya Patel', category: 'Under 11', className: 'Class 5 - B', school: 'APAR Sports Academy', rating: '1024', score: '3.5/6', tieBreak: '18.0', result: 'Completed' },
            { id: 'PLY-006', rank: 6, name: 'Aarav Sharma', category: 'Under 09', className: 'Class 3 - A', school: 'APAR Sports Academy', rating: 'Unrated', score: '3/6', tieBreak: '16.5', result: 'Completed' },
        ],
    },
    {
        id: 'ACT-CUL-001',
        type: 'cultural',
        eventName: 'Annual Classical Music & Dance Symphony 2025',
        eventType: 'Music & Dance Festival',
        className: 'Grades 6 to 12',
        eventDate: '22-09-2025',
        startTime: '10:00 AM',
        endTime: '04:00 PM',
        venue: 'Main Auditorium, Cultural Block',
        coordinator: 'Sunita Rao',
        coach: '',
        description: 'Inter-house classical Carnatic and Hindustani music performance, choir showcase, and folk dance exposition.',
        submittedBy: 'Admin',
        mdApprovalStatus: MD_APPROVAL_STATUS.APPROVED,
        submittedDate: '10-09-2025',
        participantCount: 142,
    },
    {
        id: 'ACT-CUL-002',
        type: 'cultural',
        eventName: 'Inter-School Sanskrit Drama & One-Act Play',
        eventType: 'Theatre & Drama',
        className: 'Grades 9 to 12',
        eventDate: '14-10-2025',
        startTime: '02:00 PM',
        endTime: '06:00 PM',
        venue: 'Open Air Amphitheatre',
        coordinator: 'Meenakshi Sundaram',
        coach: '',
        description: 'Dramatic staging of classical drama with student-directed acoustic orchestra and stage design.',
        submittedBy: 'Teacher',
        mdApprovalStatus: MD_APPROVAL_STATUS.PENDING,
        submittedDate: '28-09-2025',
        participantCount: 65,
    },
    {
        id: 'ACT-SPT-002',
        type: 'sports',
        eventName: 'State Invitational Athletics & Track Meet 2025',
        eventType: 'Track & Field',
        className: 'Grades 5 to 12',
        eventDate: '05-10-2025',
        startTime: '08:00 AM',
        endTime: '04:30 PM',
        venue: 'Main Sports Complex & Synthetic 400m Track',
        coordinator: '',
        coach: 'Coach Vikram Singh',
        description: 'Inter-school championship featuring 100m, 200m, 400m sprint, 4x100m relay, long jump, and shot put finals.',
        submittedBy: 'Sports HOD',
        mdApprovalStatus: MD_APPROVAL_STATUS.APPROVED,
        submittedDate: '15-09-2025',
        participantCount: 220,
    },
    {
        id: 'ACT-CMP-001',
        type: 'competition',
        eventName: 'National Science & Cyber Olympiad (State Chapter)',
        eventType: 'Science Olympiad',
        className: 'Grades 8 to 11',
        eventDate: '18-09-2025',
        startTime: '09:30 AM',
        endTime: '12:30 PM',
        venue: 'Computer Lab 1 & 2, Tech Block',
        coordinator: 'Dr. Ramesh Nathan',
        coach: '',
        description: 'State-wide competitive coding, logic theoretical puzzles, and experimental physics problem solving.',
        submittedBy: 'Admin',
        mdApprovalStatus: MD_APPROVAL_STATUS.APPROVED,
        submittedDate: '01-09-2025',
        participantCount: 88,
    },
    {
        id: 'ACT-CMP-002',
        type: 'competition',
        eventName: 'State Inter-School Mathematics Olympiad & Quiz',
        eventType: 'Mathematics Olympiad',
        className: 'Grades 9 & 10',
        eventDate: '28-10-2025',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        venue: 'Senior Wing Seminar Hall',
        coordinator: 'Priya Menon',
        coach: '',
        description: 'Advanced calculus, combinatorics, and geometry tournament with rolling trophy for the top school team.',
        submittedBy: 'Teacher',
        mdApprovalStatus: MD_APPROVAL_STATUS.PENDING,
        submittedDate: '25-09-2025',
        participantCount: 45,
    },
    {
        id: 'ACT-ACD-001',
        type: 'academic',
        eventName: 'Model United Nations (MUN) 2025 General Assembly',
        eventType: 'Debate & Diplomacy',
        className: 'Grades 9 to 12',
        eventDate: '12-11-2025',
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        venue: 'Conference Hall A & B',
        coordinator: 'Kavita Menon',
        coach: '',
        description: 'Simulation of UN committees debating global climate finance, diplomatic treaties, and AI ethics in education.',
        submittedBy: 'Coordinator',
        mdApprovalStatus: MD_APPROVAL_STATUS.APPROVED,
        submittedDate: '20-09-2025',
        participantCount: 110,
    },
    {
        id: 'ACT-ADM-001',
        type: 'administrative',
        eventName: 'Annual Day Gala & Student Excellence Convocation',
        eventType: 'Annual Convocation',
        className: 'All Students & Faculty',
        eventDate: '20-12-2025',
        startTime: '04:00 PM',
        endTime: '08:30 PM',
        venue: 'Main Campus Open Grounds',
        coordinator: 'Principal Office',
        coach: '',
        description: 'Flagship institutional celebration, annual awards distribution, Star of the Year recognition, and patron address.',
        submittedBy: 'Principal',
        mdApprovalStatus: MD_APPROVAL_STATUS.APPROVED,
        submittedDate: '01-09-2025',
        participantCount: 1850,
    },
]

const mergeDefaultActivities = (records) => {
    const existingIds = new Set(records.map((item) => item.id))
    const missingDefaults = DEFAULT_ACTIVITIES.filter((item) => !existingIds.has(item.id))
    return missingDefaults.length > 0 ? [...missingDefaults, ...records] : records
}

let _memoryActivities = null

export const getActivities = () => {
    if (_memoryActivities && Array.isArray(_memoryActivities) && _memoryActivities.length > 0) {
        return _memoryActivities
    }
    try {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                const records = Array.isArray(parsed) ? parsed : []
                const merged = mergeDefaultActivities(records)
                if (merged.length !== records.length) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
                }
                _memoryActivities = merged
                return _memoryActivities
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACTIVITIES))
        }
    } catch {
        /* ignore */
    }
    _memoryActivities = DEFAULT_ACTIVITIES.map((activity) => ({ ...activity }))
    return _memoryActivities
}

export const saveActivities = (records) => {
    _memoryActivities = records
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
        }
    } catch {
        /* ignore */
    }
}

export const getActivitiesByType = (type) =>
    getActivities().filter((item) => item.type === type)

export const getChessResultActivities = () =>
    getActivitiesByType('sports').filter((item) => {
        const eventName = String(item.eventName || '').toLowerCase()
        const eventType = String(item.eventType || '').toLowerCase()
        return eventName.includes('chess') || eventType.includes('chess')
    })

export const getActivityById = (id) =>
    getActivities().find((item) => item.id === id) ?? null

export const CALENDAR_UPDATED_EVENT = 'schoolerp-calendar-updated'

const ACTIVITY_TYPE_LABELS = {
    cultural: 'Cultural',
    sports: 'Sports',
    competition: 'Competition',
}

export const parseActivityDateToIso = (dateStr) => {
    if (!dateStr) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
    const parts = String(dateStr).split('-')
    if (parts.length === 3 && parts[0].length === 2) {
        const [dd, mm, yyyy] = parts
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
    }
    return ''
}

export const notifyCalendarUpdated = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(CALENDAR_UPDATED_EVENT))
    }
}

export const getActivityCalendarItems = () =>
    getActivities()
        .filter((item) => item.mdApprovalStatus !== MD_APPROVAL_STATUS.REJECTED)
        .map((activity) => {
            const startDate = parseActivityDateToIso(activity.eventDate)
            if (!startDate) return null

            const typeLabel = ACTIVITY_TYPE_LABELS[activity.type] || activity.type
            const pendingNote =
                activity.mdApprovalStatus === MD_APPROVAL_STATUS.PENDING
                    ? ' (Pending Super Admin approval)'
                    : ''
            const timeRange =
                activity.startTime && activity.endTime
                    ? `${activity.startTime} – ${activity.endTime}`
                    : ''

            return {
                id: `cal-${activity.id}`,
                type: 'event',
                title: activity.eventName,
                startDate,
                endDate: startDate,
                description: [
                    typeLabel,
                    activity.eventType,
                    activity.venue,
                    activity.className,
                    timeRange,
                    activity.description,
                ]
                    .filter(Boolean)
                    .join(' · ') + pendingNote,
                activityId: activity.id,
            }
        })
        .filter(Boolean)

export const generateActivityId = (type) => {
    const prefix = type === 'cultural' ? 'ACT-CUL' : type === 'sports' ? 'ACT-SPT' : 'ACT-CMP'
    const list = getActivities().filter((item) => item.type === type)
    const max = list.reduce((acc, item) => {
        const num = Number(item.id.replace(`${prefix}-`, ''))
        return Number.isFinite(num) ? Math.max(acc, num) : acc
    }, 0)
    return `${prefix}-${String(max + 1).padStart(3, '0')}`
}

export const formatSubmittedDate = () =>
    new Date().toLocaleDateString('en-GB').replace(/\//g, '-')

export const formatEventDate = (date) => {
    if (!date) return ''
    if (typeof date === 'string') return date
    return date.toLocaleDateString('en-GB').replace(/\//g, '-')
}

export const formatTimeLabel = (timeValue) => {
    if (!timeValue) return ''
    const [hours, minutes] = timeValue.split(':')
    const hour = Number(hours)
    if (!Number.isFinite(hour)) return timeValue
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${String(hour12).padStart(2, '0')}:${minutes} ${suffix}`
}

export const parseTimeForInput = (timeLabel) => {
    if (!timeLabel) return ''
    const match = String(timeLabel).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return timeLabel.includes(':') && !/\s/i.test(timeLabel) ? timeLabel : ''
    let hour = Number(match[1])
    const minutes = match[2]
    const period = match[3].toUpperCase()
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${minutes}`
}

export const parseEventDateForInput = (dateStr) => {
    if (!dateStr) return new Date()
    const parts = String(dateStr).split('-')
    if (parts.length === 3 && parts[0].length === 2) {
        const [dd, mm, yyyy] = parts
        return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
    }
    if (parts.length === 3 && parts[0].length === 4) {
        const [yyyy, mm, dd] = parts
        return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
    }
    return new Date(dateStr)
}

export const addActivity = (payload) => {
    const record = {
        id: payload.id || generateActivityId(payload.type),
        type: payload.type,
        eventName: payload.eventName,
        eventType: payload.eventType,
        className: payload.className,
        eventDate: payload.eventDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
        venue: payload.venue,
        coordinator: payload.coordinator || '',
        coach: payload.coach || '',
        description: payload.description,
        submittedBy: payload.submittedBy,
        mdApprovalStatus: payload.mdApprovalStatus,
        submittedDate: payload.submittedDate || formatSubmittedDate(),
        players: Array.isArray(payload.players) ? payload.players : [],
    }
    saveActivities([record, ...getActivities()])
    notifyCalendarUpdated()
    return record
}

export const updateActivity = (id, payload) => {
    const records = getActivities()
    const index = records.findIndex((item) => item.id === id)
    if (index === -1) return null

    const updated = {
        ...records[index],
        eventName: payload.eventName,
        eventType: payload.eventType,
        className: payload.className,
        eventDate: payload.eventDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
        venue: payload.venue,
        coordinator: payload.coordinator ?? records[index].coordinator,
        coach: payload.coach ?? records[index].coach,
        description: payload.description,
        mdApprovalStatus: payload.mdApprovalStatus ?? records[index].mdApprovalStatus,
        players: Array.isArray(payload.players) ? payload.players : records[index].players || [],
    }

    records[index] = updated
    saveActivities(records)
    notifyCalendarUpdated()
    return updated
}

export const deleteActivity = (id) => {
    const records = getActivities().filter((item) => item.id !== id)
    saveActivities(records)
    notifyCalendarUpdated()
}

export const updateActivityMdApproval = (id, status) => {
    const next = getActivities().map((item) =>
        item.id === id ? { ...item, mdApprovalStatus: status } : item,
    )
    saveActivities(next)
    notifyCalendarUpdated()
    return next.find((item) => item.id === id) ?? null
}


export const advanceActivityWorkflow = ({
    activityId,
    decision,
    actor,
    actorRole,
    remarks
}) => {
    const list = getActivities()
    const index = list.findIndex((a) => a.id === activityId)
    if (index === -1) throw new Error(`Activity not found: ${activityId}`)

    const current = list[index]
    const updated = applyWorkflowDecision({
        workflowType: WORKFLOW_TYPES.EXTRA_CURRICULAR_ACTIVITY,
        entity: {
            ...current,
            status: current.approvalStatus || current.mdApprovalStatus || 'Submitted'
        },
        decision,
        actor,
        actorRole,
        remarks
    })

    // Sync legacy mdApprovalStatus
    updated.approvalStatus = updated.status
    if (updated.status === 'Approved') {
        updated.mdApprovalStatus = MD_APPROVAL_STATUS.APPROVED
    } else if (updated.status === 'Rejected') {
        updated.mdApprovalStatus = MD_APPROVAL_STATUS.REJECTED
    } else {
        updated.mdApprovalStatus = MD_APPROVAL_STATUS.PENDING
    }

    list[index] = updated
    saveActivities(list)
    notifyCalendarUpdated()
    return updated
}

export const enrollStudentInActivity = (activityId, student) => {
    const list = getActivities()
    const index = list.findIndex((a) => a.id === activityId)
    if (index === -1) return null

    const participants = list[index].participants || []
    if (participants.some((p) => p.studentId === student.studentId)) {
        return list[index] // already enrolled
    }

    const newParticipant = {
        studentId: student.studentId || `STU-${Date.now()}`,
        studentName: student.studentName || student.name || 'Student',
        className: student.className || 'General',
        enrolledAt: new Date().toLocaleDateString('en-GB'),
        attended: false,
        result: 'Enrolled',
        award: null
    }

    list[index].participants = [...participants, newParticipant]
    list[index].participantCount = list[index].participants.length
    saveActivities(list)
    return list[index]
}

export const updateStudentActivityAttendance = (activityId, studentId, attended, result = '', award = '') => {
    const list = getActivities()
    const index = list.findIndex((a) => a.id === activityId)
    if (index === -1) return null

    const participants = (list[index].participants || []).map((p) => {
        if (p.studentId === studentId) {
            return {
                ...p,
                attended: Boolean(attended),
                result: result || p.result || (attended ? 'Attended' : 'Absent'),
                award: award !== undefined ? award : p.award
            }
        }
        return p
    })

    list[index].participants = participants
    saveActivities(list)
    return list[index]
}

export const getPersonInCharge = (activity, personField) =>
    activity[personField] || activity.coordinator || activity.coach || '—'
