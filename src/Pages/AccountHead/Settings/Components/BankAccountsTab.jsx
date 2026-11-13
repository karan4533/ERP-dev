import { DataTable, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { useFinance } from '../../financeDomain/FinanceContext'
import { SettingsPanel } from './SettingsShared'

const columns = [
    { key: 'name', label: 'Account name', required: true },
    { key: 'bankName', label: 'Bank', required: true },
    { key: 'accountNumber', label: 'Account number', render: (row) => <span className='font-mono text-xs'>{row.accountNumber}</span> },
    { key: 'enabled', label: 'Status', render: (row) => <StatusBadge status={row.enabled ? 'Enabled' : 'Disabled'} /> },
]

const BankAccountsTab = () => {
    const { bankAccounts } = useFinance()
    return <div className='space-y-5'><IntegrationNotice state='demo' title='Browser-stored bank master' description='These accounts support local finance demonstrations only. Production account changes require restricted permissions, validation, encryption and immutable audit history.' /><SettingsPanel title='Bank accounts' sub='Used for local bank-transfer collections, bank book and reconciliation previews.'><DataTable caption='Finance bank account register' rows={bankAccounts} columns={columns} rowKey='id' emptyTitle='No bank accounts configured' emptyDescription='Connect the finance configuration API to maintain bank masters.' renderActions={() => <button type='button' disabled title='Bank master editing requires the connected finance API.' className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Edit unavailable</button>} /></SettingsPanel></div>
}

export default BankAccountsTab
