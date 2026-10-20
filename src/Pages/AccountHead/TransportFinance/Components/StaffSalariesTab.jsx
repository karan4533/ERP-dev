import React, { useMemo } from 'react'
import { toast } from 'react-toastify'
import { Banknote, Download, Mail, MessageCircle, Search } from 'lucide-react'
import {
    PAYROLL_STAFF,
    SALARY_SUMMARY,
    payrollStatusBadgeColor,
} from '../transportFinanceData'
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

const StaffSalariesTab = () => {
    const { transactions, financePersistence, transportSalaries } = useFinance()
    const apiLive = Boolean(financePersistence?.apiEnabled)
    const payrollPosted = useMemo(
        () => (transactions || []).filter((row) => row.sourceModule === 'PAYROLL'),
        [transactions],
    )
    const salaryRegister = transportSalaries || []
    const liveSummary = useMemo(() => {
        const total = payrollPosted.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
        const registerTotal = salaryRegister.reduce((sum, row) => sum + (Number(row.netAmount || row.amount) || 0), 0)
        return [
            { label: 'Posted payroll vouchers', value: String(payrollPosted.length), sub: 'sourceModule=PAYROLL', iconTone: 'success' },
            { label: 'Posted amount', value: formatCurrency(total), sub: 'Snapshot transactions', iconTone: 'success' },
            { label: 'Staff register rows', value: String(salaryRegister.length), sub: apiLive ? 'transportSalaries' : 'Offline seed', iconTone: 'info' },
            { label: 'Register net', value: formatCurrency(registerTotal), sub: 'From transportSalaries', iconTone: 'warning' },
        ]
    }, [apiLive, payrollPosted, salaryRegister])

    return (
    <div className='space-y-6'>
        <SummaryCards cards={apiLive ? liveSummary : SALARY_SUMMARY} />
        {(payrollPosted.length > 0 || (apiLive && salaryRegister.length > 0)) && (
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
                        {payrollPosted.slice(0, 8).map((row) => (
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

        {apiLive && (
            <TableCard
                title='Transport staff register (snapshot)'
                footer={<TablePagination summary={`${salaryRegister.length} staff on transportSalaries`} />}
            >
                <table className='w-full text-sm text-left mt-4'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Staff</th>
                            <th className={thClass}>Role</th>
                            <th className={thClass}>Net pay</th>
                            <th className={`${thClass} rounded-e-lg`}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salaryRegister.length === 0 ? (
                            <tr>
                                <td colSpan={4} className={`${tdClass} text-[#667085]`}>
                                    No rows on `transportSalaries` yet. HR payroll vouchers still appear above when posted.
                                </td>
                            </tr>
                        ) : salaryRegister.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className={`${tdClass} rounded-s-lg`}>{row.name || row.staffName || '—'}</td>
                                <td className={tdClass}>{row.role || '—'}</td>
                                <td className={`${tdClass} font-semibold`}>{formatCurrency(row.netAmount || row.amount || 0)}</td>
                                <td className={`${tdClass} rounded-e-lg`}>{row.status || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableCard>
        )}

{!apiLive && (
        <TableCard
            title='Transport staff payroll — June 2026 (offline demo)'
            filters={(
                <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                    <div className='relative min-w-[160px]'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                        <input
                            type='text'
                            placeholder='Search staff...'
                            className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                        />
                    </div>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'>
                        <option>All Roles</option>
                        <option>Driver</option>
                        <option>Transport Manager</option>
                    </select>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'>
                        <option>All Status</option>
                        <option>Paid</option>
                        <option>Pending</option>
                    </select>
                    <button
                        type='button'
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                    >
                        <Banknote size={16} />
                        Run Payroll
                    </button>
                </div>
            )}
            footer={<TablePagination summary='21 staff on transport payroll' />}
        >
            <table className='w-full text-sm text-left mt-4'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Staff</th>
                        <th className={thClass}>Role</th>
                        <th className={thClass}>Base Salary</th>
                        <th className={thClass}>Allowance</th>
                        <th className={thClass}>Deductions</th>
                        <th className={thClass}>Net Pay</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} rounded-e-lg`}>Payslip</th>
                    </tr>
                </thead>
                <tbody>
                    {PAYROLL_STAFF.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg`}>
                                <StaffAvatar initials={row.initials} name={row.name} />
                            </td>
                            <td className={tdClass}>{row.role}</td>
                            <td className={tdClass}>{row.baseSalary}</td>
                            <td className={tdClass}>{row.allowance}</td>
                            <td className={tdClass}>{row.deductions}</td>
                            <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.netPay}</td>
                            <td className={tdClass}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${payrollStatusBadgeColor[row.status]}`}>
                                    {row.status}
                                </span>
                            </td>
                            <td className={`${tdClass} rounded-e-lg`}>
                                <div className='flex gap-1'>
                                    <button type='button' onClick={() => toast.info(`Payslip preview for ${row.name} is mocked.`)} className='text-xs text-[#515DEF] cursor-pointer'>View</button>
                                    <button type='button' onClick={() => toast.info('PDF download mocked until payroll service is connected.')} className='text-[#515DEF] cursor-pointer' aria-label='Download'><Download size={14} /></button>
                                    <button type='button' onClick={() => toast.success('Mock payslip email sent.')} className='text-[#515DEF] cursor-pointer' aria-label='Email'><Mail size={14} /></button>
                                    <button type='button' onClick={() => toast.success('Mock WhatsApp payslip sent.')} className='text-[#515DEF] cursor-pointer' aria-label='WhatsApp'><MessageCircle size={14} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableCard>
        )}
        {apiLive && payrollPosted.length === 0 && (
            <p className='text-sm text-[#667085] bg-white rounded-2xl shadow-md p-4'>
                No PAYROLL vouchers on the campus finance snapshot. Demo staff payroll register is hidden while Finance API is on.
            </p>
        )}
    </div>
    )
}

export default StaffSalariesTab
