import React, { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import AttachmentsUpload from './Components/AttachmentsUpload'
import UserMultiSelect from './Components/UserMultiSelect'
import FileUploadField from '../CommonComponents/FileUploadField'
import { assignTasksViaApi, addTask, isTasksApiMode, toIsoDay, uploadTaskAttachmentsViaApi } from './taskManagementData'
import { useAssignableUsers } from './useAssignableUsers'
import {
    canAssignTasks,
    canAssignToRole,
    getAssignableRoles,
    getRoleLabel,
    getTaskManagementPaths,
    TASK_PRIORITIES,
} from './taskManagementConfig'
import { useTaskRole } from './useTaskRole'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

/** Stable per-assignee key sent with each create call so a retry can never create a second task. */
const makeClientRef = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

const startOfToday = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
}

const AddAssignTaskPage = () => {
    const navigate = useNavigate()
    const roleKey = useTaskRole()
    const paths = getTaskManagementPaths(roleKey)
    const assignableRoles = getAssignableRoles(roleKey)
    const apiMode = isTasksApiMode()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [assigneeRole, setAssigneeRole] = useState('')
    const [selectedUserIds, setSelectedUserIds] = useState([])
    const [priority, setPriority] = useState('')
    const [assignedDate, setAssignedDate] = useState(new Date())
    const [dueDate, setDueDate] = useState(new Date())
    const [submitting, setSubmitting] = useState(false)
    // API mode only: set after a submit in which some users could not be assigned.
    const [outcome, setOutcome] = useState(null)
    // API mode: files chosen before the tasks exist; uploaded to each task once it is created.
    const [pendingFiles, setPendingFiles] = useState([])
    const clientRefs = useRef({})
    const attachmentsDone = useRef({})
    const submittingRef = useRef(false)

    const { users, loading: usersLoading, error: usersError } = useAssignableUsers(assigneeRole)

    const selectedUsers = !selectedUserIds.length
        ? []
        : users.length > 0 && users.every((user) => selectedUserIds.includes(user.id))
            ? ['All']
            : users.filter((user) => selectedUserIds.includes(user.id)).map((user) => user.name)

    const handleRoleChange = (event) => {
        setAssigneeRole(event.target.value)
        setSelectedUserIds([])
    }

    const validate = () => {
        if (!title.trim() || !assigneeRole || !selectedUserIds.length || !priority) {
            alert('Please fill in task title, role, assignees, and priority.')
            return false
        }
        if (!canAssignToRole(roleKey, assigneeRole)) {
            alert('You are not allowed to assign tasks to the selected role.')
            return false
        }
        return true
    }

    const submitLocal = () => {
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

    /** `onlyUserIds`: retry just those users (the earlier successes are never sent again). */
    const submitApi = async (onlyUserIds) => {
        if (submittingRef.current) return // a double click must not send the batch twice
        if (!onlyUserIds && !validate()) return
        if (!dueDate) {
            alert('Please choose a due date.')
            return
        }
        if (toIsoDay(dueDate) < toIsoDay(new Date())) {
            alert('The due date cannot be in the past.')
            return
        }
        const assignees = users.filter(
            (user) => selectedUserIds.includes(user.id) && (!onlyUserIds || onlyUserIds.includes(user.id)),
        )
        if (!assignees.length) {
            alert('The selected users are no longer available. Please reselect.')
            return
        }
        for (const person of assignees) {
            if (!clientRefs.current[person.id]) clientRefs.current[person.id] = makeClientRef()
        }

        submittingRef.current = true
        setSubmitting(true)
        const result = await assignTasksViaApi({
            title: title.trim(),
            description: description.trim(),
            priority,
            dueDate: toIsoDay(dueDate),
            assignees,
            clientRefs: clientRefs.current,
        })
        const created = [...(outcome?.created ?? []), ...result.created]
        const attachmentFailures = pendingFiles.length
            ? await uploadTaskAttachmentsViaApi(created, pendingFiles, attachmentsDone.current)
            : []
        submittingRef.current = false
        setSubmitting(false)

        if (!result.failed.length && !attachmentFailures.length) {
            navigate(paths.assignTasks)
            return
        }
        setOutcome({ created, failed: result.failed, attachmentFailures })
    }

    /** Only attachments failed: upload the missing files again (tasks are not re-created). */
    const retryAttachments = async () => {
        if (submittingRef.current) return
        submittingRef.current = true
        setSubmitting(true)
        const attachmentFailures = await uploadTaskAttachmentsViaApi(outcome.created, pendingFiles, attachmentsDone.current)
        submittingRef.current = false
        setSubmitting(false)
        if (!outcome.failed.length && !attachmentFailures.length) {
            navigate(paths.assignTasks)
            return
        }
        setOutcome({ ...outcome, attachmentFailures })
    }

    const retryOutcome = () =>
        outcome.failed.length ? submitApi(outcome.failed.map((item) => item.userId)) : retryAttachments()

    const handleSubmit = () => (apiMode ? submitApi() : (validate() && submitLocal()))

    if (!canAssignTasks(roleKey)) {
        return <Navigate to={paths.myTasks} replace />
    }

    const locked = Boolean(outcome) || submitting

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Assign Task</h2>
                <fieldset disabled={locked} className='min-w-0 border-0 p-0 m-0'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='task-title' className='text-base font-medium text-[#1E1E1E]'>Task Title:</label>
                            <input
                                type='text'
                                id='task-title'
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={apiMode ? 200 : undefined}
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
                                maxLength={apiMode ? 4000 : undefined}
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
                                users={users}
                                loading={usersLoading}
                                error={usersError}
                            />
                            {selectedUsers.length > 0 && (
                                <p className='text-xs text-[#667085] mt-1'>
                                    Will be assigned to: {selectedUsers.join(', ')}
                                    {apiMode && selectedUserIds.length > 1 && ` — ${selectedUserIds.length} separate tasks will be created, one per person.`}
                                </p>
                            )}
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Assigned Date:</label>
                            {apiMode ? (
                                <input type='text' readOnly value='Today (set by the server)' className={`${inputClass} bg-[#F9FAFB] text-[#808080]`} />
                            ) : (
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
                            )}
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Due Date:</label>
                            <div className='relative'>
                                <DatePicker
                                    selected={dueDate}
                                    onChange={setDueDate}
                                    dateFormat='dd/MM/yyyy'
                                    isClearable
                                    minDate={apiMode ? startOfToday() : assignedDate}
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
                            {apiMode ? (
                                <FileUploadField
                                    label=''
                                    deferred
                                    pendingFiles={pendingFiles}
                                    onPendingChange={setPendingFiles}
                                    disabled={locked}
                                    hint='PDF, PNG, JPG, Word or Excel · up to 10 MB each · attached to every task created'
                                />
                            ) : (
                                <AttachmentsUpload />
                            )}
                        </div>
                    </div>
                </fieldset>
            </div>

            {outcome && (
                <div role='alert' className='mt-6 bg-white rounded-2xl shadow-md p-4 border border-[#FDA29B]'>
                    <h3 className='text-base font-semibold text-[#B42318]'>
                        {outcome.created.length} task(s) created, {outcome.failed.length} could not be assigned
                        {outcome.attachmentFailures?.length ? `, ${outcome.attachmentFailures.length} attachment upload(s) failed` : ''}
                    </h3>
                    {outcome.created.length > 0 && (
                        <p className='text-sm text-[#067647] mt-2'>
                            Created: {outcome.created.map((item) => `${item.taskId} (${item.name})`).join(', ')}
                        </p>
                    )}
                    <ul className='mt-2 space-y-1 text-sm text-[#B42318]'>
                        {outcome.failed.map((item) => (
                            <li key={item.userId}>
                                <span className='font-medium'>{item.name}:</span> {item.message}
                            </li>
                        ))}
                        {(outcome.attachmentFailures ?? []).map((item) => (
                            <li key={`${item.id}-${item.fileName}`}>
                                <span className='font-medium'>{item.fileName}</span> was not attached to {item.taskId} ({item.name}): {item.message}
                            </li>
                        ))}
                    </ul>
                    <p className='text-xs text-[#667085] mt-3'>
                        Retrying only sends the failed people and attachments, and never creates a duplicate task or file.
                    </p>
                </div>
            )}

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(paths.assignTasks)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    {outcome ? 'Close' : 'Discard Changes'}
                </button>
                {outcome ? (
                    <button
                        type='button'
                        onClick={retryOutcome}
                        disabled={submitting}
                        className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {submitting
                            ? 'Retrying…'
                            : `Retry failed (${outcome.failed.length + (outcome.attachmentFailures?.length ?? 0)})`}
                    </button>
                ) : (
                    <button
                        type='button'
                        onClick={handleSubmit}
                        disabled={submitting}
                        className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {submitting ? 'Assigning…' : 'Assign Task'}
                    </button>
                )}
            </div>
        </section>
    )
}

export default AddAssignTaskPage
