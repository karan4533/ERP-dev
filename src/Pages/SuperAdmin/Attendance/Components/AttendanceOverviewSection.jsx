import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { GraduationCap, UserCheck, Users, UserX } from 'lucide-react'

const CHART_COLORS = {
    primary: '#515DEF',
    present: '#4CAF50',
    absent: '#FF0000',
    late: '#FF9800',
    other: '#667085',
    palette: ['#4CAF50', '#FF0000', '#FF9800', '#2196F3', '#9C27B0', '#667085'],
}

const STATUS_COLORS = {
    Present: CHART_COLORS.present,
    Absent: CHART_COLORS.absent,
    Late: CHART_COLORS.late,
    Leave: '#2196F3',
    Permission: '#9C27B0',
    Holiday: '#1565C0',
    'Not marked': '#9E9E9E',
}

const isPresentLike = (status) => /^(present|late)$/i.test(String(status || '').trim())
const isAbsentLike = (status) => /^absent$/i.test(String(status || '').trim())

const StatCard = ({ title, value, description, icon: Icon, color }) => (
    <div className='bg-white rounded-2xl shadow-md p-5'>
        <div className='flex items-start justify-between gap-4'>
            <div>
                <p className='text-sm font-medium text-[#808080]'>{title}</p>
                <p className='text-3xl font-bold text-[#0C1E5B] mt-2'>{value}</p>
            </div>
            <span className={`flex size-11 items-center justify-center rounded-xl ${color}`}>
                <Icon size={22} />
            </span>
        </div>
        {description ? <p className='text-sm text-[#667085] mt-4'>{description}</p> : null}
    </div>
)

const Panel = ({ title, children, hint }) => (
    <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
        <div className='flex items-start justify-between gap-3 mb-4'>
            <h3 className='text-lg font-semibold text-black'>{title}</h3>
            {hint ? <span className='text-xs text-[#667085]'>{hint}</span> : null}
        </div>
        {children}
    </div>
)

const EmptyChart = ({ label = 'No attendance rows for this filter' }) => (
    <div className='h-[280px] flex items-center justify-center text-sm text-[#667085]'>{label}</div>
)

/**
 * Overview cards/charts for Super Admin attendance.
 * @param {object[]} records — filtered rows currently shown in the table
 * @param {string} groupKey — className | role
 * @param {{ labels: string[], rates: (number|null)[] } | null} dailyTrend — real day rates; never invent
 */
const AttendanceOverviewSection = ({
    records = [],
    groupKey,
    groupChartTitle,
    dailyTrend = null,
    trendTitle = 'Attendance trend (last 7 days)',
}) => {
    const summary = useMemo(() => {
        const total = records.length
        const present = records.filter((record) => isPresentLike(record.status)).length
        const absent = records.filter((record) => isAbsentLike(record.status)).length
        const other = Math.max(0, total - present - absent)
        const attendanceRate = total ? Math.round((present / total) * 100) : 0
        return { total, present, absent, other, attendanceRate }
    }, [records])

    const statusPieOption = useMemo(() => {
        const counts = new Map()
        records.forEach((record) => {
            const key = String(record.status || 'Unknown').trim() || 'Unknown'
            counts.set(key, (counts.get(key) || 0) + 1)
        })
        const data = [...counts.entries()].map(([name, value], index) => ({
            name,
            value,
            itemStyle: {
                color: STATUS_COLORS[name] || CHART_COLORS.palette[index % CHART_COLORS.palette.length],
            },
        }))
        return {
            tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
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
                data,
            }],
        }
    }, [records])

    const groupBarOption = useMemo(() => {
        const grouped = records.reduce((acc, record) => {
            const key = record[groupKey] ?? 'Unknown'
            if (!acc[key]) acc[key] = { total: 0, present: 0 }
            acc[key].total += 1
            if (isPresentLike(record.status)) acc[key].present += 1
            return acc
        }, {})

        const labels = Object.keys(grouped).sort()
        const rates = labels.map((label) => {
            const item = grouped[label]
            return item.total ? Math.round((item.present / item.total) * 100) : 0
        })

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params) => {
                    const item = params[0]
                    const group = grouped[item.name]
                    return `${item.name}<br/>Rate: ${item.value}%<br/>Present/Late: ${group.present} / ${group.total}`
                },
            },
            grid: { left: 48, right: 24, top: 16, bottom: 48 },
            xAxis: {
                type: 'category',
                data: labels,
                axisLabel: { color: '#667085', fontSize: 10, rotate: labels.length > 5 ? 25 : 0 },
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
                data: rates,
                barWidth: 28,
                itemStyle: {
                    color: CHART_COLORS.primary,
                    borderRadius: [4, 4, 0, 0],
                },
                label: {
                    show: true,
                    position: 'top',
                    color: '#667085',
                    fontSize: 11,
                    formatter: '{c}%',
                },
            }],
        }
    }, [records, groupKey])

    const trendOption = useMemo(() => {
        const labels = dailyTrend?.labels || []
        const rates = dailyTrend?.rates || []
        if (!labels.length) return null
        return {
            tooltip: {
                trigger: 'axis',
                formatter: (params) => {
                    const item = params[0]
                    if (item.value == null || Number.isNaN(item.value)) return `${item.name}: no marks`
                    return `${item.name}: ${item.value}%`
                },
            },
            grid: { left: 48, right: 24, top: 24, bottom: 32 },
            xAxis: {
                type: 'category',
                data: labels,
                axisLine: { lineStyle: { color: '#E0E0E0' } },
                axisLabel: { color: '#667085', fontSize: 11 },
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: 100,
                axisLabel: { color: '#667085', fontSize: 11, formatter: '{value}%' },
                splitLine: { lineStyle: { color: '#F2F4F7' } },
            },
            series: [{
                name: trendTitle,
                type: 'line',
                smooth: true,
                connectNulls: false,
                data: rates,
                areaStyle: { color: 'rgba(81, 93, 239, 0.12)' },
                lineStyle: { color: CHART_COLORS.primary, width: 2 },
                itemStyle: { color: CHART_COLORS.primary },
            }],
        }
    }, [dailyTrend, trendTitle])

    const hasTrendPoints = Array.isArray(dailyTrend?.rates) && dailyTrend.rates.some((n) => n != null)

    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                <StatCard
                    title='Total'
                    value={summary.total}
                    description='Records in current filter / date'
                    icon={Users}
                    color='bg-[#515DEF]/10 text-[#515DEF]'
                />
                <StatCard
                    title='Present / Late'
                    value={summary.present}
                    description='Counted as attended'
                    icon={UserCheck}
                    color='bg-[#4CAF50]/10 text-[#4CAF50]'
                />
                <StatCard
                    title='Absent'
                    value={summary.absent}
                    description={summary.other ? `${summary.other} other statuses` : 'Marked absent'}
                    icon={UserX}
                    color='bg-[#FF0000]/10 text-[#FF0000]'
                />
                <StatCard
                    title='Attendance Rate'
                    value={summary.total ? `${summary.attendanceRate}%` : '—'}
                    description='Present+Late ÷ total in view'
                    icon={GraduationCap}
                    color='bg-[#2196F3]/10 text-[#2196F3]'
                />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <Panel title='Status mix' hint='From filtered rows'>
                    {records.length
                        ? <ReactECharts option={statusPieOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
                        : <EmptyChart />}
                </Panel>
                <Panel title={groupChartTitle} hint='From filtered rows'>
                    {records.length
                        ? <ReactECharts option={groupBarOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
                        : <EmptyChart />}
                </Panel>
            </div>

            <Panel title={trendTitle} hint='Live marks only — gaps mean no rows that day'>
                {hasTrendPoints && trendOption
                    ? <ReactECharts option={trendOption} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
                    : <EmptyChart label='No attendance marks in the last 7 days yet' />}
            </Panel>
        </div>
    )
}

export default AttendanceOverviewSection
