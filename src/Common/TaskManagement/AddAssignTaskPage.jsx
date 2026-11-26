import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { toast } from 'react-toastify'
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
import IntegrationNotice from '../ui/IntegrationNotice'
import PageHeader from '../ui/PageHeader'
import Surface from '../ui/Surface'
import UnavailableWorkflowPage from '../ui/UnavailableWorkflowPage'
import WorkflowContextBar from '../ui/WorkflowContextBar'

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
            toast.error('Complete the task title, role, assignees and priority.')
            return
        }

        if (!canAssignToRole(roleKey, assigneeRole)) {
            toast.error('Your role cannot assign tasks to the selected role.')
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
            toast.error('Unable to assign the task. Check the selected role and staff.')
            return
        }

        toast.success(`Task assigned to ${selectedUsers.join(', ')}.`)
        navigate(paths.assignTasks)
    }

    if (!canAssignTasks(roleKey)) {
        return <UnavailableWorkflowPage title='Task assignment is outside your role' description='You can update your own assigned work, but this role cannot delegate tasks.' alternateHref={paths.myTasks} alternateLabel='Open my tasks' />
    }

    return (
        <section className='space-y-5'>
            <PageHeader title='Assign task' description='Delegate work to a permitted direct-report role with a clear owner and deadline.' />
            <IntegrationNotice state='demo' title='Local task assignment' description='Tasks are stored in this browser. Assignee notifications, evidence uploads and production audit events are not connected.' />
            <WorkflowContextBar owner={selectedUsers.length ? selectedUsers.join(', ') : 'Select assignees'} due={dueDate?.toLocaleDateString('en-GB')} priority={priority || 'Select priority'} nextAction='Complete and assign the task' />
            <Surface title='Task information' description='Required fields identify who owns the work and when it is due.' contentClassName='p-4 sm:p-5'>
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
                    <fieldset className='flex flex-col gap-y-2 lg:col-span-3'>
                        <legend className='text-base font-medium text-[#1E1E1E]'>Assign To:</legend>
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
                    </fieldset>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='task-assigned-date' className='text-base font-medium text-[#1E1E1E]'>Assigned Date:</label>
                        <div className='relative'>
                            <DatePicker
                                id='task-assigned-date'
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
                        <label htmlFor='task-due-date' className='text-base font-medium text-[#1E1E1E]'>Due Date:</label>
                        <div className='relative'>
                            <DatePicker
                                id='task-due-date'
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
                        <label htmlFor='task-initial-status' className='text-base font-medium text-[#1E1E1E]'>Initial Status:</label>
                        <input id='task-initial-status' type='text' readOnly value='Pending' className={`${inputClass} bg-[#F9FAFB] text-[#808080]`} />
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <p className='text-base font-medium text-[#1E1E1E]'>Supporting document:</p>
                        <AttachmentsUpload />
                    </div>
                </div>
            </Surface>

            <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
                <button
                    type='button'
                    onClick={() => navigate(paths.assignTasks)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Cancel
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
