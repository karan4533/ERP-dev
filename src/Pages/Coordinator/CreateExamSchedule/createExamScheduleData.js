import { CLASSES, SECTIONS, SUBJECTS } from '../AssignedClass/assignedClassData'

export const APPROVAL_STATUSES = ['Approved', 'Pending', 'Rejected']

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const approvalBadgeColor = {
    Approved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Rejected: 'bg-[#FF000033] text-[#FF0000]',
}

const STORAGE_KEY = 'teacher-exam-schedules'

const SUBJECT_COLOR_PALETTE = [
    'bg-emerald-50 text-emerald-700',
    'bg-purple-50 text-purple-700',
    'bg-amber-50 text-amber-700',
    'bg-teal-50 text-teal-700',
    'bg-orange-50 text-orange-700',
    'bg-rose-50 text-rose-700',
    'bg-sky-50 text-sky-700',
    'bg-blue-50 text-blue-700',
    'bg-fuchsia-50 text-fuchsia-700',
    'bg-indigo-50 text-indigo-700',
]

export const formatDate = (date) => {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(d.getTime())) return typeof date === 'string' ? date : ''
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
}

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    return `${parts[0]}/${parts[1]}/${parts[2]}`
}

const getSubjectColor = (subject, colorMap = {}) => {
    if (colorMap[subject]) return colorMap[subject]
    let hash = 0
    for (let i = 0; i < subject.length; i += 1) {
        hash = subject.charCodeAt(i) + ((hash << 5) - hash)
    }
    return SUBJECT_COLOR_PALETTE[Math.abs(hash) % SUBJECT_COLOR_PALETTE.length]
}

export const buildTimetableFromSubjects = (subjects = []) => {
    if (!subjects.length) {
        return { days: [], timeSlots: [], schedule: {}, subjectColors: {} }
    }

    const dayOrder = [...DAYS, 'Sunday']
    const days = [...new Set(subjects.map((item) => item.day).filter(Boolean))].sort(
        (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b),
    )

    const slotMap = new Map()
    subjects.forEach((item) => {
        if (!item.startTime || !item.endTime) return
        const label = `${item.startTime} - ${item.endTime}`
        if (!slotMap.has(label)) {
            slotMap.set(label, {
                time: `${item.startTime} -\n${item.endTime}`,
                label,
            })
        }
    })

    const timeSlots = Array.from(slotMap.values())
    const schedule = {}
    const subjectColors = {}

    subjects.forEach((item) => {
        if (!item.day || !item.startTime || !item.endTime || !item.subject) return
        const label = `${item.startTime} - ${item.endTime}`
        if (!schedule[label]) schedule[label] = {}
        schedule[label][item.day] = {
            subject: item.subject,
            date: formatDisplayDate(item.examDate),
        }
        subjectColors[item.subject] = getSubjectColor(item.subject, subjectColors)
    })

    return { days, timeSlots, schedule, subjectColors }
}

const withTimetable = (record) => ({
    ...record,
    timetable: buildTimetableFromSubjects(record.subjects ?? []),
})

const DEFAULT_EXAM_SCHEDULE_LIST = [
    {
        id: 'EXM-1001',
        examId: 'EXM-1001',
        examName: 'Mid Term Examination',
        className: '10',
        section: 'A',
        classLabel: '10 - A',
        startDate: '15-09-2025',
        endDate: '20-09-2025',
        teacherName: 'Mr. Anil Kumar',
        submittedDate: '01-09-2025',
        approvalStatus: 'Pending',
        subjects: [
            { subject: 'Mathematics', examDate: '15-09-2025', startTime: '10:30 AM', endTime: '12:30 PM', day: 'Monday', duration: '2 Hours' },
            { subject: 'Physics', examDate: '16-09-2025', startTime: '10:30 AM', endTime: '12:30 PM', day: 'Tuesday', duration: '2 Hours' },
            { subject: 'English', examDate: '17-09-2025', startTime: '02:30 PM', endTime: '04:30 PM', day: 'Wednesday', duration: '2 Hours' },
            { subject: 'Chemistry', examDate: '18-09-2025', startTime: '10:30 AM', endTime: '12:30 PM', day: 'Thursday', duration: '2 Hours' },
        ],
    },
    {
        id: 'EXM-1002',
        examId: 'EXM-1002',
        examName: 'Unit Test — Term 1',
        className: '10',
        section: 'A',
        classLabel: '10 - A',
        startDate: '05-08-2025',
        endDate: '08-08-2025',
        teacherName: 'Mr. Anil Kumar',
        submittedDate: '28-07-2025',
        approvalStatus: 'Approved',
        subjects: [
            { subject: 'Mathematics', examDate: '05-08-2025', startTime: '09:00 AM', endTime: '11:00 AM', day: 'Monday', duration: '2 Hours' },
            { subject: 'Computer Science', examDate: '06-08-2025', startTime: '09:00 AM', endTime: '11:00 AM', day: 'Tuesday', duration: '2 Hours' },
        ],
    },
    {
        id: 'EXM-1003',
        examId: 'EXM-1003',
        examName: 'Annual Examination',
        className: '9',
        section: 'B',
        classLabel: '9 - B',
        startDate: '10-03-2026',
        endDate: '18-03-2026',
        teacherName: 'Mrs. Priya Menon',
        submittedDate: '20-02-2026',
        approvalStatus: 'Approved',
        subjects: [
            { subject: 'English', examDate: '10-03-2026', startTime: '10:30 AM', endTime: '01:00 PM', day: 'Monday', duration: '2.5 Hours' },
            { subject: 'Physics', examDate: '12-03-2026', startTime: '10:30 AM', endTime: '01:00 PM', day: 'Wednesday', duration: '2.5 Hours' },
            { subject: 'Chemistry', examDate: '14-03-2026', startTime: '02:00 PM', endTime: '04:30 PM', day: 'Friday', duration: '2.5 Hours' },
        ],
    },
    {
        id: 'EXM-1004',
        examId: 'EXM-1004',
        examName: 'Pre-Board Examination',
        className: '10',
        section: 'A',
        classLabel: '10 - A',
        startDate: '12-01-2026',
        endDate: '16-01-2026',
        teacherName: 'Mr. Anil Kumar',
        submittedDate: '02-01-2026',
        approvalStatus: 'Rejected',
        subjects: [
            { subject: 'Mathematics', examDate: '12-01-2026', startTime: '10:30 AM', endTime: '01:30 PM', day: 'Monday', duration: '3 Hours' },
            { subject: 'Physics', examDate: '14-01-2026', startTime: '10:30 AM', endTime: '01:30 PM', day: 'Wednesday', duration: '3 Hours' },
        ],
    },
    {
        id: 'EXM-1005',
        examId: 'EXM-1005',
        examName: 'Monthly Assessment — August',
        className: '8',
        section: 'C',
        classLabel: '8 - C',
        startDate: '22-08-2025',
        endDate: '23-08-2025',
        teacherName: 'Mr. Ravi Shankar',
        submittedDate: '15-08-2025',
        approvalStatus: 'Pending',
        subjects: [
            { subject: 'English', examDate: '22-08-2025', startTime: '09:30 AM', endTime: '11:30 AM', day: 'Friday', duration: '2 Hours' },
            { subject: 'Mathematics', examDate: '23-08-2025', startTime: '09:30 AM', endTime: '11:30 AM', day: 'Saturday', duration: '2 Hours' },
        ],
    },
    {
        id: 'EXM-1006',
        examId: 'EXM-1006',
        examName: 'Practical Examination',
        className: '10',
        section: 'A',
        classLabel: '10 - A',
        startDate: '25-09-2025',
        endDate: '27-09-2025',
        teacherName: 'Mr. Anil Kumar',
        submittedDate: '10-09-2025',
        approvalStatus: 'Approved',
        subjects: [
            { subject: 'Physics', examDate: '25-09-2025', startTime: '09:00 AM', endTime: '12:00 PM', day: 'Thursday', duration: '3 Hours' },
            { subject: 'Chemistry', examDate: '26-09-2025', startTime: '09:00 AM', endTime: '12:00 PM', day: 'Friday', duration: '3 Hours' },
            { subject: 'Computer Science', examDate: '27-09-2025', startTime: '09:00 AM', endTime: '12:00 PM', day: 'Saturday', duration: '3 Hours' },
        ],
    },
].map(withTimetable)

export const saveExamSchedules = (schedules) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules))
}

export const getExamSchedules = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            return parsed.map((item) =>
                item.timetable ? item : withTimetable(item),
            )
        }
    } catch {
        /* ignore */
    }
    const seeded = DEFAULT_EXAM_SCHEDULE_LIST
    saveExamSchedules(seeded)
    return seeded
}

export const addExamSchedule = (payload) => {
    const list = getExamSchedules()
    const maxId = list.reduce((max, item) => {
        const num = parseInt(String(item.examId).replace('EXM-', ''), 10)
        return Number.isNaN(num) ? max : Math.max(max, num)
    }, 1000)
    const id = `EXM-${maxId + 1}`

    const subjects = payload.subjects.map(({ subject, examDate, startTime, endTime, day, duration }) => ({
        subject,
        examDate,
        startTime,
        endTime,
        day,
        duration,
    }))

    const record = withTimetable({
        id,
        examId: id,
        examName: payload.examName,
        className: payload.className,
        section: payload.section,
        classLabel: `${payload.className} - ${payload.section}`,
        startDate: payload.examDate,
        endDate: payload.endDate,
        teacherName: payload.teacherName,
        submittedDate: formatDate(new Date()),
        approvalStatus: 'Pending',
        subjects,
    })

    const next = [...list, record]
    saveExamSchedules(next)
    return record
}

export const getExamScheduleById = (id) =>
    getExamSchedules().find((item) => item.id === id) ?? null

export { CLASSES, SECTIONS, SUBJECTS }
