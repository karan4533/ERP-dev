import React, { useEffect, useState } from 'react'
import { Save, X } from 'lucide-react'
import { DEFAULT_RESPONSE_TYPE_FORM } from './responseTypesData'

const inputClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full focus:outline-none focus:border-[#515DEF]'

const Toggle = ({ enabled, onChange, ariaLabel }) => (
    <button
        type='button'
        role='switch'
        aria-checked={enabled}
        aria-label={ariaLabel}
        onClick={() => onChange(!enabled)}
        className={`relative w-[34px] h-[19px] rounded-full shrink-0 cursor-pointer transition-colors border ${
            enabled
                ? 'bg-[#515DEF] border-[#515DEF]'
                : 'bg-[#EDEEF5] border-[#D9D9D9]'
        }`}
    >
        <span
            className={`absolute top-[2px] size-3.5 rounded-full bg-white transition-all ${
                enabled ? 'left-[17px]' : 'left-[2px]'
            }`}
        />
    </button>
)

const ResponseTypeFormModal = ({
    isOpen,
    mode = 'create',
    initialData,
    onClose,
    onSave,
}) => {
    const [form, setForm] = useState(DEFAULT_RESPONSE_TYPE_FORM)
    const isViewMode = mode === 'view'

    useEffect(() => {
        if (isOpen) {
            setForm(initialData ? { ...initialData } : { ...DEFAULT_RESPONSE_TYPE_FORM })
        }
    }, [isOpen, initialData])

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    if (!isOpen) return null

    const title = mode === 'edit' ? 'Edit Response Type' : mode === 'view' ? 'View Response Type' : 'Create Response Type'

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
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

                <div className='px-6 py-5 space-y-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='response-type-name' className='text-sm font-medium text-[#808080]'>Type</label>
                        <input
                            id='response-type-name'
                            type='text'
                            value={form.type}
                            onChange={(event) => updateField('type', event.target.value)}
                            placeholder='e.g. Yes / No'
                            disabled={isViewMode}
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='response-type-description' className='text-sm font-medium text-[#808080]'>Description</label>
                        <textarea
                            id='response-type-description'
                            value={form.description}
                            onChange={(event) => updateField('description', event.target.value)}
                            placeholder='Describe how this response type is used'
                            rows={4}
                            disabled={isViewMode}
                            className={`${inputClass} resize-none`}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-sm font-medium text-[#808080]'>Active</label>
                        <div className='flex items-center gap-3 h-[42px]'>
                            {isViewMode ? (
                                <span className={`text-sm font-medium ${form.active ? 'text-[#4CAF50]' : 'text-[#667085]'}`}>
                                    {form.active ? 'Active' : 'Inactive'}
                                </span>
                            ) : (
                                <>
                                    <Toggle
                                        enabled={form.active}
                                        onChange={(value) => updateField('active', value)}
                                        ariaLabel='Response type active status'
                                    />
                                    <span className='text-sm text-[#667085]'>{form.active ? 'Active' : 'Inactive'}</span>
                                </>
                            )}
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

export default ResponseTypeFormModal
