import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import {
    Users,
    Building2,
    ClipboardCheck,
    ShieldAlert,
    ClipboardList,
    Rss,
    AlertTriangle,
    Monitor,
    Bus,
    LayoutDashboard,
    UtensilsCrossed,
    Package,
    Sparkles,
    Ticket,
} from 'lucide-react'
import {
    KPI_CARDS,
    DEPARTMENT_SUMMARIES,
    PENDING_APPROVALS,
    CRITICAL_ALERTS,
    RECENT_ESCALATIONS,
    priorityBadgeColor,
    OPERATIONS_TREND,
    APPROVALS_BY_DEPARTMENT,
    ESCALATIONS_BY_PRIORITY,
    ALERTS_BY_DEPARTMENT,
    DEPARTMENT_WORKLOAD,
    CHART_COLORS,
} from './dashboardData'

const KPI_ICONS = {
    'Total Employees': Users,
    'Active Departments': Building2,
    'Pending Approvals': ClipboardCheck,
    'Open Escalations': ShieldAlert,
    'Pending Tasks': ClipboardList,
    'Active Announcements': Rss,
    'Critical Inventory Alerts': AlertTriangle,
    'Critical IT Issues': Monitor,
    'Vehicle Maintenance Due': Bus,
}

const DEPT_ICONS = {
    Canteen: UtensilsCrossed,
    'Stationery Store': Package,
    Housekeeping: Sparkles,
    'IT Support': Ticket,
    Transport: Bus,
}

const Panel = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-md p-4 h-full ${className}`}>
        <h3 className='text-lg font-semibold text-black mb-4'>{title}</h3>
        {children}
    </div>
)

const Widget = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
        <h3 className='text-lg font-semibold text-black mb-4'>{title}</h3>
        <div className="relative overflow-x-auto">{children}</div>
    </div>
)

const thClass = 'px-2 py-3 text-[#0C1E5B] font-medium uppercase text-xs'
const tdClass = 'px-2 py-3 text-[#667085] text-sm'

const Dashboard = () => {
    const operationsTrendOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        legend: {
            data: ['Pending Approvals', 'Escalations', 'Tasks'],
            bottom: 0,
            textStyle: { color: '#667085', fontSize: 12 },
        },
        grid: { left: 48, right: 24, top: 24, bottom: 48 },
        xAxis: {
            type: 'category',
            data: OPERATIONS_TREND.labels,
            axisLine: { lineStyle: { color: '#E0E0E0' } },
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#667085', fontSize: 11 },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [
            {
                name: 'Pending Approvals',
                type: 'line',
                smooth: true,
                data: OPERATIONS_TREND.approvals,
                areaStyle: { color: 'rgba(81, 93, 239, 0.1)' },
                lineStyle: { color: CHART_COLORS.primary, width: 2 },
                itemStyle: { color: CHART_COLORS.primary },
                symbol: 'circle',
                symbolSize: 6,
            },
            {
                name: 'Escalations',
                type: 'line',
                smooth: true,
                data: OPERATIONS_TREND.escalations,
                lineStyle: { color: CHART_COLORS.danger, width: 2 },
                itemStyle: { color: CHART_COLORS.danger },
                symbol: 'circle',
                symbolSize: 6,
            },
            {
                name: 'Tasks',
                type: 'line',
                smooth: true,
                data: OPERATIONS_TREND.tasks,
                lineStyle: { color: CHART_COLORS.success, width: 2 },
                itemStyle: { color: CHART_COLORS.success },
                symbol: 'circle',
                symbolSize: 6,
            },
        ],
    }), [])

    const escalationsPieOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: {
            orient: 'vertical',
            right: 0,
            top: 'center',
            textStyle: { color: '#667085', fontSize: 12 },
        },
        series: [{
            type: 'pie',
            radius: ['48%', '72%'],
            center: ['38%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: ESCALATIONS_BY_PRIORITY.filter((item) => item.value > 0).map((item, index) => ({
                ...item,
                itemStyle: {
                    color: [CHART_COLORS.danger, CHART_COLORS.warning, CHART_COLORS.info, CHART_COLORS.palette[5]][index],
                },
            })),
        }],
    }), [])

    const approvalsBarOption = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                const val = params[0]?.value ?? 0
                return `${params[0]?.name}<br/>₹${val.toLocaleString('en-IN')}`
            },
        },
        grid: { left: 16, right: 16, top: 16, bottom: 48 },
        xAxis: {
            type: 'category',
            data: APPROVALS_BY_DEPARTMENT.map((d) => d.department),
            axisLabel: { color: '#667085', fontSize: 10, rotate: 20 },
            axisLine: { lineStyle: { color: '#E0E0E0' } },
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#667085',
                fontSize: 11,
                formatter: (v) => `₹${(v / 1000).toFixed(0)}k`,
            },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [{
            type: 'bar',
            data: APPROVALS_BY_DEPARTMENT.map((d) => d.amount),
            barWidth: 28,
            itemStyle: {
                color: CHART_COLORS.primary,
                borderRadius: [4, 4, 0, 0],
            },
        }],
    }), [])

    const alertsBarOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 100, right: 16, top: 8, bottom: 8 },
        xAxis: {
            type: 'value',
            axisLabel: { color: '#667085', fontSize: 11 },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        yAxis: {
            type: 'category',
            data: ALERTS_BY_DEPARTMENT.map((d) => d.department).reverse(),
            axisLabel: { color: '#667085', fontSize: 11 },
            axisLine: { show: false },
            axisTick: { show: false },
        },
        series: [{
            type: 'bar',
            data: ALERTS_BY_DEPARTMENT.map((d) => d.count).reverse(),
            barWidth: 14,
            itemStyle: { color: CHART_COLORS.danger, borderRadius: [0, 4, 4, 0] },
        }],
    }), [])

    const departmentWorkloadOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: {
            data: ['Pending Tasks', 'Open Tickets', 'Low Stock'],
            bottom: 0,
            textStyle: { color: '#667085', fontSize: 12 },
        },
        grid: { left: 48, right: 16, top: 24, bottom: 48 },
        xAxis: {
            type: 'category',
            data: DEPARTMENT_WORKLOAD.map((d) => d.department),
            axisLabel: { color: '#667085', fontSize: 10, rotate: 15 },
            axisLine: { lineStyle: { color: '#E0E0E0' } },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#667085', fontSize: 11 },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [
            {
                name: 'Pending Tasks',
                type: 'bar',
                stack: 'total',
                data: DEPARTMENT_WORKLOAD.map((d) => d.pendingTasks),
                itemStyle: { color: CHART_COLORS.primary },
            },
            {
                name: 'Open Tickets',
                type: 'bar',
                stack: 'total',
                data: DEPARTMENT_WORKLOAD.map((d) => d.openTickets),
                itemStyle: { color: CHART_COLORS.info },
            },
            {
                name: 'Low Stock',
                type: 'bar',
                stack: 'total',
                data: DEPARTMENT_WORKLOAD.map((d) => d.lowStock),
                itemStyle: { color: CHART_COLORS.warning },
            },
        ],
    }), [])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <LayoutDashboard size={22} />
                    </div>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Joint Director Dashboard</h2>
                        <p className='text-sm text-[#667085] mt-0.5'>Cross-department overview of operations, approvals, and critical alerts.</p>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4'>
                {KPI_CARDS.map((card) => {
                    const Icon = KPI_ICONS[card.label] ?? ClipboardList
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

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <Panel title="Weekly Operations Trend" className="lg:col-span-2">
                    <ReactECharts option={operationsTrendOption} style={{ height: 300 }} opts={{ renderer: 'svg' }} />
                </Panel>
                <Panel title="Escalations by Priority">
                    <ReactECharts option={escalationsPieOption} style={{ height: 300 }} opts={{ renderer: 'svg' }} />
                </Panel>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Department Summary</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'>
                    {DEPARTMENT_SUMMARIES.map((dept) => {
                        const Icon = DEPT_ICONS[dept.department] ?? Building2
                        return (
                            <div key={dept.department} className='bg-white rounded-2xl shadow-md p-4'>
                                <div className='flex items-center gap-2 mb-4'>
                                    <div className='p-2 rounded-lg bg-[#515DEF]/10 text-[#515DEF]'>
                                        <Icon size={16} />
                                    </div>
                                    <h4 className='text-sm font-semibold text-[#1E1E1E]'>{dept.department}</h4>
                                </div>
                                <div className='space-y-3'>
                                    {dept.metrics.map((metric) => (
                                        <div key={metric.label} className='flex justify-between items-center gap-2'>
                                            <span className='text-xs text-[#808080]'>{metric.label}</span>
                                            <span className='text-sm font-semibold text-[#1E1E1E]'>{metric.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel title="Department Workload Comparison">
                    <ReactECharts option={departmentWorkloadOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
                </Panel>
                <Panel title="Pending Approval Amounts by Department">
                    <ReactECharts option={approvalsBarOption} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
                </Panel>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <Panel title="Critical Alerts by Department" className="lg:col-span-1">
                    <ReactECharts option={alertsBarOption} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
                </Panel>

                <Widget title="Pending Approvals">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Request ID</th>
                                <th className={thClass}>Department</th>
                                <th className={thClass}>Type</th>
                                <th className={`${thClass} rounded-e-lg`}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PENDING_APPROVALS.map((row) => (
                                <tr key={row.requestId} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.requestId}</td>
                                    <td className={tdClass}>{row.department}</td>
                                    <td className={tdClass}>{row.type}</td>
                                    <td className={`${tdClass} whitespace-nowrap`}>{row.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Widget>

                <Widget title="Recent Escalations">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Escalation ID</th>
                                <th className={thClass}>Department</th>
                                <th className={`${thClass} rounded-e-lg`}>Priority</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_ESCALATIONS.map((row) => (
                                <tr key={row.escalationId} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.escalationId}</td>
                                    <td className={tdClass}>{row.department}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${priorityBadgeColor[row.priority]}`}>
                                            {row.priority}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Widget>
            </div>

            <Widget title="Critical Alerts">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Department</th>
                            <th className={`${thClass} rounded-e-lg`}>Alert</th>
                        </tr>
                    </thead>
                    <tbody>
                        {CRITICAL_ALERTS.map((row) => (
                            <tr key={`${row.department}-${row.alert}`} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                <td className={`${tdClass} font-medium text-[#1E1E1E] whitespace-nowrap`}>{row.department}</td>
                                <td className={`${tdClass} text-[#FF5722]`}>{row.alert}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Widget>
        </section>
    )
}

export default Dashboard
