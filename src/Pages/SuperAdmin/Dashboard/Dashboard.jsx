import React, { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import {
    GraduationCap,
    Users,
    Building2,
    TrendingDown,
    IndianRupee,
    ClipboardCheck,
    ShieldAlert,
    ShieldCheck,
    Bus,
    Package,
    LayoutDashboard,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    UtensilsCrossed,
    Sparkles,
    Ticket,
    BookOpen,
    Landmark,
} from 'lucide-react'
import {
    APPROVAL_PRIORITY_COLORS,
    CHART_COLORS,
    DEPARTMENT_STATUS_COLORS,
    MODULE_STATUS_COLORS,
    findingSeverityBadgeColor,
} from './dashboardData'
import { loadLiveSuperAdminDashboard } from './liveDashboardLoader'

const KPI_ICONS = {
    students: GraduationCap,
    employees: Users,
    departments: Building2,
    revenue: IndianRupee,
    expenses: TrendingDown,
    approvals: ClipboardCheck,
    'audit-findings': ShieldAlert,
    compliance: ShieldCheck,
    vehicles: Bus,
    inventory: Package,
}

const TONE_STYLES = {
    primary: { icon: 'bg-[#515DEF]/15 text-[#515DEF]', border: 'border-l-[#515DEF]' },
    success: { icon: 'bg-[#4CAF50]/15 text-[#4CAF50]', border: 'border-l-[#4CAF50]' },
    danger: { icon: 'bg-[#FF5722]/15 text-[#FF5722]', border: 'border-l-[#FF5722]' },
    warning: { icon: 'bg-[#FF9800]/15 text-[#FF9800]', border: 'border-l-[#FF9800]' },
    info: { icon: 'bg-[#2196F3]/15 text-[#2196F3]', border: 'border-l-[#2196F3]' },
    violet: { icon: 'bg-[#9C27B0]/15 text-[#9C27B0]', border: 'border-l-[#9C27B0]' },
}

const DEPT_ICONS = {
    Academic: BookOpen,
    Transport: Bus,
    HR: Users,
    Accounts: Landmark,
    Canteen: UtensilsCrossed,
    Housekeeping: Sparkles,
    'IT Support': Ticket,
    Store: Package,
}

const PERIOD_OPTIONS = [
    { value: '3m', label: 'Last 3 months' },
    { value: '6m', label: 'Last 6 months' },
    { value: '12m', label: 'Last 12 months' },
]

const Sparkline = ({ data, color }) => {
    const safe = Array.isArray(data) && data.length ? data : [0]
    const option = useMemo(() => ({
        grid: { left: 0, right: 0, top: 4, bottom: 0 },
        xAxis: { type: 'category', show: false, data: safe.map((_, i) => i) },
        yAxis: {
            type: 'value',
            show: false,
            min: Math.min(...safe) * 0.95,
            max: Math.max(...safe, 1) * 1.05,
        },
        series: [{
            type: 'line',
            data: safe,
            smooth: true,
            symbol: 'none',
            lineStyle: { color, width: 2 },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: `${color}33` },
                        { offset: 1, color: `${color}00` },
                    ],
                },
            },
        }],
    }), [safe, color])

    return <ReactECharts option={option} style={{ height: 48, width: '100%' }} opts={{ renderer: 'svg' }} />
}

const TrendBadge = ({ trend, trendType }) => {
    if (trendType === 'neutral') {
        return (
            <span className='inline-flex items-center gap-1 rounded-full bg-[#6670851A] px-2 py-0.5 text-xs font-semibold text-[#667085]'>
                <Minus size={12} />
                {trend}
            </span>
        )
    }
    const isPositive = trendType === 'up'
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
            isPositive ? 'bg-[#4CAF501A] text-[#4CAF50]' : 'bg-[#FF57221A] text-[#FF5722]'
        }`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
        </span>
    )
}

const KpiCard = ({ card }) => {
    const Icon = KPI_ICONS[card.key] ?? LayoutDashboard
    const tone = TONE_STYLES[card.iconTone] ?? TONE_STYLES.primary
    const showPrevious = card.previousValue != null && card.previousValue !== ''
    const spark = Array.isArray(card.sparkline) ? card.sparkline : []
    const showSpark = spark.length > 1
    return (
        <div className={`bg-white rounded-2xl shadow-md border border-[#EDEEF5] border-l-4 ${tone.border} p-4 hover:shadow-lg transition-shadow`}>
            <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0 flex-1'>
                    <p className='text-xs font-medium uppercase tracking-wide text-[#808080]'>{card.label}</p>
                    <p className='text-2xl font-bold text-[#0C1E5B] mt-2'>{card.value}</p>
                    <div className='flex flex-wrap items-center gap-2 mt-2'>
                        <TrendBadge trend={card.trend} trendType={card.trendType} />
                        <span className='text-xs text-[#667085]'>{card.comparison}</span>
                    </div>
                    {showPrevious ? (
                        <p className='text-xs text-[#808080] mt-1'>Prior period: {card.previousValue}</p>
                    ) : null}
                </div>
                <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
                    <Icon size={20} />
                </div>
            </div>
            {showSpark ? (
                <div className='mt-3 -mx-1'>
                    <Sparkline data={spark} color={card.sparkColor} />
                </div>
            ) : null}
        </div>
    )
}

const ProgressBar = ({ label, value, target, color, emptyLabel }) => (
    <div>
        <div className='flex items-center justify-between gap-2 mb-2'>
            <span className='text-sm font-medium text-[#1E1E1E]'>{label}</span>
            <span className='text-sm font-semibold' style={{ color }}>
                {emptyLabel ? '—' : `${value}%`}
            </span>
        </div>
        <div className='h-2.5 rounded-full bg-[#EDEEF5] overflow-hidden'>
            <div
                className='h-full rounded-full transition-all duration-500'
                style={{ width: emptyLabel ? '0%' : `${Math.min(value, 100)}%`, backgroundColor: color }}
            />
        </div>
        <p className='text-xs text-[#808080] mt-1'>{emptyLabel || `Target: ${target}%`}</p>
    </div>
)

const Panel = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-md border border-[#EDEEF5] p-5 h-full ${className}`}>
        <h3 className='text-lg font-semibold text-[#0C1E5B] mb-4'>{title}</h3>
        {children}
    </div>
)

const thClass = 'px-3 py-3 text-[#0C1E5B] font-medium uppercase text-xs'
const tdClass = 'px-3 py-3 text-[#667085] text-sm'
const emptyRow = (cols, label = 'No live records yet') => (
    <tr>
        <td colSpan={cols} className='px-3 py-8 text-center text-[#667085]'>{label}</td>
    </tr>
)

const Dashboard = () => {
    const [period, setPeriod] = useState('6m')
    const [snap, setSnap] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        setLoading(true)
        setError('')
        loadLiveSuperAdminDashboard(period)
            .then((data) => {
                if (!active) return
                setSnap(data)
                if (data.errors?.length) setError(data.errors.slice(0, 2).join(' · '))
            })
            .catch((err) => {
                if (!active) return
                setSnap(null)
                setError(err?.message || 'Dashboard could not be loaded from the API.')
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => { active = false }
    }, [period])

    const trend = snap?.governanceTrend || { labels: [], revenue: [], expenses: [], compliance: [], hasCompliance: false }
    const incomeMix = snap?.incomeMix || []
    const findingsBySeverity = snap?.findingsBySeverity || []
    const departmentSummaries = snap?.departmentSummaries || []

    const financialTrendOption = useMemo(() => {
        const hasCompliance = Boolean(trend.hasCompliance)
        const legend = hasCompliance ? ['Revenue', 'Expenses', 'Compliance'] : ['Revenue', 'Expenses']
        const series = [
            {
                name: 'Revenue',
                type: 'bar',
                data: trend.revenue,
                barWidth: 18,
                itemStyle: { color: CHART_COLORS.success, borderRadius: [4, 4, 0, 0] },
            },
            {
                name: 'Expenses',
                type: 'bar',
                data: trend.expenses,
                barWidth: 18,
                itemStyle: { color: CHART_COLORS.danger, borderRadius: [4, 4, 0, 0] },
            },
        ]
        if (hasCompliance) {
            series.push({
                name: 'Compliance',
                type: 'line',
                yAxisIndex: 1,
                smooth: true,
                data: trend.compliance,
                lineStyle: { color: CHART_COLORS.primary, width: 3 },
                itemStyle: { color: CHART_COLORS.primary },
                symbol: 'circle',
                symbolSize: 8,
            })
        }
        return {
            tooltip: { trigger: 'axis' },
            legend: {
                data: legend,
                bottom: 0,
                textStyle: { color: '#667085', fontSize: 12 },
            },
            grid: { left: 48, right: 48, top: 24, bottom: 48 },
            xAxis: {
                type: 'category',
                data: trend.labels,
                axisLabel: { color: '#667085', fontSize: 11 },
                axisLine: { lineStyle: { color: '#E0E0E0' } },
            },
            yAxis: [
                {
                    type: 'value',
                    name: '₹ Lakhs',
                    axisLabel: { color: '#667085', fontSize: 11 },
                    splitLine: { lineStyle: { color: '#F2F4F7' } },
                },
                ...(hasCompliance
                    ? [{
                        type: 'value',
                        name: 'Compliance %',
                        min: 0,
                        max: 100,
                        axisLabel: { color: '#667085', fontSize: 11, formatter: '{value}%' },
                        splitLine: { show: false },
                    }]
                    : []),
            ],
            series,
        }
    }, [trend])

    const incomeMixOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
        series: [{
            type: 'pie',
            radius: ['46%', '72%'],
            center: ['50%', '48%'],
            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: incomeMix.map((item) => ({
                name: item.name,
                value: item.percent || item.amount || 0,
                itemStyle: { color: item.color },
            })),
        }],
    }), [incomeMix])

    const findingsSeverityOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 48, right: 16, top: 16, bottom: 32 },
        xAxis: {
            type: 'category',
            data: findingsBySeverity.map((item) => item.name),
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#667085', fontSize: 11 },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [{
            type: 'bar',
            data: findingsBySeverity.map((item, index) => ({
                value: item.value,
                itemStyle: {
                    color: [CHART_COLORS.danger, CHART_COLORS.warning, CHART_COLORS.info, CHART_COLORS.palette[5]][index] || CHART_COLORS.primary,
                    borderRadius: [4, 4, 0, 0],
                },
            })),
            barWidth: 32,
        }],
    }), [findingsBySeverity])

    const departmentComplianceOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 48, right: 16, top: 16, bottom: 48 },
        xAxis: {
            type: 'category',
            data: departmentSummaries.map((item) => item.department),
            axisLabel: { color: '#667085', fontSize: 10, rotate: 25 },
        },
        yAxis: {
            type: 'value',
            min: 50,
            max: 100,
            axisLabel: { color: '#667085', fontSize: 11, formatter: '{value}%' },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [{
            type: 'bar',
            data: departmentSummaries.map((item) => ({
                value: item.compliance,
                itemStyle: {
                    color: item.compliance >= 90 ? CHART_COLORS.success : item.compliance >= 80 ? CHART_COLORS.primary : item.compliance >= 75 ? CHART_COLORS.warning : CHART_COLORS.danger,
                    borderRadius: [4, 4, 0, 0],
                },
            })),
            barWidth: 24,
        }],
    }), [departmentSummaries])

    const summary = snap?.executiveSummary || {}
    const kpiCards = snap?.kpiCards || []

    return (
        <section className='space-y-6'>
            <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C1E5B] via-[#1A2F8F] to-[#515DEF] p-6 sm:p-8 text-white shadow-xl'>
                <div className='absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl' />
                <div className='relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
                    <div>
                        <h1 className='text-2xl sm:text-3xl font-bold'>Super Admin Dashboard</h1>
                        <p className='text-sm text-white/75 mt-2 max-w-2xl'>
                            Live campus figures from finance, students, HR, approvals, audit findings, transport and inventory APIs
                            {snap?.asOf ? ` · as of ${snap.asOf}` : ''}.
                        </p>
                    </div>
                    <div className='flex flex-col gap-3 min-w-[220px]'>
                        <label className='text-xs text-white/70' htmlFor='sa-period'>Period filter</label>
                        <select
                            id='sa-period'
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className='rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm text-white'
                        >
                            {PERIOD_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className='text-[#1E1E1E]'>{opt.label}</option>
                            ))}
                        </select>
                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                            <div className='rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10'>
                                <p className='text-xs text-white/70'>Net Surplus</p>
                                <p className='text-lg font-bold mt-1'>{summary.netSurplus || '—'}</p>
                            </div>
                            <div className='rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10'>
                                <p className='text-xs text-white/70'>Fee Collection</p>
                                <p className='text-lg font-bold mt-1'>{summary.feeCollectionRate ?? 0}%</p>
                            </div>
                            <div className='rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10'>
                                <p className='text-xs text-white/70'>Active Risks</p>
                                <p className='text-lg font-bold mt-1'>{summary.activeRisks ?? 0}</p>
                            </div>
                            <div className='rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10'>
                                <p className='text-xs text-white/70'>Pending Fees</p>
                                <p className='text-lg font-bold mt-1'>{summary.pendingFees || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? <p className='text-[#667085]'>Loading live dashboard…</p> : null}
            {error ? <p className='text-sm text-[#B42318]'>{error}</p> : null}

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4'>
                {kpiCards.map((card) => (
                    <KpiCard key={card.key} card={card} />
                ))}
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
                <Panel title={`Financial & Compliance Trend (${PERIOD_OPTIONS.find((p) => p.value === period)?.label || period})`} className='xl:col-span-2'>
                    <ReactECharts option={financialTrendOption} style={{ height: 340 }} opts={{ renderer: 'svg' }} />
                </Panel>
                <Panel title='Performance Targets'>
                    <div className='space-y-5'>
                        {(snap?.progressMetrics || []).map((metric) => (
                            <ProgressBar key={metric.label} {...metric} />
                        ))}
                    </div>
                </Panel>
            </div>

            <div>
                <div className='flex items-center justify-between gap-4 mb-4'>
                    <h2 className='text-lg font-semibold text-[#0C1E5B]'>Department Summary</h2>
                    <span className='text-xs font-medium text-[#667085]'>Only departments that appear on live audit findings</span>
                </div>
                {departmentSummaries.length === 0 ? (
                    <div className='bg-white rounded-2xl shadow-md border border-[#EDEEF5] p-8 text-center text-[#667085]'>
                        No audit findings yet — department cards appear when findings are logged.
                    </div>
                ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {departmentSummaries.map((dept) => {
                        const Icon = DEPT_ICONS[dept.department] ?? Building2
                        const compliancePct = dept.complianceLabel || `${dept.compliance}%`
                        return (
                            <div key={dept.department} className='bg-white rounded-2xl shadow-md border border-[#EDEEF5] p-4 hover:shadow-lg transition-shadow'>
                                <div className='flex items-start justify-between gap-2 mb-4'>
                                    <div className='flex items-center gap-2 min-w-0'>
                                        <div className='p-2 rounded-xl bg-[#515DEF]/10 text-[#515DEF] shrink-0'>
                                            <Icon size={16} />
                                        </div>
                                        <h4 className='text-sm font-semibold text-[#1E1E1E] truncate'>{dept.department}</h4>
                                    </div>
                                    <span className={`inline-flex shrink-0 px-2 py-1 rounded-lg text-xs font-semibold ${DEPARTMENT_STATUS_COLORS[dept.status] || 'bg-[#66708533] text-[#667085]'}`}>
                                        {dept.status}
                                    </span>
                                </div>
                                <div className='space-y-3'>
                                    <div>
                                        <div className='flex justify-between text-xs mb-1'>
                                            <span className='text-[#808080]'>Compliance</span>
                                            <span className='font-semibold text-[#515DEF]'>{compliancePct}</span>
                                        </div>
                                        <div className='h-2 rounded-full bg-[#EDEEF5] overflow-hidden'>
                                            <div className='h-full rounded-full bg-[#515DEF]' style={{ width: `${dept.compliance || 0}%` }} />
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-3 gap-2 pt-1'>
                                        <div className='rounded-lg bg-[#FAFBFF] p-2 text-center'>
                                            <p className='text-[10px] text-[#808080]'>Findings</p>
                                            <p className='text-sm font-semibold text-[#1E1E1E]'>{dept.totalAudits}</p>
                                        </div>
                                        <div className='rounded-lg bg-[#FF98000D] p-2 text-center'>
                                            <p className='text-[10px] text-[#808080]'>Open</p>
                                            <p className='text-sm font-semibold text-[#FF9800]'>{dept.pendingFindings}</p>
                                        </div>
                                        <div className='rounded-lg bg-[#4CAF500D] p-2 text-center'>
                                            <p className='text-[10px] text-[#808080]'>Closed</p>
                                            <p className='text-sm font-semibold text-[#4CAF50]'>{dept.closedFindings}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                )}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <Panel title='Income Mix (posted)'>
                    <ReactECharts option={incomeMixOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
                    <div className='grid grid-cols-2 gap-2 mt-2'>
                        {incomeMix.map((item) => (
                            <div key={item.name} className='flex items-center gap-2 text-xs text-[#667085]'>
                                <span className='size-2.5 rounded-full shrink-0' style={{ backgroundColor: item.color }} />
                                <span>{item.name} · {item.percent}%</span>
                            </div>
                        ))}
                    </div>
                </Panel>
                <Panel title='Active Findings by Severity'>
                    <ReactECharts option={findingsSeverityOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
                </Panel>
                <Panel title='Department Compliance Ranking'>
                    <ReactECharts option={departmentComplianceOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
                </Panel>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel title='Pending Approvals'>
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr>
                                    <th className={`${thClass} rounded-s-lg`}>Request</th>
                                    <th className={thClass}>Department</th>
                                    <th className={thClass}>Category</th>
                                    <th className={`${thClass} rounded-e-lg`}>Priority</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(snap?.recentApprovals || []).length
                                    ? snap.recentApprovals.map((row) => (
                                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                            <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.title}</td>
                                            <td className={tdClass}>{row.department}</td>
                                            <td className={tdClass}>{row.category}</td>
                                            <td className={tdClass}>
                                                <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${APPROVAL_PRIORITY_COLORS[row.priority] ?? 'bg-[#66708533] text-[#667085]'}`}>
                                                    {row.priority}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                    : emptyRow(4)}
                            </tbody>
                        </table>
                    </div>
                </Panel>

                <Panel title='Active Audit Findings'>
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr>
                                    <th className={`${thClass} rounded-s-lg`}>Finding</th>
                                    <th className={thClass}>Department</th>
                                    <th className={thClass}>Severity</th>
                                    <th className={`${thClass} rounded-e-lg`}>Due</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(snap?.activeFindings || []).length
                                    ? snap.activeFindings.map((row) => (
                                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                            <td className={`${tdClass} font-medium text-[#1E1E1E] max-w-[180px] truncate`}>{row.title}</td>
                                            <td className={tdClass}>{row.department}</td>
                                            <td className={tdClass}>
                                                <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${findingSeverityBadgeColor[row.severity] || 'bg-[#66708533] text-[#667085]'}`}>
                                                    {row.severity}
                                                </span>
                                            </td>
                                            <td className={tdClass}>{row.dueDate}</td>
                                        </tr>
                                    ))
                                    : emptyRow(4)}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <Panel title='Module Health' className='lg:col-span-1'>
                    <div className='space-y-3'>
                        {(snap?.moduleHealth || []).map((item) => (
                            <div key={item.module} className='flex items-center justify-between gap-3 rounded-xl border border-[#EDEEF5] p-3'>
                                <div className='min-w-0'>
                                    <p className='text-sm font-medium text-[#1E1E1E]'>{item.module}</p>
                                    <p className='text-xs text-[#667085] mt-1'>{item.detail || '—'}</p>
                                    {item.score != null ? (
                                        <p className='text-xs font-semibold text-[#515DEF] mt-1'>Compliance {item.score}%</p>
                                    ) : null}
                                </div>
                                <span className={`inline-flex shrink-0 px-2 py-1 rounded-lg text-xs font-semibold ${MODULE_STATUS_COLORS[item.status] || 'bg-[#66708533] text-[#667085]'}`}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </Panel>

                <Panel title='Critical Inventory Alerts' className='lg:col-span-2'>
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr>
                                    <th className={`${thClass} rounded-s-lg`}>Department</th>
                                    <th className={thClass}>Item</th>
                                    <th className={thClass}>Alert Type</th>
                                    <th className={`${thClass} rounded-e-lg`}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(snap?.inventoryAlerts || []).length
                                    ? snap.inventoryAlerts.map((row) => (
                                        <tr key={`${row.department}-${row.item}`} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                            <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.department}</td>
                                            <td className={tdClass}>{row.item}</td>
                                            <td className={tdClass}>{row.alertType}</td>
                                            <td className={tdClass}>
                                                <span className='inline-flex px-2 py-1 rounded-lg text-xs font-semibold bg-[#FF000033] text-[#FF0000]'>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                    : emptyRow(4, 'No low/out-of-stock inventory alerts')}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            </div>
        </section>
    )
}

export default Dashboard
