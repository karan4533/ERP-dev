import React, { useMemo, useState } from 'react'
import {
    GENERAL_LEDGER_ACCOUNTS,
    GENERAL_LEDGER_DEPARTMENTS,
    GENERAL_LEDGER_FINANCIAL_YEARS,
    GENERAL_LEDGER_VOUCHER_TYPES,
    formatRupeeAmount,
    parseRupeeAmount,
} from '../accountingData'
import { SummaryCards, TableCard, TablePagination, tdClass, thClass } from './AccountingShared'

const GeneralLedgerTab = ({ entries, summary, registerRef }) => {
    const [dateFilter, setDateFilter] = useState('')
    const [ledgerAccount, setLedgerAccount] = useState(GENERAL_LEDGER_ACCOUNTS[0])
    const [voucherType, setVoucherType] = useState(GENERAL_LEDGER_VOUCHER_TYPES[0])
    const [department, setDepartment] = useState(GENERAL_LEDGER_DEPARTMENTS[0])
    const [financialYear, setFinancialYear] = useState('All Years')

    const filteredEntries = useMemo(() => {
        return entries.filter((row) => {
            if (ledgerAccount !== 'All Accounts' && row.ledgerAccount !== ledgerAccount) return false
            if (voucherType !== 'All Types' && row.voucherType !== voucherType) return false
            if (department !== 'All Departments' && row.department !== department) return false
            if (financialYear !== 'All Years' && financialYear !== row.financialYear) return false
            if (dateFilter && row.dateIso !== dateFilter) return false
            return true
        })
    }, [entries, dateFilter, ledgerAccount, voucherType, department, financialYear])

    return (
        <div className='space-y-6' id='general-ledger-print-area'>
            <SummaryCards cards={summary} />

            <div ref={registerRef}>
                <TableCard
                    title='Ledger register'
                    filters={(
                        <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                            <input
                                type='date'
                                value={dateFilter}
                                onChange={(event) => setDateFilter(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                            />
                            <select
                                value={ledgerAccount}
                                onChange={(event) => setLedgerAccount(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[180px]'
                            >
                                {GENERAL_LEDGER_ACCOUNTS.map((account) => (
                                    <option key={account} value={account}>{account}</option>
                                ))}
                            </select>
                            <select
                                value={voucherType}
                                onChange={(event) => setVoucherType(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'
                            >
                                {GENERAL_LEDGER_VOUCHER_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <select
                                value={department}
                                onChange={(event) => setDepartment(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[150px]'
                            >
                                {GENERAL_LEDGER_DEPARTMENTS.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                            <select
                                value={financialYear}
                                onChange={(event) => setFinancialYear(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[110px]'
                            >
                                {['All Years', ...GENERAL_LEDGER_FINANCIAL_YEARS].map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    footer={(
                        <TablePagination
                            summary={`${filteredEntries.length} posted entries${
                                filteredEntries.length !== entries.length ? ` (of ${entries.length} total)` : ''
                            }`}
                        />
                    )}
                >
                    <table className='w-full text-sm text-left mt-4 min-w-[1100px]'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Date</th>
                                <th className={thClass}>Voucher No.</th>
                                <th className={thClass}>Ledger Account</th>
                                <th className={thClass}>Description</th>
                                <th className={thClass}>Debit</th>
                                <th className={thClass}>Credit</th>
                                <th className={thClass}>Balance</th>
                                <th className={thClass}>Reference Module</th>
                                <th className={`${thClass} rounded-e-lg`}>Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className='px-2 py-8 text-center text-[#667085]'>
                                        No ledger entries match the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((row) => (
                                    <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className={`${tdClass} rounded-s-lg whitespace-nowrap`}>{row.date}</td>
                                        <td className={`${tdClass} font-mono text-xs text-[#515DEF]`}>{row.voucherNo}</td>
                                        <td className={`${tdClass} font-medium text-[#1E1E1E]`}>{row.ledgerAccount}</td>
                                        <td className={tdClass}>{row.description}</td>
                                        <td className={`${tdClass} text-[#4CAF50] font-medium`}>{row.debit}</td>
                                        <td className={`${tdClass} text-[#FF5722] font-medium`}>{row.credit}</td>
                                        <td className={`${tdClass} font-semibold`}>{row.balance}</td>
                                        <td className={tdClass}>
                                            <span className='text-xs font-medium px-2 py-1 rounded bg-[#515DEF1A] text-[#515DEF] whitespace-nowrap'>
                                                {row.referenceModule}
                                            </span>
                                        </td>
                                        <td className={`${tdClass} rounded-e-lg font-mono text-xs`}>
                                            {row.referenceNo || row.sourceTransactionId || '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </TableCard>
            </div>
        </div>
    )
}

const formatCompactRupee = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
    return formatRupeeAmount(amount)
}

export const buildGeneralLedgerSummary = (entries) => {
    const postedEntries = entries.filter((row) => row.status === 'Posted')

    const totalDebit = postedEntries.reduce(
        (total, row) => total + (row.debit !== '—' ? parseRupeeAmount(row.debit) : 0),
        0,
    )
    const totalCredit = postedEntries.reduce(
        (total, row) => total + (row.credit !== '—' ? parseRupeeAmount(row.credit) : 0),
        0,
    )
    const runningBalance = totalDebit - totalCredit
    const isBalanced = runningBalance === 0

    return [
        {
            label: 'Total Debit',
            value: formatCompactRupee(totalDebit),
            sub: `${postedEntries.filter((row) => row.debit !== '—').length} debit lines`,
            iconTone: 'info',
        },
        {
            label: 'Total Credit',
            value: formatCompactRupee(totalCredit),
            sub: `${postedEntries.filter((row) => row.credit !== '—').length} credit lines`,
            subTone: 'success',
            iconTone: 'success',
        },
        {
            label: 'Running Balance',
            value: isBalanced ? '₹0' : formatRupeeAmount(Math.abs(runningBalance)),
            sub: isBalanced ? 'books balanced' : runningBalance > 0 ? 'debit excess' : 'credit excess',
            subTone: isBalanced ? 'success' : 'danger',
            iconTone: isBalanced ? 'success' : 'warning',
        },
        {
            label: 'Posted Entries',
            value: String(postedEntries.length),
            sub: 'all modules consolidated',
            iconTone: 'info',
        },
    ]
}

export default GeneralLedgerTab
