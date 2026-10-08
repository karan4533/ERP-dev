import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    MoreVertical,
    Phone,
    Search,
    UserRound,
    Wallet,
} from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import {
    DEFAULTER_CLASSES,
    DEFAULTERS_REGISTER,
    DEFAULTERS_SUMMARY,
    OUTSTANDING_BY_GRADE,
    OVERDUE_AGING,
    OVERDUE_RANGES,
    RECOVERY_TREND,
    SEVERITY_FILTERS,
    defaulterSeverityBadgeColor,
    defaulterStatusBadgeColor,
} from '../feesManagementData'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const ICON_TONES = {
    info: 'bg-[#515DEF1A] text-[#515DEF]',
    success: 'bg-[#4CAF501A] text-[#4CAF50]',
    danger: 'bg-[#FF57221A] text-[#FF5722]',
}

const SUMMARY_ICONS = {
    'Total Defaulters': UserRound,
    'Total Outstanding': Wallet,
    'Critical Cases': AlertTriangle,
    'Reminders Sent': CheckCircle2,
}

const Panel = ({ title, children, action }) => (
    <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
        <div className='flex justify-between items-center mb-4'>
            <h3 className='text-base font-semibold text-[#1E1E1E]'>{title}</h3>
            {action}
        </div>
        {children}
    </div>
)

const DefaultersTab = ({ exportModal, setExportModal }) => {
    const { installments, students } = useFinance()
    const liveDefaulters = students.map((student) => {
        const overdue = installments.filter((row) => row.studentId === student.id && (row.status === 'OVERDUE' || row.status === 'UNPAID' || row.status === 'PARTIALLY_PAID') && row.balanceAmount > 0)
        if (!overdue.length) return null
        const amount = overdue.reduce((sum, row) => sum + row.balanceAmount, 0)
        const worst = overdue.some((row) => row.status === 'OVERDUE') ? 'OVERDUE' : overdue.some((row) => row.status === 'PARTIALLY_PAID') ? 'Partially Paid' : 'Pending'
        return {
            id: `LIVE-${student.id}`,
            student: student.name,
            studentId: student.admissionNo,
            initials: student.initials,
            avatarColor: 'bg-[#515DEF]',
            className: `${student.className}-${student.section}`,
            dueSince: overdue[0].dueDate,
            daysOverdue: worst,
            amount: formatCurrency(amount),
            feeType: [...new Set(overdue.map((row) => row.feeHead))].join(', '),
            severity: worst === 'OVERDUE' ? 'CRITICAL' : worst === 'Partially Paid' ? 'MODERATE' : 'HIGH',
            status: worst === 'OVERDUE' ? 'FOLLOW-UP PENDING' : 'PARTIAL PAYMENT',
        }
    }).filter(Boolean)
    const maxOutstanding = Math.max(...OUTSTANDING_BY_GRADE.map((item) => item.value))

    const overdueAgingOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {c}' },
        series: [{
            type: 'pie',
            radius: ['58%', '78%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            label: { show: false },
            labelLine: { show: false },
            data: OVERDUE_AGING.map((item) => ({
                value: item.value,
                name: item.label,
                itemStyle: { color: item.color },
            })),
        }],
        graphic: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
                text: '30+ DAYS\n47',
                textAlign: 'center',
                fill: '#1E1E1E',
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 18,
                fontFamily: 'Inter',
            },
        }],
    }), [])

    const recoveryTrendOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: {
            data: ['Recovered', 'Outstanding'],
            bottom: 0,
            textStyle: { color: '#667085', fontSize: 11 },
        },
        grid: { left: 40, right: 16, top: 16, bottom: 48 },
        xAxis: {
            type: 'category',
            data: RECOVERY_TREND.labels,
            axisLine: { lineStyle: { color: '#E0E0E0' } },
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#667085', fontSize: 11, formatter: (v) => `₹${v}L` },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [
            {
                name: 'Recovered',
                type: 'bar',
                stack: 'total',
                barWidth: 28,
                data: RECOVERY_TREND.recovered,
                itemStyle: { color: '#4CAF50', borderRadius: [0, 0, 0, 0] },
            },
            {
                name: 'Outstanding',
                type: 'bar',
                stack: 'total',
                data: RECOVERY_TREND.outstanding,
                itemStyle: { color: '#B4E4C4', borderRadius: [4, 4, 0, 0] },
            },
        ],
    }), [])

    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                {DEFAULTERS_SUMMARY.map((card) => {
                    const Icon = SUMMARY_ICONS[card.label] ?? UserRound
                    return (
                        <div key={card.label} className='bg-white rounded-2xl shadow-md p-4'>
                            <div className='flex items-start justify-between gap-2 mb-3'>
                                <div className={`p-2 rounded-xl ${ICON_TONES[card.iconTone]}`}>
                                    <Icon size={18} />
                                </div>
                                {card.trend && (
                                    <span className='text-xs font-semibold text-[#FF5722] bg-[#FF57221A] px-2 py-0.5 rounded-full'>
                                        {card.trend}
                                    </span>
                                )}
                                {card.badge && (
                                    <span className='text-[10px] font-semibold text-[#FF5722] bg-[#FF57221A] px-2 py-0.5 rounded-full'>
                                        {card.badge}
                                    </span>
                                )}
                            </div>
                            <p className='text-xs text-[#808080]'>{card.label}</p>
                            <p className='text-xl font-semibold text-[#1E1E1E] mt-1'>{card.value}</p>
                            {card.sub && <p className='text-xs text-[#667085] mt-1'>{card.sub}</p>}
                        </div>
                    )
                })}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <Panel
                    title='Outstanding Amount by Grade'
                    action={(
                        <button type='button' className='text-[#667085] hover:text-[#515DEF] cursor-pointer' aria-label='More options'>
                            <MoreVertical size={16} />
                        </button>
                    )}
                >
                    <div className='space-y-4'>
                        {OUTSTANDING_BY_GRADE.map((item) => (
                            <div key={item.grade} className='flex items-center gap-3'>
                                <span className='text-sm text-[#667085] w-16 shrink-0'>{item.grade.replace('Grade ', 'G')}</span>
                                <div className='flex-1 h-2 rounded-full bg-[#EDEEF5] overflow-hidden'>
                                    <div
                                        className='h-full rounded-full bg-[#515DEF]'
                                        style={{ width: `${(item.value / maxOutstanding) * 100}%` }}
                                    />
                                </div>
                                <span className='text-sm font-semibold text-[#1E1E1E] w-12 text-right shrink-0'>{item.amount}</span>
                            </div>
                        ))}
                    </div>
                </Panel>

                <Panel title='Overdue Aging Analysis'>
                    <ReactECharts option={overdueAgingOption} style={{ height: 180 }} opts={{ renderer: 'svg' }} />
                    <div className='grid grid-cols-2 gap-2 mt-2'>
                        {OVERDUE_AGING.map((item) => (
                            <div key={item.label} className='flex items-center gap-2 text-xs text-[#667085]'>
                                <span className='size-2 rounded-full shrink-0' style={{ backgroundColor: item.color }} />
                                {item.label}
                            </div>
                        ))}
                    </div>
                </Panel>

                <Panel
                    title='Recovery Trend'
                    action={(
                        <select className='text-xs border border-[#D9D9D9] rounded-md px-2 py-1 text-[#667085]'>
                            <option>Last 6 Months</option>
                        </select>
                    )}
                >
                    <ReactECharts option={recoveryTrendOption} style={{ height: 220 }} opts={{ renderer: 'svg' }} />
                </Panel>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4'>
                    <h3 className='text-base font-semibold text-[#1E1E1E]'>Defaulters Register</h3>
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <div className='relative min-w-[180px]'>
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                            <input
                                type='text'
                                placeholder='Student name...'
                                className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                            />
                        </div>
                        <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'>
                            {DEFAULTER_CLASSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                            {OVERDUE_RANGES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[110px]'>
                            {SEVERITY_FILTERS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <button
                            type='button'
                            className='size-10 flex items-center justify-center border border-[#D9D9D9] rounded-md text-[#667085] hover:text-[#515DEF] hover:border-[#515DEF] transition-colors cursor-pointer'
                            aria-label='Filter defaulters'
                        >
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Student Name</th>
                                <th className={thClass}>Class</th>
                                <th className={thClass}>Due Since</th>
                                <th className={thClass}>Amount</th>
                                <th className={thClass}>Severity</th>
                                <th className={thClass}>Status</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...liveDefaulters, ...DEFAULTERS_REGISTER].map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg`}>
                                        <div className='flex items-center gap-3'>
                                            <div className={`size-9 rounded-full ${row.avatarColor} text-white text-xs font-semibold flex items-center justify-center shrink-0`}>
                                                {row.initials}
                                            </div>
                                            <div>
                                                <p className='font-medium text-[#1E1E1E]'>{row.student}</p>
                                                <p className='text-xs'>{row.studentId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={tdClass}>{row.className}</td>
                                    <td className={tdClass}>
                                        <p>{row.dueSince}</p>
                                        <p className='text-xs font-semibold text-[#FF5722]'>{row.daysOverdue}</p>
                                    </td>
                                    <td className={tdClass}>
                                        <p className='font-semibold text-[#1E1E1E]'>{row.amount}</p>
                                        <p className='text-xs'>{row.feeType}</p>
                                    </td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${defaulterSeverityBadgeColor[row.severity]}`}>
                                            {row.severity}
                                        </span>
                                    </td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${defaulterStatusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <div className='flex items-center gap-2'>
                                            <button type='button' className='p-1.5 rounded-md hover:bg-[#515DEF1A] text-[#515DEF] cursor-pointer' aria-label='View defaulter'>
                                                <Eye size={16} />
                                            </button>
                                            <button type='button' className='p-1.5 rounded-md hover:bg-[#4CAF501A] text-[#4CAF50] cursor-pointer' aria-label='Contact defaulter'>
                                                <Phone size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-2'>
                    <p className='text-sm text-[#667085]'>Showing 1-10 of 218 defaulters</p>
                    <div className='flex items-center gap-2'>
                        <button type='button' className='size-8 flex items-center justify-center rounded-md border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                            <ChevronLeft size={16} />
                        </button>
                        {[1, 2, 3].map((page) => (
                            <button
                                key={page}
                                type='button'
                                className={`size-8 flex items-center justify-center rounded-md text-sm font-medium cursor-pointer transition-colors ${
                                    page === 1
                                        ? 'bg-[#515DEF] text-white'
                                        : 'border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button type='button' className='size-8 flex items-center justify-center rounded-md border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </div>
    )
}

export default DefaultersTab
