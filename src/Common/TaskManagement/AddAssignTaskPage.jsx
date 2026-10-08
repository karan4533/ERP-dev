import React, { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import AttachmentsUpload from './Components/AttachmentsUpload'
import UserMultiSelect from './Components/UserMultiSelect'
import { addTask } from './taskManagementData'
import {
    canAssignTasks,
    canAssignToRole,
    getAssignableRoles,
    getRoleLabel,
    getTaskManagementPaths,
    getUsersByRole,
    TASK_PRIORITIES,
} from './taskManagementConfig'
import { useTaskRole } from './useTaskRole'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const AddAssignTaskPage = () => {
    const navigate = useNavigate()
    const roleKey = useTaskRole()
    const paths = getTaskManagementPaths(roleKey)
    const assignableRoles = getAssignableRoles(roleKey)

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [assigneeRole, setAssigneeRole] = useState('')
    const [selectedUserIds, setSelectedUserIds] = useState([])
    const [priority, setPriority] = useState('')
    const [assignedDate, setAssignedDate] = useState(new Date())
    const [dueDate, setDueDate] = useState(new Date())

    const selectedUsers = useMemo(() => {
        const users = getUsersByRole(assigneeRole)
        if (!selectedUserIds.length) return []
        if (users.length > 0 && users.every((user) => selectedUserIds.includes(user.id))) {
            return ['All']
        }
        return users.filter((user) => selectedUserIds.includes(user.id)).map((user) => user.name)
    }, [assigneeRole, selectedUserIds])

    const handleRoleChange = (event) => {
        setAssigneeRole(event.target.value)
        setSelectedUserIds([])
    }

    const handleSubmit = () => {
        if (!title.trim() || !assigneeRole || !selectedUserIds.length || !priority) {
            alert('Please fill in task title, role, assignees, and priority.')
            return
        }

        if (!canAssignToRole(roleKey, assigneeRole)) {
            alert('You are not allowed to assign tasks to the selected role.')
            return
        }

        const created = addTask({
            title: title.trim(),
            description: description.trim(),
            assigneeRole,
            assigneeUserIds: selectedUserIds,
            assignedByRole: roleKey,
            assignedBy: getRoleLabel(roleKey),
            priority,
            assignedDate,
            dueDate,
            status: 'Pending',
        })

        if (!created) {
            alert('Unable to assign task. Check the selected role and users.')
            return
        }

        navigate(paths.assignTasks)
    }

    if (!canAssignTasks(roleKey)) {
        return <Navigate to={paths.myTasks} replace />
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Assign Task</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='task-title' className='text-base font-medium text-[#1E1E1E]'>Task Title:</label>
                        <input
                            type='text'
                            id='task-title'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={inputClass}
                            placeholder='Enter task title'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='task-role' className='text-base font-medium text-[#1E1E1E]'>Role:</label>
                        <select id='task-role' value={assigneeRole} onChange={handleRoleChange} className={inputClass}>
                            <option value=''>Select Role</option>
                            {assignableRoles.map((role) => (
                                <option key={role.key} value={role.key}>{role.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='task-priority' className='text-base font-medium text-[#1E1E1E]'>Priority:</label>
                        <select id='task-priority' value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
                            <option value=''>Select Priority</option>
                            {TASK_PRIORITIES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2 lg:col-span-3'>
                        <label htmlFor='task-description' className='text-base font-medium text-[#1E1E1E]'>Task Description:</label>
                        <textarea
                            id='task-description'
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={inputClass}
                            placeholder='Describe the task...'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2 lg:col-span-3'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Assign To:</label>
                        <UserMultiSelect
                            roleKey={assigneeRole}
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
                        <label className='text-base font-medium text-[#1E1E1E]'>Initial Status:</label>
                        <input type='text' readOnly value='Pending' className={`${inputClass} bg-[#F9FAFB] text-[#808080]`} />
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
                    onClick={() => navigate(paths.assignTasks)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSubmit}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Assign Task
                </button>
            </div>
        </section>
    )
}

export default AddAssignTaskPage
