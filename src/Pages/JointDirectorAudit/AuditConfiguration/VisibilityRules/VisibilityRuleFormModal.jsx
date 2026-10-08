import React, { useEffect, useState } from 'react'
import { Save, X } from 'lucide-react'
import {
    DEFAULT_VISIBILITY_FORM,
    PERMISSION_FIELDS,
    VISIBILITY_MODULES,
    VISIBILITY_ROLES,
} from './visibilityRulesData'

const selectClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full bg-white focus:outline-none focus:border-[#515DEF]'

const VisibilityRuleFormModal = ({
    isOpen,
    mode = 'create',
    initialData,
    onClose,
    onSave,
}) => {
    const [form, setForm] = useState(DEFAULT_VISIBILITY_FORM)
    const isViewMode = mode === 'view'

    useEffect(() => {
        if (isOpen) {
            setForm(initialData ? {
                ...initialData,
                roles: [...(initialData.roles || [])],
                permissions: {
                    ...DEFAULT_VISIBILITY_FORM.permissions,
                    ...initialData.permissions,
                },
            } : { ...DEFAULT_VISIBILITY_FORM, permissions: { ...DEFAULT_VISIBILITY_FORM.permissions } })
        }
    }, [isOpen, initialData])

    const toggleRole = (role) => {
        if (isViewMode) return
        setForm((prev) => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter((item) => item !== role)
                : [...prev.roles, role],
        }))
    }

    const togglePermission = (key) => {
        if (isViewMode) return
        setForm((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key],
            },
        }))
    }

    if (!isOpen) return null

    const title = mode === 'edit' ? 'Edit Visibility Rule' : mode === 'view' ? 'View Visibility Rule' : 'Create Visibility Rule'

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <h2 className='text-lg font-semibold text-[#1E1E1E]'>{title}</h2>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer'
                        aria-label='Close modal'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='px-6 py-5 space-y-5'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='visibility-module' className='text-sm font-medium text-[#808080]'>Module</label>
                        <select
                            id='visibility-module'
                            value={form.module}
                            onChange={(event) => setForm((prev) => ({ ...prev, module: event.target.value }))}
                            disabled={isViewMode}
                            className={selectClass}
                        >
                            <option value=''>Select module</option>
                            {VISIBILITY_MODULES.map((module) => (
                                <option key={module} value={module}>{module}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className='text-sm font-medium text-[#808080] block mb-3'>Role</label>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-[#EDEEF5] p-3 bg-[#FAFAFA]'>
                            {VISIBILITY_ROLES.map((role) => {
                                const selected = form.roles.includes(role)
                                return (
                                    <label
                                        key={role}
                                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${
                                            selected
                                                ? 'bg-[#515DEF1A] text-[#515DEF] border border-[#515DEF33]'
                                                : 'bg-white text-[#667085] border border-[#EDEEF5]'
                                        } ${isViewMode ? 'cursor-default' : ''}`}
                                    >
                                        <input
                                            type='checkbox'
                                            checked={selected}
                                            onChange={() => toggleRole(role)}
                                            disabled={isViewMode}
                                            className='accent-[#515DEF]'
                                        />
                                        {role}
                                    </label>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <label className='text-sm font-medium text-[#808080] block mb-3'>Permission</label>
                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-[#EDEEF5] p-3 bg-[#FAFAFA]'>
                            {PERMISSION_FIELDS.map((field) => (
                                <label
                                    key={field.key}
                                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer ${
                                        form.permissions[field.key]
                                            ? 'bg-[#515DEF1A] text-[#515DEF] border border-[#515DEF33]'
                                            : 'bg-white text-[#667085] border border-[#EDEEF5]'
                                    } ${isViewMode ? 'cursor-default' : ''}`}
                                >
                                    <input
                                        type='checkbox'
                                        checked={form.permissions[field.key]}
                                        onChange={() => togglePermission(field.key)}
                                        disabled={isViewMode}
                                        className='accent-[#515DEF]'
                                    />
                                    {field.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className='flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-[#F2F4F7] bg-[#FAFAFA]'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='sm:min-w-[120px] text-sm font-medium text-[#667085] border border-[#D9D9D9] bg-white px-5 py-2.5 rounded-md hover:bg-[#F9F9F9] transition-colors cursor-pointer'
                    >
                        {isViewMode ? 'Close' : 'Cancel'}
                    </button>
                    {!isViewMode && (
                        <button
                            type='button'
                            onClick={() => onSave(form)}
                            className='inline-flex items-center justify-center gap-2 sm:min-w-[140px] bg-[#515DEF] text-white text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-all cursor-pointer'
                        >
                            Save
                            <Save size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default VisibilityRuleFormModal
