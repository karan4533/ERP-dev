import React, { useEffect, useMemo, useState } from 'react'
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Filter,
    Plus,
} from 'lucide-react'
import {
    ACADEMIC_EVENT_TYPES,
    canWriteCalendar,
    createCalendarEventViaApi,
    getAcademicCalendarRoleConfig,
    getAllCalendarItems,
    hydrateCalendarFromApi,
} from './academicCalendarData'
import { canUseCalendarApi } from '../../services/calendarApi'
import { CALENDAR_UPDATED_EVENT } from '../Activities/activitiesData'
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
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: meta.soft, color: meta.color }}
        >
            {meta.label}
        </span>
    )
}

const emptyEventForm = () => ({
    type: 'event',
    title: '',
    startDate: '',
    endDate: '',
    description: '',
})

const AcademicCalendarPage = ({ roleKey }) => {
    const roleConfig = getAcademicCalendarRoleConfig(roleKey)
    const showAddForm = canWriteCalendar(roleKey) && canUseCalendarApi()
    const [currentDate, setCurrentDate] = useState(() => new Date()) // live month — never pinned to demo sample year
    const [selectedDate, setSelectedDate] = useState(null)
    const [activeTypes, setActiveTypes] = useState(() => new Set(TYPE_KEYS))
    const [calendarRefresh, setCalendarRefresh] = useState(0)
    const [serverItems, setServerItems] = useState(null)
    const [loadingCalendar, setLoadingCalendar] = useState(canUseCalendarApi())
    const [loadError, setLoadError] = useState('')
    const [eventForm, setEventForm] = useState(emptyEventForm)
    const [formError, setFormError] = useState('')
    const [formSaving, setFormSaving] = useState(false)
    const [formOpen, setFormOpen] = useState(false)

    useEffect(() => {
        const refresh = () => setCalendarRefresh((value) => value + 1)
        window.addEventListener(CALENDAR_UPDATED_EVENT, refresh)
        window.addEventListener('focus', refresh)
        return () => {
            window.removeEventListener(CALENDAR_UPDATED_EVENT, refresh)
            window.removeEventListener('focus', refresh)
        }
    }, [])

    useEffect(() => {
        if (!canUseCalendarApi()) {
            setLoadingCalendar(false)
            return undefined
        }
        let active = true
        setLoadingCalendar(true)
        hydrateCalendarFromApi()
            .then((rows) => {
                if (active) {
                    setServerItems(Array.isArray(rows) ? rows : [])
                    setLoadError('')
                    setCalendarRefresh((value) => value + 1)
                }
            })
            .catch((error) => {
                if (active) {
                    setServerItems([])
                    setLoadError(error?.message || 'The calendar could not be loaded from the API.')
                }
            })
            .finally(() => {
                if (active) setLoadingCalendar(false)
            })
        return () => {
            active = false
        }
    }, [])

    const handleCreateEvent = async (event) => {
        event.preventDefault()
        if (!showAddForm) return
        setFormError('')
        if (!eventForm.title.trim() || !eventForm.startDate) {
            setFormError('Title and start date are required.')
            return
        }
        setFormSaving(true)
        try {
            const rows = await createCalendarEventViaApi({
                type: eventForm.type,
                title: eventForm.title,
                startDate: eventForm.startDate,
                endDate: eventForm.endDate || undefined,
                description: eventForm.description,
            })
            setServerItems(rows)
            setEventForm(emptyEventForm())
            setFormOpen(false)
            setCalendarRefresh((value) => value + 1)
        } catch (error) {
            setFormError(error?.message || 'Could not create the event.')
        } finally {
            setFormSaving(false)
        }
    }

    const filteredItems = useMemo(() => {
        void calendarRefresh
        // API mode: only server payload (incl. activity overlays from GET /calendar). Never static ACADEMIC_CALENDAR_ITEMS.
        const source = canUseCalendarApi()
            ? (serverItems ?? getAllCalendarItems())
            : getAllCalendarItems()
        return source.filter((item) => activeTypes.has(item.type))
    }, [activeTypes, calendarRefresh, serverItems])

    const cells = useMemo(() => getMonthCells(currentDate), [currentDate])
    const monthItems = useMemo(
        () => getItemsInMonth(filteredItems, currentDate),
        [filteredItems, currentDate]
    )
    const upcoming = useMemo(() => getUpcomingItems(filteredItems, new Date(), 8), [filteredItems])
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

    if (!roleConfig) {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-md text-[#667085]">
                Academic Calendar is not configured for this role.
            </div>
        )
    }

    const pageTitle = roleConfig.pageTitle ?? 'Academic Calendar'

    return (
        <div className="space-y-4 font-inter">
            <div className="rounded-2xl bg-white p-4 shadow-md sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[#0C1E5B]">{pageTitle}</h2>
                        <p className="mt-0.5 text-sm text-[#667085]">
                            View holidays, exam timelines, and school events including Cultural, Sports & Competition activities.
                        </p>
                        {loadingCalendar ? (
                            <p className="mt-1 text-sm text-[#667085]">Loading calendar from the server…</p>
                        ) : null}
                        {loadError ? <p className="mt-1 text-sm text-[#B42318]">{loadError}</p> : null}
                        {!loadingCalendar && canUseCalendarApi() && !loadError && filteredItems.length === 0 ? (
                            <p className="mt-1 text-sm text-[#667085]">
                                No calendar events yet. Use Add Event to create holidays, exams, or school events.
                            </p>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {showAddForm ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setFormOpen((open) => !open)
                                    setFormError('')
                                }}
                                className="inline-flex items-center gap-1.5 rounded-md bg-[#515DEF] px-3 py-2 text-sm font-medium text-white hover:bg-[#4048C9]"
                            >
                                <Plus size={16} />
                                Add Event
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={goToday}
                            className="rounded-md border border-[#D0D5DD] px-3 py-2 text-sm font-medium text-[#344054] hover:bg-[#F9FAFB]"
                        >
                            Today
                        </button>
                        <div className="flex items-center rounded-md border border-[#D0D5DD]">
                            <button
                                type="button"
                                onClick={goPrev}
                                className="p-2 text-[#667085] hover:bg-[#F9FAFB]"
                                aria-label="Previous month"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="min-w-[140px] px-2 text-center text-sm font-semibold text-[#101828]">
                                {format(currentDate, 'MMMM yyyy')}
                            </span>
                            <button
                                type="button"
                                onClick={goNext}
                                className="p-2 text-[#667085] hover:bg-[#F9FAFB]"
                                aria-label="Next month"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {showAddForm && formOpen ? (
                    <form
                        onSubmit={handleCreateEvent}
                        className="mt-4 grid gap-3 rounded-xl border border-[#E4E7EC] bg-[#F8F9FC] p-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <label className="block text-xs font-medium text-[#344054]">
                            Type
                            <select
                                value={eventForm.type}
                                onChange={(e) => setEventForm((prev) => ({ ...prev, type: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#101828]"
                            >
                                {TYPE_KEYS.map((key) => (
                                    <option key={key} value={key}>
                                        {ACADEMIC_EVENT_TYPES[key].label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-xs font-medium text-[#344054] sm:col-span-2 lg:col-span-2">
                            Title
                            <input
                                type="text"
                                value={eventForm.title}
                                onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#101828]"
                                placeholder="e.g. Staff meeting"
                                required
                            />
                        </label>
                        <label className="block text-xs font-medium text-[#344054]">
                            Start date
                            <input
                                type="date"
                                value={eventForm.startDate}
                                onChange={(e) => setEventForm((prev) => ({ ...prev, startDate: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#101828]"
                                required
                            />
                        </label>
                        <label className="block text-xs font-medium text-[#344054]">
                            End date
                            <input
                                type="date"
                                value={eventForm.endDate}
                                onChange={(e) => setEventForm((prev) => ({ ...prev, endDate: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#101828]"
                            />
                        </label>
                        <label className="block text-xs font-medium text-[#344054] sm:col-span-2 lg:col-span-3">
                            Description
                            <textarea
                                value={eventForm.description}
                                onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                                rows={2}
                                className="mt-1 w-full rounded-md border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#101828]"
                                placeholder="Optional details"
                            />
                        </label>
                        {formError ? (
                            <p className="text-sm text-[#B42318] sm:col-span-2 lg:col-span-3">{formError}</p>
                        ) : null}
                        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                            <button
                                type="submit"
                                disabled={formSaving}
                                className="rounded-md bg-[#515DEF] px-4 py-2 text-sm font-medium text-white hover:bg-[#4048C9] disabled:opacity-60"
                            >
                                {formSaving ? 'Saving…' : 'Save event'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setFormOpen(false)
                                    setFormError('')
                                    setEventForm(emptyEventForm())
                                }}
                                className="rounded-md border border-[#D0D5DD] px-4 py-2 text-sm font-medium text-[#344054] hover:bg-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#667085]">
                        <Filter size={14} /> Show:
                    </span>
                    {TYPE_KEYS.map((key) => {
                        const meta = ACADEMIC_EVENT_TYPES[key]
                        const active = activeTypes.has(key)
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => toggleType(key)}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    active ? 'border-transparent text-white' : 'bg-white text-[#667085]'
                                }`}
                                style={
                                    active
                                        ? { backgroundColor: meta.color, borderColor: meta.color }
                                        : { borderColor: meta.border }
                                }
                            >
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: active ? '#fff' : meta.color }}
                                />
                                {meta.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
                <div className="overflow-hidden rounded-2xl bg-white shadow-md">
                    <div className="grid grid-cols-7 border-b border-[#E4E7EC] bg-[#F8F9FC]">
                        {WEEKDAYS.map((day) => (
                            <div
                                key={day}
                                className="px-1 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-[#667085]"
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
                                    className={`min-h-[96px] border-b border-r border-[#F2F4F7] p-1.5 text-left transition-colors sm:min-h-[110px] sm:p-2 ${
                                        selected ? 'bg-[#F0F1FF]' : 'hover:bg-[#F9FAFB]'
                                    } ${!inMonth ? 'bg-[#FCFCFD]' : 'bg-white'}`}
                                >
                                    <div className="mb-1 flex items-center justify-between">
                                        <span
                                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                                today
                                                    ? 'bg-[#515DEF] text-white'
                                                    : inMonth
                                                      ? 'text-[#101828]'
                                                      : 'text-[#D0D5DD]'
                                            }`}
                                        >
                                            {format(day, 'd')}
                                        </span>
                                        {dayItems.length > 0 && (
                                            <span className="text-[10px] font-medium text-[#98A2B3]">
                                                {dayItems.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        {visibleChips.map((item) => {
                                            const meta = ACADEMIC_EVENT_TYPES[item.type]
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight"
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
                                            <p className="px-1 text-[10px] font-medium text-[#98A2B3]">
                                                +{extra} more
                                            </p>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl bg-white p-4 shadow-md">
                        <h3 className="mb-3 text-sm font-semibold text-[#0C1E5B]">
                            {selectedDate
                                ? `On ${formatRangeLabel(selectedDate, selectedDate)}`
                                : 'Select a date'}
                        </h3>
                        {!selectedDate ? (
                            <p className="text-sm text-[#667085]">
                                Click a day on the calendar to see holidays, exam timelines, and events.
                            </p>
                        ) : selectedItems.length === 0 ? (
                            <p className="text-sm text-[#667085]">No academic items on this date.</p>
                        ) : (
                            <ul className="space-y-3">
                                {selectedItems.map((item) => (
                                    <li
                                        key={item.id}
                                        className="rounded-xl border border-[#E4E7EC] p-3"
                                        style={{
                                            borderLeftWidth: 3,
                                            borderLeftColor: ACADEMIC_EVENT_TYPES[item.type].color,
                                        }}
                                    >
                                        <div className="mb-1 flex items-center gap-2">
                                            <TypeBadge type={item.type} />
                                        </div>
                                        <p className="text-sm font-semibold text-[#101828]">{item.title}</p>
                                        <p className="mt-0.5 text-xs text-[#667085]">
                                            {formatRangeLabel(item.startDate, item.endDate)}
                                        </p>
                                        {item.description && (
                                            <p className="mt-1.5 text-xs leading-relaxed text-[#667085]">
                                                {item.description}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-md">
                        <div className="mb-3 flex items-center gap-2">
                            <CalendarDays size={16} className="text-[#515DEF]" />
                            <h3 className="text-sm font-semibold text-[#0C1E5B]">This month</h3>
                        </div>
                        {monthItems.length === 0 ? (
                            <p className="text-sm text-[#667085]">No items in this month for selected filters.</p>
                        ) : (
                            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                {monthItems.map((item) => (
                                    <li key={item.id} className="flex gap-2 text-sm">
                                        <span
                                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                                            style={{ backgroundColor: ACADEMIC_EVENT_TYPES[item.type].color }}
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-[#101828]">{item.title}</p>
                                            <p className="text-xs text-[#667085]">
                                                {formatRangeLabel(item.startDate, item.endDate)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-md">
                        <h3 className="mb-3 text-sm font-semibold text-[#0C1E5B]">Upcoming</h3>
                        {upcoming.length === 0 ? (
                            <p className="text-sm text-[#667085]">No upcoming items.</p>
                        ) : (
                            <ul className="space-y-2">
                                {upcoming.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex cursor-pointer gap-2 rounded-lg p-1.5 hover:bg-[#F9FAFB]"
                                        onClick={() => {
                                            const d = new Date(`${item.startDate}T00:00:00`)
                                            setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1))
                                            setSelectedDate(item.startDate)
                                        }}
                                    >
                                        <span
                                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                                            style={{ backgroundColor: ACADEMIC_EVENT_TYPES[item.type].color }}
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-[#101828]">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-[#667085]">
                                                {ACADEMIC_EVENT_TYPES[item.type].label} ·{' '}
                                                {formatRangeLabel(item.startDate, item.endDate)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AcademicCalendarPage
