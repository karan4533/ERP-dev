import React, { useState } from 'react'
import { X, Plus, Trash2, Save } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    DAYS,
    SUBJECTS,
    TEACHERS,
    saveClassTimetables,
    getClassTimetables,
    getClassSectionLabel,
} from '../classTimetableData'

const EditClassTimetableModal = ({ open, onClose, record, onSaved }) => {
    const [timelines, setTimelines] = useState(() => (record?.timelines ? [...record.timelines] : []))

    if (!open || !record) return null

    const handleUpdateRow = (index, field, value) => {
        setTimelines((prev) => {
            const next = [...prev]
            next[index] = { ...next[index], [field]: value }
            return next
        })
    }

    const handleAddRow = () => {
        setTimelines((prev) => [
            ...prev,
            {
                id: `TL-${Date.now()}`,
                periodNumber: String(prev.length + 1),
                day: DAYS[0] || 'Monday',
                subject: SUBJECTS[0] || 'English',
                teacher: TEACHERS[0] || 'Mr. Ravi Kumar',
                startTime: '09:00',
                endTime: '09:45',
            },
        ])
    }

    const handleRemoveRow = (index) => {
        setTimelines((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSave = () => {
        try {
            const all = getClassTimetables()
            const updated = all.map((tt) => {
                if (tt.id === record.id) {
                    return {
                        ...tt,
                        timelines: timelines.filter((t) => t.day && t.subject),
                    }
                }
                return tt
            })
            saveClassTimetables(updated)
            toast.success(`Timetable for ${getClassSectionLabel(record)} updated successfully!`)
            if (onSaved) onSaved()
            onClose()
        } catch (err) {
            toast.error('Failed to save timetable changes: ' + err.message)
        }
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs'>
            <div className='relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden'>
                <div className='flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50'>
                    <div>
                        <h3 className='text-lg font-bold text-slate-900'>
                            Edit {getClassSectionLabel(record)} Timetable
                        </h3>
                        <p className='text-xs text-slate-500'>
                            Academic Year: {record.academicYear} • Term: {record.term}
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='p-6 overflow-y-auto flex-1 space-y-4'>
                    <div className='flex justify-between items-center'>
                        <h4 className='text-sm font-semibold text-slate-800'>Scheduled Periods ({timelines.length})</h4>
                        <button
                            type='button'
                            onClick={handleAddRow}
                            className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs rounded-lg transition-colors cursor-pointer'
                        >
                            <Plus size={14} />
                            Add Period
                        </button>
                    </div>

                    <div className='space-y-3'>
                        {timelines.length === 0 ? (
                            <p className='text-xs text-slate-400 text-center py-6'>No periods scheduled. Click &quot;Add Period&quot; to configure timetable.</p>
                        ) : (
                            timelines.map((row, idx) => (
                                <div
                                    key={row.id || idx}
                                    className='grid grid-cols-1 sm:grid-cols-6 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs items-center'
                                >
                                    <div>
                                        <label className='block text-[10px] font-bold text-slate-500 uppercase mb-1'>Day</label>
                                        <select
                                            value={row.day}
                                            onChange={(e) => handleUpdateRow(idx, 'day', e.target.value)}
                                            className='w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800'
                                        >
                                            {DAYS.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className='block text-[10px] font-bold text-slate-500 uppercase mb-1'>Period</label>
                                        <input
                                            type='text'
                                            value={row.periodNumber || ''}
                                            onChange={(e) => handleUpdateRow(idx, 'periodNumber', e.target.value)}
                                            placeholder='1'
                                            className='w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-[10px] font-bold text-slate-500 uppercase mb-1'>Subject</label>
                                        <select
                                            value={row.subject}
                                            onChange={(e) => handleUpdateRow(idx, 'subject', e.target.value)}
                                            className='w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800'
                                        >
                                            {SUBJECTS.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className='block text-[10px] font-bold text-slate-500 uppercase mb-1'>Teacher</label>
                                        <select
                                            value={row.teacher}
                                            onChange={(e) => handleUpdateRow(idx, 'teacher', e.target.value)}
                                            className='w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800'
                                        >
                                            {TEACHERS.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className='grid grid-cols-2 gap-1'>
                                        <div>
                                            <label className='block text-[10px] font-bold text-slate-500 uppercase mb-1'>Start</label>
                                            <input
                                                type='time'
                                                value={row.startTime || ''}
                                                onChange={(e) => handleUpdateRow(idx, 'startTime', e.target.value)}
                                                className='w-full px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px]'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-[10px] font-bold text-slate-500 uppercase mb-1'>End</label>
                                            <input
                                                type='time'
                                                value={row.endTime || ''}
                                                onChange={(e) => handleUpdateRow(idx, 'endTime', e.target.value)}
                                                className='w-full px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px]'
                                            />
                                        </div>
                                    </div>
                                    <div className='flex items-center justify-end pt-3 sm:pt-0'>
                                        <button
                                            type='button'
                                            onClick={() => handleRemoveRow(idx)}
                                            className='p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer'
                                            title='Remove period'
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={handleSave}
                        className='flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer'
                    >
                        <Save size={14} />
                        Save Timetable Changes
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditClassTimetableModal

