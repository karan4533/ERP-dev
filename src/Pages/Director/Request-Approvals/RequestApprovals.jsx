import React, { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { toast } from 'react-toastify'
import { Calendar, ChevronLeft, ChevronRight, EllipsisIcon, IndianRupee } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import { PURCHASE_REQUESTS, statusBadgeColor } from './requestApprovalData'
import {
    canUseApprovalsApi,
    decideApprovalApi,
    listApprovalsInboxApi,
} from '../../../services/approvalsApi'

const formatDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return String(iso)
    return d.toLocaleDateString('en-GB').replace(/\//g, '-')
}

const statusLabel = (status) => {
    const value = String(status || '').toLowerCase()
    if (value === 'pending') return 'Pending'
    if (value === 'approved') return 'Approved'
    if (value === 'denied' || value === 'rejected') return 'Rejected'
    return status || '—'
}

const mapInboxRow = (row) => ({
    id: row.id,
    requestId: String(row.id).slice(0, 8).toUpperCase(),
    requestDate: formatDate(row.createdAt),
    purpose: row.title || `${row.entityType} · ${row.entityId}`,
    entityType: row.entityType || '',
    requestedBy: row.initiatorRole || '—',
    status: statusLabel(row.status),
    rawStatus: row.status,
    source: 'api',
})

const RequestApprovals = () => {
    const api = canUseApprovalsApi()
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [rows, setRows] = useState(() => (api ? [] : PURCHASE_REQUESTS))
    const [loading, setLoading] = useState(api)
    const [mode, setMode] = useState(api ? 'api' : 'demo')

    const refresh = async () => {
        if (!api) {
            setRows(PURCHASE_REQUESTS)
            setMode('demo')
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const inbox = await listApprovalsInboxApi()
            setRows((Array.isArray(inbox) ? inbox : []).map(mapInboxRow))
            setMode('api')
        } catch (error) {
            toast.error(error?.message || 'Approvals inbox could not be loaded.')
            setRows([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api])

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        return rows.filter((row) => {
            if (statusFilter && String(row.status).toLowerCase() !== statusFilter.toLowerCase()) return false
            if (!query) return true
            return [
                row.requestId,
                row.purpose,
                row.requestedBy,
                row.entityType,
                row.status,
            ].join(' ').toLowerCase().includes(query)
        })
    }, [rows, search, statusFilter])

    const handleDecide = async (row, decision) => {
        if (mode !== 'api') {
            toast.info('Demo purchase requests cannot be decided against the API.')
            return
        }
        let comment
        if (decision === 'deny') {
            comment = window.prompt('Rejection reason (required):', '')
            if (comment == null) return
            if (!String(comment).trim()) {
                toast.error('A rejection reason is required.')
                return
            }
        }
        try {
            await decideApprovalApi(row.id, { decision, comment })
            toast.success(decision === 'approve' ? 'Request approved.' : 'Request rejected.')
            await refresh()
        } catch (error) {
            toast.error(error?.message || 'Decision failed.')
        }
    }

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
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <p className='text-sm text-[#667085]'>
                        {mode === 'api'
                            ? 'Live approvals waiting on Director (exam timetable, marks batches, and other campus requests).'
                            : 'Demo purchase requests (API sign-in unavailable).'}
                    </p>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Request ID, purpose...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            <option value='Pending'>Pending</option>
                            <option value='Approved'>Approved</option>
                            <option value='Rejected'>Rejected</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
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
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Request Approvals List</h2>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Request ID</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Request Date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Purpose</th>
                                {mode === 'demo' ? (
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Requested Amount</th>
                                ) : (
                                    <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Type</th>
                                )}
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Requested By</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>Loading approvals…</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>
                                        No approval requests waiting for Director.
                                    </td>
                                </tr>
                            ) : mode === 'api' ? (
                                filtered.map((request) => (
                                    <tr key={request.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{request.requestId}</td>
                                        <td className='px-2 py-4'>{request.requestDate}</td>
                                        <td className='px-2 py-4 max-w-[220px] truncate' title={request.purpose}>{request.purpose}</td>
                                        <td className='px-2 py-4'>{request.entityType || '—'}</td>
                                        <td className='px-2 py-4'>{request.requestedBy}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[request.status] || 'bg-[#66708533] text-[#667085]'}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to={`/director/request-approvals/view-request/${request.id}`}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer block'
                                                >
                                                    View / Decide
                                                </NavLink>
                                                {request.rawStatus === 'pending' && (
                                                    <>
                                                        <button
                                                            type='button'
                                                            onClick={() => handleDecide(request, 'approve')}
                                                            className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            type='button'
                                                            onClick={() => handleDecide(request, 'deny')}
                                                            className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                filtered.map((request) => (
                                    <tr key={request.requestId} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{request.requestId}</td>
                                        <td className='px-2 py-4'>{request.requestDate}</td>
                                        <td className='px-2 py-4 max-w-[180px] truncate' title={request.purpose}>{request.purpose}</td>
                                        <td className='px-2 py-4'>
                                            <span className='inline-flex items-center gap-1 font-medium text-[#1E1E1E]'>
                                                <IndianRupee size={14} />
                                                {request.requestedAmount.toLocaleString('en-IN')}
                                            </span>
                                            {request.exceedsBudget && (
                                                <span className='block text-xs text-[#FF9800] mt-0.5'>Over budget</span>
                                            )}
                                        </td>
                                        <td className='px-2 py-4'>{request.requestedBy}</td>
                                        <td className='px-2 py-4'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[request.status]}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className='px-2 py-4 text-center rounded-e-lg'>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <NavLink
                                                    to='/director/request-approvals/view-request'
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer block'
                                                >
                                                    View Details
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
                    Showing {filtered.length} of {rows.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </section>
    )
}

export default RequestApprovals
