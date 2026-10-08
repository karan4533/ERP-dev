import { useMemo, useState } from 'react'
import { addDays, addWeeks, format, isToday, startOfWeek, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { WEEKLY_DAYS, TIME_SLOTS, WEEKLY_SCHEDULE, SUBJECT_COLORS, TEACHER_TIMETABLE_INFO } from '../classRoutineData'
import TimetablePeriodCell from '../../../../Common/ClassTimetable/TimetablePeriodCell'

const TeacherWeeklyTimetable = ({ weekDate = new Date() }) => {
    const [hoveredCell, setHoveredCell] = useState(null)
    const [currentWeekDate, setCurrentWeekDate] = useState(weekDate)

    const dayDates = useMemo(() => {
        const weekStart = startOfWeek(currentWeekDate, { weekStartsOn: 1 })
        return WEEKLY_DAYS.map((_, index) => addDays(weekStart, index))
    }, [currentWeekDate])

    const weekLabel = useMemo(() => {
        const start = dayDates[0]
        const end = dayDates[dayDates.length - 1]
        return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`
    }, [dayDates])

    const getSubjectStyle = (subject) =>
        SUBJECT_COLORS[subject] ?? 'bg-gray-50 text-gray-700 border border-gray-100'

    return (
        <div className='bg-white rounded-2xl shadow-md p-7 w-full select-none'>
            <div className='flex items-center justify-center gap-5 mb-7'>
                <button
                    type='button'
                    onClick={() => setCurrentWeekDate((date) => subWeeks(date, 1))}
                    className='w-9 h-9 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer'
                    aria-label='Previous week'
                >
                    <ChevronLeft size={20} />
                </button>

                <h2 className='text-xl font-bold text-slate-800 min-w-[200px] text-center tracking-tight'>
                    {weekLabel}
                </h2>

                <button
                    type='button'
                    onClick={() => setCurrentWeekDate((date) => addWeeks(date, 1))}
                    className='w-9 h-9 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer'
                    aria-label='Next week'
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className='overflow-x-auto'>
                <table className='w-full min-w-[760px] border-collapse border-t border-l border-slate-100'>
                    <thead>
                        <tr>
                            <th className='w-[140px] border-r border-b border-slate-100 bg-[#EDEEF5] py-3' />
                            {WEEKLY_DAYS.map((day, index) => {
                                const date = dayDates[index]
                                const today = isToday(date)
                                return (
                                    <th
                                        key={day}
                                        className='border-r border-b border-slate-100 py-4 px-3 text-center last:border-r-0 bg-[#EDEEF5]'
                                    >
                                        <div className='flex flex-col items-center gap-1'>
                                            <span className={`text-sm font-semibold tracking-wide ${today ? 'text-[#515DEF]' : 'text-slate-700'}`}>
                                                {day}
                                            </span>
                                            <span
                                                className={`text-xs font-medium ${today
                                                    ? 'rounded-full bg-[#515DEF] px-2.5 py-0.5 text-white'
                                                    : 'text-slate-400'
                                                    }`}
                                            >
                                                {format(date, 'd MMM')}
                                            </span>
                                        </div>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {TIME_SLOTS.map((slot, rowIdx) => (
                            <tr key={slot.label}>
                                <td className='border-r border-b border-slate-100 px-4 py-6 text-center align-middle bg-white'>
                                    <span className='text-xs font-semibold text-[#515DEF] leading-relaxed whitespace-pre-line'>
                                        {slot.time}
                                    </span>
                                </td>
                                {WEEKLY_DAYS.map((day, colIdx) => {
                                    const entry = WEEKLY_SCHEDULE[slot.label]?.[day]
                                    const cellDate = dayDates[colIdx]
                                    const cellKey = `${rowIdx}-${colIdx}`
                                    const isHovered = hoveredCell === cellKey

                                    return (
                                        <td
                                            key={day}
                                            className='border-r border-b border-slate-100 p-2 text-center align-middle last:border-r-0'
                                            onMouseEnter={() => setHoveredCell(cellKey)}
                                            onMouseLeave={() => setHoveredCell(null)}
                                        >
                                            {entry ? (
                                                <TimetablePeriodCell
                                                    subject={entry.subject}
                                                    date={cellDate}
                                                    teacher={entry.teacher || TEACHER_TIMETABLE_INFO.teacherName}
                                                    className={`transition-all duration-200 ${getSubjectStyle(entry.subject)} ${isHovered ? 'shadow-sm scale-[1.03]' : ''}`}
                                                />
                                            ) : (
                                                <span className='text-slate-300 text-xs'>—</span>
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className='flex items-center justify-center gap-6 pt-4 mt-4 border-t border-slate-100'>
                {Object.entries(SUBJECT_COLORS).map(([subject, style]) => (
                    <div key={subject} className='flex items-center gap-2'>
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${style}`}>{subject}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TeacherWeeklyTimetable
