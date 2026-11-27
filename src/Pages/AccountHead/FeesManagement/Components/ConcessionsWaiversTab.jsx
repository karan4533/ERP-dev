import React, { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { CheckCircle2, Clock, Pencil, Users, Wallet } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import ConcessionDetailsOffcanvas from './ConcessionDetailsOffcanvas'
import { concessionDedBadgeColor, concessionStatusBadgeColor } from '../feesManagementData'
import { concessionsByType, summarizeConcessions } from '../feeLiveStats'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'
const TYPE_COLORS = ['#515DEF', '#4CAF50', '#FF9800', '#FF5722', '#B4C4FF', '#667085']

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
    { key: 'concessionType', label: 'Concession Type' },
    { key: 'feeHead', label: 'Fee Head' },
    { key: 'originalAmount', label: 'Original Amount' },
    { key: 'deduction', label: 'Deduction' },
    { key: 'dedPercent', label: 'Deduction %' },
    { key: 'netFee', label: 'Net Fee' },
    { key: 'status', label: 'Status' },
]

const ConcessionsWaiversTab = ({ exportModal, setExportModal }) => {
    const [selectedConcession, setSelectedConcession] = useState(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [typeFilter, setTypeFilter] = useState('')
    const { concessions, students, feeCategories, getStudentSummary, financeStatus, financeError } = useFinance()

    const concessionRows = useMemo(() => concessions.map((item) => {
        const student = students.find((row) => row.id === item.studentId)
        const category = feeCategories.find((row) => row.id === item.feeCategoryId)
        const summary = student ? getStudentSummary(student.id, item.academicYear) : null
        return {
            id: item.id,
            student: student?.name ?? 'Unknown student',
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
            approvalDate: item.approvedAt || '',
            totalSavings: `-${formatCurrency(item.amount)}`,
            documents: [],
        }
    }), [concessions, students, feeCategories, getStudentSummary])

    const summary = useMemo(() => summarizeConcessions(concessions), [concessions])
    const byType = useMemo(() => concessionsByType(concessions), [concessions])
    const filtered = useMemo(
        () => concessionRows.filter((row) => !typeFilter || row.concessionType === typeFilter),
        [concessionRows, typeFilter],
    )

    const loading = financeStatus === 'loading'
    const failed = financeStatus === 'error'

    const distributionOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: (p) => `${p.name}: ${formatCurrency(p.value)}` },
        series: [{
            type: 'pie',
            radius: ['58%', '78%'],
            label: { show: false },
            labelLine: { show: false },
            data: byType.map((item, index) => ({ value: item.amount, name: item.name, itemStyle: { color: TYPE_COLORS[index % TYPE_COLORS.length] } })),
        }],
    }), [byType])

    const openDetails = (row) => {
        setSelectedConcession(row)
        setDetailsOpen(true)
    }

    return (
        <div className='space-y-6'>
            {failed && (
                <div className='bg-[#FEF3F2] border border-[#FDA29B] text-[#B42318] rounded-xl px-4 py-3 text-sm'>
                    Could not load finance records from the server{financeError ? `: ${financeError}` : ''}. Concessions are unavailable until it loads.
                </div>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                <SummaryCard icon={Users} tone='bg-[#515DEF1A] text-[#515DEF]' label='Total Concessions' value={summary.count} />
                <SummaryCard icon={Wallet} tone='bg-[#FF57221A] text-[#FF5722]' label='Total Deduction' value={formatCurrency(summary.amount)} />
                <SummaryCard icon={CheckCircle2} tone='bg-[#4CAF501A] text-[#4CAF50]' label='Approved' value={summary.approved} />
                <SummaryCard icon={Clock} tone='bg-[#FF98001A] text-[#FF9800]' label='Pending Approval' value={summary.pending} />
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Concession Distribution by Type</h3>
                {byType.length === 0 ? (
                    <p className='text-sm text-[#667085]'>No concessions recorded yet.</p>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-center'>
                        <ReactECharts option={distributionOption} style={{ height: 200 }} opts={{ renderer: 'svg' }} />
                        <div className='space-y-2'>
                            {byType.map((item, index) => (
                                <div key={item.name} className='flex items-center justify-between text-sm'>
                                    <div className='flex items-center gap-2 text-[#667085]'>
                                        <span className='size-2.5 rounded-full shrink-0' style={{ backgroundColor: TYPE_COLORS[index % TYPE_COLORS.length] }} />
                                        {item.name} ({item.count})
                                    </div>
                                    <span className='font-semibold text-[#1E1E1E]'>{formatCurrency(item.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-4'>
                    <div>
                        <h3 className='text-base font-semibold text-[#1E1E1E]'>Concessions Register</h3>
                        <p className='text-xs text-[#667085] mt-0.5'>Approved and pending fee deductions from Finance.</p>
                    </div>
                    <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                        <option value=''>All types</option>
                        {byType.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                    </select>
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
                            {loading && (
                                <tr><td colSpan={8} className='px-2 py-6 text-center text-[#667085]'>Loading concessions…</td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={8} className='px-2 py-6 text-center text-[#667085]'>
                                    {failed ? 'Concessions are unavailable.' : concessionRows.length === 0 ? 'No concessions recorded yet.' : 'No concessions match the filter.'}
                                </td></tr>
                            )}
                            {!loading && filtered.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg`}>
                                        <p className='font-medium text-[#1E1E1E]'>{row.student}</p>
                                        <p className='text-xs'>{row.studentId} · {row.className}</p>
                                    </td>
                                    <td className={tdClass}>{row.concessionType}</td>
                                    <td className={tdClass}>{row.feeHead}</td>
                                    <td className={tdClass}>
                                        <p className='font-medium text-[#1E1E1E]'>{row.originalAmount}</p>
                                        <p className='text-xs text-[#FF5722]'>-{row.deduction}</p>
                                    </td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${concessionDedBadgeColor[row.dedTone]}`}>{row.dedPercent}</span>
                                    </td>
                                    <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.netFee}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${concessionStatusBadgeColor[row.status] || 'bg-[#EDEEF5] text-[#667085]'}`}>{row.status}</span>
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
                <p className='text-sm text-[#667085] mt-4'>Showing {filtered.length} of {concessionRows.length} concession(s)</p>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='concessions-waivers'
                title='Concessions & Waivers'
                rows={filtered}
                columns={EXPORT_COLUMNS}
                exportDescription={<>You are exporting {filtered.length} concession record(s) from live Finance data.</>}
            />

            <ConcessionDetailsOffcanvas
                isOpen={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                concession={selectedConcession}
            />
        </div>
    )
}

export default ConcessionsWaiversTab
