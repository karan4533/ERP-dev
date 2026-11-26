import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

async function defaultFetchAttendance(year, month) {
    await new Promise((r) => setTimeout(r, 600))

    const daysInMonth = new Date(year, month, 0).getDate()
    const data = {}

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day)
        const weekday = date.getDay()
        const key = `${year}-${pad(month)}-${pad(day)}`

        if (weekday === 0 || weekday === 6) {
            data[key] = 'H'
        } else {
            data[key] = day % 6 === 0 ? 'A' : 'P'
        }
    }

    return data
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function pad(n) {
    return String(n).padStart(2, '0')
}

function toKey(year, month, day) {
    return `${year}-${pad(month + 1)}-${pad(day)}`
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
            className={`inline-flex items-center justify-center rounded-full font-bold transition-transform hover:scale-110 select-none ${dim} ${BADGE_STYLES[status]}`}
        >
            {status}
        </span>
    )
}

function CalendarCell({ day, isCurrentMonth, isToday, status }) {
    return (
        <div className='relative flex items-center justify-center min-h-[76px] border-r border-b border-slate-100'>
            {isToday && (
                <span className='absolute inset-[5px] rounded-full border-2 border-[#1358CF] bg-[#E5EEFD] pointer-events-none' />
            )}
            <div className='relative flex flex-col items-center gap-1.5'>
                <span
                    className={`text-sm font-semibold leading-none ${!isCurrentMonth ? 'text-slate-300' : isToday ? 'text-[#1358CF]' : 'text-slate-700'}`}
                >
                    {day}
                </span>
                {isCurrentMonth && <StatusBadge status={status} />}
            </div>
        </div>
    )
}

function Legend() {
    return (
        <div className='flex items-center justify-center gap-7 pt-4 mt-4 border-t border-slate-100'>
            {(['P', 'A', 'H']).map((s) => (
                <div key={s} className='flex items-center gap-2'>
                    <StatusBadge status={s} size='sm' />
                    <span className='text-[13px] font-bold text-slate-700 tracking-wide'>
                        {BADGE_LABELS[s]}
                    </span>
                </div>
            ))}
        </div>
    )
}

function CalendarSkeleton({ rows = 6 }) {
    return (
        <div className='grid grid-cols-7 border-t border-l border-slate-100 animate-pulse'>
            {Array.from({ length: rows * 7 }).map((_, i) => (
                <div
                    key={i}
                    className='flex flex-col items-center gap-2 pt-3 pb-2 min-h-[76px] border-r border-b border-slate-100'
                >
                    <span className='w-4 h-3 rounded bg-slate-200' />
                    <span className='w-[34px] h-[34px] rounded-full bg-slate-200' />
                </div>
            ))}
        </div>
    )
}

export default function AttendanceCalendar({
    fetchAttendance = defaultFetchAttendance,
    initialYear,
    initialMonth,
}) {
    const now = new Date()
    const [viewYear, setViewYear] = useState(initialYear ?? now.getFullYear())
    const [viewMonth, setViewMonth] = useState(initialMonth ?? now.getMonth())
    const [attendance, setAttendance] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)

        fetchAttendance(viewYear, viewMonth + 1)
            .then((data) => {
                if (!cancelled) {
                    setAttendance(data ?? {})
                    setLoading(false)
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err.message ?? 'Failed to load attendance')
                    setLoading(false)
                }
            })

        return () => { cancelled = true }
    }, [viewYear, viewMonth, fetchAttendance])

    function prevMonth() {
        if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
        else setViewMonth((m) => m - 1)
    }

    function nextMonth() {
        if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
        else setViewMonth((m) => m + 1)
    }

    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate()

    const cells = []

    for (let i = firstDay - 1; i >= 0; i--) {
        const d = daysInPrev - i
        const pm = viewMonth === 0 ? 11 : viewMonth - 1
        const py = viewMonth === 0 ? viewYear - 1 : viewYear
        cells.push({ day: d, month: pm, year: py, isCurrentMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true })
    }
    let nd = 1
    while (cells.length % 7 !== 0) {
        const nm = viewMonth === 11 ? 0 : viewMonth + 1
        const ny = viewMonth === 11 ? viewYear + 1 : viewYear
        cells.push({ day: nd++, month: nm, year: ny, isCurrentMonth: false })
    }

    return (
        <div className='bg-white rounded-2xl shadow-md p-7 w-full select-none'>
            <div className='flex items-center justify-center gap-5 mb-7'>
                <button
                    type='button'
                    onClick={prevMonth}
                    className='w-9 h-9 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer'
                    aria-label='Previous month'
                >
                    <ChevronLeft size={20} />
                </button>
                <h2 className='text-xl font-bold text-slate-800 min-w-[160px] text-center tracking-tight'>
                    {MONTHS[viewMonth]} {viewYear}
                </h2>
                <button
                    type='button'
                    onClick={nextMonth}
                    className='w-9 h-9 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer'
                    aria-label='Next month'
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className='grid grid-cols-7 mb-1'>
                {DAYS.map((d) => (
                    <div key={d} className='text-center text-[13px] font-semibold text-slate-400 pb-2.5 tracking-wide'>
                        {d}
                    </div>
                ))}
            </div>

            {loading ? (
                <CalendarSkeleton rows={Math.ceil(cells.length / 7)} />
            ) : error ? (
                <div className='flex items-center justify-center h-48 text-red-400 text-sm font-medium'>
                    {error}
                </div>
            ) : (
                <div className='grid grid-cols-7 border-t border-l border-slate-100'>
                    {cells.map((cell, i) => {
                        const key = toKey(cell.year, cell.month, cell.day)
                        const isToday =
                            cell.isCurrentMonth &&
                            cell.day === now.getDate() &&
                            cell.month === now.getMonth() &&
                            cell.year === now.getFullYear()
                        const status = cell.isCurrentMonth ? (attendance[key] ?? null) : null
                        return (
                            <CalendarCell
                                key={i}
                                day={cell.day}
                                isCurrentMonth={cell.isCurrentMonth}
                                isToday={isToday}
                                status={status}
                            />
                        )
                    })}
                </div>
            )}

            <Legend />
        </div>
    )
}
