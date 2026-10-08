import React from 'react'
import { Search } from 'lucide-react'
import {
    REJECTED_REQUESTS,
    REJECTED_SUMMARY,
} from '../approvalsData'
import {
    SummaryCards,
    TableCard,
    TablePagination,
    tdClass,
    thClass,
} from './ApprovalsShared'

const RejectedTab = () => (
    <div className='space-y-6'>
        <SummaryCards cards={REJECTED_SUMMARY} />

        <TableCard
            title='Rejected requests'
            filters={(
                <div className='relative min-w-[160px]'>
                    <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                    <input type='text' placeholder='Search...' className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2' />
                </div>
            )}
            footer={<TablePagination summary='4 rejected this month' pages={[1]} />}
        >
            <table className='w-full text-sm text-left mt-4'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Request ID</th>
                        <th className={thClass}>Raised By</th>
                        <th className={thClass}>Type</th>
                        <th className={thClass}>Amount</th>
                        <th className={thClass}>Rejected On</th>
                        <th className={`${thClass} rounded-e-lg`}>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {REJECTED_REQUESTS.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg font-mono text-xs text-[#1E1E1E]`}>{row.id}</td>
                            <td className={`${tdClass} text-[#1E1E1E]`}>{row.raisedBy}</td>
                            <td className={tdClass}>{row.type}</td>
                            <td className={`${tdClass} font-semibold text-[#1E1E1E]`}>{row.amount}</td>
                            <td className={tdClass}>{row.rejectedOn}</td>
                            <td className={`${tdClass} rounded-e-lg`}>{row.reason}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableCard>
    </div>
)

export default RejectedTab
