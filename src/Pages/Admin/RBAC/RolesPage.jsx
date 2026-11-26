import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import {
    DataTable,
    DataToolbar,
    IntegrationNotice,
    PageHeader,
    Pagination,
    StatusBadge,
    Surface,
} from '../../../Common/ui'
import {
    ROLE_PERMISSION_MODULES,
    getAllRolesForManagement,
    getPermissionsForRole,
    hasPermissionConfigurationForRole,
} from '../../../Common/RBAC/rolePermissionsData'
import { paginateRows } from '../../../Common/ui/dataTableState'

const EDITABLE_ROLES = ['teacher', 'coordinator']
const ENFORCED_MODULE_KEYS = ['lessonPlans', 'taskManagement', 'unitTests', 'markEntry', 'deliverables']
const editableModules = ROLE_PERMISSION_MODULES.filter((module) => ENFORCED_MODULE_KEYS.includes(module.key))

/**
 * Legacy root UI: permission matrix is read-only.
 * Writes live in ERP_QMIS via GET/PATCH /api/v1/rbac/roles/{id}/permissions.
 */
const RolesPage = () => {
    const roles = getAllRolesForManagement()
    const [selectedRole, setSelectedRole] = useState('teacher')
    const [draftPermissions, setDraftPermissions] = useState(() => getPermissionsForRole('teacher'))
    const [configured, setConfigured] = useState(() => hasPermissionConfigurationForRole('teacher'))
    const [roleQuery, setRoleQuery] = useState('')
    const [catalogPage, setCatalogPage] = useState(1)
    const [catalogPageSize, setCatalogPageSize] = useState(5)
    const filteredRoles = roles.filter((role) => [role.label, role.id]
        .some((value) => value.toLowerCase().includes(roleQuery.trim().toLowerCase())))
    const rolePagination = paginateRows(filteredRoles, { page: catalogPage, pageSize: catalogPageSize })

    const chooseRole = (role) => {
        const permissions = getPermissionsForRole(role)
        setSelectedRole(role)
        setDraftPermissions(permissions)
        setConfigured(hasPermissionConfigurationForRole(role))
    }

    const columns = [
        { key: 'label', label: 'Role', required: true, render: (role) => <span className='font-semibold text-[var(--erp-ink)]'>{role.label}</span> },
        { key: 'id', label: 'Role key' },
        {
            key: 'scope',
            label: 'Current UI enforcement',
            render: (role) => EDITABLE_ROLES.includes(role.id)
                ? <StatusBadge status='Active' label='Navigation enforced' />
                : <StatusBadge status='Pending' label='Backend policy pending' />,
        },
        {
            key: 'configuration',
            label: 'Configuration',
            render: (role) => EDITABLE_ROLES.includes(role.id)
                ? (hasPermissionConfigurationForRole(role.id) ? 'Custom policy' : 'Existing navigation fallback')
                : 'View only',
        },
    ]

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Roles and access'
                description='Review every ERP role and the module navigation currently enforced by this frontend.'
                context={`${roles.length} system roles · read-only matrix on legacy UI`}
            />

            <IntegrationNotice
                state='failed'
                title='Permission writes disabled on legacy UI'
                description='This page is view-only. Role permission changes persist only through ERP_QMIS Admin RBAC, which calls PATCH /api/v1/rbac/roles/{id}/permissions.'
            />

            <div className='grid grid-cols-1 gap-5 xl:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.25fr)]'>
                <Surface title='Role policy (read-only)' description='Teacher and Coordinator module visibility is shown for reference only.' contentClassName='p-4 sm:p-5'>
                    <label className='grid gap-1.5 text-sm font-semibold text-[var(--erp-ink)]'>Role
                        <select value={selectedRole} onChange={(event) => chooseRole(event.target.value)} className='min-h-11 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>
                            <option value='teacher'>Teacher</option>
                            <option value='coordinator'>Coordinator</option>
                        </select>
                    </label>

                    <div className='mt-5 rounded-xl border border-[var(--erp-line)] bg-[var(--erp-canvas)] p-4'>
                        <div className='flex items-center gap-2'>
                            <ShieldCheck aria-hidden='true' size={18} className='text-[var(--erp-indigo)]' />
                            <p className='text-sm font-semibold text-[var(--erp-ink)]'>Dashboard access is always on</p>
                        </div>
                        <p className='mt-1 text-xs text-[var(--erp-muted)]'>This prevents a role from losing its safe landing page.</p>
                    </div>

                    <fieldset className='mt-5 space-y-2' disabled>
                        <legend className='mb-2 text-sm font-semibold text-[var(--erp-ink)]'>Module navigation</legend>
                        {editableModules.map((module) => (
                            <label key={module.key} className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 opacity-80 ${draftPermissions[module.key] ? 'border-[var(--erp-indigo)] bg-[var(--erp-indigo-soft)]' : 'border-[var(--erp-line)] bg-white'}`}>
                                <span>
                                    <span className='block text-sm font-semibold text-[var(--erp-ink)]'>{module.label}</span>
                                    <span className='block text-xs text-[var(--erp-muted)]'>{draftPermissions[module.key] ? 'Visible in role navigation' : 'Hidden from role navigation'}</span>
                                </span>
                                <input type='checkbox' checked={Boolean(draftPermissions[module.key])} readOnly className='size-4 accent-[var(--erp-indigo)]' />
                            </label>
                        ))}
                    </fieldset>

                    {!configured && (
                        <p className='mt-4 rounded-xl border border-[#FF980044] bg-[#FFF8E8] p-3 text-sm text-[#8A4B08]'>
                            This role currently uses its existing navigation fallback. Use ERP_QMIS Admin RBAC to persist changes on the server.
                        </p>
                    )}
                </Surface>

                <Surface title='System role catalog' description='Roles outside the supported frontend policy editor remain view-only.'>
                    <DataToolbar
                        query={roleQuery}
                        onQueryChange={(value) => { setRoleQuery(value); setCatalogPage(1) }}
                        searchPlaceholder='Search system roles'
                        resultCount={filteredRoles.length}
                        onReset={() => { setRoleQuery(''); setCatalogPage(1) }}
                    />
                    <DataTable caption='System roles' rows={rolePagination.rows} columns={columns} rowKey='id' />
                    <Pagination
                        {...rolePagination}
                        onPageChange={setCatalogPage}
                        onPageSizeChange={(value) => { setCatalogPageSize(value); setCatalogPage(1) }}
                        pageSizeOptions={[5, 10, 25]}
                    />
                </Surface>
            </div>
        </section>
    )
}

export default RolesPage
