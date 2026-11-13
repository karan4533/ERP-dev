import React, { useState } from 'react'
import { getNextStatusOptions, TASK_STATUSES } from '../taskManagementConfig'
import Dialog from '../../ui/Dialog'
import FormField from '../../ui/FormField'
import StatusBadge from '../../ui/StatusBadge'

const UpdateTaskStatusModal = ({ open, task, onClose, onSave, showRemark = false }) => {
    const [status, setStatus] = useState(task?.status ?? 'Pending')
    const [remark, setRemark] = useState(task?.remark ?? '')

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
        <Dialog
            open={open}
            onClose={onClose}
            title='Update task status'
            description={`${task.taskId} · ${task.title}`}
            size='sm'
            footer={(
                <>
                    <button type='button' onClick={onClose} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold'>Cancel</button>
                    <button type='button' onClick={handleSave} disabled={!showRemark && status === task.status} className='min-h-10 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white disabled:opacity-50'>Update status</button>
                </>
            )}
        >
                <div className='space-y-4'>
                    <div>
                        <p className='text-sm text-[#808080]'>Task</p>
                        <p className='text-base font-medium text-[#1E1E1E]'>{task.title}</p>
                        <p className='text-xs text-[#667085] mt-1'>{task.taskId}</p>
                    </div>
                    <div>
                        <p className='text-sm text-[#808080] mb-1'>Current Status</p>
                        <StatusBadge status={task.status} />
                    </div>
                    <FormField id='new-status' label='New status' required>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className='text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
                        >
                            <option value={task.status}>{task.status} (current)</option>
                            {selectableStatuses.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>
                    {showRemark && (
                        <FormField id='task-remark' label='Remarks' hint='Record useful handoff or completion context.'>
                            <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                        </FormField>
                    )}
                </div>
        </Dialog>
    )
}

export default UpdateTaskStatusModal
