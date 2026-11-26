import React, { useEffect, useMemo, useState } from 'react'
import {
    CalendarDays,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    Plus,
    Search,
    Clock,
    Sparkles,
    BookOpen,
    Award,
    CheckCircle2,
    X,
    LayoutGrid,
    List,
    Layers,
    MapPin,
    Users
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
    ACADEMIC_EVENT_TYPES,
    getAcademicCalendarRoleConfig,
    getAllCalendarItems,
    addCustomCalendarItem
} from './academicCalendarData'
import { CALENDAR_UPDATED_EVENT } from '../Activities/activitiesData'
import FeedbackState from '../ui/FeedbackState'
import IntegrationNotice from '../ui/IntegrationNotice'
import {
    format,
    formatRangeLabel,
    getItemsForDate,
    getItemsInMonth,
    getMonthCells,
    getUpcomingItems,
    isSameMonth,
    isToday,
    toDateKey,
} from './utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TYPE_KEYS = Object.keys(ACADEMIC_EVENT_TYPES)

const TypeBadge = ({ type }) => {
    const meta = ACADEMIC_EVENT_TYPES[type]
    if (!meta) return null
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-2xs"
            style={{ backgroundColor: meta.soft, color: meta.color }}
        >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
            {meta.label}
        </span>
    )
}

const AcademicCalendarPage = ({ roleKey }) => {
    const roleConfig = getAcademicCalendarRoleConfig(roleKey)
    const [currentDate, setCurrentDate] = useState(() => new Date(2026, 6, 1)) // Jul 2026
    const [selectedDate, setSelectedDate] = useState(null)
    const [activeTypes, setActiveTypes] = useState(() => new Set(TYPE_KEYS))
    const [calendarRefresh, setCalendarRefresh] = useState(0)
    const [viewMode, setViewMode] = useState('month') // 'month', 'agenda'
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddEventModal, setShowAddEventModal] = useState(false)

    // Form state for new custom event
    const [newEventForm, setNewEventForm] = useState({
        title: '',
        type: 'event',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        description: ''
    })

    useEffect(() => {
        const refresh = () => setCalendarRefresh((value) => value + 1)
        window.addEventListener(CALENDAR_UPDATED_EVENT, refresh)
        window.addEventListener('focus', refresh)
        return () => {
            window.removeEventListener(CALENDAR_UPDATED_EVENT, refresh)
            window.removeEventListener('focus', refresh)
        }
    }, [])

    const filteredItems = useMemo(() => {
        void calendarRefresh
        return getAllCalendarItems()
            .filter((item) => activeTypes.has(item.type))
            .filter((item) => {
                if (!searchQuery.trim()) return true
                const q = searchQuery.toLowerCase()
                return (
                    item.title.toLowerCase().includes(q) ||
                    (item.description && item.description.toLowerCase().includes(q))
                )
            })
    }, [activeTypes, calendarRefresh, searchQuery])

    const cells = useMemo(() => getMonthCells(currentDate), [currentDate])
    const monthItems = useMemo(
        () => getItemsInMonth(filteredItems, currentDate),
        [filteredItems, currentDate]
    )
    const upcoming = useMemo(() => getUpcomingItems(filteredItems, new Date(), 10), [filteredItems])
    const selectedItems = useMemo(
        () => (selectedDate ? getItemsForDate(filteredItems, selectedDate) : []),
        [filteredItems, selectedDate]
    )

    const toggleType = (key) => {
        setActiveTypes((prev) => {
            const next = new Set(prev)
            if (next.has(key)) {
                if (next.size === 1) return prev
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    const goPrev = () =>
        setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
    const goNext = () =>
        setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
    const goToday = () => {
        const today = new Date()
        setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
        setSelectedDate(toDateKey(today))
    }

    const handleCreateEvent = (e) => {
        e.preventDefault()
        if (!newEventForm.title.trim()) {
            toast.error('Event title is required.')
            return
        }
        addCustomCalendarItem({
            title: newEventForm.title.trim(),
            type: newEventForm.type,
            startDate: newEventForm.startDate,
            endDate: newEventForm.endDate || newEventForm.startDate,
            description: newEventForm.description.trim()
        })
        setCalendarRefresh((k) => k + 1)
        setShowAddEventModal(false)
        setNewEventForm({
            title: '',
            type: 'event',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            description: ''
        })
        toast.success('Academic event scheduled and added to calendar!')
    }

    if (!roleConfig) {
        return (
            <FeedbackState kind='permission' title='Academic calendar unavailable' description='Calendar visibility is not configured for this role.' />
        )
    }

    const pageTitle = roleConfig.pageTitle ?? 'Academic Calendar'

    return (
        <div className="space-y-6 font-inter pb-8">
            {/* Redesigned Modern Calendar Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                        <CalendarDays size={26} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                                {pageTitle}
                            </h1>
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
                                Term 2 (2026–27)
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Interactive schedule of holidays, exams, sports, and institutional milestones.
                        </p>
                    </div>
                </div>

                {/* View Switcher & Date Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* View Switcher */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setViewMode('month')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'month'
                                    ? 'bg-white text-indigo-700 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <LayoutGrid size={13} /> Month
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('agenda')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                viewMode === 'agenda'
                                    ? 'bg-white text-indigo-700 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <List size={13} /> Agenda
                        </button>
                    </div>

                    {/* Today Button */}
                    <button
                        type="button"
                        onClick={goToday}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                    >
                        Today
                    </button>

                    {/* Prev / Next Month Navigator */}
                    <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs">
                        <button
                            type="button"
                            onClick={goPrev}
                            className="p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-l-xl transition cursor-pointer"
                            aria-label="Previous month"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="min-w-[130px] px-2 text-center text-xs font-bold text-slate-900">
                            {format(currentDate, 'MMMM yyyy')}
                        </span>
                        <button
                            type="button"
                            onClick={goNext}
                            className="p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-r-xl transition cursor-pointer"
                            aria-label="Next month"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Add Event Button for Authorized Roles */}
                    {['superAdmin', 'admin', 'principal', 'coordinator'].includes(roleKey) && (
                        <button
                            type="button"
                            onClick={() => setShowAddEventModal(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
                        >
                            <Plus size={14} /> Schedule Event
                        </button>
                    )}
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                        Category:
                    </span>
                    {TYPE_KEYS.map((key) => {
                        const meta = ACADEMIC_EVENT_TYPES[key]
                        const active = activeTypes.has(key)
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => toggleType(key)}
                                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                    active
                                        ? 'border-transparent text-white shadow-2xs'
                                        : 'bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                                style={
                                    active
                                        ? { backgroundColor: meta.color, borderColor: meta.color }
                                        : { borderColor: meta.border }
                                }
                            >
                                <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: active ? '#fff' : meta.color }}
                                />
                                {meta.label}
                            </button>
                        )
                    })}
                </div>

                <div className="relative min-w-[220px]">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search events, exams, breaks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* VIEW MODE: MONTH GRID */}
            {viewMode === 'month' && (
                <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                    {/* Calendar Month Grid */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                        <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/70">
                            {WEEKDAYS.map((day) => (
                                <div
                                    key={day}
                                    className="py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 auto-rows-fr">
                            {cells.map((day) => {
                                const key = toDateKey(day)
                                const inMonth = isSameMonth(day, currentDate)
                                const dayItems = getItemsForDate(filteredItems, day)
                                const selected = selectedDate === key
                                const today = isToday(day)
                                const visibleChips = dayItems.slice(0, 3)
                                const extra = dayItems.length - visibleChips.length

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelectedDate(key)}
                                        className={`min-h-[105px] border-b border-r border-slate-100 p-2 text-left transition-all sm:min-h-[118px] cursor-pointer ${
                                            selected
                                                ? 'bg-indigo-50/50 ring-2 ring-indigo-500 ring-inset'
                                                : 'hover:bg-slate-50/80'
                                        } ${!inMonth ? 'bg-slate-50/40 text-slate-300' : 'bg-white'}`}
                                    >
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <span
                                                className={`inline-flex size-6.5 items-center justify-center rounded-full text-xs font-bold ${
                                                    today
                                                        ? 'bg-indigo-600 text-white shadow-2xs'
                                                        : inMonth
                                                        ? 'text-slate-800'
                                                        : 'text-slate-300'
                                                }`}
                                            >
                                                {format(day, 'd')}
                                            </span>
                                            {dayItems.length > 0 && (
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {dayItems.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            {visibleChips.map((item) => {
                                                const meta = ACADEMIC_EVENT_TYPES[item.type]
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-tight"
                                                        style={{
                                                            backgroundColor: meta.soft,
                                                            color: meta.color,
                                                        }}
                                                        title={item.title}
                                                    >
                                                        {item.title}
                                                    </div>
                                                )
                                            })}
                                            {extra > 0 && (
                                                <p className="px-1 text-[10px] font-bold text-slate-400">
                                                    +{extra} more
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right Side: Selected Date & Monthly Feed */}
                    <div className="space-y-5">
                        {/* Selected Date Card */}
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                            <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                                {selectedDate
                                    ? `Events on ${formatRangeLabel(selectedDate, selectedDate)}`
                                    : 'Select a Date on the Grid'}
                            </h3>
                            {!selectedDate ? (
                                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                                    Click any date on the calendar grid to inspect its academic events, exams, or holiday notices.
                                </p>
                            ) : selectedItems.length === 0 ? (
                                <p className="text-xs text-slate-500 mt-3">No academic events scheduled on this day.</p>
                            ) : (
                                <div className="space-y-3 mt-3">
                                    {selectedItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-xl border border-slate-100 p-3 bg-slate-50/50"
                                            style={{
                                                borderLeftWidth: 3,
                                                borderLeftColor: ACADEMIC_EVENT_TYPES[item.type]?.color || '#515DEF',
                                            }}
                                        >
                                            <div className="mb-1 flex items-center justify-between">
                                                <TypeBadge type={item.type} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-900 mt-1">{item.title}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                {formatRangeLabel(item.startDate, item.endDate)}
                                            </p>
                                            {item.description && (
                                                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-1.5">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upcoming Events Mini-feed */}
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                                <Sparkles size={15} className="text-indigo-600" />
                                <h3 className="text-xs font-bold text-slate-900">Upcoming Highlights</h3>
                            </div>
                            {upcoming.length === 0 ? (
                                <p className="text-xs text-slate-500">No upcoming academic milestones scheduled.</p>
                            ) : (
                                <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                    {upcoming.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                type="button"
                                                className="flex w-full items-start gap-2.5 rounded-xl p-2 text-left hover:bg-slate-50 transition cursor-pointer"
                                                onClick={() => {
                                                    const d = new Date(`${item.startDate}T00:00:00`)
                                                    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1))
                                                    setSelectedDate(item.startDate)
                                                }}
                                            >
                                                <span
                                                    className="mt-1 size-2 shrink-0 rounded-full"
                                                    style={{ backgroundColor: ACADEMIC_EVENT_TYPES[item.type]?.color }}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-bold text-slate-800">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        {ACADEMIC_EVENT_TYPES[item.type]?.label} · {formatRangeLabel(item.startDate, item.endDate)}
                                                    </p>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW MODE: AGENDA / TIMELINE LIST */}
            {viewMode === 'agenda' && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                        <h2 className="text-base font-bold text-slate-900">Chronological Event Timeline</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Full academic calendar agenda in sequence of execution.
                        </p>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredItems.map((item) => {
                            const meta = ACADEMIC_EVENT_TYPES[item.type] || ACADEMIC_EVENT_TYPES.event
                            return (
                                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 p-3 rounded-xl transition">
                                    <div className="flex items-start gap-4">
                                        <div className="size-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center shrink-0 text-indigo-700">
                                            <span className="text-[10px] uppercase font-bold tracking-wider">
                                                {format(new Date(`${item.startDate}T00:00:00`), 'MMM')}
                                            </span>
                                            <span className="text-base font-bold leading-none mt-0.5">
                                                {format(new Date(`${item.startDate}T00:00:00`), 'dd')}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                                                <TypeBadge type={item.type} />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Duration: <strong>{formatRangeLabel(item.startDate, item.endDate)}</strong>
                                            </p>
                                            {item.description && (
                                                <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const d = new Date(`${item.startDate}T00:00:00`)
                                                setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1))
                                                setSelectedDate(item.startDate)
                                                setViewMode('month')
                                            }}
                                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                        >
                                            View in Month Grid
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* SCHEDULE NEW ACADEMIC EVENT MODAL */}
            {showAddEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                            <h3 className="text-base font-bold text-slate-900">Schedule Academic Event</h3>
                            <button
                                type="button"
                                onClick={() => setShowAddEventModal(false)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="space-y-3.5">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Event / Assessment Title</label>
                                <input
                                    type="text"
                                    value={newEventForm.title}
                                    onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                                    placeholder="e.g. Mid-Term Chemistry Practical Exam"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Event Category</label>
                                <select
                                    value={newEventForm.type}
                                    onChange={(e) => setNewEventForm({ ...newEventForm, type: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="event">School & Cultural Event</option>
                                    <option value="exam">Examination / Assessment</option>
                                    <option value="holiday">School Holiday / Break</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={newEventForm.startDate}
                                        onChange={(e) => setNewEventForm({ ...newEventForm, startDate: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={newEventForm.endDate}
                                        onChange={(e) => setNewEventForm({ ...newEventForm, endDate: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Description & Guidelines</label>
                                <textarea
                                    rows={3}
                                    value={newEventForm.description}
                                    onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })}
                                    placeholder="Notes, participating classes, or holiday announcements..."
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddEventModal(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                                >
                                    Add to Calendar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AcademicCalendarPage
