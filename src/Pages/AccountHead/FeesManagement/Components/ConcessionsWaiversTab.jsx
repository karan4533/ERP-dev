import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    MoreVertical,
    Pencil,
    RefreshCw,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import ConcessionDetailsOffcanvas from './ConcessionDetailsOffcanvas'
import {
    CONCESSION_DISTRIBUTION,
    CONCESSION_TYPES,
    CONCESSIONS_REGISTER,
    CONCESSIONS_SUMMARY,
    MONTHLY_CONCESSION_TREND,
    concessionDedBadgeColor,
    concessionStatusBadgeColor,
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
    'Total Concessions': Wallet,
    Scholarships: GraduationCap,
    'Sibling Discounts': Users,
    'Special Waivers': AlertCircle,
}

const Panel = ({ title, subtitle, children, action, className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-md p-4 h-full ${className}`}>
        <div className='flex justify-between items-start gap-3 mb-4'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E]'>{title}</h3>
                {subtitle && <p className='text-xs text-[#667085] mt-0.5'>{subtitle}</p>}
            </div>
            {action}
        </div>
        {children}
    </div>
)

const ConcessionsWaiversTab = ({ exportModal, setExportModal }) => {
    const [selectedConcession, setSelectedConcession] = useState(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const { concessions, students, feeCategories, getStudentSummary } = useFinance()

    const liveConcessionRows = concessions.map((item) => {
        const student = students.find((row) => row.id === item.studentId)
        const category = feeCategories.find((row) => row.id === item.feeCategoryId)
        const summary = student ? getStudentSummary(student.id, item.academicYear) : null
        return {
            id: item.id,
            student: student?.name ?? 'Student',
            studentId: student?.admissionNo ?? item.studentId,
            className: student ? `${student.className}-${student.section}` : '—',
            avatarColor: 'bg-[#515DEF]',
            concessionType: item.type,
            feeHead: category?.name || item.feeCategoryId,
            originalAmount: formatCurrency(summary?.totalFee || 0),
            deduction: formatCurrency(item.amount),
            dedPercent: summary?.totalFee ? `${Math.round((item.amount / summary.totalFee) * 100)}%` : '—',
            dedTone: 'success',
            netFee: formatCurrency(summary?.netPayable || 0),
            status: item.status,
            rollNumber: student?.rollNo,
            gradeSection: student ? `${student.className} - ${student.section}` : '—',
            policyId: item.id,
            approvalDate: 'Live',
            totalSavings: `-${formatCurrency(item.amount)}`,
            documents: [],
        }
    })
    const concessionRows = [...liveConcessionRows, ...CONCESSIONS_REGISTER]

    const openDetails = (row) => {
        setSelectedConcession(row)
        setDetailsOpen(true)
    }

    const closeDetails = () => {
        setDetailsOpen(false)
    }

    const monthlyTrendOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        legend: {
            data: ['Current Year', 'Previous Year'],
            right: 0,
            top: 0,
            textStyle: { color: '#667085', fontSize: 11 },
        },
        grid: { left: 40, right: 16, top: 36, bottom: 32 },
        xAxis: {
            type: 'category',
            data: MONTHLY_CONCESSION_TREND.labels,
            axisLine: { lineStyle: { color: '#E0E0E0' } },
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#667085', fontSize: 11, formatter: (v) => `₹${v}k` },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [
            {
                name: 'Current Year',
                type: 'line',
                smooth: true,
                data: MONTHLY_CONCESSION_TREND.currentYear,
                areaStyle: { color: 'rgba(81, 93, 239, 0.12)' },
                lineStyle: { color: '#515DEF', width: 2 },
                itemStyle: { color: '#515DEF' },
                symbol: 'circle',
                symbolSize: 6,
            },
            {
                name: 'Previous Year',
                type: 'line',
                smooth: true,
                data: MONTHLY_CONCESSION_TREND.previousYear,
                lineStyle: { color: '#D9D9D9', width: 2, type: 'dashed' },
                itemStyle: { color: '#D9D9D9' },
                symbol: 'circle',
                symbolSize: 5,
            },
        ],
    }), [])

    const distributionOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {c}k' },
        series: [{
            type: 'pie',
            radius: ['58%', '78%'],
            center: ['50%', '42%'],
            avoidLabelOverlap: true,
            label: { show: false },
            labelLine: { show: false },
            data: CONCESSION_DISTRIBUTION.map((item) => ({
                value: item.value,
                name: item.name,
                itemStyle: { color: item.color },
            })),
        }],
        graphic: [{
            type: 'text',
            left: 'center',
            top: '32%',
            style: {
                text: '87\nTOTAL',
                textAlign: 'center',
                fill: '#1E1E1E',
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 20,
                fontFamily: 'Inter',
            },
        }],
    }), [])

    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                {CONCESSIONS_SUMMARY.map((card) => {
                    const Icon = SUMMARY_ICONS[card.label] ?? Wallet
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
                                    <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FF57221A] text-[#FF5722]'>
                                        {card.badge}
                                    </span>
                                )}
                            </div>
                            <p className='text-xs text-[#808080]'>{card.label}</p>
                            <p className='text-xl font-semibold text-[#1E1E1E] mt-1'>{card.value}</p>
                            {card.sub && (
                                <p className={`text-xs mt-1 ${
                                    card.subTone === 'danger' ? 'text-[#FF5722] font-medium' : 'text-[#667085]'
                                }`}>
                                    {card.sub}
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <Panel title='Monthly Concession Trend' className='lg:col-span-2'>
                    <ReactECharts option={monthlyTrendOption} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
                </Panel>

                <Panel title='Concession Distribution'>
                    <ReactECharts option={distributionOption} style={{ height: 180 }} opts={{ renderer: 'svg' }} />
                    <div className='space-y-2 mt-2'>
                        {CONCESSION_DISTRIBUTION.map((item) => (
                            <div key={item.name} className='flex items-center justify-between text-sm'>
                                <div className='flex items-center gap-2 text-[#667085]'>
                                    <span className='size-2.5 rounded-full shrink-0' style={{ backgroundColor: item.color }} />
                                    {item.name}
                                </div>
                                <span className='font-semibold text-[#1E1E1E]'>{item.amount}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-4'>
                    <div>
                        <h3 className='text-base font-semibold text-[#1E1E1E]'>Concessions Register</h3>
                        <p className='text-xs text-[#667085] mt-0.5'>
                            Real-time view of all approved and pending fee deductions.
                        </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-3'>
                        <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                            {CONCESSION_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <button
                            type='button'
                            className='size-10 flex items-center justify-center border border-[#D9D9D9] rounded-md text-[#667085] hover:text-[#515DEF] hover:border-[#515DEF] transition-colors cursor-pointer'
                            aria-label='Refresh register'
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            type='button'
                            className='size-10 flex items-center justify-center border border-[#D9D9D9] rounded-md text-[#667085] hover:text-[#515DEF] hover:border-[#515DEF] transition-colors cursor-pointer'
                            aria-label='More options'
                        >
                            <MoreVertical size={16} />
                        </button>
                    </div>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Student Details</th>
                                <th className={thClass}>Concession Type</th>
                                <th className={thClass}>Fee Head</th>
                                <th className={thClass}>Original Amt</th>
                                <th className={thClass}>Ded %</th>
                                <th className={thClass}>Net Fee</th>
                                <th className={thClass}>Status</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {concessionRows.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg`}>
                                        <div className='flex items-center gap-3'>
                                            <div className={`size-9 rounded-full ${row.avatarColor} text-white text-xs font-semibold flex items-center justify-center shrink-0 overflow-hidden`}>
                                                {row.student.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className='font-medium text-[#1E1E1E]'>{row.student}</p>
                                                <p className='text-xs'>{row.studentId} · {row.className}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={tdClass}>{row.concessionType}</td>
                                    <td className={tdClass}>{row.feeHead}</td>
                                    <td className={tdClass}>
                                        <p className='font-medium text-[#1E1E1E]'>{row.originalAmount}</p>
                                        <p className='text-xs text-[#FF5722]'>-{row.deduction}</p>
                                    </td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${concessionDedBadgeColor[row.dedTone]}`}>
                                            {row.dedPercent}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.netFee}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${concessionStatusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <button
                                            type='button'
                                            onClick={() => openDetails(row)}
                                            className='p-1.5 rounded-md hover:bg-[#EDEEF5] text-[#667085] hover:text-[#515DEF] cursor-pointer'
                                            aria-label='View concession details'
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-2'>
                    <p className='text-sm text-[#667085]'>Showing 1 to 3 of 87 records</p>
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

            <ConcessionDetailsOffcanvas
                isOpen={detailsOpen}
                onClose={closeDetails}
                concession={selectedConcession}
            />
        </div>
    )
}

export default ConcessionsWaiversTab
