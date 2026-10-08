import React from 'react'
import { Download } from 'lucide-react'
import {
    COMPLIANCE_DOCS,
    COMPLIANCE_SUMMARY,
    complianceStatusBadgeColor,
} from '../transportFinanceData'
import {
    SummaryCards,
    TableCard,
    TablePagination,
    tdClass,
    thClass,
} from './TransportShared'

const ComplianceTab = () => (
    <div className='space-y-6'>
        <SummaryCards cards={COMPLIANCE_SUMMARY} />

        <TableCard
            title='Compliance & documentation register'
            filters={(
                <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[150px]'>
                        <option>All Types</option>
                        <option>Insurance</option>
                        <option>Fitness Cert.</option>
                        <option>Permit</option>
                        <option>Pollution Cert.</option>
                        <option>Driver License</option>
                    </select>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                        <option>All Status</option>
                        <option>Valid</option>
                        <option>Expiring Soon</option>
                        <option>Expired</option>
                    </select>
                    <button
                        type='button'
                        className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            )}
            footer={<TablePagination summary='72 documents tracked' />}
        >
            <table className='w-full text-sm text-left mt-4'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Vehicle / Staff</th>
                        <th className={thClass}>Document Type</th>
                        <th className={thClass}>Issued On</th>
                        <th className={thClass}>Valid Till</th>
                        <th className={thClass}>Days Left</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} rounded-e-lg`}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {COMPLIANCE_DOCS.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>{row.entity}</td>
                            <td className={tdClass}>{row.docType}</td>
                            <td className={tdClass}>{row.issuedOn}</td>
                            <td className={tdClass}>{row.validTill}</td>
                            <td className={tdClass}>{row.daysLeft}</td>
                            <td className={tdClass}>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${complianceStatusBadgeColor[row.status]}`}>
                                    {row.status}
                                </span>
                            </td>
                            <td className={`${tdClass} rounded-e-lg`}>
                                <button type='button' className='text-sm font-medium text-[#515DEF] hover:underline cursor-pointer'>
                                    {row.status === 'Valid' ? 'View' : 'Renew'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableCard>
    </div>
)

export default ComplianceTab
