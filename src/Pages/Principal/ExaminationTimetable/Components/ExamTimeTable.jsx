import { useState } from 'react'

const DEFAULT_DAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
]

const DEFAULT_TIME_SLOTS = [
    { time: '10:30 AM -\n12:30 PM', label: '10:30 AM - 12:30 PM' },
    { time: '02:30 PM -\n04:30 PM', label: '02:30 PM - 04:30 PM' },
]

const DEFAULT_SCHEDULE = {
    '10:30 AM - 12:30 PM': {
        Monday: { subject: 'Tamil', date: '02/05/2026' },
        Tuesday: { subject: 'Science', date: '03/05/2026' },
        Wednesday: { subject: 'Social', date: '04/05/2026' },
        Thursday: { subject: 'EVS', date: '05/05/2026' },
        Friday: { subject: 'Hindi', date: '06/05/2026' },
    },
    '02:30 PM - 04:30 PM': {
        Monday: { subject: 'English', date: '02/05/2026' },
        Tuesday: { subject: 'French', date: '03/05/2026' },
        Wednesday: { subject: 'Maths', date: '04/05/2026' },
        Thursday: { subject: 'GK', date: '05/05/2026' },
    },
}

const DEFAULT_SUBJECT_COLORS = {
    Tamil: 'bg-emerald-50 text-emerald-700',
    Science: 'bg-purple-50 text-purple-700',
    Social: 'bg-amber-50 text-amber-700',
    EVS: 'bg-teal-50 text-teal-700',
    Hindi: 'bg-orange-50 text-orange-700',
    English: 'bg-rose-50 text-rose-700',
    French: 'bg-sky-50 text-sky-700',
    Maths: 'bg-blue-50 text-blue-700',
    GK: 'bg-fuchsia-50 text-fuchsia-700',
}

export default function ExamTimeTable({
    days = DEFAULT_DAYS,
    timeSlots = DEFAULT_TIME_SLOTS,
    schedule = DEFAULT_SCHEDULE,
    subjectColors = DEFAULT_SUBJECT_COLORS,
}) {
    const [hoveredCell, setHoveredCell] = useState(null)

    const getSubjectStyle = (subject) =>
        subjectColors[subject] ?? 'bg-gray-50 text-gray-700'

    return (
        <div className='w-full bg-white rounded-2xl border border-gray-200 overflow-hidden font-sans'>
            <div className='overflow-x-auto'>
                <table className='w-full min-w-[700px] border-collapse'>
                    <thead>
                        <tr>
                            <th className='w-[140px] border-r border-b border-gray-200' />
                            {days.map((day) => (
                                <th
                                    key={day}
                                    className='border-r border-b border-gray-200 py-4 px-3 text-center last:border-r-0'
                                >
                                    <span className='text-sm font-semibold tracking-wide text-gray-700'>
                                        {day}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {timeSlots.map((slot, rowIdx) => (
                            <tr key={slot.label} className='group'>
                                <td className='border-r border-b border-gray-200 px-4 py-6 text-center align-middle last:border-b-0'>
                                    <span className='text-xs font-semibold text-indigo-500 leading-relaxed whitespace-pre-line'>
                                        {slot.time}
                                    </span>
                                </td>

                                {days.map((day, colIdx) => {
                                    const exam = schedule[slot.label]?.[day]
                                    const cellKey = `${rowIdx}-${colIdx}`
                                    const isHovered = hoveredCell === cellKey

                                    return (
                                        <td
                                            key={day}
                                            className='border-r border-b border-gray-200 p-2 text-center align-middle last:border-r-0'
                                            onMouseEnter={() => setHoveredCell(cellKey)}
                                            onMouseLeave={() => setHoveredCell(null)}
                                        >
                                            {exam ? (
                                                <div
                                                    className={`inline-flex flex-col items-center justify-center gap-1 w-full py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${getSubjectStyle(exam.subject)} ${isHovered ? 'shadow-sm scale-[1.03]' : ''}`}
                                                >
                                                    <span>{exam.subject}</span>
                                                    <span className='text-xs font-normal opacity-80'>
                                                        {exam.date}
                                                    </span>
                                                </div>
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
