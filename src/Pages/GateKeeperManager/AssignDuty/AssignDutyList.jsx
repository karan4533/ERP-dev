import React, { useState, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, Plus, EllipsisIcon } from 'lucide-react'
import { toast } from 'react-toastify'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import EditRequestModal from '../../../Common/CommonComponents/EditRequestModal'
import DeleteRequestModal from '../../../Common/CommonComponents/DeleteRequestModal'
import { DUTIES_STORAGE_KEY, DEFAULT_GATEKEEPER_DUTIES, loadDuties } from './assignDutyData'

export { DUTIES_STORAGE_KEY, DEFAULT_GATEKEEPER_DUTIES, loadDuties }

const statusBadgeColor = {
    'Pending': 'bg-[#FF980033] text-[#FF9800]',
    'In Progress': 'bg-[#2196F333] text-[#2196F3]',
    'Completed': 'bg-[#4CAF5033] text-[#4CAF50]',
}

const AssignDutyList = () => {
    const [duties, setDuties] = useState(loadDuties)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [editRequestModal, setEditRequestModal] = useState(false)
    const [deleteRequestModal, setDeleteRequestModal] = useState(false)

    const handleStatusChange = (dutyId, newStatus) => {
        const updated = duties.map((d) => {
            if (d.dutyId === dutyId || d.id === dutyId) {
                return { ...d, status: newStatus }
            }
            return d
        })
        setDuties(updated)
        try {
            localStorage.setItem(DUTIES_STORAGE_KEY, JSON.stringify(updated))
        } catch {
            /* ignore */
        }
        toast.success(`Duty shift ${dutyId} marked as "${newStatus}"`)
    }

    const filteredDuties = useMemo(() => {
        return duties.filter((item) => {
            if (search.trim()) {
                const q = search.toLowerCase()
                const match =
                    item.dutyId.toLowerCase().includes(q) ||
                    item.gateKeeperName.toLowerCase().includes(q) ||
                    item.employeeId.toLowerCase().includes(q) ||
                    item.gateLocation.toLowerCase().includes(q)
                if (!match) return false
            }
            if (statusFilter && item.status !== statusFilter) return false
            return true
        })
    }, [duties, search, statusFilter])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearch('')
                            setStatusFilter('')
                            setFromDate(null)
                            setToDate(null)
                        }}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='search'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Duty ID, name, location...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status'
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All Statuses</option>
                            <option value='Pending'>Pending</option>
                            <option value='In Progress'>In Progress</option>
                            <option value='Completed'>Completed</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
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
                        <div className='relative w-full'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
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
                    <h2 className='text-xl font-medium text-black'>Assign Duty List</h2>
                    <div className='flex gap-x-2'>
                        <NavLink to='/gatekeeper-manager/assign-duty' className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Plus size={16} />
                            Assign Duty
                        </NavLink>
                        <button onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr className='rounded-lg'>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Duty ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Gate Keeper Name</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Employee ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Gate Location</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Shift</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Duty Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Start Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>End Time</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Assigned By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredDuties.map((duty) => (
                                <tr key={duty.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                    <td className='px-2 py-4 rounded-s-lg font-mono font-medium text-indigo-600'>{duty.dutyId}</td>
                                    <td className='px-2 py-4 font-semibold text-slate-800'>{duty.gateKeeperName}</td>
                                    <td className='px-2 py-4'>{duty.employeeId}</td>
                                    <td className='px-2 py-4'>{duty.gateLocation}</td>
                                    <td className='px-2 py-4'>{duty.shift}</td>
                                    <td className='px-2 py-4'>{duty.dutyDate}</td>
                                    <td className='px-2 py-4'>{duty.startTime}</td>
                                    <td className='px-2 py-4'>{duty.endTime}</td>
                                    <td className='px-2 py-4'>{duty.assignedBy}</td>
                                    <td className='px-2 py-4'>
                                        <select
                                            value={duty.status}
                                            onChange={(e) => handleStatusChange(duty.dutyId, e.target.value)}
                                            className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border border-slate-200 cursor-pointer outline-none transition ${statusBadgeColor[duty.status] || 'bg-slate-100 text-slate-700'}`}
                                        >
                                            <option value='Pending'>Pending</option>
                                            <option value='In Progress'>In Progress</option>
                                            <option value='Completed'>Completed</option>
                                        </select>
                                    </td>
                                    <td className='px-2 py-4 text-center rounded-e-lg'>
                                        <Dropdown
                                            buttonContent={<EllipsisIcon size={16} className='text-black' />}
                                        >
                                            <button className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
                                                View
                                            </button>
                                            <button onClick={() => setEditRequestModal(true)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
                                                Edit
                                            </button>
                                            <button onClick={() => setDeleteRequestModal(true)} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>
                                                Delete
                                            </button>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                            {filteredDuties.length === 0 && (
                                <tr>
                                    <td colSpan={11} className='text-center py-8 text-slate-400 text-sm'>
                                        No security shift assignments found matching filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>Showing 1 to {filteredDuties.length} of {duties.length} entries</p>

                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
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

export default AssignDutyList
