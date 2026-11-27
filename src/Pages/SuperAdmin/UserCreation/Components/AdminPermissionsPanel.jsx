import React from 'react'
import { ADMIN_PERMISSION_MODULES, MODULE_PERMISSIONS_NOTICE } from '../adminUsersData'

const selectableModules = ADMIN_PERMISSION_MODULES.filter((module) => !module.alwaysOn)

const AdminPermissionsPanel = ({
    permissions,
    onToggle,
    onToggleAll,
    disabled = false,
    previewOnly = false,
}) => {
    const selectedCount = selectableModules.filter((module) => permissions[module.key]).length
    const totalCount = selectableModules.length
    const allSelected = selectedCount === totalCount
    const locked = disabled || previewOnly

    return (
        <div>
            <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
                <label className='text-sm font-medium text-[#808080]'>
                    {previewOnly ? 'Module map (informational)' : 'Module Permissions'}
                </label>
                {!locked && (
                    <button
                        type='button'
                        onClick={() => onToggleAll(!allSelected)}
                        className='text-xs font-semibold text-[#515DEF] hover:underline cursor-pointer'
                    >
                        {allSelected ? 'Clear All' : 'Select All'}
                    </button>
                )}
            </div>
            {previewOnly && (
                <p className='text-xs text-[#92400E] mb-3'>
                    Checkboxes are disabled. {MODULE_PERMISSIONS_NOTICE}
                </p>
            )}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 rounded-xl border border-[#EDEEF5] p-3 bg-[#FAFAFA]'>
                {selectableModules.map((module) => (
                    <label
                        key={module.key}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                            permissions[module.key]
                                ? 'bg-[#515DEF1A] text-[#515DEF] border border-[#515DEF33]'
                                : 'bg-white text-[#667085] border border-[#EDEEF5]'
                        } ${locked ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
                    >
                        <input
                            type='checkbox'
                            checked={Boolean(permissions[module.key])}
                            onChange={() => onToggle(module.key)}
                            disabled={locked}
                            className='accent-[#515DEF]'
                        />
                        {module.label}
                    </label>
                ))}
            </div>
            <p className='text-xs text-[#667085] mt-2'>
                {previewOnly
                    ? 'Shown for orientation only. Server access follows the Admin role permission matrix.'
                    : `${selectedCount} of ${totalCount} modules selected. Dashboard access is always enabled for administrators.`}
            </p>
        </div>
    )
}

export default AdminPermissionsPanel
