import { DataTable, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { ROLE_PERMISSIONS } from '../settingsData'
import { SettingsPanel } from './SettingsShared'

const permission = (value) => <StatusBadge status={value} />
const columns = [
    { key: 'role', label: 'Role', required: true },
    { key: 'fees', label: 'Fees management', render: (row) => permission(row.fees) },
    { key: 'transport', label: 'Transport finance', render: (row) => permission(row.transport) },
    { key: 'accounting', label: 'Accounting', render: (row) => permission(row.accounting) },
    { key: 'approvals', label: 'Approvals', render: (row) => permission(row.approvals) },
    { key: 'reports', label: 'Reports', render: (row) => permission(row.reports) },
]

const RolesPermissionsTab = () => (
    <div className='space-y-5'>
        <IntegrationNotice state='demo' title='Permission matrix is read-only' description='This sample matrix does not grant or revoke access. Authoritative RBAC changes require identity-service policy validation, segregation-of-duties checks and audit history.' />
        <SettingsPanel title='Finance module access by role' sub='Reference access levels for finance-facing modules.'>
            <DataTable caption='Finance role permission matrix' rows={ROLE_PERMISSIONS} columns={columns} rowKey='id' emptyTitle='No role permissions available' emptyDescription='Connect the identity service to load the finance permission matrix.' renderActions={() => <button type='button' disabled title='Role overrides require the connected identity service.' className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Override unavailable</button>} />
        </SettingsPanel>
    </div>
)

export default RolesPermissionsTab
