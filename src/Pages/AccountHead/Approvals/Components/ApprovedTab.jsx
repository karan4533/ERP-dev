import React from 'react'
import { Search } from 'lucide-react'
import {
    APPROVED_REQUESTS,
    APPROVED_SUMMARY,
} from '../approvalsData'
import {
    SummaryCards,
    TableCard,
    TablePagination,
    tdClass,
    thClass,
} from './ApprovalsShared'

const ApprovedTab = () => (
    <div className='space-y-6'>
        <SummaryCards cards={APPROVED_SUMMARY} />

        <TableCard
            title='Approved requests'
            filters={(
                <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                    <div className='relative min-w-[160px]'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                        <input type='text' placeholder='Search...' className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2' />
                    </div>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'>
                        <option>All Departments</option>
                        <option>Transport</option>
                        <option>Academics</option>
                        <option>Admin</option>
                    </select>
                </div>
            )}
            footer={<TablePagination summary='62 approved this month' />}
        >
            <table className='w-full text-sm text-left mt-4'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Request ID</th>
                        <th className={thClass}>Raised By</th>
                        <th className={thClass}>Type</th>
                        <th className={thClass}>Amount</th>
                        <th className={thClass}>Approved By</th>
                        <th className={`${thClass} rounded-e-lg`}>Approved On</th>
                    </tr>
                </thead>
                <tbody>
                    {APPROVED_REQUESTS.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg font-mono text-xs text-[#1E1E1E]`}>{row.id}</td>
                            <td className={`${tdClass} text-[#1E1E1E]`}>{row.raisedBy}</td>
                            <td className={tdClass}>{row.type}</td>
                            <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.amount}</td>
                            <td className={tdClass}>{row.approvedBy}</td>
                            <td className={`${tdClass} rounded-e-lg`}>{row.approvedOn}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableCard>
    </div>
)

export default ApprovedTab
