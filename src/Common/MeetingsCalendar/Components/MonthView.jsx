import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EVENT_COLORS, DAYS_SHORT, DRAG_THRESHOLD } from "../utils/constants";
import { formatTime, getMonthCells, isToday, toDateKey, toMinutes } from "../utils/dateHelpers";

function MonthView({ currentDate, events, onDayClick, onEventClick, onEventUpdate }) {
    const cells = useMemo(() => getMonthCells(currentDate), [currentDate]);

    // Group + sort events per day once per events/date change.
    const eventsByDay = useMemo(() => {
        const map = new Map();
        events.forEach((e) => {
            if (!map.has(e.date)) map.set(e.date, []);
            map.get(e.date).push(e);
        });
        map.forEach((list) => list.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)));
        return map;
    }, [events]);

    const interactionRef = useRef(null);
    const [drag, setDrag] = useState(null); // { title, colorIdx, x, y, overKey }

    const handlePointerMove = useCallback((e) => {
        const it = interactionRef.current;
        if (!it) return;
        if (!it.moved) {
            const dist = Math.abs(e.clientX - it.originX) + Math.abs(e.clientY - it.originY);
            if (dist < DRAG_THRESHOLD) return;
            it.moved = true;
        }
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el?.closest("[data-datekey]");
        const overKey = cell?.getAttribute("data-datekey") ?? null;
        it.overKey = overKey;
        const c = EVENT_COLORS[it.ev.colorIdx ?? 0];
        setDrag({ title: it.ev.title, solid: c.solid, x: e.clientX, y: e.clientY, overKey });
    }, []);

    const handlePointerUp = useCallback(() => {
        const it = interactionRef.current;
        interactionRef.current = null;
        if (!it) return;
        if (!it.moved) {
            onEventClick(it.ev);
        } else if (it.overKey && it.overKey !== it.ev.date) {
            onEventUpdate(it.ev.id, { date: it.overKey }); // reschedule, keep times
        }
        setDrag(null);
    }, [onEventClick, onEventUpdate]);

    const handlePointerCancel = useCallback(() => {
        interactionRef.current = null;
        setDrag(null);
    }, []);

    useEffect(() => {
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointercancel", handlePointerCancel);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerCancel);
        };
    }, [handlePointerMove, handlePointerUp, handlePointerCancel]);

    const onChipPointerDown = useCallback((e, ev) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.stopPropagation();
        interactionRef.current = { ev, originX: e.clientX, originY: e.clientY, moved: false, overKey: ev.date };
    }, []);

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-200">
                {DAYS_SHORT.map((d) => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>
            {/* Cells */}
            <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: "minmax(100px, 1fr)" }}>
                {cells.map((d, idx) => {
                    const key = d ? toDateKey(d) : null;
                    const evs = key ? (eventsByDay.get(key) ?? []) : [];
                    const today_ = d && isToday(d);
                    const isDropTarget = drag && key && drag.overKey === key;
                    return (
                        <div
                            key={idx}
                            data-datekey={key ?? undefined}
                            className={`border-b border-r border-slate-100 p-1 cursor-pointer transition-colors ${!d ? "bg-slate-50/50" : "hover:bg-slate-50"} ${isDropTarget ? "bg-indigo-50 ring-2 ring-inset ring-indigo-400" : ""
                                }`}
                            onClick={() => d && onDayClick(d)}
                        >
                            {d && (
                                <>
                                    <span
                                        className={`inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full mb-1 ${today_
                                                ? "bg-indigo-600 text-white"
                                                : "text-slate-700 hover:bg-slate-200"
                                            }`}
                                    >
                                        {d.getDate()}
                                    </span>
                                    <div className="space-y-0.5">
                                        {evs.slice(0, 3).map((ev) => {
                                            const c = EVENT_COLORS[ev.colorIdx ?? 0];
                                            return (
                                                <div
                                                    key={ev.id}
                                                    onPointerDown={(e) => onChipPointerDown(e, ev)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={`truncate text-xs px-1.5 py-0.5 rounded ${c.bg} ${c.text} border-l-2 ${c.border} cursor-grab active:cursor-grabbing hover:opacity-80`}
                                                    style={{ touchAction: "none" }}
                                                >
                                                    {formatTime(ev.startTime)} {ev.title}
                                                </div>
                                            );
                                        })}
                                        {evs.length > 3 && (
                                            <div className="text-xs text-slate-500 px-1">
                                                +{evs.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Floating drag preview */}
            {drag && (
                <div
                    className="fixed z-50 pointer-events-none px-2 py-1 rounded-md shadow-lg text-xs font-semibold text-white max-w-[180px] truncate"
                    style={{ left: drag.x + 12, top: drag.y + 12 }}
                >
                    <span className={`inline-block px-2 py-1 rounded-md ${drag.solid}`}>{drag.title}</span>
                </div>
            )}
        </div>
    );
}

export default memo(MonthView);
