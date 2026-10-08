import { useCallback, useMemo, useState } from "react";
import { addDays, addMonths, addWeeks } from "date-fns";
import { getHeaderLabel } from "../utils/dateHelpers";

// Owns view mode, the active date, and all navigation / labelling logic.
export function useCalendarState(initialView = "week") {
    const [view, setView] = useState(initialView);
    const [currentDate, setCurrentDate] = useState(() => new Date());

    const navigate = useCallback(
        (dir) => {
            setCurrentDate((prev) => {
                if (view === "month") return addMonths(prev, dir);
                if (view === "week") return addWeeks(prev, dir);
                return addDays(prev, dir);
            });
        },
        [view]
    );

    const goToday = useCallback(() => setCurrentDate(new Date()), []);

    // Jump to a date and drop into day view (used by mini-calendar / month click).
    const goToDay = useCallback((date) => {
        setCurrentDate(date);
        setView("day");
    }, []);

    const headerLabel = useMemo(() => getHeaderLabel(view, currentDate), [view, currentDate]);

    return {
        view,
        setView,
        currentDate,
        setCurrentDate,
        navigate,
        goToday,
        goToDay,
        headerLabel,
    };
}
