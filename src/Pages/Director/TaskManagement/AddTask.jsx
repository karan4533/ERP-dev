import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import AttachmentsUpload from './Components/AttachmentsUpload'
import UserMultiSelect from './Components/UserMultiSelect'
import {
    getUsersByRole,
    LOWER_HIERARCHY_ROLES,
    TASK_PRIORITIES,
    TASK_STATUSES,
} from './taskData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const AddTask = () => {
    const navigate = useNavigate()
    const [roleKey, setRoleKey] = useState('')
    const [selectedUserIds, setSelectedUserIds] = useState([])
    const [assignedDate, setAssignedDate] = useState(new Date())
    const [dueDate, setDueDate] = useState(new Date())

    const selectedUsers = useMemo(() => {
        const users = getUsersByRole(roleKey)
        if (!selectedUserIds.length) return []
        if (users.length > 0 && users.every((user) => selectedUserIds.includes(user.id))) {
            return ['All']
        }
        return users.filter((user) => selectedUserIds.includes(user.id)).map((user) => user.name)
    }, [roleKey, selectedUserIds])

    const handleRoleChange = (event) => {
        setRoleKey(event.target.value)
        setSelectedUserIds([])
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Assign Task</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='task-title' className='text-base font-medium text-[#1E1E1E]'>Task Title:</label>
                        <input type='text' id='task-title' className={inputClass} placeholder='Enter task title' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='task-role' className='text-base font-medium text-[#1E1E1E]'>Role:</label>
                        <select id='task-role' value={roleKey} onChange={handleRoleChange} className={inputClass}>
                            <option value=''>Select Role</option>
                            {LOWER_HIERARCHY_ROLES.map((role) => (
                                <option key={role.key} value={role.key}>{role.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='task-priority' className='text-base font-medium text-[#1E1E1E]'>Priority:</label>
                        <select id='task-priority' className={inputClass}>
                            <option value=''>Select Priority</option>
                            {TASK_PRIORITIES.map((priority) => (
                                <option key={priority} value={priority}>{priority}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2 lg:col-span-3'>
                        <label htmlFor='task-description' className='text-base font-medium text-[#1E1E1E]'>Task Description:</label>
                        <textarea id='task-description' rows={3} className={inputClass} placeholder='Describe the task...' />
                    </div>
                    <div className='flex flex-col gap-y-2 lg:col-span-3'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Assign To:</label>
                        <UserMultiSelect
                            roleKey={roleKey}
                            selectedUserIds={selectedUserIds}
                            onChange={setSelectedUserIds}
                        />
                        {selectedUsers.length > 0 && (
                            <p className='text-xs text-[#667085] mt-1'>
                                Will be assigned to: {selectedUsers.join(', ')}
                            </p>
                        )}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Assigned Date:</label>
                        <div className='relative'>
                            <DatePicker
                                selected={assignedDate}
                                onChange={setAssignedDate}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Due Date:</label>
                        <div className='relative'>
                            <DatePicker
                                selected={dueDate}
                                onChange={setDueDate}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                minDate={assignedDate}
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='task-status' className='text-base font-medium text-[#1E1E1E]'>Status:</label>
                        <select id='task-status' className={inputClass} defaultValue='Incomplete'>
                            {TASK_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Upload Document:</label>
                        <AttachmentsUpload />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/director/task-management')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={() => navigate('/director/task-management')}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Assign Task
                </button>
            </div>
        </section>
    )
}

export default AddTask
