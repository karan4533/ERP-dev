import React, { useMemo, useState } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    Download,
    EllipsisIcon,
    Eye,
    Pencil,
    Plus,
} from 'lucide-react'
import Dropdown from '../../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import VisibilityRuleFormModal from './VisibilityRuleFormModal'
import {
    VISIBILITY_MODULES,
    VISIBILITY_ROLES,
    VISIBILITY_RULES,
    buildVisibilityPayload,
    createVisibilityRuleId,
    formatPermissionSummary,
    getPermissionLabels,
    permissionBadgeColor,
    toVisibilityForm,
} from './visibilityRulesData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const VisibilityRulesList = () => {
    const [rules, setRules] = useState(VISIBILITY_RULES)
    const [search, setSearch] = useState('')
    const [moduleFilter, setModuleFilter] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [exportModal, setExportModal] = useState(false)
    const [formModal, setFormModal] = useState({ open: false, mode: 'create', rule: null, ruleId: null })

    const filteredRules = useMemo(() => rules.filter((rule) => {
        const searchValue = search.trim().toLowerCase()
        const matchesSearch = !searchValue
            || rule.module.toLowerCase().includes(searchValue)
            || rule.roles.some((role) => role.toLowerCase().includes(searchValue))
            || formatPermissionSummary(rule.permissions).toLowerCase().includes(searchValue)
        const matchesModule = !moduleFilter || rule.module === moduleFilter
        const matchesRole = !roleFilter || rule.roles.includes(roleFilter)

        return matchesSearch && matchesModule && matchesRole
    }), [rules, search, moduleFilter, roleFilter])

    const clearFilters = () => {
        setSearch('')
        setModuleFilter('')
        setRoleFilter('')
    }

    const openCreateModal = () => {
        setFormModal({ open: true, mode: 'create', rule: null, ruleId: null })
    }

    const openEditModal = (rule) => {
        setFormModal({
            open: true,
            mode: 'edit',
            ruleId: rule.id,
            rule: toVisibilityForm(rule),
        })
    }

    const openViewModal = (rule) => {
        setFormModal({
            open: true,
            mode: 'view',
            ruleId: rule.id,
            rule: toVisibilityForm(rule),
        })
    }

    const closeFormModal = () => {
        setFormModal({ open: false, mode: 'create', rule: null, ruleId: null })
    }

    const handleSave = (formData) => {
        const payload = buildVisibilityPayload(formData)

        if (formModal.mode === 'edit' && formModal.ruleId) {
            setRules((prev) => prev.map((rule) => (
                rule.id === formModal.ruleId
                    ? { ...rule, ...payload }
                    : rule
            )))
        } else {
            setRules((prev) => [
                {
                    id: createVisibilityRuleId(prev),
                    ...payload,
                },
                ...prev,
            ])
        }

        closeFormModal()
    }

    const handleDelete = (ruleId) => {
        setRules((prev) => prev.filter((rule) => rule.id !== ruleId))
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <p className='text-sm text-[#667085] mb-4'>
                    Control who can view, create, edit, and approve actions across audit modules and roles.
                </p>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full'>
                        <option value=''>From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='visibility-search' className='text-base font-medium text-[#808080]'>Search</label>
                        <input
                            type='text'
                            id='visibility-search'
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder='Module, role, permission...'
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='visibility-module-filter' className='text-base font-medium text-[#808080]'>Module</label>
                        <select
                            id='visibility-module-filter'
                            value={moduleFilter}
                            onChange={(event) => setModuleFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {VISIBILITY_MODULES.map((module) => (
                                <option key={module} value={module}>{module}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='visibility-role-filter' className='text-base font-medium text-[#808080]'>Role</label>
                        <select
                            id='visibility-role-filter'
                            value={roleFilter}
                            onChange={(event) => setRoleFilter(event.target.value)}
                            className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                        >
                            <option value=''>All</option>
                            {VISIBILITY_ROLES.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-3'>Example Access Matrix</h3>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='bg-[#EDEEF5]'>
                                <th className='px-4 py-2 text-left text-xs font-semibold uppercase text-[#0C1E5B]'>Module</th>
                                <th className='px-4 py-2 text-left text-xs font-semibold uppercase text-[#0C1E5B]'>Role</th>
                                <th className='px-4 py-2 text-left text-xs font-semibold uppercase text-[#0C1E5B]'>Permission</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { module: 'Audit', role: 'Process Auditor', permission: 'Create' },
                                { module: 'Observation', role: 'Process Auditor', permission: 'Create' },
                                { module: 'RCA', role: 'Employee', permission: 'Submit' },
                                { module: 'ATR', role: 'Employee', permission: 'Submit' },
                                { module: 'Reports', role: 'JD Audit', permission: 'View' },
                                { module: 'Reports', role: 'Super Admin', permission: 'View' },
                            ].map((row) => (
                                <tr key={`${row.module}-${row.role}`} className='border-b border-[#F2F4F7]'>
                                    <td className='px-4 py-2 text-[#1E1E1E]'>{row.module}</td>
                                    <td className='px-4 py-2 text-[#667085]'>{row.role}</td>
                                    <td className='px-4 py-2'>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${permissionBadgeColor[row.permission] || 'bg-[#EDEEF5] text-[#667085]'}`}>
                                            {row.permission}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Visibility Rules</h2>
                    <div className='flex gap-x-2'>
                        <button
                            type='button'
                            onClick={openCreateModal}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Create Rule
                        </button>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Module</th>
                                <th className={thClass}>Role</th>
                                <th className={thClass}>Permission</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRules.map((rule) => {
                                const permissionLabels = getPermissionLabels(rule.permissions)
                                return (
                                    <tr key={rule.id} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                        <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{rule.module}</td>
                                        <td className={tdClass}>
                                            <div className='flex flex-wrap gap-1'>
                                                {rule.roles.map((role) => (
                                                    <span key={role} className='text-xs px-2 py-0.5 rounded bg-[#EDEEF5] text-[#667085]'>
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className={tdClass}>
                                            <div className='flex flex-wrap gap-1'>
                                                {permissionLabels.map((label) => (
                                                    <span
                                                        key={label}
                                                        className={`text-xs font-semibold px-2 py-1 rounded-lg ${permissionBadgeColor[label] || 'bg-[#EDEEF5] text-[#667085]'}`}
                                                    >
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className={`${tdClass} text-center rounded-e-lg`}>
                                            <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                                <button
                                                    type='button'
                                                    onClick={() => openViewModal(rule)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => openEditModal(rule)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer flex items-center gap-2'
                                                >
                                                    <Pencil size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => handleDelete(rule.id)}
                                                    className='w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer'
                                                >
                                                    Delete
                                                </button>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredRules.length === 0 && (
                    <p className='text-sm text-[#667085] text-center py-8'>No visibility rules match the selected filters.</p>
                )}
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing 1 to {filteredRules.length} of {filteredRules.length} entries
                </p>
                <div className='flex justify-center gap-x-2 flex-wrap'>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] hover:bg-[#515DEF] hover:text-white border border-[#E2E8F0] rounded-full cursor-pointer'>
                        1
                    </button>
                    <button type='button' className='size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <VisibilityRuleFormModal
                isOpen={formModal.open}
                mode={formModal.mode}
                initialData={formModal.rule}
                onClose={closeFormModal}
                onSave={handleSave}
            />
        </section>
    )
}

export default VisibilityRulesList
