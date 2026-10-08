import React, { useMemo, useState } from 'react'
import { Navigate, NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon, Plus } from 'lucide-react'
import Dropdown from '../CommonComponents/Dropdown'
import ExportModal from '../CommonComponents/ExportModal'
import EditRequestModal from '../CommonComponents/EditRequestModal'
import DeleteRequestModal from '../CommonComponents/DeleteRequestModal'
import { getTasksAssignedByRole } from './taskManagementData'
import {
    canAssignTasks,
    formatAssignedTo,
    getAssignableRoles,
    getRoleLabel,
    getTaskManagementPaths,
    statusBadgeColor,
    TASK_STATUSES,
} from './taskManagementConfig'
import { useTaskRole } from './useTaskRole'

const AssignTasksPage = () => {
    const roleKey = useTaskRole()
    const paths = getTaskManagementPaths(roleKey)
    const assignableRoles = getAssignableRoles(roleKey)

    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)

    const tasks = useMemo(() => getTasksAssignedByRole(roleKey), [roleKey])

    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase()
        return tasks.filter((task) => {
            if (roleFilter && task.assigneeRole !== roleFilter) return false
            if (statusFilter && task.status !== statusFilter) return false
            if (!query) return true
            return (
                task.taskId?.toLowerCase().includes(query) ||
                task.title?.toLowerCase().includes(query) ||
                task.description?.toLowerCase().includes(query)
            )
        })
    }, [tasks, search, roleFilter, statusFilter])

    if (!canAssignTasks(roleKey)) {
        return <Navigate to={paths.myTasks} replace />
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearch('')
                            setRoleFilter('')
                            setStatusFilter('')
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Task ID, title...'
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    {assignableRoles.length > 0 && (
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#808080]'>Role</label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                            >
                                <option value=''>All Roles</option>
                                {assignableRoles.map((role) => (
                                    <option key={role.key} value={role.key}>{role.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {TASK_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative'>
                            <DatePicker selected={fromDate} onChange={setFromDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Assign Tasks List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink to={paths.addTask} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Plus size={16} />
                            Assign Task
                        </NavLink>
                        <button type='button' onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Task ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Title</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Description</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Role</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Assigned To</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Priority</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Due Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className='px-2 py-8 text-center text-[#808080]'>
                                        No tasks assigned yet.
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => (
                                    <tr key={task.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{task.taskId}</td>
                                        <td className='px-2 py-4'>{task.title}</td>
                                        <td className='px-2 py-4 max-w-[200px] truncate' title={task.description}>{task.description}</td>
                                        <td className='px-2 py-4'>{getRoleLabel(task.assigneeRole)}</td>
                                        <td className='px-2 py-4' title={task.assigneeNames?.join(', ')}>{formatAssignedTo(task.assigneeNames)}</td>
                                        <td className='px-2 py-4'>{task.priority}</td>
                                        <td className='px-2 py-4'>{task.dueDate}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[task.status] ?? ''}`}>{task.status}</span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <button type='button' onClick={() => setEditRequestModal(true)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>Edit</button>
                                                <button type='button' onClick={() => setDeleteRequestModal(true)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>Delete</button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredTasks.length} of {filteredTasks.length} entries
                </p>
                <div className='flex gap-x-2'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'><ChevronLeft size={16} /></button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>1</button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'><ChevronRight size={16} /></button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />
            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />
        </section>
    )
}

export default AssignTasksPage
