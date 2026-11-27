import React, { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CircleCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    IT_TICKETS_KEY,
    assignTicket,
    getTicketById,
    hydrateTicketsFromApi,
    listAssignableUsers,
    updateTicket,
} from '../../../Common/demoDomain/itTickets'
import { usesCampusApiForKey } from '../../../services/campusJsonStore'
import ResourceAttachments from '../../../Common/CommonComponents/ResourceAttachments'
import { STATUS_OPTIONS, normalizeTicketStatus, priorityBadgeColor, statusBadgeColor } from './supportTicketsData'

const listPathFromLocation = (pathname = '') => {
    if (pathname.includes('/tickets/view-ticket/')) {
        return pathname.split('/view-ticket/')[0]
    }
    if (pathname.includes('/support-tickets/view-ticket/')) {
        return pathname.split('/view-ticket/')[0]
    }
    return '/it-support-manager/support-tickets'
}

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value}</span>
    </div>
)

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full max-w-xs bg-white'

const formatHistoryAt = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const ViewSupportTicket = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const listPath = listPathFromLocation(location.pathname)
    const { id } = useParams()
    const apiMode = usesCampusApiForKey(IT_TICKETS_KEY)
    const [ticket, setTicket] = useState(() => getTicketById(id))
    const [loadState, setLoadState] = useState(() => (apiMode ? 'loading' : 'ready'))
    const [assignable, setAssignable] = useState({ key: '', status: 'loading', rows: [], error: '' })
    const [selectedAssignees, setSelectedAssignees] = useState(() => ticket?.assigneeUserIds ?? [])
    const [assignBusy, setAssignBusy] = useState(false)
    const [status, setStatus] = useState(normalizeTicketStatus(ticket?.status ?? 'Raised'))
    const [assignedTo, setAssignedTo] = useState(ticket?.assignedTo ?? '')
    const [remarks, setRemarks] = useState(ticket?.remarks ?? '')
    const [requesterConfirmed, setRequesterConfirmed] = useState(Boolean(ticket?.requesterConfirmed))
    const [outsideService, setOutsideService] = useState(Boolean(ticket?.outsideService))
    const [printerMaintenance, setPrinterMaintenance] = useState(Boolean(ticket?.printerMaintenance))
    const [service, setService] = useState({
        asset: ticket?.serviceAsset || '',
        vendor: ticket?.serviceVendor || '',
        sentDate: ticket?.sentDate || '',
        expectedReturn: ticket?.expectedReturn || '',
        returnedDate: ticket?.returnedDate || '',
        cost: ticket?.serviceCost || '',
        serviceStatus: ticket?.serviceStatus || 'Sent',
        serviceRemarks: ticket?.serviceRemarks || '',
    })
    const [saved, setSaved] = useState(false)

    const applyTicket = useCallback((next) => {
        setTicket(next)
        setStatus(normalizeTicketStatus(next?.status ?? 'Raised'))
        setAssignedTo(next?.assignedTo ?? '')
        setRemarks(next?.remarks ?? '')
        setRequesterConfirmed(Boolean(next?.requesterConfirmed))
        setOutsideService(Boolean(next?.outsideService))
        setPrinterMaintenance(Boolean(next?.printerMaintenance))
        setSelectedAssignees(next?.assigneeUserIds ?? [])
        setService({
            asset: next?.serviceAsset || '',
            vendor: next?.serviceVendor || '',
            sentDate: next?.sentDate || '',
            expectedReturn: next?.expectedReturn || '',
            returnedDate: next?.returnedDate || '',
            cost: next?.serviceCost || '',
            serviceStatus: next?.serviceStatus || 'Sent',
            serviceRemarks: next?.serviceRemarks || '',
        })
    }, [])

    const [reloadToken, setReloadToken] = useState(0)
    useEffect(() => {
        if (!apiMode) return undefined
        let cancelled = false
        hydrateTicketsFromApi().then((ok) => {
            if (cancelled) return
            const fresh = getTicketById(id)
            if (fresh) applyTicket(fresh)
            setLoadState(fresh ? 'ready' : ok ? 'missing' : 'error')
        })
        return () => {
            cancelled = true
        }
    }, [apiMode, id, applyTicket, reloadToken])

    const retryLoad = () => {
        setLoadState('loading')
        setReloadToken((value) => value + 1)
    }

    const ticketKey = ticket?.ticketId
    useEffect(() => {
        if (!apiMode || !ticketKey) return undefined
        let cancelled = false
        listAssignableUsers(ticketKey)
            .then((rows) => {
                if (!cancelled) setAssignable({ key: ticketKey, status: 'ready', rows, error: '' })
            })
            .catch((error) => {
                if (cancelled) return
                setAssignable({
                    key: ticketKey,
                    status: error?.status === 403 ? 'forbidden' : 'error',
                    rows: [],
                    error: error?.message || 'Department members could not be loaded.',
                })
            })
        return () => {
            cancelled = true
        }
    }, [apiMode, ticketKey])
    const assignableStatus = assignable.key === ticketKey ? assignable.status : 'loading'

    const toggleAssignee = (userId) => {
        setSelectedAssignees((prev) => (prev.includes(userId) ? prev.filter((value) => value !== userId) : [...prev, userId]))
    }

    const handleSaveAssignees = async () => {
        if (assignBusy || !ticket) return
        setAssignBusy(true)
        const result = await assignTicket(ticket.ticketId, selectedAssignees)
        setAssignBusy(false)
        if (!result?.success) {
            toast.error(result?.message || 'The assignment could not be saved.')
            return
        }
        applyTicket(result.ticket)
        toast.success(result.ticket.assignees.length ? `Assigned to ${result.ticket.assignedTo}.` : 'Returned to the department queue.')
    }

    const statusChoices = STATUS_OPTIONS.includes(status)
        ? STATUS_OPTIONS
        : [status, ...STATUS_OPTIONS]

    const handleUpdateStatus = async () => {
        let nextStatus = status
        if (requesterConfirmed && normalizeTicketStatus(status) === 'Resolved') {
            nextStatus = 'Confirmed by Requester'
            setStatus(nextStatus)
        }
        const hasAssignee = apiMode ? Boolean(ticket?.assignees?.length) : Boolean(assignedTo)
        if (hasAssignee && nextStatus === 'Raised') {
            nextStatus = 'Assigned'
            setStatus(nextStatus)
        }
        const result = await updateTicket(id, {
            status: nextStatus,
            assignedTo,
            remarks,
            requesterConfirmed,
            confirmationNote: requesterConfirmed ? 'Requester confirmed resolution' : '',
            outsideService,
            printerMaintenance,
            ...service,
            serviceAsset: service.asset,
            serviceVendor: service.vendor,
            serviceCost: service.cost,
        })
        if (!result?.success) {
            toast.error(result?.message || 'The ticket could not be updated.')
            return
        }
        setTicket(result.ticket)
        setSaved(true)
        toast.success('Ticket updated. History retained; the requester sees the same record.')
    }

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button type='button' onClick={() => navigate(listPath)} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {/* Edit only the server copy: a cached ticket would be reset under the user when the load lands. */}
            {loadState === 'loading' ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Loading ticket…</div>
            ) : loadState === 'error' ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#B42318] space-y-3'>
                    <p>The ticket could not be loaded.</p>
                    <button type='button' onClick={retryLoad} className='border border-[#515DEF] text-[#515DEF] px-4 py-2 rounded-md text-sm cursor-pointer'>Retry</button>
                </div>
            ) : !ticket ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Ticket not found, or it belongs to another department.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                            <div>
                                <h1 className='text-2xl font-semibold text-black'>{ticket.subject}</h1>
                                <p className='text-sm text-[#667085] mt-1'>{ticket.ticketId} · {ticket.issueType}</p>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${priorityBadgeColor[ticket.priority]}`}>{ticket.priority}</span>
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[status]}`}>{status}</span>
                            </div>
                        </div>
                    </div>

                    <Section title='Ticket Details'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Ticket ID' value={ticket.ticketId} />
                            <Field label='Requester Name' value={ticket.requesterName} />
                            <Field label='Requester Role' value={ticket.requesterRole} />
                            <Field label='Department' value={ticket.department} />
                            <Field label='Issue Type' value={ticket.issueType} />
                            <Field label='Priority' value={ticket.priority} />
                            <Field label='Assigned To' value={ticket.assignedTo} />
                            <Field label='Created Date' value={ticket.createdDate} />
                            <Field label='Location' value={ticket.location} />
                            <div className='lg:col-span-3'>
                                <Field label='Description' value={ticket.description} />
                            </div>
                            {apiMode && (
                                <div className='lg:col-span-3'>
                                    <ResourceAttachments resourceType='it-ticket-attachment' resourceId={ticket.ticketId} canUpload />
                                </div>
                            )}
                        </div>
                    </Section>

                    {apiMode && (
                        <Section title='Assignees'>
                            <p className='text-xs text-[#808080] mb-4'>
                                Assign this ticket to one or more {ticket.department} members. Every change is kept in the ticket history.
                            </p>
                            {assignableStatus === 'loading' ? (
                                <p className='text-sm text-[#667085]'>Loading department members…</p>
                            ) : assignableStatus === 'forbidden' ? (
                                <p className='text-sm text-[#667085]'>
                                    {ticket.assignees?.length ? `Assigned to ${ticket.assignedTo}.` : 'Not assigned yet.'} Only IT Support or the {ticket.department} head can change assignees.
                                </p>
                            ) : assignableStatus === 'error' ? (
                                <p className='text-sm text-[#B42318]'>{assignable.error}</p>
                            ) : assignable.rows.length === 0 ? (
                                <p className='text-sm text-[#667085]'>No active {ticket.department} members found to assign.</p>
                            ) : (
                                <div className='space-y-4'>
                                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'>
                                        {assignable.rows.map((member) => (
                                            <label key={member.userId} className='flex items-center gap-2 text-sm border border-[#EEF0F6] rounded-md px-3 py-2'>
                                                <input
                                                    type='checkbox'
                                                    checked={selectedAssignees.includes(member.userId)}
                                                    onChange={() => toggleAssignee(member.userId)}
                                                />
                                                <span className='flex flex-col'>
                                                    <span className='text-[#1E1E1E]'>{member.name}</span>
                                                    <span className='text-xs text-[#667085]'>{member.email}</span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    <button
                                        type='button'
                                        onClick={handleSaveAssignees}
                                        disabled={assignBusy}
                                        className='bg-[#515DEF] text-white text-sm px-8 py-3 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer disabled:opacity-60'
                                    >
                                        {assignBusy ? 'Saving…' : 'Save Assignees'}
                                    </button>
                                </div>
                            )}
                        </Section>
                    )}

                    <Section title='Update Status'>
                        <p className='text-xs text-[#808080] mb-4'>
                            Lifecycle: Raised → Assigned → In Progress → Resolved → Confirmed by Requester. History is retained; records are not deleted.
                        </p>
                        <div className='flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap'>
                            <div className='flex flex-col gap-y-2'>
                                <label htmlFor="ticket-status" className='text-base font-medium text-[#1E1E1E]'>Status</label>
                                <select
                                    id="ticket-status"
                                    className={selectClass}
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(e.target.value)
                                        setSaved(false)
                                    }}
                                >
                                    {statusChoices.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            {!apiMode && (
                                <div className='flex flex-col gap-y-2'>
                                    <label htmlFor="ticket-assignee" className='text-base font-medium text-[#1E1E1E]'>Assigned To</label>
                                    <input
                                        id="ticket-assignee"
                                        className={selectClass}
                                        value={assignedTo}
                                        onChange={(e) => {
                                            setAssignedTo(e.target.value)
                                            setSaved(false)
                                        }}
                                        placeholder='Staff / queue name'
                                    />
                                </div>
                            )}
                            <button
                                type='button'
                                onClick={handleUpdateStatus}
                                className='bg-[#515DEF] text-white text-sm px-8 py-3 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer'
                            >
                                Update Status
                            </button>
                        </div>
                        <label className='flex items-center gap-2 mt-4 text-sm'>
                            <input
                                type='checkbox'
                                checked={requesterConfirmed}
                                onChange={(event) => {
                                    setRequesterConfirmed(event.target.checked)
                                    setSaved(false)
                                }}
                            />
                            Confirmed by requester
                        </label>
                        <label className='flex flex-col gap-2 mt-4 text-sm'>Remarks / resolution details
                            <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={3} className='border border-[#D9D9D9] rounded-md px-2 py-2' />
                        </label>
                        <div className='flex gap-4 mt-3 text-sm'>
                            <label className='flex items-center gap-2'><input type='checkbox' checked={outsideService} onChange={(event) => setOutsideService(event.target.checked)} /> Outside Service Maintenance</label>
                            <label className='flex items-center gap-2'><input type='checkbox' checked={printerMaintenance} onChange={(event) => setPrinterMaintenance(event.target.checked)} /> Printer Maintenance</label>
                        </div>
                        {(outsideService || printerMaintenance) && (
                            <div className='grid md:grid-cols-2 gap-3 mt-3 text-sm'>
                                {[['asset', 'Asset / printer'], ['vendor', 'Vendor / service center'], ['sentDate', 'Sent date'], ['expectedReturn', 'Expected return'], ['returnedDate', 'Returned date'], ['cost', 'Cost'], ['serviceRemarks', 'Remarks']].map(([key, label]) => (
                                    <label key={key} className='flex flex-col gap-1'>{label}<input className='border border-[#D9D9D9] rounded-md px-2 py-2' value={service[key]} onChange={(event) => setService({ ...service, [key]: event.target.value })} /></label>
                                ))}
                                <label className='flex flex-col gap-1'>Status<select className='border border-[#D9D9D9] rounded-md px-2 py-2' value={service.serviceStatus} onChange={(event) => setService({ ...service, serviceStatus: event.target.value })}><option>Sent</option><option>In Service</option><option>Returned</option></select></label>
                            </div>
                        )}
                        {ticket.history?.length > 0 && (
                            <div className='mt-6'>
                                <h3 className='text-base font-semibold text-[#1E1E1E] mb-3'>Ticket History</h3>
                                <ul className='space-y-3 border border-[#EEF0F6] rounded-xl p-4'>
                                    {ticket.history.map((event, index) => (
                                        <li key={`${event.event}-${event.at || index}`} className='text-sm border-b border-[#F2F4F7] last:border-0 pb-3 last:pb-0'>
                                            <div className='flex flex-wrap items-center justify-between gap-2'>
                                                <span className='font-medium text-[#1E1E1E]'>{event.event}</span>
                                                <span className='text-xs text-[#667085]'>{formatHistoryAt(event.at)}</span>
                                            </div>
                                            <p className='text-[#667085] mt-1'>{event.note || '—'}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {saved && (
                            <div className='flex items-center gap-2 mt-4 text-sm text-[#4CAF50] font-medium'>
                                <CircleCheck size={18} />
                                Ticket status updated successfully.
                            </div>
                        )}
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewSupportTicket
