import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Headset, Monitor, Ticket, ClipboardCheck, AlertTriangle } from 'lucide-react'
import { getTickets, ticketCounts } from '../../../Common/demoDomain/itTickets'

const priorityBadgeColor = {
    High: 'bg-[#FF572233] text-[#FF5722]',
    Medium: 'bg-[#FF980033] text-[#FF9800]',
    Low: 'bg-[#2196F333] text-[#2196F3]',
    Critical: 'bg-[#FF000033] text-[#FF0000]',
}

const statusBadgeColor = {
    Open: 'bg-[#FF980033] text-[#FF9800]',
    Pending: 'bg-[#FF980033] text-[#FF9800]',
    'In Progress': 'bg-[#2196F333] text-[#2196F3]',
    Resolved: 'bg-[#4CAF5033] text-[#4CAF50]',
    Closed: 'bg-[#4CAF5033] text-[#4CAF50]',
}

const Dashboard = () => {
    const navigate = useNavigate()
    const counts = ticketCounts()
    const recent = getTickets().slice(0, 5)
    const summaryCards = [
        { label: 'Open Tickets', value: counts.open, icon: Ticket, color: 'bg-[#515DEF]/10 text-[#515DEF]' },
        { label: 'Pending Tickets', value: counts.pending, icon: ClipboardCheck, color: 'bg-[#FF9800]/10 text-[#FF9800]' },
        { label: 'Resolved Tickets', value: counts.resolved, icon: ClipboardCheck, color: 'bg-[#4CAF50]/10 text-[#4CAF50]' },
        { label: 'Critical Tickets', value: counts.critical, icon: AlertTriangle, color: 'bg-[#FF0000]/10 text-[#FF0000]' },
        { label: 'Assets', value: '6', icon: Monitor, color: 'bg-[#4CAF50]/10 text-[#4CAF50]' },
        { label: 'Assets Under Service', value: '1', icon: Headset, color: 'bg-[#FF9800]/10 text-[#FF9800]' },
    ]

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>IT Support Team Manager Dashboard</h2>
                <p className='text-sm text-[#667085] mt-0.5'>Counts come from the shared ticket store in this browser.</p>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
                {summaryCards.map((card) => (
                    <button key={card.label} type='button' onClick={() => navigate(card.label.startsWith('Asset') ? '/it-support-manager/asset-management' : '/it-support-manager/support-tickets')} className='bg-white rounded-2xl shadow-md p-4 text-left cursor-pointer'>
                        <div className='flex items-start justify-between gap-3'>
                            <div>
                                <p className='text-sm text-[#808080]'>{card.label}</p>
                                <p className='text-2xl font-semibold text-[#1E1E1E] mt-1'>{card.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${card.color}`}><card.icon size={22} /></div>
                        </div>
                    </button>
                ))}
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <h3 className='text-lg font-semibold text-black mb-4'>Recent Tickets</h3>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            {['Ticket ID', 'Subject', 'Requester', 'Priority', 'Status'].map((label) => <th key={label} className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>{label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {recent.map((ticket) => (
                            <tr key={ticket.ticketId} className='border-b text-[#667085] border-[#f2f4f7]'>
                                <td className='px-2 py-4 font-medium text-[#1E1E1E]'>{ticket.ticketId}</td>
                                <td className='px-2 py-4'>{ticket.subject}</td>
                                <td className='px-2 py-4'>{ticket.requesterName}</td>
                                <td className='px-2 py-4'><span className={`px-2 py-1 rounded-lg text-xs font-semibold ${priorityBadgeColor[ticket.priority] || ''}`}>{ticket.priority}</span></td>
                                <td className='px-2 py-4'><span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[ticket.status] || ''}`}>{ticket.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default Dashboard
