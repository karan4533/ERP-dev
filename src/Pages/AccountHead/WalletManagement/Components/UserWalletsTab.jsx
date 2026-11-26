import { useMemo, useState } from 'react'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { matchesWalletRole, USER_WALLETS, USER_WALLETS_SUMMARY } from '../walletManagementData'
import { RoleChip, SummaryCards, UserAvatar } from './WalletShared'

const STATUS_FILTERS = ['All Status', 'Active', 'Zero Balance', 'Frozen', 'Flagged']
const UserWalletsTab = ({ userWallets = USER_WALLETS, initialRole = 'All Roles' }) => {
    const [query, setQuery] = useState('')
    const [status, setStatus] = useState(STATUS_FILTERS[0])
    const rows = useMemo(() => userWallets.filter((row) => {
        if (!matchesWalletRole(row.role, initialRole)) return false
        if (status !== STATUS_FILTERS[0] && row.status !== status) return false
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return true
        return [row.name, row.email, row.role, row.walletId, row.balance, row.status].join(' ').toLowerCase().includes(normalizedQuery)
    }), [initialRole, query, status, userWallets])
    const columns = [
        { key: 'name', label: 'User', required: true, render: (row) => <UserAvatar initials={row.initials} name={row.name} /> },
        { key: 'role', label: 'Role', render: (row) => <RoleChip role={row.role} /> },
        { key: 'walletId', label: 'Wallet ID', render: (row) => <span className='font-mono text-xs'>{row.walletId}</span> },
        { key: 'balance', label: 'Balance', render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{row.balance}</span> },
        { key: 'lastRecharge', label: 'Last credit' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]

    return (
        <div className='space-y-5'>
            <IntegrationNotice state='demo' title='Sample wallet population' description='Summary cards and seeded wallets are browser demonstration records, not balances from an authoritative wallet ledger.' />
            <SummaryCards cards={USER_WALLETS_SUMMARY} />
            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='wallet-register-title'>
                <div className='px-4 pt-4 sm:px-5'><h3 id='wallet-register-title' className='text-base font-semibold text-[var(--erp-ink)]'>User wallet register</h3></div>
                <DataToolbar query={query} onQueryChange={setQuery} searchLabel='Search user wallets' searchPlaceholder='Name, email, role or wallet ID…' resultCount={rows.length} onReset={() => { setQuery(''); setStatus(STATUS_FILTERS[0]) }} filters={(
                    <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Status
                        <select value={status} onChange={(event) => setStatus(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{STATUS_FILTERS.map((item) => <option key={item}>{item}</option>)}</select>
                    </label>
                )} />
                <DataTable caption='User wallet register' rows={rows} columns={columns} rowKey='id' emptyTitle='No wallets found' emptyDescription='Reset the filters to see other browser-stored wallets.' renderActions={() => <button type='button' disabled title='Wallet ledger detail requires the connected wallet API.' className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Ledger unavailable</button>} />
            </section>
        </div>
    )
}

export default UserWalletsTab
