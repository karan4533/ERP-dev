import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { AlertTriangle, Search, UserRound, Wallet, Clock } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import { defaulterSeverityBadgeColor, defaulterStatusBadgeColor } from '../feesManagementData'
import {
    buildDefaulterRows,
    matchesSearch,
    outstandingByGrade,
    overdueAging,
    summarizeDefaulters,
} from '../feeLiveStats'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'
const AGING_COLORS = ['#B4C4FF', '#FF9800', '#FF7043', '#FF5722', '#B71C1C']

const Panel = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
        <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>{title}</h3>
        {children}
    </div>
)

const SummaryCard = ({ icon: Icon, tone, label, value, sub }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <div className={`p-2 rounded-xl inline-flex mb-3 ${tone}`}>
            <Icon size={18} />
        </div>
        <p className='text-xs text-[#808080]'>{label}</p>
        <p className='text-xl font-semibold text-[#1E1E1E] mt-1'>{value}</p>
        {sub && <p className='text-xs text-[#667085] mt-1'>{sub}</p>}
    </div>
)

const EXPORT_COLUMNS = [
    { key: 'student', label: 'Student' },
    { key: 'studentId', label: 'Admission No' },
    { key: 'className', label: 'Class' },
    { key: 'dueSince', label: 'Due Since' },
    { key: 'daysOverdue', label: 'Days Overdue' },
    { key: 'outstandingLabel', label: 'Outstanding' },
    { key: 'feeType', label: 'Fee Heads' },
    { key: 'severity', label: 'Severity' },
    { key: 'status', label: 'Status' },
]

const DefaultersTab = ({ exportModal, setExportModal }) => {
    const { installments, students, financeStatus, financeError } = useFinance()
    const [search, setSearch] = useState('')
    const [grade, setGrade] = useState('')
    const [severity, setSeverity] = useState('')

    const rows = useMemo(
        () => buildDefaulterRows(students, installments).map((row) => ({ ...row, outstandingLabel: formatCurrency(row.outstanding) })),
        [students, installments],
    )
    const summary = useMemo(() => summarizeDefaulters(rows), [rows])
    const byGrade = useMemo(() => outstandingByGrade(rows), [rows])
    const aging = useMemo(() => overdueAging(rows), [rows])
    const grades = useMemo(() => [...new Set(rows.map((row) => row.grade).filter(Boolean))].sort(), [rows])
    const maxOutstanding = Math.max(1, ...byGrade.map((item) => item.value))

    const filtered = useMemo(
        () => rows.filter((row) => {
            if (grade && row.grade !== grade) return false
            if (severity && row.severity !== severity) return false
            return matchesSearch(row, search, ['student', 'studentId', 'className', 'feeType'])
        }),
        [rows, grade, severity, search],
    )

    const loading = financeStatus === 'loading'
    const failed = financeStatus === 'error'

    const agingOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {c} student(s)' },
        series: [{
            type: 'pie',
            radius: ['58%', '78%'],
            label: { show: false },
            labelLine: { show: false },
            data: aging.map((bucket, index) => ({ value: bucket.value, name: bucket.label, itemStyle: { color: AGING_COLORS[index] } })),
        }],
    }), [aging])

    return (
        <div className='space-y-6'>
            {failed && (
                <div className='bg-[#FEF3F2] border border-[#FDA29B] text-[#B42318] rounded-xl px-4 py-3 text-sm'>
                    Could not load finance records from the server{financeError ? `: ${financeError}` : ''}. Defaulter figures are unavailable until it loads.
                </div>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                <SummaryCard icon={UserRound} tone='bg-[#515DEF1A] text-[#515DEF]' label='Total Defaulters' value={summary.count} sub='Students with an open balance' />
                <SummaryCard icon={Wallet} tone='bg-[#FF57221A] text-[#FF5722]' label='Total Outstanding' value={formatCurrency(summary.outstanding)} />
                <SummaryCard icon={Clock} tone='bg-[#FF98001A] text-[#FF9800]' label='Past Due' value={summary.overdue} sub='Earliest due date has passed' />
                <SummaryCard icon={AlertTriangle} tone='bg-[#FF57221A] text-[#FF5722]' label='Critical Cases' value={summary.critical} sub='More than 60 days overdue' />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel title='Outstanding Amount by Grade'>
                    {byGrade.length === 0 ? (
                        <p className='text-sm text-[#667085]'>No outstanding balances.</p>
                    ) : (
                        <div className='space-y-4'>
                            {byGrade.map((item) => (
                                <div key={item.grade} className='flex items-center gap-3'>
                                    <span className='text-sm text-[#667085] w-20 shrink-0'>{item.grade}</span>
                                    <div className='flex-1 h-2 rounded-full bg-[#EDEEF5] overflow-hidden'>
                                        <div className='h-full rounded-full bg-[#515DEF]' style={{ width: `${(item.value / maxOutstanding) * 100}%` }} />
                                    </div>
                                    <span className='text-sm font-semibold text-[#1E1E1E] w-24 text-right shrink-0'>{formatCurrency(item.value)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>

                <Panel title='Overdue Aging (students)'>
                    {summary.count === 0 ? (
                        <p className='text-sm text-[#667085]'>No defaulters to age.</p>
                    ) : (
                        <>
                            <ReactECharts option={agingOption} style={{ height: 180 }} opts={{ renderer: 'svg' }} />
                            <div className='grid grid-cols-2 gap-2 mt-2'>
                                {aging.map((bucket, index) => (
                                    <div key={bucket.label} className='flex items-center gap-2 text-xs text-[#667085]'>
                                        <span className='size-2 rounded-full shrink-0' style={{ backgroundColor: AGING_COLORS[index] }} />
                                        {bucket.label}: {bucket.value}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
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
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder='Student name or admission no...'
                                className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                            />
                        </div>
                        <select value={grade} onChange={(event) => setGrade(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'>
                            <option value=''>All classes</option>
                            {grades.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                        <select value={severity} onChange={(event) => setSeverity(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[110px]'>
                            <option value=''>All severities</option>
                            {['CRITICAL', 'HIGH', 'MODERATE'].map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Student Name</th>
                                <th className={thClass}>Class</th>
                                <th className={thClass}>Due Since</th>
                                <th className={thClass}>Outstanding</th>
                                <th className={thClass}>Severity</th>
                                <th className={`${thClass} rounded-e-lg`}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={6} className='px-2 py-6 text-center text-[#667085]'>Loading finance records…</td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={6} className='px-2 py-6 text-center text-[#667085]'>
                                    {failed ? 'Finance records are unavailable.' : rows.length === 0 ? 'No fee defaulters.' : 'No defaulters match the filters.'}
                                </td></tr>
                            )}
                            {!loading && filtered.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg`}>
                                        <div className='flex items-center gap-3'>
                                            <div className='size-9 rounded-full bg-[#515DEF] text-white text-xs font-semibold flex items-center justify-center shrink-0'>
                                                {row.initials}
                                            </div>
                                            <div>
                                                <p className='font-medium text-[#1E1E1E]'>{row.student}</p>
                                                <p className='text-xs'>{row.studentId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={tdClass}>{row.className || '—'}</td>
                                    <td className={tdClass}>
                                        <p>{row.dueSince || '—'}</p>
                                        <p className='text-xs font-semibold text-[#FF5722]'>{row.daysOverdue > 0 ? `${row.daysOverdue} days overdue` : 'Not yet due'}</p>
                                    </td>
                                    <td className={tdClass}>
                                        <p className='font-semibold text-[#1E1E1E]'>{row.outstandingLabel}</p>
                                        <p className='text-xs'>{row.feeType}</p>
                                    </td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${defaulterSeverityBadgeColor[row.severity]}`}>{row.severity}</span>
                                    </td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${defaulterStatusBadgeColor[row.status]}`}>{row.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className='text-sm text-[#667085] mt-4'>
                    Showing {filtered.length} of {rows.length} defaulter(s)
                </p>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='fee-defaulters'
                title='Fee Defaulters'
                rows={filtered}
                columns={EXPORT_COLUMNS}
                exportDescription={<>You are exporting {filtered.length} defaulter record(s) from live Finance data.</>}
            />
        </div>
    )
}

export default DefaultersTab
