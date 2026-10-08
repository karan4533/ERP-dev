import React from 'react'
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

const StaffSalariesTab = () => (
    <div className='space-y-6'>
        <SummaryCards cards={SALARY_SUMMARY} />

        <TableCard
            title='Transport staff payroll — June 2026'
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
    </div>
)

export default StaffSalariesTab
