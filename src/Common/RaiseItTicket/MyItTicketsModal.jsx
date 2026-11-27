import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { listMyTickets } from '../demoDomain/itTickets'

const STATUS_COLORS = {
    Open: 'bg-[#2196F333] text-[#2196F3]',
    Raised: 'bg-[#2196F333] text-[#2196F3]',
    Assigned: 'bg-[#9C27B033] text-[#9C27B0]',
    'Confirmed by Requester': 'bg-[#4CAF5033] text-[#4CAF50]',
    'In Progress': 'bg-[#FF980033] text-[#FF9800]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    Resolved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Closed: 'bg-[#66708533] text-[#667085]',
}

const formatWhen = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

const lastUpdate = (ticket) => {
    const history = Array.isArray(ticket.history) ? ticket.history : []
    return history.length ? history[history.length - 1] : null
}

/** Mounted only while open, so each opening reloads the list from the source. */
export default function MyItTicketsModal({ onClose }) {
    const { name, email } = useAuth()
    const [state, setState] = useState({ loading: true, rows: [], error: '' })
    const [expanded, setExpanded] = useState('')

    useEffect(() => {
        let cancelled = false
        listMyTickets({ email, name })
            .then((rows) => {
                if (!cancelled) setState({ loading: false, rows, error: '' })
            })
            .catch((error) => {
                if (!cancelled) setState({ loading: false, rows: [], error: error?.message || 'Your tickets could not be loaded.' })
            })
        return () => {
            cancelled = true
        }
    }, [email, name])

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <button type='button' className='absolute inset-0 bg-black/40' onClick={onClose} aria-label='Close' />
            <div className='relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-lg p-5 max-h-[85vh] overflow-y-auto'>
                <div className='flex items-start justify-between gap-4'>
                    <div>
                        <h3 className='text-lg font-semibold text-black'>My Tickets</h3>
                        <p className='text-xs text-[#667085] mt-1'>Tickets you raised, with the latest status and remarks from the department handling them.</p>
                    </div>
                    <button type='button' onClick={onClose} className='border border-[#515DEF] text-[#515DEF] px-3 py-1.5 rounded-md text-sm cursor-pointer'>Close</button>
                </div>

                {state.loading ? (
                    <p className='text-sm text-[#667085] mt-6'>Loading your tickets…</p>
                ) : state.error ? (
                    <p className='text-sm text-[#B42318] mt-6'>{state.error}</p>
                ) : state.rows.length === 0 ? (
                    <p className='text-sm text-[#667085] mt-6'>You have not raised any tickets yet. Use Raise Ticket in this menu.</p>
                ) : (
                    <div className='relative overflow-x-auto mt-4'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                                <tr>
                                    <th className='px-2 py-3 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>S.No</th>
                                    <th className='px-2 py-3 text-[#0C1E5B] font-medium uppercase'>Ticket</th>
                                    <th className='px-2 py-3 text-[#0C1E5B] font-medium uppercase'>Subject</th>
                                    <th className='px-2 py-3 text-[#0C1E5B] font-medium uppercase'>Priority</th>
                                    <th className='px-2 py-3 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                    <th className='px-2 py-3 text-[#0C1E5B] font-medium uppercase'>Raised</th>
                                    <th className='px-2 py-3 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.rows.map((ticket, index) => {
                                    const open = expanded === ticket.ticketId
                                    const latest = lastUpdate(ticket)
                                    return [
                                        <tr
                                            key={ticket.ticketId}
                                            onClick={() => setExpanded(open ? '' : ticket.ticketId)}
                                            className='border-b border-[#f2f4f7] text-[#667085] hover:bg-[#f2f4f7] cursor-pointer'
                                        >
                                            <td className='px-2 py-3'>{index + 1}</td>
                                            <td className='px-2 py-3 font-medium text-[#1E1E1E] whitespace-nowrap'>{ticket.ticketId}</td>
                                            <td className='px-2 py-3'>{ticket.subject}</td>
                                            <td className='px-2 py-3'>{ticket.priority}</td>
                                            <td className='px-2 py-3'>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${STATUS_COLORS[ticket.status] || STATUS_COLORS.Closed}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className='px-2 py-3 whitespace-nowrap'>{ticket.createdDate || '—'}</td>
                                            <td className='px-2 py-3'>{ticket.remarks || (latest ? `${latest.event}: ${latest.note || ''}` : '—')}</td>
                                        </tr>,
                                        open ? (
                                            <tr key={`${ticket.ticketId}-history`} className='bg-[#FAFBFD]'>
                                                <td colSpan={7} className='px-4 py-3'>
                                                    <p className='text-xs font-semibold text-[#0C1E5B] mb-2'>History</p>
                                                    <ul className='space-y-1 text-xs text-[#475467]'>
                                                        {(ticket.history || []).map((item, at) => (
                                                            <li key={`${item.at}-${at}`}>
                                                                <span className='font-medium'>{formatWhen(item.at)}</span> — {item.event}{item.note ? `: ${item.note}` : ''}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                            </tr>
                                        ) : null,
                                    ]
                                })}
                            </tbody>
                        </table>
                        <p className='text-xs text-[#667085] mt-2'>Showing {state.rows.length} ticket{state.rows.length === 1 ? '' : 's'}. Click a ticket to see its history.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
