import React from 'react'
import {
    ClipboardList,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Users,
    ClipboardCheck,
    MapPin,
    Sparkles,
} from 'lucide-react'
import {
    SUMMARY_CARDS,
    RECENT_TASKS,
    LOW_STOCK_ITEMS,
    PENDING_REQUESTS,
    RECENT_ANNOUNCEMENTS,
    taskStatusBadgeColor,
    requestStatusBadgeColor,
} from './dashboardData'

const CARD_ICONS = {
    'Active Tasks Today': ClipboardList,
    'Tasks Completed': CheckCircle2,
    'Pending Tasks': Clock,
    'Low Stock Items': AlertTriangle,
    'Staff On Duty': Users,
    'Pending Requests': ClipboardCheck,
    'Zones Inspected': MapPin,
}

const Widget = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
        <h3 className='text-lg font-semibold text-black mb-4'>{title}</h3>
        <div className="relative overflow-x-auto">{children}</div>
    </div>
)

const thClass = 'px-2 py-3 text-[#0C1E5B] font-medium uppercase text-xs'
const tdClass = 'px-2 py-3 text-[#667085] text-sm'

const Dashboard = () => {
    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <Sparkles size={22} />
                    </div>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Housekeeping Manager Dashboard</h2>
                        <p className='text-sm text-[#667085] mt-0.5'>Overview of tasks, supplies, staff, and pending requests.</p>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                {SUMMARY_CARDS.map((card) => {
                    const Icon = CARD_ICONS[card.label] ?? ClipboardList
                    return (
                        <div key={card.label} className='bg-white rounded-2xl shadow-md p-4'>
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
                        </div>
                    )
                })}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Widget title="Recent Tasks">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Task ID</th>
                                <th className={thClass}>Title</th>
                                <th className={thClass}>Assigned To</th>
                                <th className={`${thClass} rounded-e-lg`}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_TASKS.map((row) => (
                                <tr key={row.taskId} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.taskId}</td>
                                    <td className={`${tdClass} max-w-[180px] truncate`} title={row.title}>{row.title}</td>
                                    <td className={tdClass}>{row.assignedTo}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${taskStatusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Widget>

                <Widget title="Low Stock Supplies">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Item</th>
                                <th className={thClass}>Available Qty</th>
                                <th className={`${thClass} rounded-e-lg`}>Reorder Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {LOW_STOCK_ITEMS.map((row) => (
                                <tr key={row.item} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.item}</td>
                                    <td className={`${tdClass} text-[#FF5722] font-medium`}>{row.availableQty}</td>
                                    <td className={tdClass}>{row.reorderLevel}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Widget>

                <Widget title="Pending Requests">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Request ID</th>
                                <th className={thClass}>Type</th>
                                <th className={`${thClass} rounded-e-lg`}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PENDING_REQUESTS.map((row) => (
                                <tr key={row.requestId} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.requestId}</td>
                                    <td className={tdClass}>{row.type}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${requestStatusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Widget>

                <Widget title="Recent Announcements">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Title</th>
                                <th className={`${thClass} rounded-e-lg`}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_ANNOUNCEMENTS.map((row) => (
                                <tr key={row.title} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] max-w-[220px] truncate`} title={row.title}>{row.title}</td>
                                    <td className={tdClass}>{row.date}</td>
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
