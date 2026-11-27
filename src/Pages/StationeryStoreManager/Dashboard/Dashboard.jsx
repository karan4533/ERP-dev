import React, { useEffect, useState } from 'react'
import {
    Package,
    AlertTriangle,
    PackageX,
    ClipboardCheck,
    ArrowUpFromLine,
    ArrowDownToLine,
    IndianRupee,
    Store,
} from 'lucide-react'
import {
    buildStationeryDashboard,
    hydrateStationeryDashboardFromApi,
    requestStatusBadgeColor,
} from './dashboardData'

const CARD_ICONS = {
    'Total Inventory Items': Package,
    'Low Stock Items': AlertTriangle,
    'Out of Stock Items': PackageX,
    'Pending Requests': ClipboardCheck,
    'Items Issued This Month': ArrowUpFromLine,
    'Items Returned This Month': ArrowDownToLine,
    'Total Inventory Value': IndianRupee,
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
    const [data, setData] = useState(() => buildStationeryDashboard())

    useEffect(() => {
        let active = true
        hydrateStationeryDashboardFromApi().then((next) => {
            if (active) setData(next)
        })
        return () => { active = false }
    }, [])

    const { summaryCards, recentIssues, lowStockItems, pendingRequests, recentNotices } = data

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <Store size={22} />
                    </div>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Stationery Store Manager Dashboard</h2>
                        <p className='text-sm text-[#667085] mt-0.5'>Overview of inventory, issues, returns, and pending requests.</p>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                {summaryCards.map((card) => {
                    const Icon = CARD_ICONS[card.label] ?? Package
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
                <Widget title="Recent Issues">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Issue ID</th>
                                <th className={thClass}>Requested By</th>
                                <th className={thClass}>Department</th>
                                <th className={`${thClass} rounded-e-lg`}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentIssues.length === 0 && (
                                <tr><td colSpan={4} className={`${tdClass} text-center`}>No issues recorded yet.</td></tr>
                            )}
                            {recentIssues.map((row) => (
                                <tr key={row.issueId} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.issueId}</td>
                                    <td className={tdClass}>{row.requestedBy}</td>
                                    <td className={tdClass}>{row.department}</td>
                                    <td className={tdClass}>{row.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Widget>

                <Widget title="Low Stock Items">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Item</th>
                                <th className={thClass}>Available Qty</th>
                                <th className={`${thClass} rounded-e-lg`}>Reorder Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStockItems.length === 0 && (
                                <tr><td colSpan={3} className={`${tdClass} text-center`}>No low-stock items.</td></tr>
                            )}
                            {lowStockItems.map((row) => (
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
                            {pendingRequests.length === 0 && (
                                <tr><td colSpan={3} className={`${tdClass} text-center`}>No pending requests.</td></tr>
                            )}
                            {pendingRequests.map((row) => (
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

                <Widget title="Recent Notices">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Title</th>
                                <th className={`${thClass} rounded-e-lg`}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentNotices.length === 0 && (
                                <tr><td colSpan={2} className={`${tdClass} text-center`}>No announcements yet.</td></tr>
                            )}
                            {recentNotices.map((row) => (
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
