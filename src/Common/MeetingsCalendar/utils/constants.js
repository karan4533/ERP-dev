export const EVENT_COLORS = [
    { label: "Indigo", bg: "bg-indigo-100", border: "border-indigo-400", text: "text-indigo-800", solid: "bg-indigo-500" },
    { label: "Sky", bg: "bg-sky-100", border: "border-sky-400", text: "text-sky-800", solid: "bg-sky-500" },
    { label: "Emerald", bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-800", solid: "bg-emerald-500" },
    { label: "Amber", bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-800", solid: "bg-amber-500" },
    { label: "Rose", bg: "bg-rose-100", border: "border-rose-400", text: "text-rose-800", solid: "bg-rose-500" },
    { label: "Violet", bg: "bg-violet-100", border: "border-violet-400", text: "text-violet-800", solid: "bg-violet-500" },
];

export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
    const ampm = i >= 12 ? "PM" : "AM";
    const h = i % 12 || 12;
    return `${h} ${ampm}`;
});

export const HOUR_HEIGHT = 64; // px per hour in the time grid

// Configurable snap-to-grid increments (minutes)
export const SNAP_OPTIONS = [15, 30, 60];
export const DEFAULT_SNAP = 15;

// Drag-and-drop / resize interaction tuning
export const DRAG_THRESHOLD = 4; // px of movement before a drag (vs click) begins
export const RESIZE_HANDLE = 8; // px height of the top/bottom resize zones
export const MINUTES_IN_DAY = 24 * 60;

export const VIEW_BTNS = [
    { label: "Month", key: "month" },
    { label: "Week", key: "week" },
    { label: "Day", key: "day" },
];
