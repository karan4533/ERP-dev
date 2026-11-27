import React, { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { addSectionToClass, updateSectionDetails } from '../../../../../services/classDetailsApi'
import { useClassTeacherOptions } from '../useClassDirectory'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

const toRow = (section) => {
    const values = {
        name: section.name,
        isActive: section.isActive,
        capacity: section.capacity ? String(section.capacity) : '',
        roomNumber: section.roomNumber || '',
        classTeacherUserId: section.classTeacherUserId || '',
    }
    return {
        key: section.id,
        id: section.id,
        isNew: false,
        classTeacherName: section.classTeacherName || '',
        ...values,
        saved: values, // what the server holds, so only real changes are sent
        error: '',
    }
}

const newRow = (key) => ({
    key,
    id: null,
    isNew: true,
    name: '',
    isActive: true,
    capacity: '',
    roomNumber: '',
    classTeacherUserId: '',
    classTeacherName: '',
    saved: null,
    error: '',
})

const changesOf = (row) => {
    const changes = {}
    const nextName = String(row.name || '').trim().toUpperCase()
    const savedName = String(row.saved.name || '').trim().toUpperCase()
    if (nextName && nextName !== savedName) changes.name = nextName
    if (row.isActive !== row.saved.isActive) changes.isActive = row.isActive
    if (row.capacity.trim() !== row.saved.capacity) changes.capacity = row.capacity
    if (row.roomNumber.trim() !== row.saved.roomNumber) changes.roomNumber = row.roomNumber
    if (row.classTeacherUserId !== row.saved.classTeacherUserId) changes.classTeacherUserId = row.classTeacherUserId
    return changes
}

/**
 * API mode only. Edits a class's sections: name (when unused), capacity, room, class teacher (picked
 * from real teacher logins) and active flag, and adds sections. A class is identified by name and
 * academic year, so neither can be changed here. Each section saves on its own, so one failure does
 * not undo or repeat the others, and what the server refused is shown on that row.
 */
const EditClassModal = ({ record, onClose, onSaved }) => {
    const teachers = useClassTeacherOptions(true)
    const nextKey = useRef(0)
    const [rows, setRows] = useState(() => record.sections.map(toRow))
    const [saving, setSaving] = useState(false)

    const patchRow = (key, patch) => setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch, error: '' } : row)))

    const addRow = () => {
        nextKey.current += 1
        setRows((prev) => [...prev, newRow(`new-${nextKey.current}`)])
    }

    const save = async () => {
        if (saving) return
        setSaving(true)
        let failures = 0
        let saved = 0
        const result = []
        for (const row of rows) {
            try {
                if (row.isNew) {
                    if (!row.name.trim()) {
                        result.push(row) // an empty new row is ignored, not an error
                        continue
                    }
                    const created = await addSectionToClass(record.id, row)
                    saved += 1
                    result.push({
                        ...toRow({
                            id: created.id,
                            name: created.name,
                            isActive: created.is_active !== false,
                            capacity: created.capacity,
                            roomNumber: created.room_number,
                            classTeacherUserId: created.class_teacher_user_id,
                            classTeacherName: created.class_teacher_name || created.class_teacher_email,
                        }),
                    })
                } else {
                    const nextName = String(row.name || '').trim()
                    if (!nextName) {
                        failures += 1
                        result.push({ ...row, error: 'Section name is required.' })
                        continue
                    }
                    const changes = changesOf(row)
                    if (Object.keys(changes).length === 0) {
                        result.push(row)
                        continue
                    }
                    const updated = await updateSectionDetails(row.id, changes)
                    saved += 1
                    result.push(toRow({
                        id: updated.id,
                        name: updated.name,
                        isActive: updated.is_active !== false,
                        capacity: updated.capacity,
                        roomNumber: updated.room_number,
                        classTeacherUserId: updated.class_teacher_user_id,
                        classTeacherName: updated.class_teacher_name || updated.class_teacher_email,
                    }))
                }
            } catch (error) {
                failures += 1
                result.push({ ...row, error: error?.message || 'Could not save this section.' })
            }
        }
        setRows(result)
        setSaving(false)
        if (saved > 0) onSaved()
        if (failures === 0) {
            toast.success(saved > 0 ? `Saved ${saved} section${saved === 1 ? '' : 's'} of ${record.className}.` : 'Nothing to save.')
            onClose()
        } else {
            toast.error(`${failures} section${failures === 1 ? '' : 's'} could not be saved. See the messages on each row.`)
        }
    }

    return (
        <div className='fixed inset-0 z-500 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={saving ? undefined : onClose} />
            <div
                role='dialog'
                aria-modal='true'
                aria-label={`Edit ${record.className}`}
                className='relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg p-5'
            >
                <div className='flex justify-between items-start gap-4'>
                    <div>
                        <h3 className='text-xl font-medium text-black'>Edit {record.className}</h3>
                        <p className='text-sm text-[#667085] mt-1'>
                            Academic year {record.academicYear}. The class name and year cannot be changed because
                            students and attendance refer to them. Section names can be updated when unused; if a
                            section already has students or records, add a new section and deactivate the old one
                            instead. Leave capacity, room or teacher empty to clear them.
                        </p>
                    </div>
                    <button type='button' onClick={onClose} disabled={saving} aria-label='Close' className='hover:text-red-500 cursor-pointer'>
                        <X />
                    </button>
                </div>

                {teachers.status === 'error' && (
                    <p role='alert' className='text-sm text-[#B42318] mt-3'>
                        Could not load the teacher list: {teachers.error}{' '}
                        <button type='button' onClick={teachers.reload} className='underline cursor-pointer'>Retry</button>
                    </p>
                )}

                <div className='mt-4 space-y-3'>
                    {rows.map((row) => {
                        const known = teachers.options.some((option) => option.userId === row.classTeacherUserId)
                        return (
                            <div key={row.key} className={`rounded-lg border p-3 ${row.error ? 'border-[#F44336]' : 'border-[#E4E7EC]'} ${row.isActive ? '' : 'bg-[#F9FAFB]'}`}>
                                <div className='grid grid-cols-1 md:grid-cols-[0.8fr_0.8fr_1fr_2fr_auto] gap-3 items-end'>
                                    <div className='flex flex-col gap-y-1'>
                                        <label htmlFor={`edit-name-${row.key}`} className='text-sm font-medium text-[#1E1E1E]'>Section</label>
                                        <input
                                            id={`edit-name-${row.key}`}
                                            value={row.name}
                                            maxLength={20}
                                            onChange={(e) => patchRow(row.key, { name: e.target.value })}
                                            placeholder='e.g. A'
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className='flex flex-col gap-y-1'>
                                        <label htmlFor={`edit-capacity-${row.key}`} className='text-sm font-medium text-[#1E1E1E]'>Capacity</label>
                                        <input
                                            id={`edit-capacity-${row.key}`}
                                            inputMode='numeric'
                                            value={row.capacity}
                                            onChange={(e) => patchRow(row.key, { capacity: e.target.value })}
                                            placeholder='e.g. 40'
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className='flex flex-col gap-y-1'>
                                        <label htmlFor={`edit-room-${row.key}`} className='text-sm font-medium text-[#1E1E1E]'>Room No.</label>
                                        <input
                                            id={`edit-room-${row.key}`}
                                            maxLength={20}
                                            value={row.roomNumber}
                                            onChange={(e) => patchRow(row.key, { roomNumber: e.target.value })}
                                            placeholder='e.g. 102'
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className='flex flex-col gap-y-1'>
                                        <label htmlFor={`edit-teacher-${row.key}`} className='text-sm font-medium text-[#1E1E1E]'>Class Teacher</label>
                                        <select
                                            id={`edit-teacher-${row.key}`}
                                            value={row.classTeacherUserId}
                                            disabled={teachers.status === 'loading'}
                                            onChange={(e) => patchRow(row.key, { classTeacherUserId: e.target.value })}
                                            className={inputClass}
                                        >
                                            <option value=''>{teachers.status === 'loading' ? 'Loading teachers…' : 'No class teacher'}</option>
                                            {row.classTeacherUserId && !known && (
                                                <option value={row.classTeacherUserId}>{row.classTeacherName || 'Current teacher'} (current)</option>
                                            )}
                                            {teachers.options.map((teacher) => (
                                                <option key={teacher.userId} value={teacher.userId}>
                                                    {teacher.name}{teacher.name !== teacher.email ? ` (${teacher.email})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <label className='flex items-center gap-2 text-sm text-[#1E1E1E] pb-2'>
                                        <input
                                            type='checkbox'
                                            checked={row.isActive}
                                            disabled={row.isNew}
                                            onChange={(e) => patchRow(row.key, { isActive: e.target.checked })}
                                        />
                                        Active
                                    </label>
                                </div>
                                {row.error && <p role='alert' className='text-xs text-[#B42318] mt-2'>{row.error}</p>}
                            </div>
                        )
                    })}
                </div>

                <div className='flex flex-col sm:flex-row sm:justify-between gap-3 mt-5'>
                    <button
                        type='button'
                        onClick={addRow}
                        disabled={saving}
                        className='inline-flex items-center justify-center gap-2 text-[#515DEF] text-sm px-4 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white cursor-pointer disabled:opacity-60'
                    >
                        <Plus size={16} />
                        Add Section
                    </button>
                    <div className='flex gap-3'>
                        <button
                            type='button'
                            onClick={onClose}
                            disabled={saving}
                            className='bg-white text-[#77767A] text-sm px-6 py-2 rounded-md border border-[#77767A] hover:bg-[#F2F4F7] cursor-pointer disabled:opacity-60'
                        >
                            Cancel
                        </button>
                        <button
                            type='button'
                            onClick={save}
                            disabled={saving}
                            className='bg-[#515DEF] text-white text-sm px-6 py-2 rounded-md border border-[#515DEF] hover:opacity-90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditClassModal
