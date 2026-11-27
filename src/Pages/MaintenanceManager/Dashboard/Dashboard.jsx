import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarDays, ClipboardCheck, ClipboardList, Ticket, Wrench } from 'lucide-react'
import { buildMaintenanceDashboard, hydrateMaintenanceDashboardFromApi } from './dashboardData'

const CARD_ICONS = {
    'Facilities Tickets': Ticket,
    'Open Tickets': AlertTriangle,
    'Open Duties': ClipboardList,
    'Active Schedules': CalendarDays,
    'Pending Checklists': ClipboardCheck,
    'Low Materials': Wrench,
    'Store Requests': ClipboardList,
    'Purchase Open': ClipboardCheck,
    'Announcements': Ticket,
}

const thClass = 'px-2 py-3 text-[#0C1E5B] font-medium uppercase text-xs'
const tdClass = 'px-2 py-3 text-[#667085] text-sm'

const Widget = ({ title, children, to }) => (
    <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
        <div className='flex items-center justify-between gap-3 mb-4'>
            <h3 className='text-lg font-semibold text-black'>{title}</h3>
            {to ? (
                <Link to={to} className='text-sm text-[#515DEF] hover:underline'>
                    Open
                </Link>
            ) : null}
        </div>
        <div className='relative overflow-x-auto'>{children}</div>
    </div>
)

const Dashboard = () => {
    const [data, setData] = useState(() => buildMaintenanceDashboard())

    useEffect(() => {
        let active = true
        hydrateMaintenanceDashboardFromApi().then((next) => {
            if (active) setData(next)
        })
        return () => { active = false }
    }, [])

    const { summaryCards, recentTickets, recentDuties, recentChecklists } = data

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <Wrench size={22} />
                    </div>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Maintenance Manager Dashboard</h2>
                        <p className='text-sm text-[#667085] mt-0.5'>
                            Facilities tickets, duty allotment, schedules, and checklist completion. Housekeeping cleaning data stays separate.
                        </p>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                {summaryCards.map((card) => {
                    const Icon = CARD_ICONS[card.label] ?? Ticket
                    return (
                        <Link
                            key={card.label}
                            to={card.to}
                            className='bg-white rounded-2xl shadow-md p-4 border border-transparent hover:border-[#515DEF]/40 transition-colors'
                        >
                            <div className='flex items-start justify-between gap-2'>
                                <div className='min-w-0'>
                                    <p className='text-xs text-[#808080]'>{card.label}</p>
                                    <p className='text-xl font-semibold text-[#1E1E1E] mt-1'>{card.value}</p>
                                    <p className='text-xs text-[#667085] mt-1'>{card.sub}</p>
                                </div>
                                <div className='p-2 rounded-xl bg-[#515DEF]/10 text-[#515DEF] shrink-0'>
                                    <Icon size={18} />
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <Widget title='Recent Facilities Tickets' to='/maintenance-manager/tickets'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Ticket</th>
                                <th className={thClass}>Subject</th>
                                <th className={`${thClass} rounded-e-lg`}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTickets.length === 0 && (
                                <tr><td colSpan={3} className={`${tdClass} text-center`}>No Facilities tickets yet.</td></tr>
                            )}
                            {recentTickets.map((row) => (
                                <tr key={row.ticketId} className='border-b border-[#f2f4f7]'>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.ticketId}</td>
                                    <td className={`${tdClass} max-w-[160px] truncate`} title={row.subject}>{row.subject}</td>
                                    <td className={tdClass}>{row.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Widget>

                <Widget title='Recent Duties' to='/maintenance-manager/duty-allotment'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Duty</th>
                                <th className={thClass}>Staff</th>
                                <th className={`${thClass} rounded-e-lg`}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentDuties.length === 0 && (
                                <tr><td colSpan={3} className={`${tdClass} text-center`}>No duties yet.</td></tr>
                            )}
                            {recentDuties.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.dutyType}</td>
                                    <td className={tdClass}>{row.staff}</td>
                                    <td className={tdClass}>{row.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Widget>

                <Widget title='Recent Checklists' to='/maintenance-manager/checklists'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Checklist</th>
                                <th className={thClass}>Staff</th>
                                <th className={`${thClass} rounded-e-lg`}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentChecklists.length === 0 && (
                                <tr><td colSpan={3} className={`${tdClass} text-center`}>No checklists yet.</td></tr>
                            )}
                            {recentChecklists.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] max-w-[160px] truncate`} title={row.title}>{row.title}</td>
                                    <td className={tdClass}>{row.staff}</td>
                                    <td className={tdClass}>{row.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Widget>
            </div>
        </section>
    )
}

export default Dashboard
