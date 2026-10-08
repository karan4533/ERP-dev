import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../CommonComponents/ExportModal'
import UpdateTaskStatusModal from './Components/UpdateTaskStatusModal'
import { getDemoUserId, getMyTasks, updateTaskStatus } from './taskManagementData'
import { getNextStatusOptions, statusBadgeColor, TASK_STATUSES } from './taskManagementConfig'
import { useTaskRole } from './useTaskRole'

const MyTasksPage = () => {
    const { pathname } = useLocation()
    const pageTitle = pathname.includes('/assigned-tasks') ? 'Assigned Tasks List' : 'My Tasks'
    const roleKey = useTaskRole()
    const userId = getDemoUserId(roleKey)

    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [assignedByFilter, setAssignedByFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [statusModalTask, setStatusModalTask] = useState(null)

    const tasks = useMemo(() => {
        void refreshKey
        return getMyTasks(roleKey, userId)
    }, [roleKey, userId, refreshKey])

    const assignedByOptions = useMemo(
        () => [...new Set(tasks.map((task) => task.assignedBy).filter(Boolean))],
        [tasks]
    )

    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase()
        return tasks.filter((task) => {
            if (statusFilter && task.status !== statusFilter) return false
            if (assignedByFilter && task.assignedBy !== assignedByFilter) return false
            if (!query) return true
            return (
                task.taskId?.toLowerCase().includes(query) ||
                task.title?.toLowerCase().includes(query) ||
                task.description?.toLowerCase().includes(query) ||
                task.assignedBy?.toLowerCase().includes(query)
            )
        })
    }, [tasks, search, statusFilter, assignedByFilter])

    const showRemarks = pathname.includes('/housekeeping-manager/')
    const handleStatusSave = (taskId, status, remark) => {
        updateTaskStatus(taskId, status, remark)
        setRefreshKey((key) => key + 1)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
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
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Assigned By</label>
                        <select
                            value={assignedByFilter}
                            onChange={(e) => setAssignedByFilter(e.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {assignedByOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
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
                <div className='flex justify-between items-center mb-4'>
                    <h2 className='text-xl font-medium text-black'>{pageTitle}</h2>
                    <button type='button' onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Task ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Title</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Description</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Assigned By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Priority</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Due Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                {showRemarks && <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Remarks</th>}
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={showRemarks ? 9 : 8} className='px-2 py-8 text-center text-[#808080]'>
                                        No tasks assigned to you.
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => {
                                    const canUpdate = getNextStatusOptions(task.status).length > 0
                                    return (
                                        <tr key={task.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{task.taskId}</td>
                                            <td className='px-2 py-4'>{task.title}</td>
                                            <td className='px-2 py-4 max-w-[200px] truncate' title={task.description}>{task.description}</td>
                                            <td className='px-2 py-4'>{task.assignedBy}</td>
                                            <td className='px-2 py-4'>{task.priority}</td>
                                            <td className='px-2 py-4'>{task.dueDate}</td>
                                            <td className='px-2 py-4'>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[task.status] ?? ''}`}>{task.status}</span>
                                            </td>
                                            {showRemarks && <td className='px-2 py-4 max-w-[180px]'>{task.remark || '—'}</td>}
                                            <td className='px-2 py-4 rounded-e-lg'>
                                                {canUpdate ? (
                                                    <button
                                                        type='button'
                                                        onClick={() => setStatusModalTask(task)}
                                                        className='bg-[#515DEF] text-white text-xs px-3 py-1.5 rounded-md hover:opacity-90 transition-all cursor-pointer whitespace-nowrap'
                                                    >
                                                        Update Status
                                                    </button>
                                                ) : (
                                                    <span className='text-xs text-[#808080]'>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
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
            <UpdateTaskStatusModal
                open={Boolean(statusModalTask)}
                task={statusModalTask}
                onClose={() => setStatusModalTask(null)}
                showRemark={showRemarks}
                onSave={handleStatusSave}
            />
        </section>
    )
}

export default MyTasksPage
