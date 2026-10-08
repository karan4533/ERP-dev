import React from 'react'
import { ChevronRight } from 'lucide-react'
import {
    COA_ACCOUNT_TREE,
    coaStatusBadgeColor,
    coaTypeBadgeColor,
} from '../accountingData'
import { Panel, SummaryCards, TableCard, TablePagination, tdClass, thClass } from './AccountingShared'

const AccountTreePanel = () => (
    <Panel title='Account tree'>
        <div className='space-y-5'>
            {COA_ACCOUNT_TREE.map((section) => (
                <div key={section.title}>
                    <p className='text-sm font-semibold text-[#1E1E1E] mb-2'>{section.title}</p>
                    <div className='space-y-1.5 pl-3 border-l-2 border-[#515DEF]/20'>
                        {section.children.map((child) => (
                            <div key={child} className='flex items-center gap-2 text-sm text-[#667085] pl-2'>
                                <ChevronRight size={14} className='text-[#515DEF] shrink-0' />
                                <span>{child}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </Panel>
)

const ChartOfAccountsTab = ({ accounts, summary }) => (
    <div className='space-y-6' id='chart-of-accounts-print-area'>
        <SummaryCards cards={summary} />

        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
            <div className='xl:col-span-1'>
                <AccountTreePanel />
            </div>

            <div className='xl:col-span-2'>
                <TableCard
                    title='Chart of accounts'
                    footer={<TablePagination summary={`${accounts.length} accounts configured`} />}
                >
                    <table className='w-full text-sm text-left mt-4 min-w-[800px]'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Account Code</th>
                                <th className={thClass}>Account Name</th>
                                <th className={thClass}>Account Type</th>
                                <th className={thClass}>Parent Account</th>
                                <th className={thClass}>Status</th>
                                <th className={`${thClass} rounded-e-lg`}>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} rounded-s-lg font-mono text-xs text-[#515DEF]`}>{row.accountCode}</td>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.accountName}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${coaTypeBadgeColor[row.accountType]}`}>
                                            {row.accountType}
                                        </span>
                                    </td>
                                    <td className={tdClass}>{row.parentAccount}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${coaStatusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} rounded-e-lg font-semibold`}>{row.balance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TableCard>
            </div>
        </div>
    </div>
)

export const buildCoaSummary = (accounts) => {
    const assetCount = accounts.filter((row) => row.accountType === 'Asset').length
    const liabilityCount = accounts.filter((row) => row.accountType === 'Liability').length
    const incomeExpenseCount = accounts.filter(
        (row) => row.accountType === 'Income' || row.accountType === 'Expense',
    ).length

    return [
        {
            label: 'Total Accounts',
            value: String(accounts.length),
            sub: `${accounts.filter((row) => row.status === 'Active').length} active`,
            iconTone: 'info',
        },
        {
            label: 'Assets',
            value: String(assetCount),
            sub: 'cash, bank & receivables',
            iconTone: 'info',
        },
        {
            label: 'Liabilities',
            value: String(liabilityCount),
            sub: 'payables & obligations',
            iconTone: 'warning',
        },
        {
            label: 'Income & Expenses',
            value: String(incomeExpenseCount),
            sub: 'fee heads & cost centres',
            iconTone: 'success',
        },
    ]
}

export const appendCoaAccount = (accounts, account) => [
    {
        ...account,
        id: `COA-${Date.now()}`,
    },
    ...accounts,
]

export default ChartOfAccountsTab
