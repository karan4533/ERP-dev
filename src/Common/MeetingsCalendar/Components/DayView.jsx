import { memo, useMemo } from "react";
import { format } from "date-fns";
import { isToday } from "../utils/dateHelpers";
import TimeGrid from "./TimeGrid";

function DayView({ currentDate, events, onSlotClick, onEventClick, onEventUpdate, snapMinutes }) {
    const days = useMemo(() => [currentDate], [currentDate]);

    const header = (
        <div className="flex border-b border-slate-200 bg-white">
            <div className="w-14 flex-none" />
            <div className="flex-1 min-w-0 py-3 text-center">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{format(currentDate, "EEEE")}</p>
                <span
                    className={`inline-flex items-center justify-center w-10 h-10 text-xl font-semibold rounded-full mx-auto mt-0.5 ${isToday(currentDate) ? "bg-indigo-600 text-white" : "text-slate-700"
                        }`}
                >
                    {currentDate.getDate()}
                </span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <TimeGrid days={days} events={events} header={header} onSlotMouseDown={onSlotClick} onEventClick={onEventClick} onEventUpdate={onEventUpdate} snapMinutes={snapMinutes} />
        </div>
    );
}

export default memo(DayView);
