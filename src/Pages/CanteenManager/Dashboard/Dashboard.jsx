import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import {
    ShoppingCart,
    IndianRupee,
    Package,
    AlertTriangle,
    ClipboardCheck,
    Rss,
    TrendingUp,
    Plus,
} from 'lucide-react'
import {
    SUMMARY_CARDS,
    SALES_CHART_7_DAYS,
    SALES_CHART_30_DAYS,
    RECENT_ORDERS,
    TOP_SELLING_ITEMS,
    LOW_STOCK_ALERTS,
    PENDING_REQUESTS,
    INVENTORY_SUMMARY,
    ORDER_DISTRIBUTION,
    RECENT_ANNOUNCEMENTS,
    QUICK_ACTIONS,
    orderStatusBadgeColor,
    requestStatusBadgeColor,
} from './dashboardData'

const CARD_ICONS = {
    'Orders Today': ShoppingCart,
    "Today's Sales": IndianRupee,
    'Inventory Items': Package,
    'Low Stock Alerts': AlertTriangle,
    'Pending Approvals': ClipboardCheck,
    'Active Announcements': Rss,
}

const Panel = ({ title, children, action }) => (
    <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
        <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold text-black'>{title}</h3>
            {action}
        </div>
        {children}
    </div>
)

const TableWrapper = ({ children }) => (
    <div className="relative overflow-x-auto">{children}</div>
)

const thClass = 'px-2 py-3 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-3 text-[#667085]'

const Dashboard = () => {
    const [salesPeriod, setSalesPeriod] = useState('7')

    const salesData = salesPeriod === '7' ? SALES_CHART_7_DAYS : SALES_CHART_30_DAYS

    const salesChartOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        legend: {
            data: ['Revenue (₹)', 'Orders Count'],
            bottom: 0,
            textStyle: { color: '#667085', fontSize: 12 },
        },
        grid: { left: 48, right: 48, top: 24, bottom: 48 },
        xAxis: {
            type: 'category',
            data: salesData.labels,
            axisLine: { lineStyle: { color: '#E0E0E0' } },
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: [
            {
                type: 'value',
                name: 'Sales (₹)',
                nameTextStyle: { color: '#667085', fontSize: 11 },
                axisLabel: { color: '#667085', fontSize: 11, formatter: (v) => `₹${(v / 1000).toFixed(0)}k` },
                splitLine: { lineStyle: { color: '#F2F4F7' } },
            },
            {
                type: 'value',
                name: 'Orders',
                nameTextStyle: { color: '#667085', fontSize: 11 },
                axisLabel: { color: '#667085', fontSize: 11 },
                splitLine: { show: false },
            },
        ],
        series: [
            {
                name: 'Revenue (₹)',
                type: 'line',
                smooth: true,
                data: salesData.revenue,
                areaStyle: { color: 'rgba(81, 93, 239, 0.12)' },
                lineStyle: { color: '#515DEF', width: 2 },
                itemStyle: { color: '#515DEF' },
                symbol: 'circle',
                symbolSize: 6,
            },
            {
                name: 'Orders Count',
                type: 'line',
                smooth: true,
                yAxisIndex: 1,
                data: salesData.orders,
                lineStyle: { color: '#4CAF50', width: 2 },
                itemStyle: { color: '#4CAF50' },
                symbol: 'circle',
                symbolSize: 6,
            },
        ],
    }), [salesData])

    const topSellingChartOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 80, right: 16, top: 8, bottom: 8 },
        xAxis: {
            type: 'value',
            axisLabel: { color: '#667085', fontSize: 11 },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        yAxis: {
            type: 'category',
            data: TOP_SELLING_ITEMS.map((i) => i.item).reverse(),
            axisLabel: { color: '#667085', fontSize: 11 },
            axisLine: { show: false },
            axisTick: { show: false },
        },
        series: [{
            type: 'bar',
            data: TOP_SELLING_ITEMS.map((i) => i.quantity).reverse(),
            barWidth: 14,
            itemStyle: { color: '#515DEF', borderRadius: [0, 4, 4, 0] },
        }],
    }), [])

    const orderDistributionOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        legend: {
            orient: 'vertical',
            right: 0,
            top: 'center',
            textStyle: { color: '#667085', fontSize: 12 },
        },
        series: [{
            type: 'pie',
            radius: ['50%', '75%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            padAngle: 2,
            data: ORDER_DISTRIBUTION.map((d) => ({
                value: d.value,
                name: d.name,
                itemStyle: { color: d.color },
            })),
            label: { show: false },
            labelLine: { show: false },
        }],
    }), [])

    return (
        <section className='space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
                {SUMMARY_CARDS.map((card) => {
                    const Icon = CARD_ICONS[card.label] ?? Package
                    return (
                        <div key={card.label} className='bg-white rounded-2xl shadow-md p-4'>
                            <div className='flex items-start justify-between gap-2'>
                                <div className='min-w-0'>
                                    <p className='text-xs text-[#808080] truncate'>{card.label}</p>
                                    <p className='text-xl font-semibold text-[#1E1E1E] mt-1'>{card.value}</p>
                                    <p className={`text-xs mt-1 flex items-center gap-1 ${card.trend === 'up' ? 'text-[#4CAF50]' : card.trend === 'down' ? 'text-[#FF5722]' : 'text-[#667085]'}`}>
                                        {card.trend === 'up' && <TrendingUp size={12} />}
                                        {card.sub}
                                    </p>
                                </div>
                                <div className='p-2 rounded-xl bg-[#515DEF]/10 text-[#515DEF] shrink-0'>
                                    <Icon size={18} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <Panel
                title="Sales Overview"
                action={
                    <div className='flex gap-1'>
                        {[{ key: '7', label: 'Last 7 Days' }, { key: '30', label: 'Last 30 Days' }].map((opt) => (
                            <button
                                key={opt.key}
                                type='button'
                                onClick={() => setSalesPeriod(opt.key)}
                                className={`text-xs px-3 py-1.5 rounded-md border transition-all cursor-pointer ${salesPeriod === opt.key ? 'bg-[#515DEF] text-white border-[#515DEF]' : 'bg-white text-[#515DEF] border-[#515DEF] hover:bg-[#515DEF] hover:text-white'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                }
            >
                <p className='text-sm text-[#667085] mb-2'>Daily Sales Trend</p>
                <ReactECharts option={salesChartOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
            </Panel>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel title="Recent Orders">
                    <TableWrapper>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                                <tr>
                                    <th className={`${thClass} rounded-s-lg`}>Order ID</th>
                                    <th className={thClass}>Customer</th>
                                    <th className={thClass}>Type</th>
                                    <th className={thClass}>Amount</th>
                                    <th className={`${thClass} rounded-e-lg`}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {RECENT_ORDERS.map((order) => (
                                    <tr key={order.orderId} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                        <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{order.orderId}</td>
                                        <td className={tdClass}>{order.customer}</td>
                                        <td className={tdClass}>{order.type}</td>
                                        <td className={tdClass}>{order.amount}</td>
                                        <td className={tdClass}>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${orderStatusBadgeColor[order.status]}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableWrapper>
                </Panel>

                <Panel title="Top Selling Menu Items">
                    <ReactECharts option={topSellingChartOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
                    <TableWrapper>
                        <table className="w-full text-sm text-left mt-4">
                            <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                                <tr>
                                    <th className={`${thClass} rounded-s-lg`}>Item</th>
                                    <th className={`${thClass} rounded-e-lg text-right`}>Quantity Sold</th>
                                </tr>
                            </thead>
                            <tbody>
                                {TOP_SELLING_ITEMS.slice(0, 3).map((row) => (
                                    <tr key={row.item} className="border-b border-[#f2f4f7]">
                                        <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.item}</td>
                                        <td className={`${tdClass} text-right`}>{row.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableWrapper>
                </Panel>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel
                    title="Low Stock Alerts"
                    action={
                        <NavLink to="/canteen-manager/requests-approvals/add-request" className='text-xs bg-[#515DEF] text-white px-3 py-1.5 rounded-md hover:opacity-90 transition-all'>
                            Create Purchase Request
                        </NavLink>
                    }
                >
                    <TableWrapper>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                                <tr>
                                    <th className={`${thClass} rounded-s-lg`}>Item</th>
                                    <th className={thClass}>Current Stock</th>
                                    <th className={`${thClass} rounded-e-lg`}>Reorder Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {LOW_STOCK_ALERTS.map((row) => (
                                    <tr key={row.item} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                        <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.item}</td>
                                        <td className={`${tdClass} text-[#FF5722] font-medium`}>{row.currentStock}</td>
                                        <td className={tdClass}>{row.reorderLevel}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableWrapper>
                </Panel>

                <Panel title="Pending Requests & Approvals">
                    <TableWrapper>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                                <tr>
                                    <th className={`${thClass} rounded-s-lg`}>Request ID</th>
                                    <th className={thClass}>Type</th>
                                    <th className={thClass}>Amount</th>
                                    <th className={`${thClass} rounded-e-lg`}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PENDING_REQUESTS.map((row) => (
                                    <tr key={row.requestId} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                        <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.requestId}</td>
                                        <td className={tdClass}>{row.type}</td>
                                        <td className={tdClass}>{row.amount}</td>
                                        <td className={tdClass}>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${requestStatusBadgeColor[row.status]}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableWrapper>
                </Panel>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel title="Inventory Summary">
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
                        {INVENTORY_SUMMARY.map((item) => (
                            <div key={item.label} className='border border-[#EDEEF5] rounded-xl p-4 text-center'>
                                <p className='text-xs text-[#808080]'>{item.label}</p>
                                <p className={`text-lg font-semibold mt-1 ${item.color}`}>{item.value}</p>
                            </div>
                        ))}
                    </div>
                    <p className='text-sm font-medium text-[#1E1E1E] mb-2'>Order Distribution</p>
                    <ReactECharts option={orderDistributionOption} style={{ height: 220 }} opts={{ renderer: 'svg' }} />
                </Panel>

                <Panel title="Recent Announcements">
                    <TableWrapper>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                                <tr>
                                    <th className={`${thClass} rounded-s-lg`}>Title</th>
                                    <th className={thClass}>Audience</th>
                                    <th className={`${thClass} rounded-e-lg`}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {RECENT_ANNOUNCEMENTS.map((row) => (
                                    <tr key={row.title} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                        <td className={`${tdClass} font-medium text-[#1E1E1E] max-w-[180px] truncate`} title={row.title}>{row.title}</td>
                                        <td className={tdClass}>{row.audience}</td>
                                        <td className={tdClass}>{row.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableWrapper>
                </Panel>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h3 className='text-lg font-semibold text-black mb-4'>Quick Actions</h3>
                <div className='flex flex-wrap gap-3'>
                    {QUICK_ACTIONS.map((action) => (
                        <NavLink
                            key={action.label}
                            to={action.to}
                            className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-5 py-2.5 rounded-md hover:opacity-90 transition-all duration-200'
                        >
                            <Plus size={16} />
                            {action.label}
                        </NavLink>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Dashboard
