import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    EVENT_COLORS,
    HOUR_HEIGHT,
    HOUR_LABELS,
    DEFAULT_SNAP,
    DRAG_THRESHOLD,
    RESIZE_HANDLE,
    MINUTES_IN_DAY,
} from "../utils/constants";
import { formatTime, fromMinutes, isToday, toDateKey, toMinutes } from "../utils/dateHelpers";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Pure column-packing for overlapping events within a single day.
function layoutDayEvents(dayEvents) {
    const sorted = [...dayEvents].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    const cols = [];
    const result = sorted.map((ev) => {
        const start = toMinutes(ev.startTime);
        const end = toMinutes(ev.endTime);
        let col = 0;
        while (cols[col] && cols[col] > start) col++;
        cols[col] = end;
        return { ...ev, col, totalCols: 1 };
    });
    result.forEach((ev) => {
        let maxCol = ev.col;
        result.forEach((ev2) => {
            if (ev2 !== ev &&
                toMinutes(ev2.startTime) < toMinutes(ev.endTime) &&
                toMinutes(ev2.endTime) > toMinutes(ev.startTime)) {
                maxCol = Math.max(maxCol, ev2.col + 1);
            }
        });
        ev.totalCols = maxCol + 1;
    });
    return result;
}

function TimeGrid({ days, events, header, onSlotMouseDown, onEventClick, onEventUpdate, snapMinutes = DEFAULT_SNAP }) {
    const gridRef = useRef(null);
    const interactionRef = useRef(null);
    const [draft, setDraft] = useState(null);

    const snap = snapMinutes || DEFAULT_SNAP;

    // Recompute layout only when the days window or events actually change.
    const laidOutByDay = useMemo(
        () => days.map((d) => {
            const key = toDateKey(d);
            return layoutDayEvents(events.filter((e) => e.date === key));
        }),
        [days, events]
    );

    // ── Geometry helpers ──────────────────────────────────────────────────────
    const getColumns = useCallback(
        () => Array.from(gridRef.current?.querySelectorAll("[data-daycol]") ?? []),
        []
    );

    const snapMins = useCallback(
        (offsetY) => Math.round((offsetY / HOUR_HEIGHT) * 60 / snap) * snap,
        [snap]
    );

    // Which day column the pointer is over (for cross-day moves), clamped to ends.
    const columnFromX = useCallback((clientX) => {
        const cols = getColumns();
        for (let i = 0; i < cols.length; i++) {
            const r = cols[i].getBoundingClientRect();
            if (clientX >= r.left && clientX <= r.right) return { dayIdx: i, rect: r };
        }
        if (cols.length) {
            const firstRect = cols[0].getBoundingClientRect();
            if (clientX < firstRect.left) return { dayIdx: 0, rect: firstRect };
            const lastIdx = cols.length - 1;
            return { dayIdx: lastIdx, rect: cols[lastIdx].getBoundingClientRect() };
        }
        return null;
    }, [getColumns]);

    // ── Interaction starters ────────────────────────────────────────────────
    const startCreate = useCallback((e, dayIdx) => {
        const cols = getColumns();
        const rect = cols[dayIdx].getBoundingClientRect();
        const startMin = clamp(snapMins(e.clientY - rect.top), 0, MINUTES_IN_DAY - snap);
        interactionRef.current = {
            mode: "create",
            dayIdx,
            startMin,
            endMin: startMin + 60,
            originX: e.clientX,
            originY: e.clientY,
            moved: false,
        };
    }, [getColumns, snapMins, snap]);

    const startMove = useCallback((e, ev, dayIdx) => {
        const cols = getColumns();
        const rect = cols[dayIdx].getBoundingClientRect();
        const rawMin = (e.clientY - rect.top) / HOUR_HEIGHT * 60;
        const startMin = toMinutes(ev.startTime);
        const durationMin = toMinutes(ev.endTime) - startMin;
        interactionRef.current = {
            mode: "move",
            ev,
            dayIdx,
            targetDayIdx: dayIdx,
            durationMin,
            grabOffset: rawMin - startMin,
            startMin,
            endMin: startMin + durationMin,
            originX: e.clientX,
            originY: e.clientY,
            moved: false,
        };
    }, [getColumns]);

    const startResize = useCallback((e, ev, dayIdx, edge) => {
        interactionRef.current = {
            mode: "resize",
            ev,
            dayIdx,
            edge,
            startMin: toMinutes(ev.startTime),
            endMin: toMinutes(ev.endTime),
            originX: e.clientX,
            originY: e.clientY,
            moved: false,
        };
    }, []);

    // ── Global pointer move / up ──────────────────────────────────────────────
    const handlePointerMove = useCallback((e) => {
        const it = interactionRef.current;
        if (!it) return;

        if (!it.moved) {
            const dist = Math.abs(e.clientX - it.originX) + Math.abs(e.clientY - it.originY);
            if (dist < DRAG_THRESHOLD) return;
            it.moved = true;
        }

        const cols = getColumns();

        if (it.mode === "create") {
            const rect = cols[it.dayIdx].getBoundingClientRect();
            const m = clamp(snapMins(e.clientY - rect.top), 0, MINUTES_IN_DAY);
            const endMin = Math.max(it.startMin + snap, m);
            it.endMin = endMin;
            setDraft({ mode: "create", dayIdx: it.dayIdx, startMin: it.startMin, endMin });
        } else if (it.mode === "move") {
            const target = columnFromX(e.clientX);
            const dayIdx = target ? target.dayIdx : it.dayIdx;
            const rect = target ? target.rect : cols[it.dayIdx].getBoundingClientRect();
            const pointerMin = (e.clientY - rect.top) / HOUR_HEIGHT * 60;
            // Snap the resulting start to the grid so times never become fractional.
            const snappedStart = Math.round((pointerMin - it.grabOffset) / snap) * snap;
            const newStart = clamp(snappedStart, 0, MINUTES_IN_DAY - it.durationMin);
            it.targetDayIdx = dayIdx;
            it.startMin = newStart;
            it.endMin = newStart + it.durationMin;
            setDraft({ mode: "move", ev: it.ev, dayIdx, startMin: it.startMin, endMin: it.endMin });
        } else if (it.mode === "resize") {
            const rect = cols[it.dayIdx].getBoundingClientRect();
            const m = clamp(snapMins(e.clientY - rect.top), 0, MINUTES_IN_DAY);
            if (it.edge === "top") {
                it.startMin = clamp(m, 0, it.endMin - snap);
            } else {
                it.endMin = clamp(m, it.startMin + snap, MINUTES_IN_DAY);
            }
            setDraft({ mode: "resize", ev: it.ev, dayIdx: it.dayIdx, startMin: it.startMin, endMin: it.endMin });
        }
    }, [columnFromX, getColumns, snapMins, snap]);

    const handlePointerUp = useCallback(() => {
        const it = interactionRef.current;
        interactionRef.current = null;
        if (!it) return;

        if (it.mode === "create") {
            if (it.moved && it.endMin - it.startMin >= snap) {
                onSlotMouseDown(days[it.dayIdx], fromMinutes(it.startMin), fromMinutes(it.endMin));
            } else if (!it.moved) {
                // Plain tap on an empty slot → quick-create a 1h meeting at that time.
                const endMin = Math.min(it.startMin + 60, MINUTES_IN_DAY);
                onSlotMouseDown(days[it.dayIdx], fromMinutes(it.startMin), fromMinutes(endMin));
            }
        } else if (it.mode === "move" || it.mode === "resize") {
            if (!it.moved) {
                onEventClick(it.ev); // treat as a click → open editor
            } else {
                const targetDay = days[it.targetDayIdx ?? it.dayIdx];
                onEventUpdate(it.ev.id, {
                    date: toDateKey(targetDay),
                    startTime: fromMinutes(it.startMin),
                    endTime: fromMinutes(it.endMin),
                });
            }
        }
        setDraft(null);
    }, [days, onEventClick, onEventUpdate, onSlotMouseDown, snap]);

    // Discard without committing (e.g. browser took over the touch for scrolling).
    const handlePointerCancel = useCallback(() => {
        interactionRef.current = null;
        setDraft(null);
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

    // Open the grid scrolled to the working day instead of midnight.
    useEffect(() => {
        if (gridRef.current) gridRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }, []);

    // ── Pointer down dispatchers ──────────────────────────────────────────────
    const onColumnPointerDown = useCallback((e, dayIdx) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        startCreate(e, dayIdx);
    }, [startCreate]);

    const onEventPointerDown = useCallback((e, ev, dayIdx) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.stopPropagation();
        startMove(e, ev, dayIdx);
    }, [startMove]);

    const onResizePointerDown = useCallback((e, ev, dayIdx, edge) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.stopPropagation();
        startResize(e, ev, dayIdx, edge);
    }, [startResize]);

    const activeId = draft && (draft.mode === "move" || draft.mode === "resize") ? draft.ev.id : null;

    return (
        // Single vertical scroll container: the sticky header, hour gutter and day
        // columns share one scroll context so headers stay pinned and aligned while
        // the 1 AM – 11 PM timeline scrolls.
        <div className="flex flex-col flex-1 overflow-y-auto" ref={gridRef}>
            {/* Sticky day header (kept inside the scroll area for perfect column alignment) */}
            {header && (
                <div className="sticky top-0 z-40 bg-white">{header}</div>
            )}

            <div className="flex flex-1">
                {/* Hour labels */}
                <div
                    className="flex-none w-14 border-r border-slate-200 bg-white select-none sticky left-0 z-20"
                    style={{ height: HOUR_HEIGHT * 24 }}
                >
                    {HOUR_LABELS.map((label, i) => (
                        <div key={i} style={{ height: HOUR_HEIGHT }} className="relative">
                            {i > 0 && (
                                <span className="absolute -top-2.5 right-2 text-xs text-slate-400 font-medium">
                                    {label}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Day columns */}
                <div className="flex flex-1 min-w-0">
                    {days.map((d, dayIdx) => {
                    const dayEvs = laidOutByDay[dayIdx];
                    const isToday_ = isToday(d);
                    const now = new Date();
                    const nowPct = (now.getHours() * 60 + now.getMinutes()) / MINUTES_IN_DAY;
                    const showDraft = draft && draft.dayIdx === dayIdx;

                    return (
                        <div
                            key={dayIdx}
                            data-daycol={dayIdx}
                            className="flex-1 min-w-0 relative border-r border-slate-100 cursor-crosshair select-none"
                            style={{ height: HOUR_HEIGHT * 24 }}
                            onPointerDown={(e) => onColumnPointerDown(e, dayIdx)}
                        >
                            {/* Hour lines */}
                            {Array.from({ length: 24 }, (_, i) => (
                                <div key={i} className="absolute w-full border-t border-slate-100" style={{ top: i * HOUR_HEIGHT }} />
                            ))}
                            {/* Half-hour lines */}
                            {Array.from({ length: 24 }, (_, i) => (
                                <div key={i} className="absolute w-full border-t border-dashed border-slate-100" style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }} />
                            ))}

                            {/* Now line */}
                            {isToday_ && (
                                <div
                                    className="absolute left-0 right-0 z-10 pointer-events-none"
                                    style={{ top: nowPct * HOUR_HEIGHT * 24 }}
                                >
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1" />
                                        <div className="flex-1 h-px bg-rose-500" />
                                    </div>
                                </div>
                            )}

                            {/* Events */}
                            {dayEvs.map((ev) => {
                                if (ev.id === activeId) return null; // rendered as draft instead
                                const c = EVENT_COLORS[ev.colorIdx ?? 0];
                                const topPx = (toMinutes(ev.startTime) / 60) * HOUR_HEIGHT;
                                const height = Math.max(20, ((toMinutes(ev.endTime) - toMinutes(ev.startTime)) / 60) * HOUR_HEIGHT - 2);
                                const width = `calc(${100 / ev.totalCols}% - 4px)`;
                                const left = `calc(${(ev.col / ev.totalCols) * 100}% + 2px)`;
                                const short = height < 36;
                                return (
                                    <div
                                        key={ev.id}
                                        className={`absolute rounded-md border-l-2 ${c.bg} ${c.border} ${c.text} overflow-hidden cursor-grab active:cursor-grabbing hover:brightness-95 z-10 group`}
                                        style={{ top: topPx, height, width, left, touchAction: "none" }}
                                        onPointerDown={(e) => onEventPointerDown(e, ev, dayIdx)}
                                    >
                                        {/* Top resize handle */}
                                        <div
                                            className="absolute top-0 left-0 right-0 cursor-ns-resize z-20"
                                            style={{ height: RESIZE_HANDLE, touchAction: "none" }}
                                            onPointerDown={(e) => onResizePointerDown(e, ev, dayIdx, "top")}
                                        />
                                        <div className="px-1.5 py-0.5 pointer-events-none">
                                            <p className="font-semibold leading-tight truncate text-xs">{ev.title}</p>
                                            {!short && (
                                                <p className="text-xs opacity-75 truncate">
                                                    {formatTime(ev.startTime)} – {formatTime(ev.endTime)}
                                                </p>
                                            )}
                                        </div>
                                        {/* Bottom resize handle */}
                                        <div
                                            className="absolute bottom-0 left-0 right-0 cursor-ns-resize z-20"
                                            style={{ height: RESIZE_HANDLE, touchAction: "none" }}
                                            onPointerDown={(e) => onResizePointerDown(e, ev, dayIdx, "bottom")}
                                        />
                                    </div>
                                );
                            })}

                            {/* Draft preview (create / move / resize) */}
                            {showDraft && (() => {
                                const top = (draft.startMin / 60) * HOUR_HEIGHT;
                                const h = Math.max(20, ((draft.endMin - draft.startMin) / 60) * HOUR_HEIGHT);
                                if (draft.mode === "create") {
                                    return (
                                        <div
                                            className="absolute left-1 right-1 rounded-md bg-indigo-300/60 border border-indigo-400 pointer-events-none z-30 px-1.5 py-0.5"
                                            style={{ top, height: h }}
                                        >
                                            <p className="text-xs font-medium text-indigo-900 truncate">
                                                {formatTime(fromMinutes(draft.startMin))} – {formatTime(fromMinutes(draft.endMin))}
                                            </p>
                                        </div>
                                    );
                                }
                                const c = EVENT_COLORS[draft.ev.colorIdx ?? 0];
                                return (
                                    <div
                                        className={`absolute left-1 right-1 rounded-md border-l-2 ${c.bg} ${c.border} ${c.text} px-1.5 py-0.5 pointer-events-none z-30 shadow-lg ring-2 ring-indigo-400/60 opacity-95`}
                                        style={{ top, height: h }}
                                    >
                                        <p className="font-semibold leading-tight truncate text-xs">{draft.ev.title}</p>
                                        <p className="text-xs opacity-80 truncate">
                                            {formatTime(fromMinutes(draft.startMin))} – {formatTime(fromMinutes(draft.endMin))}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                    );
                })}
                </div>
            </div>
        </div>
    );
}

export default memo(TimeGrid);
