import React from 'react'
import { Plus } from 'lucide-react'
import {
    APPROVAL_RULES,
    ruleStatusBadgeColor,
} from '../approvalsData'
import { tdClass, thClass } from './ApprovalsShared'

const ApprovalRulesTab = () => (
    <div className='space-y-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E]'>Approval routing rules</h3>
                <p className='text-sm text-[#667085] mt-1'>
                    Defines who approves what, and the threshold-based escalation path
                </p>
            </div>
            <button
                type='button'
                className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
            >
                <Plus size={16} />
                Add Rule
            </button>
        </div>

        <div className='bg-white rounded-2xl shadow-md overflow-hidden p-4'>
            <table className='w-full text-sm text-left'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Request Type</th>
                        <th className={thClass}>Amount Threshold</th>
                        <th className={thClass}>Primary Approver</th>
                        <th className={thClass}>Escalates To</th>
                        <th className={`${thClass} rounded-e-lg`}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {APPROVAL_RULES.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>{row.requestType}</td>
                            <td className={tdClass}>{row.threshold}</td>
                            <td className={tdClass}>{row.primaryApprover}</td>
                            <td className={tdClass}>{row.escalatesTo}</td>
                            <td className={`${tdClass} rounded-e-lg`}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${ruleStatusBadgeColor[row.status]}`}>
                                    {row.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)

export default ApprovalRulesTab
