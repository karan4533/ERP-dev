import React, { useEffect, useState } from 'react'
import { Save, X } from 'lucide-react'
import { DEFAULT_QUESTION_FORM, SECTION_OPTIONS } from './questionBankData'
import { getActiveResponseTypeLabels, RESPONSE_TYPES_LIST } from '../ResponseTypes/responseTypesData'

const inputClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full focus:outline-none focus:border-[#515DEF]'

const selectClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full bg-white focus:outline-none focus:border-[#515DEF]'

const Toggle = ({ enabled, onChange, ariaLabel, disabled = false }) => (
    <button
        type='button'
        role='switch'
        aria-checked={enabled}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && onChange(!enabled)}
        className={`relative w-[34px] h-[19px] rounded-full shrink-0 transition-colors border ${
            disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        } ${
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

const QuestionFormModal = ({
    isOpen,
    mode = 'create',
    initialData,
    onClose,
    onSave,
}) => {
    const [form, setForm] = useState(DEFAULT_QUESTION_FORM)
    const isViewMode = mode === 'view'

    useEffect(() => {
        if (isOpen) {
            setForm(initialData ? { ...initialData } : { ...DEFAULT_QUESTION_FORM })
        }
    }, [isOpen, initialData])

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const responseTypeOptions = getActiveResponseTypeLabels(RESPONSE_TYPES_LIST)

    if (!isOpen) return null

    const title = mode === 'edit' ? 'Edit Question' : mode === 'view' ? 'View Question' : 'Create Question'

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
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
                            <label htmlFor='question-section' className='text-sm font-medium text-[#808080]'>Section</label>
                            <select
                                id='question-section'
                                value={form.sectionId}
                                onChange={(event) => updateField('sectionId', event.target.value)}
                                disabled={isViewMode}
                                className={selectClass}
                            >
                                <option value=''>Select section</option>
                                {SECTION_OPTIONS.map((section) => (
                                    <option key={section.id} value={section.id}>{section.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='question-text' className='text-sm font-medium text-[#808080]'>Question</label>
                            <textarea
                                id='question-text'
                                value={form.question}
                                onChange={(event) => updateField('question', event.target.value)}
                                placeholder='Enter the audit question'
                                rows={3}
                                disabled={isViewMode}
                                className={`${inputClass} resize-none`}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='question-description' className='text-sm font-medium text-[#808080]'>Description</label>
                            <textarea
                                id='question-description'
                                value={form.description}
                                onChange={(event) => updateField('description', event.target.value)}
                                placeholder='Add guidance or context for auditors'
                                rows={3}
                                disabled={isViewMode}
                                className={`${inputClass} resize-none`}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2 sm:col-span-2'>
                            <label htmlFor='question-response-type' className='text-sm font-medium text-[#808080]'>Response Type</label>
                            <select
                                id='question-response-type'
                                value={form.responseType}
                                onChange={(event) => updateField('responseType', event.target.value)}
                                disabled={isViewMode}
                                className={selectClass}
                            >
                                <option value=''>Select response type</option>
                                {responseTypeOptions.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='question-weightage' className='text-sm font-medium text-[#808080]'>Weightage</label>
                            <input
                                id='question-weightage'
                                type='text'
                                inputMode='numeric'
                                value={form.weightage}
                                onChange={(event) => updateField('weightage', event.target.value.replace(/[^\d]/g, ''))}
                                placeholder='1'
                                disabled={isViewMode}
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='question-order' className='text-sm font-medium text-[#808080]'>Order</label>
                            <input
                                id='question-order'
                                type='text'
                                inputMode='numeric'
                                value={form.order}
                                onChange={(event) => updateField('order', event.target.value.replace(/[^\d]/g, ''))}
                                placeholder='1'
                                disabled={isViewMode}
                                className={inputClass}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Mandatory</label>
                            <div className='flex items-center gap-3 h-[42px]'>
                                {isViewMode ? (
                                    <span className={`text-sm font-medium ${form.mandatory ? 'text-[#FF5722]' : 'text-[#515DEF]'}`}>
                                        {form.mandatory ? 'Mandatory' : 'Optional'}
                                    </span>
                                ) : (
                                    <>
                                        <Toggle
                                            enabled={form.mandatory}
                                            onChange={(value) => updateField('mandatory', value)}
                                            ariaLabel='Question mandatory status'
                                        />
                                        <span className='text-sm text-[#667085]'>{form.mandatory ? 'Mandatory' : 'Optional'}</span>
                                    </>
                                )}
                            </div>
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
                                            ariaLabel='Question active status'
                                        />
                                        <span className='text-sm text-[#667085]'>{form.active ? 'Active' : 'Inactive'}</span>
                                    </>
                                )}
                            </div>
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

export default QuestionFormModal
