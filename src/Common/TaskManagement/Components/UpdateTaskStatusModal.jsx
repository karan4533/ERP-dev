import React, { useState } from 'react'
import { X } from 'lucide-react'
import { getNextStatusOptions, statusBadgeColor, TASK_STATUSES } from '../taskManagementConfig'
import { TASK_ATTACHMENT_RESOURCE } from '../taskManagementData'
import ResourceAttachments from '../../CommonComponents/ResourceAttachments'

/**
 * onSave(taskId, status, remark) may be synchronous (local mode) or return a promise resolving to
 * { ok, error } (API mode). On { ok: false } the modal stays open and shows the error.
 * - requireStatusChange: the status must actually change (API mode: the server rejects a no-op move).
 * State is initialised from the task once: render with key={task.id} so each task gets a fresh modal.
 * - prefillRemark: start with the task's last remark (local mode) instead of an empty box (API mode, where
 *   every remark belongs to one specific move).
 */
const UpdateTaskStatusModal = ({
    open,
    task,
    onClose,
    onSave,
    showRemark = false,
    requireStatusChange = false,
    prefillRemark = true,
}) => {
    const [status, setStatus] = useState(task?.status ?? 'Pending')
    const [remark, setRemark] = useState(prefillRemark ? (task?.remark ?? '') : '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    if (!open || !task) return null

    const nextOptions = getNextStatusOptions(task.status)
    const selectableStatuses = nextOptions.length
        ? nextOptions
        : TASK_STATUSES.filter((item) => item !== task.status)

    const handleSave = async () => {
        if (saving) return
        setSaving(true)
        setError('')
        const result = await onSave(task.id, status, remark)
        if (result && result.ok === false) {
            setSaving(false)
            setError(result.error || 'Could not update the task.')
            return
        }
        setSaving(false)
        onClose()
    }

    const needsChange = !showRemark || requireStatusChange

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
            <div className='bg-white rounded-2xl shadow-xl w-full max-w-md'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#EDEEF5]'>
                    <h3 className='text-lg font-semibold text-black'>Update Task Status</h3>
                    <button type='button' onClick={onClose} className='text-[#808080] hover:text-black cursor-pointer'>
                        <X size={20} />
                    </button>
                </div>
                <div className='px-6 py-5 space-y-4'>
                    <div>
                        <p className='text-sm text-[#808080]'>Task</p>
                        <p className='text-base font-medium text-[#1E1E1E]'>{task.title}</p>
                        <p className='text-xs text-[#667085] mt-1'>{task.taskId}</p>
                    </div>
                    {task.fromApi && (
                        <ResourceAttachments resourceType={TASK_ATTACHMENT_RESOURCE} resourceId={task.id} canUpload />
                    )}
                    <div>
                        <p className='text-sm text-[#808080] mb-1'>Current Status</p>
                        <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[task.status] ?? ''}`}>
                            {task.status}
                        </span>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='new-status' className='text-base font-medium text-[#1E1E1E]'>New Status</label>
                        <select
                            id='new-status'
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        >
                            <option value={task.status}>{task.status} (current)</option>
                            {selectableStatuses.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    {showRemark && (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='task-remark' className='text-base font-medium text-[#1E1E1E]'>Remarks (optional)</label>
                            <textarea id='task-remark' value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} maxLength={2000} className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                        </div>
                    )}
                    {error && (
                        <p role='alert' className='text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-md px-3 py-2'>{error}</p>
                    )}
                </div>
                <div className='flex justify-end gap-3 px-6 py-4 border-t border-[#EDEEF5]'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='bg-white text-[#515DEF] text-sm px-6 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all cursor-pointer'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={handleSave}
                        disabled={saving || (needsChange && status === task.status)}
                        className='bg-[#515DEF] text-white text-sm px-6 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {saving ? 'Saving…' : 'Update Status'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default UpdateTaskStatusModal
