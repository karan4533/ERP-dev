import { DataTable, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { useFinance } from '../../financeDomain/FinanceContext'
import { SettingsPanel } from './SettingsShared'

const columns = [
    { key: 'name', label: 'Terminal', required: true },
    { key: 'terminalId', label: 'Terminal ID', render: (row) => <span className='font-mono text-xs'>{row.terminalId}</span> },
    { key: 'provider', label: 'Provider', required: true },
    { key: 'enabled', label: 'Status', render: (row) => <StatusBadge status={row.enabled ? 'Enabled' : 'Disabled'} /> },
]

const PosTerminalsTab = () => {
    const { posTerminals } = useFinance()
    return <div className='space-y-5'><IntegrationNotice state='demo' title='Terminal configuration disconnected' description='Terminal records are browser demonstration data. Credentials, device verification and settlement mapping must be managed by the payment integration service.' /><SettingsPanel title='POS / swipe terminals' sub='Vendor-neutral terminal reference; no credentials are stored in this frontend.'><DataTable caption='POS terminal register' rows={posTerminals} columns={columns} rowKey='id' emptyTitle='No terminals configured' emptyDescription='Connect the payment configuration service to maintain terminals.' renderActions={() => <button type='button' disabled title='Terminal editing requires the connected payment service.' className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Edit unavailable</button>} /></SettingsPanel></div>
}

export default PosTerminalsTab
