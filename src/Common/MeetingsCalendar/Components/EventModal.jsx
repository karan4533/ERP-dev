import { memo, useState } from "react";
import { format } from "date-fns";
import { EVENT_COLORS } from "../utils/constants";
import { toMinutes, toDateKey, parseDateKey } from "../utils/dateHelpers";
import Dialog from '../../ui/Dialog'
import FormField from '../../ui/FormField'

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
    return (
        <Dialog
            open
            onClose={onClose}
            title={mode === 'create' ? 'New meeting' : 'Edit meeting'}
            description='Set the meeting date, time, details, and calendar color.'
            size='md'
            footer={(
                <div className='flex w-full items-center justify-between gap-3'>
                    {mode === 'edit' ? (
                        <button type='button' onClick={onDelete} className='min-h-10 rounded-lg px-3 text-sm font-semibold text-[var(--erp-red)]'>Delete</button>
                    ) : <span />}
                    <div className='flex gap-2'>
                        <button type='button' onClick={onClose} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold'>Cancel</button>
                        <button type='button' onClick={handleSubmit} className='min-h-10 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>{mode === 'create' ? 'Save meeting' : 'Update meeting'}</button>
                    </div>
                </div>
            )}
        >
                <div className="space-y-4">
                    {/* Title */}
                    <FormField id='meeting-title' label='Meeting title' error={errors.title} required>
                        <input
                            className={inputCls}
                            placeholder="e.g. Sprint planning"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </FormField>

                    {/* Description */}
                    <FormField id='meeting-description' label='Description'>
                        <textarea
                            className={`${inputCls} resize-none`}
                            rows={2}
                            placeholder="Add notes or agenda…"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </FormField>

                    {/* Date + Day */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormField id='meeting-date' label='Date' error={errors.date} required>
                            <input
                                type="date"
                                className={inputCls}
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                            />
                        </FormField>
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
                        <FormField id='meeting-start-time' label='Start time'>
                            <input
                                type="time"
                                className={inputCls}
                                value={form.startTime}
                                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                            />
                        </FormField>
                        <FormField id='meeting-end-time' label='End time' error={errors.endTime}>
                            <input
                                type="time"
                                className={inputCls}
                                value={form.endTime}
                                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                            />
                        </FormField>
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

        </Dialog>
    );
}

export default memo(EventModal);
