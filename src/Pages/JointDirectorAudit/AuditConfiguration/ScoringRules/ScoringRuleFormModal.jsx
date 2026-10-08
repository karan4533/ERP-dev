import React, { useEffect, useMemo, useState } from 'react'
import { Save, X } from 'lucide-react'
import {
    DEFAULT_SCORING_RULE_FORM,
    getResponseTypeLabel,
    getResponseTypeOptions,
    supportsNaScoring,
} from './scoringRulesData'

const inputClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full focus:outline-none focus:border-[#515DEF]'

const selectClass =
    'text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full bg-white focus:outline-none focus:border-[#515DEF]'

const ScoringRuleFormModal = ({
    isOpen,
    mode = 'create',
    initialData,
    onClose,
    onSave,
}) => {
    const [form, setForm] = useState(DEFAULT_SCORING_RULE_FORM)
    const isViewMode = mode === 'view'
    const responseTypeOptions = useMemo(() => getResponseTypeOptions(), [])

    const selectedRuleLabel = getResponseTypeLabel(form.responseTypeId)
    const showYesNoFields = selectedRuleLabel === 'Yes / No' || selectedRuleLabel === 'Yes / No / NA'
    const showNaField = supportsNaScoring(selectedRuleLabel)

    useEffect(() => {
        if (isOpen) {
            setForm(initialData ? { ...initialData } : { ...DEFAULT_SCORING_RULE_FORM })
        }
    }, [isOpen, initialData])

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    if (!isOpen) return null

    const title = mode === 'edit' ? 'Edit Scoring Rule' : mode === 'view' ? 'View Scoring Rule' : 'Create Scoring Rule'

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
                            <label htmlFor='scoring-response-type' className='text-sm font-medium text-[#808080]'>Response Type</label>
                            <select
                                id='scoring-response-type'
                                value={form.responseTypeId}
                                onChange={(event) => updateField('responseTypeId', event.target.value)}
                                disabled={isViewMode}
                                className={selectClass}
                            >
                                <option value=''>Select response type</option>
                                {responseTypeOptions.map((item) => (
                                    <option key={item.id} value={item.id}>{item.type}</option>
                                ))}
                            </select>
                        </div>

                        {showYesNoFields ? (
                            <>
                                <div className='flex flex-col gap-y-2'>
                                    <label htmlFor='scoring-yes-score' className='text-sm font-medium text-[#808080]'>Yes Score</label>
                                    <input
                                        id='scoring-yes-score'
                                        type='text'
                                        inputMode='numeric'
                                        value={form.yesScore}
                                        onChange={(event) => updateField('yesScore', event.target.value.replace(/[^\d]/g, ''))}
                                        placeholder='10'
                                        disabled={isViewMode}
                                        className={inputClass}
                                    />
                                </div>
                                <div className='flex flex-col gap-y-2'>
                                    <label htmlFor='scoring-no-score' className='text-sm font-medium text-[#808080]'>No Score</label>
                                    <input
                                        id='scoring-no-score'
                                        type='text'
                                        inputMode='numeric'
                                        value={form.noScore}
                                        onChange={(event) => updateField('noScore', event.target.value.replace(/[^\d]/g, ''))}
                                        placeholder='0'
                                        disabled={isViewMode}
                                        className={inputClass}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className='sm:col-span-2 rounded-xl border border-[#EDEEF5] bg-[#FAFAFA] px-4 py-3 text-sm text-[#667085]'>
                                Yes / No score fields apply to binary response types. For <span className='font-medium text-[#1E1E1E]'>{selectedRuleLabel || 'this type'}</span>, configure pass percentage and weightage via the rule settings below.
                            </div>
                        )}

                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='scoring-na-score' className='text-sm font-medium text-[#808080]'>NA Score</label>
                            <input
                                id='scoring-na-score'
                                type='text'
                                inputMode='numeric'
                                value={form.naScore}
                                onChange={(event) => updateField('naScore', event.target.value.replace(/[^\d]/g, ''))}
                                placeholder={showNaField ? 'Leave empty for Ignore' : 'N/A'}
                                disabled={isViewMode || !showNaField}
                                className={`${inputClass} ${!showNaField ? 'bg-[#F9FAFB] text-[#667085]' : ''}`}
                            />
                            {showNaField && !isViewMode && (
                                <p className='text-xs text-[#808080]'>Leave blank to ignore NA responses in scoring.</p>
                            )}
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label htmlFor='scoring-pass-percentage' className='text-sm font-medium text-[#808080]'>Pass Percentage</label>
                            <div className='relative'>
                                <input
                                    id='scoring-pass-percentage'
                                    type='text'
                                    inputMode='numeric'
                                    value={form.passPercentage}
                                    onChange={(event) => updateField('passPercentage', event.target.value.replace(/[^\d]/g, ''))}
                                    placeholder='70'
                                    disabled={isViewMode}
                                    className={`${inputClass} pr-9`}
                                />
                                <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#808080]'>%</span>
                            </div>
                        </div>
                    </div>

                    {showYesNoFields && (
                        <div className='mt-5 rounded-xl border border-[#EDEEF5] overflow-hidden'>
                            <div className='px-4 py-2 bg-[#EDEEF5] text-xs font-semibold uppercase text-[#0C1E5B]'>Score Preview</div>
                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='border-b border-[#F2F4F7]'>
                                        <th className='px-4 py-2 text-left text-[#808080] font-medium'>Rule</th>
                                        <th className='px-4 py-2 text-left text-[#808080] font-medium'>Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className='border-b border-[#F2F4F7]'>
                                        <td className='px-4 py-2 text-[#1E1E1E]'>Yes</td>
                                        <td className='px-4 py-2 font-medium text-[#515DEF]'>{form.yesScore || '0'}</td>
                                    </tr>
                                    <tr className='border-b border-[#F2F4F7]'>
                                        <td className='px-4 py-2 text-[#1E1E1E]'>No</td>
                                        <td className='px-4 py-2 font-medium text-[#515DEF]'>{form.noScore || '0'}</td>
                                    </tr>
                                    {showNaField && (
                                        <tr>
                                            <td className='px-4 py-2 text-[#1E1E1E]'>NA</td>
                                            <td className='px-4 py-2 font-medium text-[#515DEF]'>
                                                {form.naScore ? form.naScore : 'Ignore'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
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

export default ScoringRuleFormModal
