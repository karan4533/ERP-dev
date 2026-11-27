import React, { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    APPROVAL_STATUSES,
    categoryBadgeColor,
    filterApprovalRequests,
    formatAmount,
    getAllApprovalRequests,
    getApprovalSummary,
    hydrateApprovalsFromApi,
    liveApprovalCategories,
    priorityBadgeColor,
    ROUTE_BASE,
    statusBadgeColor,
} from './approvalsData'

const ApprovalsList = () => {
    const [records, setRecords] = useState(() => getAllApprovalRequests())
    const [loading, setLoading] = useState(false)
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('')
    const [status, setStatus] = useState('')
    const [exportModal, setExportModal] = useState(false)

    const summary = useMemo(() => getApprovalSummary(records), [records])

    const filteredRecords = useMemo(
        () => filterApprovalRequests(records, { search, category, status }),
        [records, search, category, status],
    )

    const refreshRequests = async () => {
        setLoading(true)
        try {
            const rows = await hydrateApprovalsFromApi()
            setRecords(rows)
        } catch {
            setRecords(getAllApprovalRequests())
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let active = true
        setLoading(true)
        hydrateApprovalsFromApi()
            .then((rows) => {
                if (active) setRecords(rows)
            })
            .catch(() => {
                if (active) setRecords(getAllApprovalRequests())
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => {
            active = false
        }
    }, [])

    const clearFilters = () => {
        setSearch('')
        setCategory('')
        setStatus('')
        setFromDate(null)
        setToDate(null)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-xl font-semibold text-black'>Approvals</h1>
                <p className='text-sm text-[#667085] mt-2'>
                    Live Activity Approvals from GET /activities (cultural / sports / competitions). Approve or reject updates the server.
                </p>
                {loading ? <p className='text-sm text-[#667085] mt-2'>Loading approvals…</p> : null}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6'>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-sm font-medium text-[#808080]'>Total Requests</p>
                    <p className='text-2xl font-semibold text-[#515DEF] mt-2'>{summary.total}</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-sm font-medium text-[#808080]'>Pending</p>
                    <p className='text-2xl font-semibold text-[#FF9800] mt-2'>{summary.pending}</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-sm font-medium text-[#808080]'>Approved</p>
                    <p className='text-2xl font-semibold text-[#4CAF50] mt-2'>{summary.approved}</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-sm font-medium text-[#808080]'>Rejected</p>
                    <p className='text-2xl font-semibold text-[#FF0000] mt-2'>{summary.rejected}</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-sm font-medium text-[#808080]'>High Priority Pending</p>
                    <p className='text-2xl font-semibold text-[#0C1E5B] mt-2'>{summary.highPriority}</p>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <div className='flex flex-wrap gap-2 mb-6'>
                    <button
                        type='button'
                        onClick={() => setCategory('')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                            !category ? 'bg-[#515DEF] text-white' : 'bg-[#EDEEF5] text-[#515DEF] hover:bg-[#515DEF33]'
                        }`}
                    >
                        All Categories
                    </button>
                    {liveApprovalCategories().map((item) => (
                        <button
                            key={item}
                            type='button'
                            onClick={() => setCategory(item)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                category === item
                                    ? 'bg-[#515DEF] text-white'
                                    : 'bg-[#EDEEF5] text-[#515DEF] hover:bg-[#515DEF33]'
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            id='search'
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Request ID, title, requester...'
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='status' className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            id='status'
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {APPROVAL_STATUSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative'>
                            <DatePicker
                                selected={fromDate}
                                onChange={setFromDate}
                                isClearable
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
                                onChange={setToDate}
                                isClearable
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
                    <h2 className='text-xl font-medium text-black'>Received Approval Requests</h2>
                    <div className='flex gap-x-2'>
                        <button
                            type='button'
                            onClick={refreshRequests}
                            disabled={loading}
                            className='bg-white text-[#515DEF] text-sm px-4 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-60'
                        >
                            {loading ? 'Loading…' : 'Refresh'}
                        </button>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Request ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Category</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Title</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Requested By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Department</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Amount</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Priority</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className='px-2 py-8 text-center text-[#667085]'>
                                        {loading
                                            ? 'Loading approval requests…'
                                            : 'No activity approvals yet. When Admin submits a cultural, sports, or competition activity it appears here for decision.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((request) => (
                                    <tr key={request.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{request.requestId}</td>
                                        <td className='px-2 py-4'>{request.requestDate}</td>
                                        <td className='px-2 py-4'>
                                            <div className='flex flex-col gap-1'>
                                                <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap w-fit ${categoryBadgeColor[request.category] ?? categoryBadgeColor['Finance Request']}`}>
                                                    {request.category}
                                                </span>
                                                {(request.isDemo || request.source === 'demo') && (
                                                    <span className='inline-flex px-2 py-0.5 rounded text-[10px] font-semibold w-fit bg-[#F59E0B33] text-[#92400E]'>
                                                        Demo
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className='px-2 py-4 max-w-xs'>{request.title}</td>
                                        <td className='px-2 py-4'>{request.requestedBy}</td>
                                        <td className='px-2 py-4'>{request.department}</td>
                                        <td className='px-2 py-4'>{formatAmount(request.amount)}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${priorityBadgeColor[request.priority] ?? priorityBadgeColor.Normal}`}>
                                                {request.priority}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4'>
                                            <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[request.status]}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={request.viewPath || `${ROUTE_BASE}/view/${request.id}`}
                                                    className='block w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    View
                                                </NavLink>
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
                    Showing 1 to {filteredRecords.length} of {filteredRecords.length} entries
                </p>
                <div className='flex gap-x-2'>
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

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename="super-admin-approvals"
                title="Received Approval Requests"
                rows={filteredRecords.map((row) => ({
                    request_id: row.requestId,
                    date: row.requestDate,
                    category: row.category,
                    title: row.title,
                    requested_by: row.requestedBy,
                    department: row.department,
                    amount: formatAmount(row.amount),
                    priority: row.priority,
                    status: row.status,
                }))}
                exportDescription={<>You are exporting {filteredRecords.length} record(s).</>}
            />
        </section>
    )
}

export default ApprovalsList
