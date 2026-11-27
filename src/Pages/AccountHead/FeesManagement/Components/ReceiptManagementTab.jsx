import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { AlertTriangle, Ban, FileText, Receipt, Search } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency } from '../../financeDomain/financeHelpers'
import { receiptStatusBadgeColor } from '../feesManagementData'
import {
    buildReceiptRows,
    matchesSearch,
    paymentModeShares,
    receiptsByMonth,
    summarizeReceipts,
} from '../feeLiveStats'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'
const MODE_COLORS = ['#515DEF', '#4CAF50', '#FF9800', '#FF5722', '#B4C4FF', '#667085']

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
    { key: 'receiptNo', label: 'Receipt No' },
    { key: 'paymentDate', label: 'Payment Date' },
    { key: 'student', label: 'Student' },
    { key: 'studentId', label: 'Admission No' },
    { key: 'className', label: 'Class' },
    { key: 'feeHeads', label: 'Fee Heads' },
    { key: 'amountLabel', label: 'Amount' },
    { key: 'paymentMode', label: 'Payment Mode' },
    { key: 'source', label: 'Recorded By' },
    { key: 'status', label: 'Status' },
]

const ReceiptManagementTab = ({ exportModal, setExportModal }) => {
    const { receipts, students, financeStatus, financeError } = useFinance()
    const [search, setSearch] = useState('')
    const [mode, setMode] = useState('')

    const rows = useMemo(
        () => buildReceiptRows(receipts, students).map((row) => ({ ...row, amountLabel: formatCurrency(row.amountPaid) })),
        [receipts, students],
    )
    const summary = useMemo(() => summarizeReceipts(receipts), [receipts])
    const trend = useMemo(() => receiptsByMonth(receipts), [receipts])
    const modes = useMemo(() => paymentModeShares(receipts), [receipts])
    const modeOptions = useMemo(() => [...new Set(rows.map((row) => row.paymentMode).filter(Boolean))].sort(), [rows])

    const filtered = useMemo(
        () => rows.filter((row) => {
            if (mode && row.paymentMode !== mode) return false
            return matchesSearch(row, search, ['receiptNo', 'student', 'studentId', 'className', 'feeHeads'])
        }),
        [rows, mode, search],
    )

    const loading = financeStatus === 'loading'
    const failed = financeStatus === 'error'

    const trendOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 36, right: 16, top: 16, bottom: 32 },
        xAxis: { type: 'category', data: trend.labels, axisLabel: { color: '#667085', fontSize: 11 } },
        yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#667085', fontSize: 11 }, splitLine: { lineStyle: { color: '#F2F4F7' } } },
        series: [{ type: 'bar', data: trend.values, barWidth: 24, itemStyle: { color: '#515DEF', borderRadius: [4, 4, 0, 0] } }],
    }), [trend])

    const modesOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {c} receipt(s)' },
        series: [{
            type: 'pie',
            radius: ['58%', '78%'],
            label: { show: false },
            labelLine: { show: false },
            data: modes.map((item, index) => ({ value: item.count, name: item.name, itemStyle: { color: MODE_COLORS[index % MODE_COLORS.length] } })),
        }],
    }), [modes])

    return (
        <div className='space-y-6'>
            {failed && (
                <div className='bg-[#FEF3F2] border border-[#FDA29B] text-[#B42318] rounded-xl px-4 py-3 text-sm'>
                    Could not load finance records from the server{financeError ? `: ${financeError}` : ''}. Receipts are unavailable until it loads.
                </div>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                <SummaryCard icon={Receipt} tone='bg-[#515DEF1A] text-[#515DEF]' label='Total Receipts' value={summary.total} sub={`${formatCurrency(summary.amount)} collected`} />
                <SummaryCard icon={FileText} tone='bg-[#4CAF501A] text-[#4CAF50]' label='Generated Today' value={summary.today} />
                <SummaryCard icon={AlertTriangle} tone='bg-[#FF98001A] text-[#FF9800]' label='Held (pending clearance)' value={summary.held} />
                <SummaryCard icon={Ban} tone='bg-[#FF57221A] text-[#FF5722]' label='Cancelled Receipts' value={summary.cancelled} />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel title='Receipts per Month (last 6 months)'>
                    {summary.total === 0 ? (
                        <p className='text-sm text-[#667085]'>No receipts recorded yet.</p>
                    ) : (
                        <ReactECharts option={trendOption} style={{ height: 240 }} opts={{ renderer: 'svg' }} />
                    )}
                </Panel>
                <Panel title='Payment Modes'>
                    {modes.length === 0 ? (
                        <p className='text-sm text-[#667085]'>No receipts recorded yet.</p>
                    ) : (
                        <div className='flex items-center gap-4'>
                            <div className='flex-1 min-w-0'>
                                <ReactECharts option={modesOption} style={{ height: 220 }} opts={{ renderer: 'svg' }} />
                            </div>
                            <div className='space-y-3 shrink-0 pr-2'>
                                {modes.map((item, index) => (
                                    <div key={item.name} className='flex items-center gap-2 text-sm'>
                                        <span className='size-2.5 rounded-full shrink-0' style={{ backgroundColor: MODE_COLORS[index % MODE_COLORS.length] }} />
                                        <span className='text-[#667085]'>{item.name}</span>
                                        <span className='font-semibold text-[#1E1E1E]'>{item.percent}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder='Receipt no, student...'
                                className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                            />
                        </div>
                        <select value={mode} onChange={(event) => setMode(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                            <option value=''>All payment modes</option>
                            {modeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                </div>

                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Receipt #</th>
                                <th className={thClass}>Date</th>
                                <th className={thClass}>Student Name</th>
                                <th className={thClass}>Class</th>
                                <th className={thClass}>Fee Heads</th>
                                <th className={thClass}>Amount</th>
                                <th className={thClass}>Mode</th>
                                <th className={thClass}>Recorded By</th>
                                <th className={`${thClass} rounded-e-lg`}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={9} className='px-2 py-6 text-center text-[#667085]'>Loading receipts…</td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={9} className='px-2 py-6 text-center text-[#667085]'>
                                    {failed ? 'Receipts are unavailable.' : rows.length === 0 ? 'No receipts recorded yet.' : 'No receipts match the filters.'}
                                </td></tr>
                            )}
                            {!loading && filtered.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg text-[#515DEF] font-medium`}>{row.receiptNo}</td>
                                    <td className={tdClass}>{row.paymentDate || '—'}</td>
                                    <td className={tdClass}>
                                        <p className='font-medium text-[#1E1E1E]'>{row.student}</p>
                                        <p className='text-xs'>{row.studentId}</p>
                                    </td>
                                    <td className={tdClass}>{row.className || '—'}</td>
                                    <td className={tdClass}>{row.feeHeads || '—'}</td>
                                    <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.amountLabel}</td>
                                    <td className={tdClass}>{row.paymentMode || '—'}</td>
                                    <td className={tdClass}>{row.source}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${receiptStatusBadgeColor[row.status] || 'bg-[#EDEEF5] text-[#667085]'}`}>{row.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className='text-sm text-[#667085] mt-4'>Showing {filtered.length} of {rows.length} receipt(s)</p>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='receipt-management'
                title='Receipt Management'
                rows={filtered}
                columns={EXPORT_COLUMNS}
                exportDescription={<>You are exporting {filtered.length} receipt record(s) from live Finance data.</>}
            />
        </div>
    )
}

export default ReceiptManagementTab
