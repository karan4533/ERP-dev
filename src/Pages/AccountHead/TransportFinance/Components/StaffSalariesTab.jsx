import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Download, Mail, MessageCircle, Search } from 'lucide-react'
import {
    StaffAvatar,
    SummaryCards,
    TableCard,
    TablePagination,
    tdClass,
    thClass,
} from './TransportShared'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency } from '../../financeDomain/financeHelpers'
import {
    hydrateHrStore,
    isHrRemoteReady,
    getHrHydrateError,
    salaryRows,
    payrollSummary,
} from '../../../HR/domain/hrStore'
import { PAYROLL_MONTHS, PAYROLL_YEARS } from '../../../HR/domain/payrollConfig'

const isTransportStaff = (row) => {
    const dept = String(row.department || row.employee?.department || '').toLowerCase()
    const role = String(row.role || row.designation || row.employee?.role || '').toLowerCase()
    const category = String(row.category || row.employee?.category || '').toLowerCase()
    return (
        dept.includes('transport')
        || role.includes('driver')
        || role.includes('conductor')
        || category.includes('driver')
        || category.includes('conductor')
        || category.includes('transport')
    )
}

const initialsOf = (name) => String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?'

const statusBadge = (status) => {
    const value = String(status || 'Unpaid')
    if (/paid|final/i.test(value)) return 'bg-[#4CAF5033] text-[#4CAF50]'
    if (/process/i.test(value)) return 'bg-[#2196F333] text-[#2196F3]'
    return 'bg-[#FF980033] text-[#FF9800]'
}

const StaffSalariesTab = () => {
    const { transactions, financePersistence } = useFinance()
    const now = new Date()
    const [month, setMonth] = useState(PAYROLL_MONTHS[now.getMonth()] || 'October')
    const [year, setYear] = useState(PAYROLL_YEARS.includes(now.getFullYear()) ? now.getFullYear() : 2026)
    const [search, setSearch] = useState('')
    const [hrReady, setHrReady] = useState(() => isHrRemoteReady())
    const [hrError, setHrError] = useState(() => getHrHydrateError())
    const [rows, setRows] = useState([])
    const [summary, setSummary] = useState(null)

    const refreshHr = () => {
        if (!isHrRemoteReady()) {
            setHrReady(false)
            setHrError(getHrHydrateError() || 'HR API is not ready.')
            setRows([])
            setSummary(null)
            return
        }
        try {
            const all = salaryRows(month, year, { search })
            const transport = all.filter(isTransportStaff)
            setRows(transport)
            setSummary(payrollSummary(month, year))
            setHrReady(true)
            setHrError(null)
        } catch (error) {
            setHrReady(false)
            setHrError(error?.message || 'Could not read HR payroll.')
            setRows([])
            setSummary(null)
        }
    }

    useEffect(() => {
        let cancelled = false
        hydrateHrStore()
            .then(() => {
                if (!cancelled) refreshHr()
            })
            .catch((error) => {
                if (!cancelled) {
                    setHrReady(false)
                    setHrError(error?.message || 'HR API is not available.')
                    setRows([])
                }
            })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh after month/year/search via next effect
    }, [])

    useEffect(() => {
        refreshHr()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month, year, search])

    const payrollPosted = useMemo(
        () => (transactions || []).filter((row) => row.sourceModule === 'PAYROLL'),
        [transactions],
    )

    const cards = useMemo(() => {
        const postedTotal = payrollPosted.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
        const netTotal = rows.reduce((sum, row) => sum + (Number(row.netSalary || row.netPay) || 0), 0)
        return [
            {
                label: 'Transport staff (HR)',
                value: String(rows.length),
                sub: hrReady ? `${month} ${year}` : 'HR not loaded',
                iconTone: 'info',
            },
            {
                label: 'Net pay (HR)',
                value: formatCurrency(netTotal),
                sub: 'Drivers / conductors / transport dept',
                iconTone: 'warning',
            },
            {
                label: 'Posted payroll vouchers',
                value: String(payrollPosted.length),
                sub: 'Finance sourceModule=PAYROLL',
                iconTone: 'success',
            },
            {
                label: 'Posted amount',
                value: formatCurrency(postedTotal),
                sub: financePersistence?.apiEnabled ? 'Campus finance snapshot' : 'Local finance snapshot',
                iconTone: 'success',
            },
        ]
    }, [rows, payrollPosted, month, year, hrReady, financePersistence?.apiEnabled])

    return (
        <div className='space-y-6'>
            <SummaryCards cards={cards} />

            {hrError && (
                <p className='text-sm text-[#FF5722] bg-white rounded-2xl shadow-md p-4'>
                    {hrError} Staff Salaries reads HR payroll (`/hr/payroll` + employees), not a demo list.
                </p>
            )}

            <TableCard
                title={`Transport staff payroll — ${month} ${year} (HR SoT)`}
                filters={(
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <div className='relative min-w-[160px]'>
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                            <input
                                type='text'
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder='Search staff...'
                                className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                            />
                        </div>
                        <select
                            value={month}
                            onChange={(event) => setMonth(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'
                        >
                            {PAYROLL_MONTHS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={(event) => setYear(Number(event.target.value))}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[100px]'
                        >
                            {PAYROLL_YEARS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                )}
                footer={(
                    <TablePagination
                        summary={
                            summary?.totals
                                ? `${rows.length} transport staff · HR campus net ${formatCurrency(summary.totals.netSalary || 0)} (all departments)`
                                : `${rows.length} transport staff`
                        }
                    />
                )}
            >
                <table className='w-full text-sm text-left mt-4'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Staff</th>
                            <th className={thClass}>Role</th>
                            <th className={thClass}>Gross</th>
                            <th className={thClass}>Allowance</th>
                            <th className={thClass}>Deductions</th>
                            <th className={thClass}>Net Pay</th>
                            <th className={thClass}>Status</th>
                            <th className={`${thClass} rounded-e-lg`}>Payslip</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={8} className={`${tdClass} text-[#667085]`}>
                                    {hrReady
                                        ? 'No Transport / Driver / Conductor employees in HR for this month. Add them under HR → Employee Database / Payroll.'
                                        : 'Waiting for HR payroll…'}
                                </td>
                            </tr>
                        ) : rows.map((row) => {
                            const name = row.name || row.employeeName || '—'
                            const role = row.designation || row.role || row.department || '—'
                            const gross = Number(row.grossSalary ?? row.payableGross ?? 0)
                            const allowance = Number(row.otherAllowance ?? 0)
                            const deductions = Number(
                                (row.pfEmployee || 0)
                                + (row.esiEmployee || 0)
                                + (row.advance || 0)
                                + (row.specialDeduction || 0)
                                + (row.lopDeduction || 0)
                                + (row.disciplinaryDeduction || 0),
                            )
                            const net = Number(row.netSalary ?? row.netPay ?? 0)
                            const status = row.paymentStatus || row.status || 'Unpaid'
                            return (
                                <tr key={row.employeeId || row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg`}>
                                        <StaffAvatar initials={initialsOf(name)} name={name} />
                                    </td>
                                    <td className={tdClass}>{role}</td>
                                    <td className={tdClass}>{formatCurrency(gross)}</td>
                                    <td className={tdClass}>{formatCurrency(allowance)}</td>
                                    <td className={tdClass}>{formatCurrency(deductions)}</td>
                                    <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{formatCurrency(net)}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusBadge(status)}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <div className='flex gap-1'>
                                            <button
                                                type='button'
                                                onClick={() => toast.info(`Open HR → Payroll → Payslip for ${name}.`)}
                                                className='text-xs text-[#515DEF] cursor-pointer'
                                            >
                                                View
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => toast.info('PDF download is available from HR Payslip.')}
                                                className='text-[#515DEF] cursor-pointer'
                                                aria-label='Download'
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => toast.info('Payslip email uses school SMTP when HR queues delivery.')}
                                                className='text-[#515DEF] cursor-pointer'
                                                aria-label='Email'
                                            >
                                                <Mail size={14} />
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => toast.info('WhatsApp payslip needs WhatsApp API credentials (still NOT_CONFIGURED).')}
                                                className='text-[#515DEF] cursor-pointer'
                                                aria-label='WhatsApp'
                                            >
                                                <MessageCircle size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </TableCard>

            {payrollPosted.length > 0 && (
                <TableCard title='Posted payroll vouchers (Finance books)' footer={<TablePagination summary={`${payrollPosted.length} vouchers`} />}>
                    <table className='w-full text-sm text-left mt-4'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Voucher</th>
                                <th className={thClass}>Employee</th>
                                <th className={thClass}>Narration</th>
                                <th className={`${thClass} rounded-e-lg`}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrollPosted.slice(0, 12).map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg font-mono text-xs`}>{row.voucherNo || row.id}</td>
                                    <td className={tdClass}>{row.employeeId || '—'}</td>
                                    <td className={tdClass}>{row.narration || 'Payroll'}</td>
                                    <td className={`${tdClass} rounded-e-lg font-semibold`}>{formatCurrency(row.amount || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TableCard>
            )}
        </div>
    )
}

export default StaffSalariesTab
