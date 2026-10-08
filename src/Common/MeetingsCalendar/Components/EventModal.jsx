import { memo, useState } from "react";
import { format } from "date-fns";
import { EVENT_COLORS } from "../utils/constants";
import { toMinutes, toDateKey, parseDateKey } from "../utils/dateHelpers";

function EventModal({ mode, event, onSave, onDelete, onClose }) {
    const [form, setForm] = useState({
        title: event?.title ?? "",
        description: event?.description ?? "",
        date: event?.date ?? toDateKey(new Date()),
        startTime: event?.startTime ?? "09:00",
        endTime: event?.endTime ?? "10:00",
        colorIdx: event?.colorIdx ?? 0,
    });
    const [errors, setErrors] = useState({});

    const dayName = form.date ? format(parseDateKey(form.date), "EEEE") : "";

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = "Title is required";
        if (!form.date) e.date = "Date is required";
        if (toMinutes(form.endTime) <= toMinutes(form.startTime))
            e.endTime = "End time must be after start time";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) onSave(form);
    };

    const inputCls =
        "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-400";
    const errCls = "text-xs text-rose-500 mt-1";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-base font-semibold text-slate-800">
                        {mode === "create" ? "New meeting" : "Edit meeting"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">
                            Meeting title *
                        </label>
                        <input
                            className={inputCls}
                            placeholder="e.g. Sprint planning"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                        {errors.title && <p className={errCls}>{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">
                            Description
                        </label>
                        <textarea
                            className={`${inputCls} resize-none`}
                            rows={2}
                            placeholder="Add notes or agenda…"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    {/* Date + Day */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">
                                Date *
                            </label>
                            <input
                                type="date"
                                className={inputCls}
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                            />
                            {errors.date && <p className={errCls}>{errors.date}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">
                                Day
                            </label>
                            <div className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                                {dayName}
                            </div>
                        </div>
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">
                                Start time
                            </label>
                            <input
                                type="time"
                                className={inputCls}
                                value={form.startTime}
                                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">
                                End time
                            </label>
                            <input
                                type="time"
                                className={inputCls}
                                value={form.endTime}
                                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                            />
                            {errors.endTime && <p className={errCls}>{errors.endTime}</p>}
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                            Color
                        </label>
                        <div className="flex gap-2">
                            {EVENT_COLORS.map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => setForm({ ...form, colorIdx: i })}
                                    className={`w-7 h-7 rounded-full ${c.solid} transition ring-offset-2 ring-offset-white ${form.colorIdx === i ? "ring-2 ring-slate-600 scale-110" : "opacity-70 hover:opacity-100"
                                        }`}
                                    aria-label={c.label}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    {mode === "edit" ? (
                        <button
                            onClick={onDelete}
                            className="flex items-center gap-1.5 text-sm text-rose-500 hover:text-rose-700 transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </button>
                    ) : (
                        <span />
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                        >
                            {mode === "create" ? "Save meeting" : "Update"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(EventModal);
