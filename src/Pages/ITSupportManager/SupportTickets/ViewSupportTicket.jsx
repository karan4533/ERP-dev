import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CircleCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import { getTicketById, updateTicket } from '../../../Common/demoDomain/itTickets'
import { STATUS_OPTIONS, priorityBadgeColor, statusBadgeColor } from './supportTicketsData'

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

const ViewSupportTicket = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [ticket, setTicket] = useState(() => getTicketById(id))
    const [status, setStatus] = useState(ticket?.status ?? 'Open')
    const [remarks, setRemarks] = useState(ticket?.remarks ?? '')
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

    const handleUpdateStatus = () => {
        const next = updateTicket(id, { status, remarks, outsideService, printerMaintenance, ...service, serviceAsset: service.asset, serviceVendor: service.vendor, serviceCost: service.cost })
        setTicket(next)
        setSaved(true)
        toast.success('Ticket updated. The requester sees the same record.')
    }

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button type='button' onClick={() => navigate('/it-support-manager/support-tickets')} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!ticket ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Ticket not found or could not be loaded.
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
                        </div>
                    </Section>

                    <Section title='Update Status'>
                        <div className='flex flex-col sm:flex-row sm:items-end gap-4'>
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
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type='button'
                                onClick={handleUpdateStatus}
                                className='bg-[#515DEF] text-white text-sm px-8 py-3 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer'
                            >
                                Update Status
                            </button>
                        </div>
                        <label className='flex flex-col gap-2 mt-4 text-sm'>Remarks
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
                            <ul className='mt-4 text-sm text-[#667085] space-y-1'>
                                {ticket.history.map((event, index) => (
                                    <li key={`${event.event}-${index}`}>{event.event}: {event.note}</li>
                                ))}
                            </ul>
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
