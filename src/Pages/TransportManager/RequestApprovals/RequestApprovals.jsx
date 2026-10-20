import React, { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { parseTransportDate } from '../transportCampus'
import {
    getMaintenanceRequests,
    getFuelRequests,
    hydrateTransportApprovalRequestsFromApi,
    updateApprovalRequestStatus,
    REQUEST_STATUSES,
    ISSUE_TYPES,
    statusBadgeColor,
} from './requestApprovalsData'

const TABS = [
    { id: 1, label: 'Maintenance Request' },
    { id: 2, label: 'Fuel Request' },
]

const canDecide = (status) => {
    const value = String(status || '').trim().toLowerCase()
    return value === 'pending' || value === 'in-process' || value === 'in process'
}

const RequestApprovals = () => {
    const [maintenanceRequests, setMaintenanceRequests] = useState(() => getMaintenanceRequests())
    const [fuelRequests, setFuelRequests] = useState(() => getFuelRequests())
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [issueTypeFilter, setIssueTypeFilter] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [activeTab, setActiveTab] = useState(1)
    const [exportModal, setExportModal] = useState(false)
    const [busyId, setBusyId] = useState('')

    const refresh = () => {
        setMaintenanceRequests(getMaintenanceRequests())
        setFuelRequests(getFuelRequests())
    }

    useEffect(() => {
        hydrateTransportApprovalRequestsFromApi().finally(refresh)
    }, [])

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('')
        setIssueTypeFilter('')
        setFromDate(null)
        setToDate(null)
    }

    const matchesFilters = (row, dateField) => {
        const q = search.trim().toLowerCase()
        if (q) {
            const haystack = [
                row.requestId,
                row.id,
                row.vehicleNumber,
                row.reportedBy,
                row.driverName,
                row.issueType,
                row.description,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
            if (!haystack.includes(q)) return false
        }
        if (statusFilter && String(row.status || '') !== statusFilter) return false
        if (activeTab === 1 && issueTypeFilter && String(row.issueType || '') !== issueTypeFilter) return false

        const rowDate = parseTransportDate(row[dateField])
        if (fromDate && rowDate && rowDate < new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())) {
            return false
        }
        if (toDate && rowDate && rowDate > new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59)) {
            return false
        }
        return true
    }

    const filteredMaintenance = useMemo(
        () => maintenanceRequests.filter((row) => matchesFilters(row, 'requestDate')),
        [maintenanceRequests, search, statusFilter, issueTypeFilter, fromDate, toDate, activeTab]
    )

    const filteredFuel = useMemo(
        () => fuelRequests.filter((row) => matchesFilters(row, 'requestedDate')),
        [fuelRequests, search, statusFilter, fromDate, toDate, activeTab]
    )

    const handleDecision = async (requestId, status) => {
        setBusyId(requestId)
        try {
            await updateApprovalRequestStatus(requestId, status)
            refresh()
        } finally {
            setBusyId('')
        }
    }

    const visibleCount = activeTab === 1 ? filteredMaintenance.length : filteredFuel.length

    return (
        <section>
            <div className='mb-4 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] px-4 py-3 text-sm text-[#312E81]'>
                <p className='font-semibold'>Approval flow</p>
                <p className='mt-1 text-[#4338CA]'>
                    1) Transport Manager reviews here and sends to Principal → 2) Principal final approval →
                    3) Expense is stored and shown on Account Head → Transport Finance (Maintenance &amp; Expense Claims).
                </p>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
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
                            placeholder='Request ID, vehicle, driver...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status-filter' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status-filter'
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {REQUEST_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    {activeTab === 1 && (
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='issue-type-filter' className='text-base font-medium text-[#808080]'>Issue Type</label>
                            <select
                                id='issue-type-filter'
                                value={issueTypeFilter}
                                onChange={(e) => setIssueTypeFilter(e.target.value)}
                                className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                            >
                                <option value=''>All</option>
                                {ISSUE_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                placeholderText='Any date'
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable
                                placeholderText='Any date'
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Request & Approvals</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                        <option value='30'>30</option>
                        <option value='40'>40</option>
                        <option value='50'>50</option>
                    </select>
                    <span className='text-sm font-normal text-[#515DEF]'>Entries Per Page</span>
                </div>

                <div className='flex gap-6 overflow-x-auto no-scrollbar my-6'>
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type='button'
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap px-2 pb-2 text-sm md:text-lg font-medium cursor-pointer transition-all duration-200 ${activeTab === tab.id
                                ? 'text-[#515DEF] border-b-2 border-[#515DEF] font-semibold'
                                : 'text-[#808080]'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 1 && (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left rtl:text-right'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr className='rounded-lg'>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Request ID</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Vehicle Number</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Reported By</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Request Date</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Issue Type</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Description</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Priority</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMaintenance.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className='px-2 py-8 text-center text-[#808080]'>
                                            No maintenance requests yet. Create one under Vehicle Maintenance, or wait for a driver request.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMaintenance.map((request) => (
                                        <tr key={request.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{request.requestId}</td>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{request.vehicleNumber}</td>
                                            <td className='px-2 py-4'>{request.reportedBy}</td>
                                            <td className='px-2 py-4'>{request.requestDate}</td>
                                            <td className='px-2 py-4'>{request.issueType}</td>
                                            <td className='px-2 py-4 max-w-xs'>{request.description}</td>
                                            <td className='px-2 py-4'>{request.priority}</td>
                                            <td className='px-2 py-4'>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[request.status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className='px-2 py-4 rounded-e-lg'>
                                                {canDecide(request.status) ? (
                                                    <div className='flex gap-2 whitespace-nowrap'>
                                                        <button
                                                            type='button'
                                                            disabled={busyId === request.requestId}
                                                            onClick={() => handleDecision(request.requestId, 'Approved')}
                                                            className='px-3 py-1 text-xs font-semibold rounded-md bg-[#4CAF50] text-white hover:opacity-90 disabled:opacity-50'
                                                        >
                                                            Send to Principal
                                                        </button>
                                                        <button
                                                            type='button'
                                                            disabled={busyId === request.requestId}
                                                            onClick={() => handleDecision(request.requestId, 'Rejected')}
                                                            className='px-3 py-1 text-xs font-semibold rounded-md bg-white text-[#F44336] border border-[#F44336] hover:bg-[#FFEBEE] disabled:opacity-50'
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className='text-xs text-[#808080]'>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 2 && (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left rtl:text-right'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr className='rounded-lg'>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Request ID</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Driver Name</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Driver ID</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Vehicle Number</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Route Name</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Current Odometer Reading</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Requested Quantity</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Requested Date</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFuel.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className='px-2 py-8 text-center text-[#808080]'>
                                            No fuel requests yet.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFuel.map((request) => (
                                        <tr key={request.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7] rounded-lg'>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{request.requestId}</td>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{request.driverName}</td>
                                            <td className='px-2 py-4'>{request.driverId}</td>
                                            <td className='px-2 py-4'>{request.vehicleNumber}</td>
                                            <td className='px-2 py-4'>{request.routeName}</td>
                                            <td className='px-2 py-4'>{request.currentOdometerReading}</td>
                                            <td className='px-2 py-4'>{request.requestedQuantity}</td>
                                            <td className='px-2 py-4'>{request.requestedDate}</td>
                                            <td className='px-2 py-4'>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[request.status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className='px-2 py-4 rounded-e-lg'>
                                                {canDecide(request.status) ? (
                                                    <div className='flex gap-2 whitespace-nowrap'>
                                                        <button
                                                            type='button'
                                                            disabled={busyId === request.requestId}
                                                            onClick={() => handleDecision(request.requestId, 'Approved')}
                                                            className='px-3 py-1 text-xs font-semibold rounded-md bg-[#4CAF50] text-white hover:opacity-90 disabled:opacity-50'
                                                        >
                                                            Send to Principal
                                                        </button>
                                                        <button
                                                            type='button'
                                                            disabled={busyId === request.requestId}
                                                            onClick={() => handleDecision(request.requestId, 'Rejected')}
                                                            className='px-3 py-1 text-xs font-semibold rounded-md bg-white text-[#F44336] border border-[#F44336] hover:bg-[#FFEBEE] disabled:opacity-50'
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className='text-xs text-[#808080]'>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {visibleCount} of {visibleCount} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#515DEF] text-white border border-[#515DEF] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default RequestApprovals
