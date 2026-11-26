import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { DAYS, SUBJECTS, TEACHERS, createTimelineRow } from '../classTimetableData'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const ClassTimelineEditor = ({ timelines, onChange, readOnly = false }) => {
    const updateRow = (index, key, value) => {
        onChange(
            timelines.map((row, rowIndex) =>
                rowIndex === index ? { ...row, [key]: value } : row,
            ),
        )
    }

    const addRow = () => onChange([...timelines, createTimelineRow()])

    const removeRow = (index) => {
        if (timelines.length === 1) return
        onChange(timelines.filter((_, rowIndex) => rowIndex !== index))
    }

    return (
        <div>
            <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold text-black'>Timetable Timelines</h3>
                {!readOnly && (
                    <button
                        type='button'
                        onClick={addRow}
                        className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-3 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        <Plus size={16} />
                        Add More
                    </button>
                )}
            </div>

            <div className='overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Period</th>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Day</th>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Teacher</th>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Start Time</th>
                            <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>End Time</th>
                            {!readOnly && (
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {timelines.map((row, index) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>
                                    {readOnly ? (
                                        row.periodNumber || '—'
                                    ) : (
                                        <input
                                            type='number'
                                            min='1'
                                            value={row.periodNumber}
                                            onChange={(e) => updateRow(index, 'periodNumber', e.target.value)}
                                            className={inputClass}
                                            placeholder='1'
                                        />
                                    )}
                                </td>
                                <td className='px-2 py-3'>
                                    {readOnly ? (
                                        row.day || '—'
                                    ) : (
                                        <select
                                            value={row.day}
                                            onChange={(e) => updateRow(index, 'day', e.target.value)}
                                            className={selectClass}
                                        >
                                            <option value=''>Select day</option>
                                            {DAYS.map((day) => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    )}
                                </td>
                                <td className='px-2 py-3'>
                                    {readOnly ? (
                                        row.subject || '—'
                                    ) : (
                                        <select
                                            value={row.subject}
                                            onChange={(e) => updateRow(index, 'subject', e.target.value)}
                                            className={selectClass}
                                        >
                                            <option value=''>Select subject</option>
                                            {SUBJECTS.map((subject) => (
                                                <option key={subject} value={subject}>{subject}</option>
                                            ))}
                                        </select>
                                    )}
                                </td>
                                <td className='px-2 py-3'>
                                    {readOnly ? (
                                        row.teacher || '—'
                                    ) : (
                                        <select
                                            value={row.teacher}
                                            onChange={(e) => updateRow(index, 'teacher', e.target.value)}
                                            className={selectClass}
                                        >
                                            <option value=''>Select teacher</option>
                                            {TEACHERS.map((teacher) => (
                                                <option key={teacher} value={teacher}>{teacher}</option>
                                            ))}
                                        </select>
                                    )}
                                </td>
                                <td className='px-2 py-3'>
                                    {readOnly ? (
                                        row.startTime || '—'
                                    ) : (
                                        <input
                                            type='time'
                                            value={row.startTime}
                                            onChange={(e) => updateRow(index, 'startTime', e.target.value)}
                                            className={inputClass}
                                        />
                                    )}
                                </td>
                                <td className='px-2 py-3'>
                                    {readOnly ? (
                                        row.endTime || '—'
                                    ) : (
                                        <input
                                            type='time'
                                            value={row.endTime}
                                            onChange={(e) => updateRow(index, 'endTime', e.target.value)}
                                            className={inputClass}
                                        />
                                    )}
                                </td>
                                {!readOnly && (
                                    <td className='px-2 py-3'>
                                        <button
                                            type='button'
                                            onClick={() => removeRow(index)}
                                            disabled={timelines.length === 1}
                                            className='inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed'
                                        >
                                            <Trash2 size={14} />
                                            Remove
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ClassTimelineEditor
