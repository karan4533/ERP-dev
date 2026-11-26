import { Building2, FileSpreadsheet, Fingerprint, Mail, MessageCircle, QrCode } from 'lucide-react'
import { DataTable, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { INTEGRATIONS } from '../settingsData'
import { SettingsPanel } from './SettingsShared'

const INTEGRATION_ICONS = { bank: Building2, qr: QrCode, whatsapp: MessageCircle, mail: Mail, fingerprint: Fingerprint, spreadsheet: FileSpreadsheet }
const IntegrationName = ({ row }) => {
    const Icon = INTEGRATION_ICONS[row.icon] ?? Building2
    return <span className='inline-flex items-center gap-2 font-semibold text-[var(--erp-ink)]'><Icon aria-hidden='true' size={16} /> {row.service}</span>
}
const columns = [
    { key: 'service', label: 'Service', required: true, render: (row) => <IntegrationName row={row} /> },
    { key: 'purpose', label: 'Purpose', required: true },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
]

const IntegrationsTab = () => (
    <div className='space-y-5'>
        <IntegrationNotice state='unavailable' title='Integration administration disconnected' description='Statuses are sample reference values. Credentials, OAuth consent, secrets, health checks and webhooks must be managed by secure backend integration services.' />
        <SettingsPanel title='Connected services reference'>
            <DataTable caption='Finance integration register' rows={INTEGRATIONS} columns={columns} rowKey='id' emptyTitle='No integrations listed' emptyDescription='Connect the integration service to load configured providers.' renderActions={() => <button type='button' disabled title='Integration configuration requires the secure backend service.' className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Configuration unavailable</button>} />
        </SettingsPanel>
    </div>
)

export default IntegrationsTab
