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
        mdApprovalStatus: MD_APPROVAL_STATUS.APPROVED,
        submittedDate: '01-08-2025',
        players: [
            { id: 'PLY-001', rank: 1, name: 'Kabir Singh', category: 'Open', className: 'Class 10 - A', school: 'APAR Sports Academy', rating: '1325', score: '5.5/6', tieBreak: '24.0', result: 'Winner' },
            { id: 'PLY-002', rank: 2, name: 'Meera Nair', category: 'Open', className: 'Class 11 - B', school: 'APAR Sports Academy', rating: '1262', score: '5/6', tieBreak: '22.5', result: 'Runner Up' },
            { id: 'PLY-003', rank: 3, name: 'Ananya Iyer', category: 'Under 15', className: 'Class 9 - C', school: 'APAR Sports Academy', rating: '1210', score: '4.5/6', tieBreak: '21.0', result: 'Third Place' },
            { id: 'PLY-004', rank: 4, name: 'Vivaan Rao', category: 'Under 13', className: 'Class 7 - A', school: 'APAR Sports Academy', rating: '1188', score: '4/6', tieBreak: '19.5', result: 'Completed' },
            { id: 'PLY-005', rank: 5, name: 'Diya Patel', category: 'Under 11', className: 'Class 5 - B', school: 'APAR Sports Academy', rating: '1024', score: '3.5/6', tieBreak: '18.0', result: 'Completed' },
            { id: 'PLY-006', rank: 6, name: 'Aarav Sharma', category: 'Under 09', className: 'Class 3 - A', school: 'APAR Sports Academy', rating: 'Unrated', score: '3/6', tieBreak: '16.5', result: 'Completed' },
        ],
    },
]

const mergeDefaultActivities = (records) => {
    const existingIds = new Set(records.map((item) => item.id))
    const missingDefaults = DEFAULT_ACTIVITIES.filter((item) => !existingIds.has(item.id))
    return missingDefaults.length > 0 ? [...missingDefaults, ...records] : records
}

export const getActivities = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            const records = Array.isArray(parsed) ? parsed : []
            const merged = mergeDefaultActivities(records)
            if (merged.length !== records.length) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
            }
            return merged
        }
    } catch {
        /* ignore */
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACTIVITIES))
    return DEFAULT_ACTIVITIES.map((activity) => ({ ...activity }))
}

export const saveActivities = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
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

export const getPersonInCharge = (activity, personField) =>
    activity[personField] || activity.coordinator || activity.coach || '—'
