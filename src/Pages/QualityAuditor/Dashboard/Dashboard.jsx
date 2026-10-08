import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import {
    LayoutDashboard,
    CalendarDays,
    ClipboardList,
    CircleCheck,
    Clock,
    AlertTriangle,
    ShieldAlert,
    Percent,
    Building2,
    Calendar,
} from 'lucide-react'
import {
    KPI_CARDS,
    MONTHLY_COMPLIANCE_TREND,
    DEPARTMENT_COMPLIANCE,
    OBSERVATION_STATUS,
    AUDIT_COMPLETION,
    UPCOMING_AUDITS_CALENDAR,
    RECENT_ACTIVITY,
    activityTypeBadgeColor,
    CHART_COLORS,
} from './dashboardData'

const KPI_ICONS = {
    "Today's Audits": CalendarDays,
    'Pending Audits': ClipboardList,
    'Completed Audits': CircleCheck,
    'Overdue Audits': Clock,
    'Open Observations': AlertTriangle,
    'Escalated Issues': ShieldAlert,
    'Average Compliance %': Percent,
    'Departments Audited': Building2,
}

const Panel = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-md p-4 h-full ${className}`}>
        <h3 className='text-lg font-semibold text-black mb-4'>{title}</h3>
        {children}
    </div>
)

const Dashboard = () => {
    const monthlyComplianceOption = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            formatter: (params) => `${params[0]?.name}<br/>${params[0]?.value}% compliance`,
        },
        grid: { left: 48, right: 24, top: 24, bottom: 32 },
        xAxis: {
            type: 'category',
            data: MONTHLY_COMPLIANCE_TREND.labels,
            axisLine: { lineStyle: { color: '#E0E0E0' } },
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            min: 80,
            max: 100,
            axisLabel: { color: '#667085', fontSize: 11, formatter: '{value}%' },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [{
            name: 'Compliance',
            type: 'line',
            smooth: true,
            data: MONTHLY_COMPLIANCE_TREND.values,
            areaStyle: { color: 'rgba(81, 93, 239, 0.12)' },
            lineStyle: { color: CHART_COLORS.primary, width: 2 },
            itemStyle: { color: CHART_COLORS.primary },
            symbol: 'circle',
            symbolSize: 6,
            label: {
                show: true,
                position: 'top',
                formatter: '{c}%',
                color: '#667085',
                fontSize: 11,
            },
        }],
    }), [])

    const departmentComplianceOption = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => `${params[0]?.name}<br/>${params[0]?.value}% compliance`,
        },
        grid: { left: 48, right: 24, top: 16, bottom: 48 },
        xAxis: {
            type: 'category',
            data: DEPARTMENT_COMPLIANCE.map((item) => item.department),
            axisLabel: { color: '#667085', fontSize: 10, rotate: 30 },
            axisLine: { lineStyle: { color: '#E0E0E0' } },
        },
        yAxis: {
            type: 'value',
            max: 100,
            axisLabel: { color: '#667085', fontSize: 11, formatter: '{value}%' },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [{
            type: 'bar',
            data: DEPARTMENT_COMPLIANCE.map((item) => item.compliance),
            barWidth: 28,
            itemStyle: {
                color: CHART_COLORS.primary,
                borderRadius: [4, 4, 0, 0],
            },
            label: {
                show: true,
                position: 'top',
                formatter: '{c}%',
                color: '#667085',
                fontSize: 10,
            },
        }],
    }), [])

    const observationStatusOption = useMemo(() => ({
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)',
        },
        legend: {
            orient: 'vertical',
            right: 0,
            top: 'center',
            textStyle: { color: '#667085', fontSize: 11 },
        },
        series: [{
            type: 'pie',
            radius: ['42%', '68%'],
            center: ['38%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: {
                label: { show: true, fontSize: 12, fontWeight: 'bold' },
            },
            data: OBSERVATION_STATUS.map((item, index) => ({
                name: item.name,
                value: item.value,
                itemStyle: { color: CHART_COLORS.pie[index % CHART_COLORS.pie.length] },
            })),
        }],
    }), [])

    const auditCompletionOption = useMemo(() => ({
        series: [{
            type: 'gauge',
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: 100,
            splitNumber: 10,
            radius: '90%',
            center: ['50%', '58%'],
            axisLine: {
                lineStyle: {
                    width: 14,
                    color: [[1, '#EDEEF5']],
                },
            },
            progress: {
                show: true,
                width: 14,
                itemStyle: { color: CHART_COLORS.primary },
            },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            pointer: { show: false },
            anchor: { show: false },
            title: {
                show: true,
                offsetCenter: [0, '28%'],
                fontSize: 13,
                color: '#808080',
            },
            detail: {
                valueAnimation: true,
                offsetCenter: [0, '-4%'],
                fontSize: 28,
                fontWeight: 'bold',
                color: '#1E1E1E',
                formatter: '{value}%',
            },
            data: [{
                value: AUDIT_COMPLETION.percentage,
                name: `${AUDIT_COMPLETION.completed} of ${AUDIT_COMPLETION.total} audits`,
            }],
        }],
    }), [])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <LayoutDashboard size={22} />
                    </div>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Quality Auditor Dashboard</h2>
                        <p className='text-sm text-[#667085] mt-0.5'>
                            Provides an overview of all assigned audits and compliance statistics.
                        </p>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
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

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel title='Monthly Compliance Trend'>
                    <ReactECharts option={monthlyComplianceOption} style={{ height: 300 }} opts={{ renderer: 'svg' }} />
                </Panel>
                <Panel title='Department-wise Compliance'>
                    <ReactECharts option={departmentComplianceOption} style={{ height: 300 }} opts={{ renderer: 'svg' }} />
                </Panel>
                <Panel title='Observation Status'>
                    <ReactECharts option={observationStatusOption} style={{ height: 300 }} opts={{ renderer: 'svg' }} />
                </Panel>
                <Panel title='Audit Completion %'>
                    <ReactECharts option={auditCompletionOption} style={{ height: 300 }} opts={{ renderer: 'svg' }} />
                </Panel>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
                    <div className='flex items-center gap-2 mb-4'>
                        <Calendar size={20} className='text-[#515DEF]' />
                        <h3 className='text-lg font-semibold text-black'>Upcoming Audits Calendar</h3>
                    </div>
                    <div className='space-y-3'>
                        {UPCOMING_AUDITS_CALENDAR.map((item) => (
                            <div
                                key={item.auditId}
                                className='flex gap-4 p-3 rounded-xl border border-[#f2f4f7] hover:bg-[#f9f9ff] transition-colors'
                            >
                                <div className='shrink-0 text-center min-w-[52px] px-2 py-1.5 rounded-lg bg-[#515DEF]/10'>
                                    <p className='text-xs font-medium text-[#515DEF]'>{item.day}</p>
                                    <p className='text-sm font-semibold text-[#1E1E1E] mt-0.5'>{item.date.split('-')[0]}</p>
                                    <p className='text-[10px] text-[#667085]'>Jun</p>
                                </div>
                                <div className='min-w-0 flex-1'>
                                    <p className='text-sm font-semibold text-[#1E1E1E]'>{item.auditType}</p>
                                    <p className='text-xs text-[#667085] mt-0.5'>
                                        {item.auditId} · {item.department}
                                    </p>
                                    <p className='text-xs text-[#808080] mt-1'>{item.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
                    <h3 className='text-lg font-semibold text-black mb-4'>Recent Activity</h3>
                    <div className='space-y-4'>
                        {RECENT_ACTIVITY.map((item, index) => (
                            <div key={item.id} className='flex gap-3'>
                                <div className='flex flex-col items-center shrink-0'>
                                    <div className='size-2.5 rounded-full bg-[#515DEF] mt-1.5' />
                                    {index < RECENT_ACTIVITY.length - 1 && (
                                        <div className='w-px flex-1 bg-[#E0E0E0] mt-1 min-h-[40px]' />
                                    )}
                                </div>
                                <div className='pb-2 min-w-0 flex-1'>
                                    <div className='flex flex-wrap items-center gap-2 mb-1'>
                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap ${activityTypeBadgeColor[item.type]}`}>
                                            {item.type}
                                        </span>
                                        <span className='text-xs text-[#808080]'>{item.date} · {item.time}</span>
                                    </div>
                                    <p className='text-sm font-medium text-[#1E1E1E]'>{item.reference} — {item.department}</p>
                                    <p className='text-xs text-[#667085] mt-0.5'>{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Dashboard
