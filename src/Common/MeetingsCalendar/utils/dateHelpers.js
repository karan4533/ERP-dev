import {
    format,
    addDays,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    getDay,
    getDaysInMonth,
    isSameDay as dfIsSameDay,
    isToday as dfIsToday,
} from "date-fns";

// ─── Time string helpers ──────────────────────────────────────────────────────

export const pad = (n) => String(n).padStart(2, "0");

export const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
};

export const fromMinutes = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

export const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${pad(m)} ${ampm}`;
};

// ─── Date helpers (date-fns backed) ────────────────────────────────────────────

// Stable yyyy-MM-dd key used to match events to a calendar day.
export const toDateKey = (d) => format(d, "yyyy-MM-dd");

// Parse a yyyy-MM-dd key back to a local Date at midnight.
export const parseDateKey = (key) => new Date(`${key}T00:00:00`);

export const isSameDay = (a, b) => dfIsSameDay(a, b);

export const isToday = (d) => dfIsToday(d);

export const generateId = () => `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// The 7 days (Sun–Sat) of the week containing `date`.
export const getWeekDays = (date) => {
    const start = startOfWeek(date);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

// Month grid cells with leading nulls for blank days before the 1st.
export const getMonthCells = (date) => {
    const monthStart = startOfMonth(date);
    const leadingBlanks = getDay(monthStart);
    const daysInMonth = getDaysInMonth(date);
    const cells = Array.from({ length: leadingBlanks }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(new Date(date.getFullYear(), date.getMonth(), d));
    }
    return cells;
};

// Human readable label for the toolbar, based on the active view.
export const getHeaderLabel = (view, currentDate) => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "day") return format(currentDate, "EEEE, MMMM d, yyyy");

    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    if (start.getMonth() === end.getMonth()) {
        return `${format(start, "MMMM d")} – ${format(end, "d, yyyy")}`;
    }
    if (start.getFullYear() === end.getFullYear()) {
        return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
};
