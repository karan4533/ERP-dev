import React, { useEffect, useState } from 'react'
import { Rocket, Save, X } from 'lucide-react'
import {
    DEFAULT_TEMPLATE_FORM,
    TEMPLATE_AUDIT_CATEGORIES,
    TEMPLATE_DEPARTMENTS,
} from './auditTemplatesData'

const inputClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full focus:outline-none focus:border-[#515DEF]'

const selectClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full bg-white focus:outline-none focus:border-[#515DEF]'

const AuditTemplateFormModal = ({
    isOpen,
    mode = 'create',
    initialData,
    onClose,
    onSaveDraft,
    onPublish,
}) => {
    const [form, setForm] = useState(DEFAULT_TEMPLATE_FORM)
    const isViewMode = mode === 'view'

    useEffect(() => {
        if (isOpen) {
            setForm(initialData ? { ...initialData } : { ...DEFAULT_TEMPLATE_FORM })
        }
    }, [isOpen, initialData])

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSaveDraft = () => {
        onSaveDraft({ ...form, status: 'Draft' })
    }

    const handlePublish = () => {
        onPublish({ ...form, status: 'Published' })
    }

    if (!isOpen) return null

    const title = mode === 'edit' ? 'Edit Audit Template' : mode === 'view' ? 'View Audit Template' : 'Create Audit Template'

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

                <div className='px-6 py-5'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='template-name' className='text-sm font-medium text-[#808080]'>Template Name</label>
                            <input
                                id='template-name'
                                type='text'
                                value={form.templateName}
                                onChange={(event) => updateField('templateName', event.target.value)}
                                placeholder='Enter template name'
                                disabled={isViewMode}
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='template-department' className='text-sm font-medium text-[#808080]'>Department</label>
                            <select
                                id='template-department'
                                value={form.department}
                                onChange={(event) => updateField('department', event.target.value)}
                                disabled={isViewMode}
                                className={selectClass}
                            >
                                <option value=''>Select department</option>
                                {TEMPLATE_DEPARTMENTS.map((department) => (
                                    <option key={department} value={department}>{department}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='template-category' className='text-sm font-medium text-[#808080]'>Audit Category</label>
                            <select
                                id='template-category'
                                value={form.auditCategory}
                                onChange={(event) => updateField('auditCategory', event.target.value)}
                                disabled={isViewMode}
                                className={selectClass}
                            >
                                <option value=''>Select audit category</option>
                                {TEMPLATE_AUDIT_CATEGORIES.map((category) => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='template-version' className='text-sm font-medium text-[#808080]'>Version</label>
                            <input
                                id='template-version'
                                type='text'
                                value={form.version}
                                readOnly
                                className={`${inputClass} bg-[#F9FAFB] text-[#667085]`}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='template-status' className='text-sm font-medium text-[#808080]'>Status</label>
                            <select
                                id='template-status'
                                value={form.status}
                                onChange={(event) => updateField('status', event.target.value)}
                                disabled={isViewMode}
                                className={selectClass}
                            >
                                <option value='Draft'>Draft</option>
                                <option value='Published'>Published</option>
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='template-description' className='text-sm font-medium text-[#808080]'>Description</label>
                            <textarea
                                id='template-description'
                                value={form.description}
                                onChange={(event) => updateField('description', event.target.value)}
                                placeholder='Describe the purpose and scope of this audit template'
                                rows={4}
                                disabled={isViewMode}
                                className={`${inputClass} resize-none`}
                            />
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
                        <>
                            <button
                                type='button'
                                onClick={handleSaveDraft}
                                className='inline-flex items-center justify-center gap-2 sm:min-w-[140px] text-sm font-medium text-[#515DEF] border border-[#515DEF] bg-white px-5 py-2.5 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                Save Draft
                                <Save size={16} />
                            </button>
                            <button
                                type='button'
                                onClick={handlePublish}
                                className='inline-flex items-center justify-center gap-2 sm:min-w-[140px] bg-[#515DEF] text-white text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-all cursor-pointer'
                            >
                                Publish
                                <Rocket size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AuditTemplateFormModal
