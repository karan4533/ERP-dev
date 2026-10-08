import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { getNextStatusOptions, statusBadgeColor, TASK_STATUSES } from '../taskManagementConfig'

const UpdateTaskStatusModal = ({ open, task, onClose, onSave, showRemark = false }) => {
    const [status, setStatus] = useState(task?.status ?? 'Pending')
    const [remark, setRemark] = useState(task?.remark ?? '')

    useEffect(() => {
        if (task?.status) setStatus(task.status)
        setRemark(task?.remark ?? '')
    }, [task])

    if (!open || !task) return null

    const nextOptions = getNextStatusOptions(task.status)
    const selectableStatuses = nextOptions.length
        ? nextOptions
        : TASK_STATUSES.filter((item) => item !== task.status)

    const handleSave = () => {
        onSave(task.id, status, remark)
        onClose()
    }

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
                            <label htmlFor='task-remark' className='text-base font-medium text-[#1E1E1E]'>Remarks</label>
                            <textarea id='task-remark' value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                        </div>
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
                        disabled={!showRemark && status === task.status}
                        className='bg-[#515DEF] text-white text-sm px-6 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        Update Status
                    </button>
                </div>
            </div>
        </div>
    )
}

export default UpdateTaskStatusModal
