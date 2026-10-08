import React, { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Download, EllipsisIcon } from 'lucide-react'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { logActivity } from '../../../Common/demoDomain/activityLog'
import { getTickets, TICKETS_UPDATED_EVENT } from '../../../Common/demoDomain/itTickets'
import { ISSUE_TYPES, priorityBadgeColor, statusBadgeColor } from './supportTicketsData'

const STATUSES = ['Open', 'Pending', 'In Progress', 'Resolved', 'Closed']

const SupportTicketsList = () => {
    const [tickets, setTickets] = useState(() => getTickets())
    const [search, setSearch] = useState('')
    const [issueType, setIssueType] = useState('')
    const [status, setStatus] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [pageSize, setPageSize] = useState(10)
    const [exportModal, setExportModal] = useState(false)

    useEffect(() => {
        const refresh = () => setTickets(getTickets())
        window.addEventListener(TICKETS_UPDATED_EVENT, refresh)
        window.addEventListener('focus', refresh)
        return () => {
            window.removeEventListener(TICKETS_UPDATED_EVENT, refresh)
            window.removeEventListener('focus', refresh)
        }
    }, [])

    const filtered = useMemo(() => tickets.filter((ticket) => {
        const query = search.trim().toLowerCase()
        const matchesSearch = !query || [ticket.ticketId, ticket.requesterName, ticket.subject, ticket.remarks].join(' ').toLowerCase().includes(query)
        const matchesType = !issueType || ticket.issueType === issueType
        const matchesStatus = !status || ticket.status === status
        const created = ticket.createdDate || ''
        const matchesFrom = !fromDate || created >= fromDate
        const matchesTo = !toDate || created <= toDate
        return matchesSearch && matchesType && matchesStatus && matchesFrom && matchesTo
    }), [tickets, search, issueType, status, fromDate, toDate])

    const visible = filtered.slice(0, Number(pageSize))

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center gap-3'>
                    <button type='button' onClick={() => { setSearch(''); setIssueType(''); setStatus(''); setFromDate(''); setToDate('') }} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 rounded-lg cursor-pointer'>Clear Filters</button>
                    <span className='text-sm text-[#515DEF]'>Total Records: {filtered.length}</span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:mt-8 mt-2'>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>Search
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Ticket ID, requester...' className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2' />
                    </label>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>Issue Type
                        <select value={issueType} onChange={(event) => setIssueType(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'>
                            <option value=''>All</option>
                            {ISSUE_TYPES.map((type) => <option key={type}>{type}</option>)}
                        </select>
                    </label>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>Status
                        <select value={status} onChange={(event) => setStatus(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'>
                            <option value=''>All</option>
                            {STATUSES.map((item) => <option key={item}>{item}</option>)}
                        </select>
                    </label>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>From Date
                        <input type='date' value={fromDate} onChange={(event) => setFromDate(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2' />
                    </label>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>To Date
                        <input type='date' value={toDate} onChange={(event) => setToDate(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2' />
                    </label>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center gap-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Tickets</h2>
                    <button type='button' onClick={() => { setExportModal(true); logActivity({ action: 'EXPORT_REQUESTED', module: 'IT Tickets', details: 'Export format dialog' }) }} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer flex items-center gap-x-2'>
                        <Download size={16} /> Export
                    </button>
                </div>
                <div className='flex gap-x-2 items-center my-2'>
                    <select value={pageSize} onChange={(event) => setPageSize(event.target.value)} className='px-2 py-1.5 bg-white text-[#515DEF] border border-[#515DEF] rounded-md'>
                        {[10, 20, 30].map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                    <span className='text-sm text-[#515DEF]'>Entries Per Page · showing {visible.length}</span>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                            <tr>
                                {['S.No', 'Ticket ID', 'Requester', 'Department', 'Issue Type', 'Priority', 'Status', 'Remarks', 'Created'].map((label) => (
                                    <th key={label} className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>{label}</th>
                                ))}
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((ticket, index) => (
                                <tr key={ticket.ticketId} className='border-b text-[#667085] border-[#f2f4f7]'>
                                    <td className='px-2 py-4'>{index + 1}</td>
                                    <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{ticket.ticketId}</td>
                                    <td className='px-2 py-4'>{ticket.requesterName}</td>
                                    <td className='px-2 py-4'>{ticket.department}</td>
                                    <td className='px-2 py-4'>{ticket.issueType}</td>
                                    <td className='px-2 py-4'><span className={`px-2 py-1 rounded-lg text-xs font-semibold ${priorityBadgeColor[ticket.priority] || ''}`}>{ticket.priority}</span></td>
                                    <td className='px-2 py-4'><span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[ticket.status] || 'bg-[#2196F333] text-[#2196F3]'}`}>{ticket.status}</span></td>
                                    <td className='px-2 py-4 max-w-[160px] truncate'>{ticket.remarks || '—'}</td>
                                    <td className='px-2 py-4 whitespace-nowrap'>{ticket.createdDate}</td>
                                    <td className='px-2 py-4'>
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <NavLink to={`/it-support-manager/support-tickets/view-ticket/${ticket.ticketId}`} className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer block'>View</NavLink>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className='flex justify-between items-center mt-4 text-sm text-[#667085]'>
                    <span>Showing {visible.length} of {filtered.length}</span>
                    <span className='inline-flex items-center gap-2'><ChevronLeft size={16} /><ChevronRight size={16} /></span>
                </div>
            </div>
            {exportModal && <ExportModal exportModal={exportModal} setExportModal={setExportModal} />}
        </section>
    )
}

export default SupportTicketsList
