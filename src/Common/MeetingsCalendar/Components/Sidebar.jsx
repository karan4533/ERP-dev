import { memo, useMemo } from "react";
import { addDays, addMonths, format } from "date-fns";
import { EVENT_COLORS, DAYS_SHORT } from "../utils/constants";
import {
    formatTime,
    getMonthCells,
    isSameDay,
    isToday,
    parseDateKey,
    toDateKey,
    toMinutes,
} from "../utils/dateHelpers";

function Sidebar({ events, onEventClick, currentDate, onDateChange }) {
    const upcoming = useMemo(() => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return [...events]
            .filter((e) => parseDateKey(e.date) >= t)
            .sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return toMinutes(a.startTime) - toMinutes(b.startTime);
            })
            .slice(0, 10);
    }, [events]);

    // Mini calendar grid for the visible month.
    const cells = useMemo(() => getMonthCells(currentDate), [currentDate]);
    const eventDays = useMemo(() => new Set(events.map((e) => e.date)), [events]);

    const prevMonth = () => onDateChange(addMonths(currentDate, -1), false);
    const nextMonth = () => onDateChange(addMonths(currentDate, 1), false);

    return (
        <aside className="w-64 flex-none border-l border-slate-200 bg-white flex flex-col overflow-hidden">
            {/* Mini calendar */}
            <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700">
                        {format(currentDate, "MMMM yyyy")}
                    </span>
                    <div className="flex gap-1">
                        <button onClick={prevMonth} className="p-1 rounded hover:bg-slate-100 text-slate-500 transition" aria-label="Previous month">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button onClick={nextMonth} className="p-1 rounded hover:bg-slate-100 text-slate-500 transition" aria-label="Next month">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center">
                    {DAYS_SHORT.map((d) => (
                        <div key={d} className="text-xs font-medium text-slate-400 py-0.5">{d[0]}</div>
                    ))}
                    {cells.map((d, idx) => {
                        const isSelected = d && isSameDay(d, currentDate);
                        const hasEvent = d && eventDays.has(toDateKey(d));
                        return (
                            <button
                                key={idx}
                                disabled={!d}
                                onClick={() => d && onDateChange(d, true)}
                                className={`text-xs rounded-full w-7 h-7 mx-auto flex items-center justify-center relative transition ${!d ? "" :
                                        isSelected
                                            ? "bg-indigo-600 text-white font-semibold"
                                            : isToday(d)
                                                ? "text-indigo-600 font-bold"
                                                : "text-slate-600 hover:bg-slate-100"
                                    }`}
                            >
                                {d ? d.getDate() : ""}
                                {hasEvent && !isSelected && (
                                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming */}
            <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Upcoming
                </h3>
                {upcoming.length === 0 ? (
                    <p className="text-xs text-slate-400">No upcoming meetings</p>
                ) : (
                    <div className="space-y-2">
                        {upcoming.map((ev) => {
                            const c = EVENT_COLORS[ev.colorIdx ?? 0];
                            const evDate = parseDateKey(ev.date);
                            const isEvToday = isToday(evDate);
                            const isTomorrow = isSameDay(evDate, addDays(new Date(), 1));
                            const label = isEvToday ? "Today" : isTomorrow ? "Tomorrow" : format(evDate, "MMM d");
                            return (
                                <div
                                    key={ev.id}
                                    onClick={() => onEventClick(ev)}
                                    className={`cursor-pointer rounded-lg p-2.5 border-l-2 ${c.border} ${c.bg} hover:opacity-90 transition`}
                                >
                                    <p className={`text-xs font-semibold ${c.text} truncate`}>{ev.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {label} · {formatTime(ev.startTime)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
}

export default memo(Sidebar);
