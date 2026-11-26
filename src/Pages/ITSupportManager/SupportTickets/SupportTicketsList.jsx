import React, { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../../../Common/ui'
import { getTickets, TICKETS_UPDATED_EVENT } from '../../../Common/demoDomain/itTickets'
import { ISSUE_TYPES, PRIORITY_OPTIONS, STATUS_OPTIONS } from './supportTicketsData'

const SLA_HOURS = { Critical: 4, High: 8, Medium: 24, Low: 48 }
const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }
const selectClass = 'min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm text-[var(--erp-ink)]'

const SupportTicketsList = () => {
    const [tickets, setTickets] = useState(() => getTickets())
    const [search, setSearch] = useState('')
    const [issueType, setIssueType] = useState('')
    const [priority, setPriority] = useState('')
    const [status, setStatus] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [pageSize, setPageSize] = useState(10)

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
        const matchesSearch = !query || [ticket.ticketId, ticket.requesterName, ticket.subject, ticket.location, ticket.assignedTo, ticket.remarks].join(' ').toLowerCase().includes(query)
        
        let tDate = ticket.createdDate || ''
        if (tDate.includes('-') && tDate.split('-')[0].length === 2) {
            const [d, m, y] = tDate.split('-')
            tDate = `${y}-${m}-${d}`
        }
        const matchesFrom = !fromDate || tDate >= fromDate
        const matchesTo = !toDate || tDate <= toDate

        return matchesSearch && matchesFrom && matchesTo && (!issueType || ticket.issueType === issueType) && (!priority || ticket.priority === priority) && (!status || ticket.status === status)
    }).sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)), [tickets, search, issueType, priority, status, fromDate, toDate])

    const visible = filtered.slice(0, Number(pageSize))

    const columns = [
        { key: 'ticketId', label: 'Ticket', required: true },
        { key: 'subject', label: 'Issue', required: true, render: (ticket) => <span className='block'><span className='block font-semibold text-[var(--erp-ink)]'>{ticket.subject}</span><span className='block text-xs text-[var(--erp-muted)]'>{ticket.issueType} · {ticket.requesterName}</span></span> },
        { key: 'location', label: 'Location', required: true, render: (ticket) => ticket.location || ticket.department || 'Not recorded' },
        { key: 'assignedTo', label: 'Assigned to', required: true, render: (ticket) => ticket.assignedTo || 'IT Queue' },
        { key: 'priority', label: 'Priority / SLA', render: (ticket) => <span className='block'><StatusBadge status={ticket.priority} /><span className='mt-1 block text-xs text-[var(--erp-muted)]'>{SLA_HOURS[ticket.priority] || 24}h response target</span></span> },
        { key: 'status', label: 'Status', render: (ticket) => <StatusBadge status={ticket.status} /> },
        { key: 'remarks', label: 'Remarks / Resolution', render: (ticket) => <span className='block max-w-[200px] truncate text-xs text-[var(--erp-ink)]'>{ticket.remarks || ticket.resolution || 'Pending review'}</span> },
        { key: 'createdDate', label: 'Created' },
    ]

    const reset = () => {
        setSearch('')
        setIssueType('')
        setPriority('')
        setStatus('')
        setFromDate('')
        setToDate('')
    }

    return (
        <section className='space-y-5'>
            <IntegrationNotice state='demo' title='Local ticket queue' description='Priority, SLA target, assignment and status are browser-stored demonstration data. Production escalation timers and notifications require the connected service desk API.' />
            <div className='overflow-hidden rounded-2xl bg-white shadow-md'>
                <DataToolbar
                    query={search}
                    onQueryChange={setSearch}
                    searchLabel='Search support tickets'
                    searchPlaceholder='Ticket, issue, requester, location or assignee…'
                    resultCount={filtered.length}
                    onReset={reset}
                    filters={
                        <>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Issue type<select className={selectClass} value={issueType} onChange={(event) => setIssueType(event.target.value)}><option value=''>All types</option>{ISSUE_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Priority<select className={selectClass} value={priority} onChange={(event) => setPriority(event.target.value)}><option value=''>All priorities</option>{PRIORITY_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Status<select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value=''>All statuses</option>{STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>From Date<input type='date' className={selectClass} value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>To Date<input type='date' className={selectClass} value={toDate} onChange={(e) => setToDate(e.target.value)} /></label>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Rows<select className={selectClass} value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>{[10, 20, 30].map((size) => <option key={size}>{size}</option>)}</select></label>
                        </>
                    }
                    actions={<button type='button' disabled title='Export requires the connected service desk API.' className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Export unavailable</button>}
                />
                <DataTable caption='IT support ticket queue' rows={visible} columns={columns} rowKey='ticketId' emptyTitle='No tickets match these filters' emptyDescription='Reset the filters to review the active support queue.' renderActions={(ticket) => <NavLink to={`/it-support-manager/support-tickets/view-ticket/${ticket.ticketId}`} className='inline-flex min-h-9 items-center rounded-md border border-[var(--erp-indigo)] px-3 text-xs font-semibold text-[var(--erp-indigo)]'>View ticket</NavLink>} />
                <p className='border-t border-[var(--erp-line)] px-4 py-3 text-xs text-[var(--erp-muted)]'>Showing {visible.length} of {filtered.length} matching tickets. Critical and high priority work is listed first.</p>
            </div>
        </section>
    )
}

export default SupportTicketsList
