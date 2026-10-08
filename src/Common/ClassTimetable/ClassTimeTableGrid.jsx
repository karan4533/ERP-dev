import { useMemo, useState } from 'react'
import { addDays, format, isToday, startOfWeek } from 'date-fns'
import { getPeriodSubject, getPeriodTeacher } from './classTimetableUtils'
import TimetablePeriodCell from './TimetablePeriodCell'

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const DEFAULT_TIME_SLOTS = [
    { time: '09:00 AM -\n09:45 AM', label: '09:00 AM - 09:45 AM' },
    { time: '09:45 AM -\n10:30 AM', label: '09:45 AM - 10:30 AM' },
    { time: '10:45 AM -\n11:30 AM', label: '10:45 AM - 11:30 AM' },
    { time: '11:30 AM -\n12:15 PM', label: '11:30 AM - 12:15 PM' },
]

const DEFAULT_SCHEDULE = {
    '09:00 AM - 09:45 AM': {
        Monday: { subject: 'English', teacher: 'Ms. Anitha' },
        Tuesday: { subject: 'Mathematics', teacher: 'Mr. Ravi' },
        Wednesday: { subject: 'Science', teacher: 'Dr. Suresh' },
        Thursday: { subject: 'Social Science', teacher: 'Mr. Karthik' },
        Friday: { subject: 'Hindi', teacher: 'Mrs. Priya' },
    },
    '09:45 AM - 10:30 AM': {
        Monday: { subject: 'Mathematics', teacher: 'Mr. Ravi' },
        Tuesday: { subject: 'English', teacher: 'Ms. Anitha' },
        Wednesday: { subject: 'Computer', teacher: 'Mr. Arjun' },
        Thursday: { subject: 'Science', teacher: 'Dr. Suresh' },
        Friday: { subject: 'Physical Education', teacher: 'Mr. Daniel' },
    },
    '10:45 AM - 11:30 AM': {
        Monday: { subject: 'Science', teacher: 'Dr. Suresh' },
        Tuesday: { subject: 'Social Science', teacher: 'Mr. Karthik' },
        Wednesday: { subject: 'English', teacher: 'Ms. Anitha' },
        Thursday: { subject: 'Mathematics', teacher: 'Mr. Ravi' },
        Friday: { subject: 'Art', teacher: 'Ms. Latha' },
    },
    '11:30 AM - 12:15 PM': {
        Monday: { subject: 'Library', teacher: 'Mrs. Meena' },
        Tuesday: { subject: 'Science Lab', teacher: 'Dr. Suresh' },
        Wednesday: { subject: 'Mathematics', teacher: 'Mr. Ravi' },
        Thursday: { subject: 'English', teacher: 'Ms. Anitha' },
        Friday: { subject: 'Moral Science', teacher: 'Mrs. Priya' },
    },
}

const DEFAULT_SUBJECT_COLORS = {
    English: 'bg-rose-50 text-rose-700',
    Mathematics: 'bg-blue-50 text-blue-700',
    Science: 'bg-purple-50 text-purple-700',
    'Social Science': 'bg-amber-50 text-amber-700',
    Hindi: 'bg-orange-50 text-orange-700',
    Computer: 'bg-sky-50 text-sky-700',
    'Physical Education': 'bg-emerald-50 text-emerald-700',
    Art: 'bg-fuchsia-50 text-fuchsia-700',
    Library: 'bg-teal-50 text-teal-700',
    'Science Lab': 'bg-indigo-50 text-indigo-700',
    'Moral Science': 'bg-gray-50 text-gray-700',
}

export default function ClassTimeTableGrid({
    days = DEFAULT_DAYS,
    timeSlots = DEFAULT_TIME_SLOTS,
    schedule = DEFAULT_SCHEDULE,
    subjectColors = DEFAULT_SUBJECT_COLORS,
    weekDate = new Date(),
}) {
    const [hoveredCell, setHoveredCell] = useState(null)

    const dayDates = useMemo(() => {
        const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 })
        return days.map((_, index) => addDays(weekStart, index))
    }, [days, weekDate])

    const getSubjectStyle = (subject) =>
        subjectColors[subject] ?? 'bg-gray-50 text-gray-700'

    return (
        <div className='w-full bg-white rounded-2xl border border-gray-200 overflow-hidden font-sans'>
            <div className='overflow-x-auto'>
                <table className='w-full min-w-[700px] border-collapse'>
                    <thead>
                        <tr>
                            <th className='w-[140px] border-r border-b border-gray-200' />
                            {days.map((day, index) => {
                                const date = dayDates[index]
                                const today = isToday(date)
                                return (
                                    <th
                                        key={day}
                                        className='border-r border-b border-gray-200 py-4 px-3 text-center last:border-r-0'
                                    >
                                        <div className='flex flex-col items-center gap-1'>
                                            <span className={`text-sm font-semibold tracking-wide ${today ? 'text-indigo-600' : 'text-gray-700'}`}>
                                                {day}
                                            </span>
                                            <span className={`text-xs font-medium ${today ? 'rounded-full bg-indigo-500 px-2.5 py-0.5 text-white' : 'text-gray-400'}`}>
                                                {format(date, 'd MMM')}
                                            </span>
                                        </div>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map((slot, rowIdx) => (
                            <tr key={slot.label}>
                                <td className='border-r border-b border-gray-200 px-4 py-6 text-center align-middle'>
                                    <span className='text-xs font-semibold text-indigo-500 leading-relaxed whitespace-pre-line'>
                                        {slot.time}
                                    </span>
                                </td>
                                {days.map((day, colIdx) => {
                                    const period = schedule[slot.label]?.[day]
                                    const subject = getPeriodSubject(period)
                                    const teacher = getPeriodTeacher(period)
                                    const cellDate = dayDates[colIdx]
                                    const cellKey = `${rowIdx}-${colIdx}`
                                    const isHovered = hoveredCell === cellKey

                                    return (
                                        <td
                                            key={day}
                                            className='border-r border-b border-gray-200 p-2 text-center align-middle last:border-r-0'
                                            onMouseEnter={() => setHoveredCell(cellKey)}
                                            onMouseLeave={() => setHoveredCell(null)}
                                        >
                                            {subject ? (
                                                <TimetablePeriodCell
                                                    subject={subject}
                                                    date={cellDate}
                                                    teacher={teacher}
                                                    className={`transition-all duration-200 ${getSubjectStyle(subject)} ${isHovered ? 'shadow-sm scale-[1.03]' : ''}`}
                                                />
                                            ) : (
                                                <span className='text-gray-300 text-xs'>—</span>
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
