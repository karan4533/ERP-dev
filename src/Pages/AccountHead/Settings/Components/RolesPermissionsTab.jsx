import React from 'react'
import { Plus } from 'lucide-react'
import { ROLE_PERMISSIONS, permissionBadgeColor } from '../settingsData'
import { SettingsPanel, tdClass, thClass } from './SettingsShared'

const PermissionBadge = ({ value }) => (
    <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${permissionBadgeColor[value]}`}>
        {value}
    </span>
)

const RolesPermissionsTab = () => (
    <div className='space-y-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E]'>Finance module access by role</h3>
                <p className='text-sm text-[#667085] mt-1'>
                    Finance Manager has full CRUD access across all modules below
                </p>
            </div>
            <button
                type='button'
                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <Plus size={16} />
                Add Role Override
            </button>
        </div>

        <SettingsPanel>
            <div className='relative overflow-x-auto'>
                <table className='w-full text-sm text-left min-w-[720px]'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Role</th>
                            <th className={thClass}>Fees Mgmt.</th>
                            <th className={thClass}>Transport Fin.</th>
                            <th className={thClass}>Accounting</th>
                            <th className={thClass}>Approvals</th>
                            <th className={`${thClass} rounded-e-lg`}>Reports</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ROLE_PERMISSIONS.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>
                                    {row.role}
                                </td>
                                <td className={tdClass}><PermissionBadge value={row.fees} /></td>
                                <td className={tdClass}><PermissionBadge value={row.transport} /></td>
                                <td className={tdClass}><PermissionBadge value={row.accounting} /></td>
                                <td className={tdClass}><PermissionBadge value={row.approvals} /></td>
                                <td className={`${tdClass} rounded-e-lg`}><PermissionBadge value={row.reports} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </SettingsPanel>
    </div>
)

export default RolesPermissionsTab
