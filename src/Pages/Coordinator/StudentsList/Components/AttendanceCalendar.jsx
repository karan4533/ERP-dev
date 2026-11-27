import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function pad(n) {
    return String(n).padStart(2, '0')
}

function toKey(year, monthIndex, day) {
    return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

const BADGE_STYLES = {
    P: 'bg-[#e6f6e7] text-[#619D73]',
    A: 'bg-red-100 text-red-400',
    H: 'bg-slate-200 text-slate-400',
}

const BADGE_LABELS = { P: 'Present', A: 'Absent', H: 'Holiday' }

function StatusBadge({ status, size = 'md' }) {
    if (!status) return null
    const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-[34px] h-[34px] text-sm'
    return (
        <span
            className={`inline-flex items-center justify-center rounded-full font-bold select-none ${dim} ${BADGE_STYLES[status]}`}
        >
            {status}
        </span>
    )
}

/**
 * Controlled month calendar. `month` is 1-indexed. `attendance` is { "YYYY-MM-DD": "P"|"A"|"H" }.
 */
export default function AttendanceCalendar({ year, month, attendance = {} }) {
    const viewYear = year
    const viewMonth = Math.max(0, (month || 1) - 1)
    const today = new Date()
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate()

    const cells = []
    for (let i = firstDay - 1; i >= 0; i--) {
        cells.push({ day: daysInPrev - i, isCurrentMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, isCurrentMonth: true })
    }
    while (cells.length % 7 !== 0) {
        cells.push({ day: cells.length - (firstDay + daysInMonth) + 1, isCurrentMonth: false })
    }

    return (
        <div>
            <div className='flex items-center justify-between mb-3'>
                <h3 className='text-base font-semibold text-black'>
                    {MONTHS[viewMonth]} {viewYear}
                </h3>
                <div className='flex gap-2 text-[#667085]'>
                    <ChevronLeft size={18} className='opacity-30' />
                    <ChevronRight size={18} className='opacity-30' />
                </div>
            </div>
            <div className='grid grid-cols-7 text-center text-xs font-semibold text-[#667085] mb-1'>
                {DAYS.map((day) => <div key={day} className='py-2'>{day}</div>)}
            </div>
            <div className='grid grid-cols-7 border-t border-l border-slate-100'>
                {cells.map((cell, index) => {
                    const key = cell.isCurrentMonth ? toKey(viewYear, viewMonth, cell.day) : `pad-${index}`
                    const status = cell.isCurrentMonth ? attendance[key] || null : null
                    const isToday = cell.isCurrentMonth
                        && today.getFullYear() === viewYear
                        && today.getMonth() === viewMonth
                        && today.getDate() === cell.day
                    return (
                        <div key={key} className='relative flex items-center justify-center min-h-[76px] border-r border-b border-slate-100'>
                            {isToday ? (
                                <span className='absolute inset-[5px] rounded-full border-2 border-[#1358CF] bg-[#E5EEFD] pointer-events-none' />
                            ) : null}
                            <div className='relative flex flex-col items-center gap-1.5'>
                                <span className={`text-sm font-semibold leading-none ${!cell.isCurrentMonth ? 'text-slate-300' : isToday ? 'text-[#1358CF]' : 'text-slate-700'}`}>
                                    {cell.day}
                                </span>
                                {cell.isCurrentMonth ? <StatusBadge status={status} /> : null}
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className='flex items-center justify-center gap-7 pt-4 mt-4 border-t border-slate-100'>
                {(['P', 'A', 'H']).map((code) => (
                    <div key={code} className='flex items-center gap-2'>
                        <StatusBadge status={code} size='sm' />
                        <span className='text-[13px] font-bold text-slate-700'>{BADGE_LABELS[code]}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
