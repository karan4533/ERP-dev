import { memo, useMemo } from "react";
import { DAYS_SHORT } from "../utils/constants";
import { getWeekDays, isToday } from "../utils/dateHelpers";
import TimeGrid from "./TimeGrid";

function WeekView({ currentDate, events, onSlotClick, onEventClick, onEventUpdate, snapMinutes }) {
    const days = useMemo(() => getWeekDays(currentDate), [currentDate]);

    const header = (
        <div className="flex border-b border-slate-200 bg-white">
            <div className="w-14 flex-none" />
            {days.map((d, i) => {
                const today_ = isToday(d);
                return (
                    <div key={i} className="flex-1 min-w-0 py-2 text-center border-l border-slate-100">
                        <p className="text-xs text-slate-500 font-medium">{DAYS_SHORT[d.getDay()]}</p>
                        <span
                            className={`inline-flex items-center justify-center w-8 h-8 text-sm font-semibold rounded-full mx-auto mt-0.5 ${today_
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-700"
                                }`}
                        >
                            {d.getDate()}
                        </span>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <TimeGrid days={days} events={events} header={header} onSlotMouseDown={onSlotClick} onEventClick={onEventClick} onEventUpdate={onEventUpdate} snapMinutes={snapMinutes} />
        </div>
    );
}

export default memo(WeekView);
