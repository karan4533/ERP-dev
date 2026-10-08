import React, { useState } from 'react'
import { NavLink } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, EllipsisIcon, ChevronLeft, ChevronRight, Plus, Download } from "lucide-react";
import Dropdown from '../../../Common/CommonComponents/Dropdown';
import ExportModal from '../../../Common/CommonComponents/ExportModal';
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import { TASKS, statusBadgeColor } from './taskData'

const TaskManagement = () => {

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const parseDmy = (value) => {
        const [day, month, year] = String(value || '').split('-').map(Number)
        return year ? new Date(year, month - 1, day) : null
    }
    const visibleTasks = TASKS.filter((task) => {
        const query = search.trim().toLowerCase()
        const date = parseDmy(task.assignedDate)
        const start = fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()) : null
        const end = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()) : null
        return (!query || `${task.taskId} ${task.title} ${task.assignedTo} ${task.assignedBy || ''}`.toLowerCase().includes(query))
            && (!status || task.status === status)
            && (!start || (date && date >= start))
            && (!end || (date && date <= end))
    })
    const [exportModal, setExportModal] = useState(false);
    const [editRequestModal, setEditRequestModal] = useState(false);
    const [deleteRequestModal, setDeleteRequestModal] = useState(false);

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' onClick={() => { setSearch(''); setStatus(''); setFromDate(null); setToDate(null) }} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                    <select name="" id="" className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value="">From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="search" className='text-base font-medium text-[#808080]'>Search</label>
                        <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="status" className='text-base font-medium text-[#808080]'>Status</label>
                        <select value={status} onChange={(event) => setStatus(event.target.value)} className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                            {['In Progress', 'Completed', 'In Complete'].map((item) => <option key={item}>{item}</option>)}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>

                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable={true}
                                showMonthYearDropdown={true}
                                scrollableMonthYearDropdown={true}
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />

                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>

                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable={true}
                                showMonthYearDropdown={true}
                                scrollableMonthYearDropdown={true}
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />

                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Task Management List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink to="/housekeeping-manager/task-management/add-task" className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Plus size={16} />
                            Add Task
                        </NavLink>
                        <button onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select name="" id="" className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                        <option value="40">40</option>
                        <option value="50">50</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr className='rounded-lg'>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Task ID</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Task Title</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Task Description</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Assigned To</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Priority</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Assigned Date</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Due Date</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Status</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {visibleTasks.map((task) => (
                                <tr key={task.taskId} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg">
                                    <td className="px-2 py-4 rounded-s-lg">{task.taskId}</td>
                                    <td className="px-2 py-4">{task.title}</td>
                                    <td className="px-2 py-4 max-w-xs truncate">{task.description}</td>
                                    <td className="px-2 py-4">{task.assignedTo}</td>
                                    <td className="px-2 py-4">{task.priority}</td>
                                    <td className="px-2 py-4">{task.assignedDate}</td>
                                    <td className="px-2 py-4">{task.dueDate}</td>
                                    <td className="px-2 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[task.status]}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-2 py-4 text-center rounded-e-lg">
                                        <Dropdown
                                            buttonContent={<EllipsisIcon size={16} className='text-black' />}
                                        >
                                            <button className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer">
                                                View
                                            </button>
                                            <button onClick={() => setEditRequestModal(true)} className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer">
                                                Edit
                                            </button>
                                            <button onClick={() => setDeleteRequestModal(true)} className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer">
                                                Delete
                                            </button>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to {TASKS.length} of {TASKS.length} entries</p>

                <div className="flex justify-center gap-x-2 flex-wrap">
                    <button className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer">
                        <ChevronLeft size={16} />
                    </button>

                    <button className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer">
                        1
                    </button>

                    <button className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer">
                        2
                    </button>

                    <button className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />

            <EditRequestModal editRequestModal={editRequestModal} setEditRequestModal={setEditRequestModal} />

            <DeleteRequestModal deleteRequestModal={deleteRequestModal} setDeleteRequestModal={setDeleteRequestModal} />

        </section>
    )
}

export default TaskManagement
