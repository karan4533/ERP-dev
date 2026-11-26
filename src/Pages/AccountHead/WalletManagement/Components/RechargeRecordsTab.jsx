import { useMemo, useState } from 'react'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import {
    matchesWalletRole,
    RECHARGE_RECORDS,
    RECHARGE_SUMMARY,
} from '../walletManagementData'
import { RoleChip, SummaryCards, UserAvatar } from './WalletShared'

const MODE_FILTERS = ['All modes', 'UPI', 'Card', 'Net Banking', 'Offline']
const STATUS_FILTERS = ['All statuses', 'Success', 'Failed', 'Refunded']

const RechargeRecordsTab = ({ rechargeRecords = RECHARGE_RECORDS, initialRole = 'All Roles' }) => {
    const [query, setQuery] = useState('')
    const [mode, setMode] = useState(MODE_FILTERS[0])
    const [status, setStatus] = useState(STATUS_FILTERS[0])
    const rows = useMemo(() => rechargeRecords.filter((row) => {
        if (!matchesWalletRole(row.role, initialRole)) return false
        if (mode !== MODE_FILTERS[0] && row.mode !== mode) return false
        if (status !== STATUS_FILTERS[0] && row.status !== status) return false
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return true
        return [row.id, row.user, row.role, row.mode, row.amount, row.dateTime, row.status]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
    }), [initialRole, mode, query, rechargeRecords, status])
    const columns = [
        { key: 'id', label: 'Transaction', required: true, render: (row) => <span className='font-mono text-xs'>{row.id}</span> },
        { key: 'user', label: 'User', required: true, render: (row) => <UserAvatar initials={row.initials} name={row.user} /> },
        { key: 'role', label: 'Role', render: (row) => <RoleChip role={row.role} /> },
        { key: 'mode', label: 'Mode' },
        { key: 'amount', label: 'Amount', render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{row.amount}</span> },
        { key: 'dateTime', label: 'Date & time' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]
    const resetFilters = () => {
        setQuery('')
        setMode(MODE_FILTERS[0])
        setStatus(STATUS_FILTERS[0])
    }

    return (
        <div className='space-y-5'>
            <IntegrationNotice state='demo' title='Browser-stored recharge evidence' description='These records combine seeded examples with local cash credits created in this session. Online gateway status, settlement and refund state require the wallet ledger API.' />
            <SummaryCards cards={RECHARGE_SUMMARY} />
            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='wallet-recharge-register-title'>
                <div className='px-4 pt-4 sm:px-5'><h3 id='wallet-recharge-register-title' className='text-base font-semibold text-[var(--erp-ink)]'>Recharge transaction register</h3></div>
                <DataToolbar
                    query={query}
                    onQueryChange={setQuery}
                    searchLabel='Search recharge records'
                    searchPlaceholder='Transaction, user, mode or amount…'
                    resultCount={rows.length}
                    onReset={resetFilters}
                    filters={(
                        <>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Mode
                                <select value={mode} onChange={(event) => setMode(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                    {MODE_FILTERS.map((item) => <option key={item}>{item}</option>)}
                                </select>
                            </label>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Status
                                <select value={status} onChange={(event) => setStatus(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                                    {STATUS_FILTERS.map((item) => <option key={item}>{item}</option>)}
                                </select>
                            </label>
                        </>
                    )}
                />
                <DataTable caption='Wallet recharge transaction register' rows={rows} columns={columns} rowKey='id' emptyTitle='No recharge records found' emptyDescription='Reset the filters or choose another role to review available recharge evidence.' />
            </section>
        </div>
    )
}

export default RechargeRecordsTab
