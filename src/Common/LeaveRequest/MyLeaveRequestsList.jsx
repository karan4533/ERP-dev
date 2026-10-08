import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Dropdown from '../CommonComponents/Dropdown'
import ExportModal from '../CommonComponents/ExportModal'
import { getMyLeaveRequestsForRole, LEAVE_REQUESTS_UPDATED_EVENT, LEAVE_STATUSES, parseLeaveDate, statusBadgeColor } from './leaveRequestData'
import { getLeaveMyViewPath, getLeaveRoutes, resolveRoleKey } from './leaveRequestConfigs'

export default function MyLeaveRequestsList({ roleKey: roleKeyProp }) {
    const location = useLocation()
    const { role: authRole } = useAuth()
    const roleKey = resolveRoleKey(authRole || roleKeyProp)
    const routes = getLeaveRoutes(roleKey)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        setRefreshKey((value) => value + 1)
    }, [location.pathname])

    useEffect(() => {
        const refresh = () => setRefreshKey((value) => value + 1)
        window.addEventListener(LEAVE_REQUESTS_UPDATED_EVENT, refresh)
        window.addEventListener('storage', refresh)
        return () => {
            window.removeEventListener(LEAVE_REQUESTS_UPDATED_EVENT, refresh)
            window.removeEventListener('storage', refresh)
        }
    }, [])

    const requests = useMemo(() => {
        void refreshKey
        return getMyLeaveRequestsForRole(roleKey)
    }, [roleKey, refreshKey, location.key])

    const filteredRequests = useMemo(() => {
        const query = search.trim().toLowerCase()
        return requests.filter((request) => {
            if (statusFilter && request.status !== statusFilter) return false

            const requestDate = parseLeaveDate(request.appliedDate)
            if (fromDate && requestDate && requestDate < fromDate) return false
            if (toDate && requestDate && requestDate > toDate) return false

            if (!query) return true
            const haystack = `${request.leaveRequestId} ${request.leaveType} ${request.reason} ${request.requestedTo} ${request.status}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [requests, search, statusFilter, fromDate, toDate])

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('')
        setFromDate(null)
        setToDate(null)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' onClick={clearFilters} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'><option value=''>From Beginning</option></select>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input type='text' value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Leave ID, type...' className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Status</label>
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value=''>All</option>
                            {LEAVE_STATUSES.map((status) => (
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
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker selected={toDate} onChange={setToDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>My Leave Requests</h2>
                    <div className='flex gap-x-2'>
                        {routes.add ? (
                            <NavLink to={routes.add} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                                <Plus size={16} />
                                Apply Leave
                            </NavLink>
                        ) : null}
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
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Leave Request ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Leave Type</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>From Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>To Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Total Days</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Applied Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Reason</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Requested To</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className='px-2 py-8 text-center text-[#667085]'>No leave requests found.</td>
                                </tr>
                            ) : (
                                filteredRequests.map((request) => (
                                    <tr key={request.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{request.leaveRequestId}</td>
                                        <td className='px-2 py-4'>{request.leaveType}</td>
                                        <td className='px-2 py-4'>{request.fromDate}</td>
                                        <td className='px-2 py-4'>{request.toDate}</td>
                                        <td className='px-2 py-4'>{request.totalDays}</td>
                                        <td className='px-2 py-4'>{request.appliedDate}</td>
                                        <td className='px-2 py-4 max-w-[180px] truncate' title={request.reason}>{request.reason}</td>
                                        <td className='px-2 py-4'>{request.requestedTo}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[request.status]}`}>{request.status}</span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink to={getLeaveMyViewPath(roleKey, request.id)} className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'>View</NavLink>
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
                <p className='text-sm font-medium text-[#515DEF]'>Showing {filteredRequests.length === 0 ? 0 : 1} to {filteredRequests.length} of {filteredRequests.length} entries</p>
                <div className='flex gap-x-2'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'><ChevronLeft size={16} /></button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>1</button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'><ChevronRight size={16} /></button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}
