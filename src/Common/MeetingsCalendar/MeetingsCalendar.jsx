import { useCallback, useState } from "react";
import { SNAP_OPTIONS, VIEW_BTNS } from "./utils/constants";
import { generateId, toDateKey, toMinutes } from "./utils/dateHelpers";
import { useCalendarState } from "./hooks/useCalendarState";
import EventModal from "./Components/EventModal";
import MonthView from "./Components/MonthView";
import WeekView from "./Components/WeekView";
import DayView from "./Components/DayView";
import Sidebar from "./Components/Sidebar";

export default function MeetingsCalendar({
    seedEvents = [],
    embedded = false,
    title = 'Meetings',
    showCreateButton = true,
}) {
    const { view, setView, currentDate, setCurrentDate, navigate, goToday, goToDay, headerLabel } =
        useCalendarState("week");

    const [events, setEvents] = useState(seedEvents);
    const [modal, setModal] = useState(null); // { mode: "create"|"edit", event }
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [snapMinutes, setSnapMinutes] = useState(SNAP_OPTIONS[0]);

    // Stable callbacks so the memoized view components don't re-render needlessly.
    const openCreateModal = useCallback((date, startTime = "09:00", endTime = "10:00") => {
        setModal({
            mode: "create",
            event: {
                id: null,
                title: "",
                description: "",
                date: date instanceof Date ? toDateKey(date) : date,
                startTime,
                endTime,
                colorIdx: 0,
            },
        });
    }, []);

    const openEditModal = useCallback((ev) => {
        setModal({ mode: "edit", event: ev });
    }, []);

    const closeModal = useCallback(() => setModal(null), []);

    // Note: keep state updates flat. Calling setEvents inside a setModal updater
    // makes the updater impure, so React StrictMode runs it twice and the event
    // gets created (or mutated) twice.
    const handleSave = useCallback((form) => {
        if (!modal) return;
        if (modal.mode === "create") {
            setEvents((prev) => [...prev, { ...form, id: generateId() }]);
        } else {
            setEvents((prev) => prev.map((e) => (e.id === modal.event.id ? { ...form, id: e.id } : e)));
        }
        setModal(null);
    }, [modal]);

    const handleDelete = useCallback(() => {
        if (!modal) return;
        setEvents((prev) => prev.filter((e) => e.id !== modal.event.id));
        setModal(null);
    }, [modal]);

    // Reschedule / resize from drag-and-drop. Rejects updates that would make the
    // meeting end before it starts so invalid scheduling never persists.
    const handleEventUpdate = useCallback((id, patch) => {
        setEvents((prev) =>
            prev.map((e) => {
                if (e.id !== id) return e;
                const next = { ...e, ...patch };
                if (toMinutes(next.endTime) <= toMinutes(next.startTime)) return e;
                return next;
            })
        );
    }, []);

    const handleMonthDayClick = useCallback((d) => goToDay(d), [goToDay]);

    // Mini-calendar: `switchToDay` distinguishes a day pick from month paging.
    const handleSidebarDateChange = useCallback((d, switchToDay) => {
        if (switchToDay) goToDay(d);
        else setCurrentDate(d);
    }, [goToDay, setCurrentDate]);

    return (
        <div className={`flex flex-col bg-slate-50 font-inter select-none rounded-2xl shadow-lg ${embedded ? 'h-[680px]' : 'h-screen'}`}>
            {/* ── Top bar ── */}
            <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white flex-none rounded-t-2xl">
                {/* Hamburger for sidebar */}
                <button
                    onClick={() => setSidebarOpen((v) => !v)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                    aria-label="Toggle sidebar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Logo / title */}
                <div className="flex items-center gap-2 mr-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-800 hidden sm:block">{title}</span>
                </div>

                {/* Nav */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={goToday}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                        aria-label="Previous"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => navigate(1)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                        aria-label="Next"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <h1 className="text-sm font-semibold text-slate-700 flex-1 min-w-0 truncate">
                    {headerLabel}
                </h1>

                {/* Snap-to-grid selector (only meaningful in week/day) */}
                {view !== "month" && (
                    <label className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
                        Snap
                        <select
                            value={snapMinutes}
                            onChange={(e) => setSnapMinutes(Number(e.target.value))}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            {SNAP_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s} min</option>
                            ))}
                        </select>
                    </label>
                )}

                {/* View switcher */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
                    {VIEW_BTNS.map((btn) => (
                        <button
                            key={btn.key}
                            onClick={() => setView(btn.key)}
                            className={`px-3 py-1.5 transition cursor-pointer ${view === btn.key
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* New meeting */}
                {showCreateButton && (
                <button
                    onClick={() => openCreateModal(currentDate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">New meeting</span>
                </button>
                )}
            </header>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden rounded-b-2xl">
                {/* Calendar area */}
                <main className="flex flex-col flex-1 overflow-hidden bg-white">
                    {view === "month" && (
                        <MonthView
                            currentDate={currentDate}
                            events={events}
                            onDayClick={handleMonthDayClick}
                            onEventClick={openEditModal}
                            onEventUpdate={handleEventUpdate}
                        />
                    )}
                    {view === "week" && (
                        <WeekView
                            currentDate={currentDate}
                            events={events}
                            onSlotClick={openCreateModal}
                            onEventClick={openEditModal}
                            onEventUpdate={handleEventUpdate}
                            snapMinutes={snapMinutes}
                        />
                    )}
                    {view === "day" && (
                        <DayView
                            currentDate={currentDate}
                            events={events}
                            onSlotClick={openCreateModal}
                            onEventClick={openEditModal}
                            onEventUpdate={handleEventUpdate}
                            snapMinutes={snapMinutes}
                        />
                    )}
                </main>

                {/* Sidebar */}
                {sidebarOpen && (
                    <Sidebar
                        events={events}
                        onEventClick={openEditModal}
                        currentDate={currentDate}
                        onDateChange={handleSidebarDateChange}
                    />
                )}
            </div>

            {/* ── Modal ── */}
            {modal && (
                <EventModal
                    mode={modal.mode}
                    event={modal.event}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}
