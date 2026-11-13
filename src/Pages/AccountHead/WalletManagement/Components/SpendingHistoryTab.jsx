import { useMemo, useState } from 'react'
import { DataTable, DataToolbar, IntegrationNotice } from '../../../../Common/ui'
import {
    matchesWalletRole,
    SPENDING_HISTORY,
    SPENDING_SUMMARY,
} from '../walletManagementData'
import { RoleChip, SummaryCards, UserAvatar } from './WalletShared'

const CATEGORY_FILTERS = ['All categories', 'Canteen', 'Stationery', 'Events', 'Other']

const SpendingHistoryTab = ({ spendingHistory = SPENDING_HISTORY, initialRole = 'All Roles' }) => {
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState(CATEGORY_FILTERS[0])
    const rows = useMemo(() => spendingHistory.filter((row) => {
        if (!matchesWalletRole(row.role, initialRole)) return false
        if (category !== CATEGORY_FILTERS[0] && row.category !== category) return false
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return true
        return [row.id, row.user, row.role, row.vendor, row.category, row.dateTime, row.amount]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
    }), [category, initialRole, query, spendingHistory])
    const columns = [
        { key: 'user', label: 'User', required: true, render: (row) => <UserAvatar initials={row.initials} name={row.user} /> },
        { key: 'role', label: 'Role', render: (row) => <RoleChip role={row.role} /> },
        { key: 'vendor', label: 'Vendor / item', required: true },
        { key: 'category', label: 'Category', render: (row) => <span className='inline-flex rounded-full bg-[var(--erp-indigo-soft)] px-2 py-1 text-xs font-semibold text-[var(--erp-indigo)]'>{row.category}</span> },
        { key: 'dateTime', label: 'Date & time' },
        { key: 'amount', label: 'Amount', render: (row) => <span className='font-semibold text-[var(--erp-danger)]'>{row.amount}</span> },
    ]
    const resetFilters = () => {
        setQuery('')
        setCategory(CATEGORY_FILTERS[0])
    }

    return (
        <div className='space-y-5'>
            <IntegrationNotice state='demo' title='Sample spending reference' description='Spending rows and summary cards are demonstration records. Production disputes, merchant evidence and balance effects require the connected wallet ledger.' />
            <SummaryCards cards={SPENDING_SUMMARY} />
            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='wallet-spending-register-title'>
                <div className='px-4 pt-4 sm:px-5'><h3 id='wallet-spending-register-title' className='text-base font-semibold text-[var(--erp-ink)]'>Spending history</h3></div>
                <DataToolbar
                    query={query}
                    onQueryChange={setQuery}
                    searchLabel='Search wallet spending'
                    searchPlaceholder='User, vendor, category or amount…'
                    resultCount={rows.length}
                    onReset={resetFilters}
                    filters={(
                        <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Category
                            <select value={category} onChange={(event) => setCategory(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                {CATEGORY_FILTERS.map((item) => <option key={item}>{item}</option>)}
                            </select>
                        </label>
                    )}
                />
                <DataTable caption='Wallet spending history' rows={rows} columns={columns} rowKey='id' emptyTitle='No spending records found' emptyDescription='Reset the filters or choose another role to review the sample spending history.' />
            </section>
        </div>
    )
}

export default SpendingHistoryTab
