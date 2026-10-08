import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import {
    AlertTriangle,
    Ban,
    ChevronLeft,
    ChevronRight,
    FileText,
    Filter,
    MoreVertical,
    Receipt,
    Search,
    TrendingUp,
} from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency } from '../../financeDomain/financeHelpers'
import {
    RECEIPT_ACTIVITY_LOG,
    RECEIPT_CLASSES,
    RECEIPT_DATE_RANGES,
    RECEIPT_GENERATION_TREND,
    RECEIPT_PAYMENT_FILTERS,
    RECEIPT_PAYMENT_MODES,
    RECEIPT_SUMMARY,
    RECEIPTS_REGISTER,
    REPRINT_REQUESTS,
    receiptStatusBadgeColor,
    reprintStatusBadgeColor,
} from '../feesManagementData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const ICON_TONES = {
    info: 'bg-[#515DEF1A] text-[#515DEF]',
    success: 'bg-[#4CAF501A] text-[#4CAF50]',
    warning: 'bg-[#FF98001A] text-[#FF9800]',
    danger: 'bg-[#FF57221A] text-[#FF5722]',
}

const SUMMARY_ICONS = {
    'Total Receipts': Receipt,
    'Generated Today': FileText,
    'Cancelled Receipts': Ban,
    'Reprint Requests': AlertTriangle,
}

const ACTIVITY_DOT = {
    success: 'bg-[#4CAF50]',
    info: 'bg-[#515DEF]',
    danger: 'bg-[#FF5722]',
}

const Panel = ({ title, action, children, className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-md p-4 h-full ${className}`}>
        <div className='flex justify-between items-center mb-4 gap-3'>
            <h3 className='text-base font-semibold text-[#1E1E1E]'>{title}</h3>
            {action}
        </div>
        {children}
    </div>
)

const ReceiptManagementTab = ({ exportModal, setExportModal }) => {
    const [paymentPeriod, setPaymentPeriod] = useState('Monthly')
    const { receipts, students } = useFinance()
    const liveRows = receipts.map((item) => {
        const student = students.find((row) => row.id === item.studentId)
        return {
            id: item.id,
            receiptNo: item.receiptNo,
            student: student?.name ?? 'Student',
            studentId: student?.admissionNo ?? item.studentId,
            initials: student?.initials ?? 'ST',
            avatarColor: 'bg-[#515DEF]',
            className: item.className || `${student?.className ?? ''}-${student?.section ?? ''}`,
            feeHeads: (item.feeHeads || []).join(', '),
            amount: formatCurrency(item.amountPaid),
            status: item.status === 'Issued' ? 'Generated' : item.status,
        }
    })

    const generationTrendOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 36, right: 16, top: 16, bottom: 32 },
        xAxis: {
            type: 'category',
            data: RECEIPT_GENERATION_TREND.labels,
            axisLine: { lineStyle: { color: '#E0E0E0' } },
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#667085', fontSize: 11 },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [{
            type: 'bar',
            data: RECEIPT_GENERATION_TREND.values.map((value, index) => ({
                value,
                itemStyle: {
                    color: index === RECEIPT_GENERATION_TREND.values.length - 1 ? '#515DEF' : '#B4C4FF',
                    borderRadius: [4, 4, 0, 0],
                },
            })),
            barWidth: 24,
        }],
    }), [])

    const paymentModesOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
        series: [{
            type: 'pie',
            radius: ['58%', '78%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            label: { show: false },
            labelLine: { show: false },
            data: RECEIPT_PAYMENT_MODES.map((mode) => ({
                value: mode.percent,
                name: mode.name,
                itemStyle: { color: mode.color },
            })),
        }],
        graphic: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
                text: '1,022\nTOTAL',
                textAlign: 'center',
                fill: '#1E1E1E',
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 18,
                fontFamily: 'Inter',
            },
        }],
    }), [])

    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                {RECEIPT_SUMMARY.map((card) => {
                    const Icon = SUMMARY_ICONS[card.label] ?? Receipt
                    return (
                        <div key={card.label} className='bg-white rounded-2xl shadow-md p-4'>
                            <div className='flex items-start justify-between gap-2 mb-3'>
                                <div className={`p-2 rounded-xl ${ICON_TONES[card.iconTone]}`}>
                                    <Icon size={18} />
                                </div>
                                {card.trend && (
                                    <span className='inline-flex items-center gap-1 text-xs font-semibold text-[#4CAF50] bg-[#4CAF501A] px-2 py-0.5 rounded-full'>
                                        <TrendingUp size={12} />
                                        {card.trend}
                                    </span>
                                )}
                                {card.badge && (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                        card.badgeTone === 'success'
                                            ? 'bg-[#4CAF501A] text-[#4CAF50]'
                                            : card.badgeTone === 'warning'
                                                ? 'bg-[#FF98001A] text-[#FF9800]'
                                                : 'bg-[#FF57221A] text-[#FF5722]'
                                    }`}>
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

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel
                    title='Receipt Generation Trend'
                    action={(
                        <select className='text-xs border border-[#D9D9D9] rounded-md px-2 py-1 text-[#667085]'>
                            <option>Current Month</option>
                        </select>
                    )}
                >
                    <ReactECharts option={generationTrendOption} style={{ height: 240 }} opts={{ renderer: 'svg' }} />
                </Panel>

                <Panel
                    title='Payment Modes'
                    action={(
                        <div className='flex items-center gap-1'>
                            {['Daily', 'Weekly', 'Monthly'].map((period) => (
                                <button
                                    key={period}
                                    type='button'
                                    onClick={() => setPaymentPeriod(period)}
                                    className={`text-xs px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                                        paymentPeriod === period
                                            ? 'bg-[#515DEF] text-white'
                                            : 'text-[#667085] hover:bg-[#515DEF1A] hover:text-[#515DEF]'
                                    }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    )}
                >
                    <div className='flex items-center gap-4'>
                        <div className='flex-1 min-w-0'>
                            <ReactECharts option={paymentModesOption} style={{ height: 220 }} opts={{ renderer: 'svg' }} />
                        </div>
                        <div className='space-y-3 shrink-0 pr-2'>
                            {RECEIPT_PAYMENT_MODES.map((mode) => (
                                <div key={mode.name} className='flex items-center gap-2 text-sm'>
                                    <span className='size-2.5 rounded-full shrink-0' style={{ backgroundColor: mode.color }} />
                                    <span className='text-[#667085]'>{mode.name}</span>
                                    <span className='font-semibold text-[#1E1E1E]'>{mode.percent}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Panel>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4'>
                    <h3 className='text-base font-semibold text-[#1E1E1E]'>Receipt Register</h3>
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <div className='relative min-w-[180px]'>
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                            <input
                                type='text'
                                placeholder='Filter student...'
                                className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                            />
                        </div>
                        <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'>
                            {RECEIPT_CLASSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'>
                            {RECEIPT_DATE_RANGES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                            {RECEIPT_PAYMENT_FILTERS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <button
                            type='button'
                            className='size-10 flex items-center justify-center border border-[#D9D9D9] rounded-md text-[#667085] hover:text-[#515DEF] hover:border-[#515DEF] transition-colors cursor-pointer'
                            aria-label='Filter receipts'
                        >
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Receipt #</th>
                                <th className={thClass}>Student Name</th>
                                <th className={thClass}>Class</th>
                                <th className={thClass}>Fee Heads</th>
                                <th className={thClass}>Amount</th>
                                <th className={thClass}>Status</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...liveRows, ...RECEIPTS_REGISTER].map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg`}>
                                        <button type='button' className='text-[#515DEF] font-medium hover:underline cursor-pointer'>
                                            {row.receiptNo}
                                        </button>
                                    </td>
                                    <td className={tdClass}>
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
                                    <td className={tdClass}>{row.feeHeads}</td>
                                    <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.amount}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${receiptStatusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <button type='button' className='p-1.5 rounded-md hover:bg-[#515DEF1A] text-[#667085] hover:text-[#515DEF] cursor-pointer' aria-label='Receipt actions'>
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-2'>
                    <p className='text-sm text-[#667085]'>Showing 1 to 10 of 1,022 receipts</p>
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

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel
                    title='Reprint Requests'
                    action={(
                        <button type='button' className='text-sm font-medium text-[#515DEF] hover:opacity-80 cursor-pointer'>
                            View All Requests
                        </button>
                    )}
                >
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                                <tr>
                                    <th className={`${thClass} rounded-s-lg`}>Request ID</th>
                                    <th className={thClass}>Receipt No</th>
                                    <th className={thClass}>Reason</th>
                                    <th className={thClass}>Status</th>
                                    <th className={`${thClass} rounded-e-lg`}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {REPRINT_REQUESTS.map((row) => (
                                    <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>{row.id}</td>
                                        <td className={`${tdClass} text-[#515DEF]`}>{row.receiptNo}</td>
                                        <td className={tdClass}>{row.reason}</td>
                                        <td className={tdClass}>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${reprintStatusBadgeColor[row.status]}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className={`${tdClass} rounded-e-lg`}>
                                            {row.status === 'PENDING' ? (
                                                <button type='button' className='text-sm font-medium text-[#515DEF] hover:underline cursor-pointer'>
                                                    Approve
                                                </button>
                                            ) : (
                                                <span className='text-xs text-[#667085]'>—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>

                <Panel title='Recent Activity Log'>
                    <div className='space-y-4'>
                        {RECEIPT_ACTIVITY_LOG.map((item, index) => (
                            <div key={item.id} className='flex gap-3'>
                                <div className='flex flex-col items-center shrink-0'>
                                    <span className={`size-2.5 rounded-full mt-1.5 ${ACTIVITY_DOT[item.tone]}`} />
                                    {index < RECEIPT_ACTIVITY_LOG.length - 1 && (
                                        <span className='w-px flex-1 bg-[#E2E8F0] mt-1 min-h-[24px]' />
                                    )}
                                </div>
                                <div className='pb-1'>
                                    <p className='text-sm text-[#1E1E1E]'>{item.message}</p>
                                    <p className='text-xs text-[#667085] mt-1'>
                                        {item.time}
                                        {' · '}
                                        {item.actor}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </div>
    )
}

export default ReceiptManagementTab
