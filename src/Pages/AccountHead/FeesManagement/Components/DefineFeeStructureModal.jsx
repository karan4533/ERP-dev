import React, { useMemo, useState } from 'react'
import { Calculator, X } from 'lucide-react'
import {
    DEFAULT_FEE_FORM,
    MODAL_GRADES,
} from '../feesManagementData'
import { FEE_FREQUENCIES } from '../../financeDomain/financeConstants'
import { FINANCE_ACADEMIC_YEARS } from '../../financeDomain/financeMasters'
import { useFinance } from '../../financeDomain/FinanceContext'
import { toast } from 'react-toastify'

const parseAmount = (value) => {
    const parsed = Number(String(value).replace(/[^\d.]/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`

const CurrencyInput = ({ label, required = false, value, onChange }) => (
    <div className='flex flex-col gap-y-2'>
        <label className='text-sm font-medium text-[#808080]'>
            {label}
            {required && <span className='text-[#FF5722]'> *</span>}
        </label>
        <div className='relative'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#667085]'>₹</span>
            <input
                type='text'
                inputMode='numeric'
                value={value}
                onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ''))}
                className='w-full text-sm border border-[#D9D9D9] rounded-md pl-8 pr-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
            />
        </div>
    </div>
)

const DefineFeeStructureModal = ({ isOpen, onClose, onSave, onAddCategory }) => {
    const { feeCategories, fineRules } = useFinance()
    const [form, setForm] = useState({
        ...DEFAULT_FEE_FORM,
        academicYear: '2026-2027',
        feeCategoryId: 'CAT-TUITION',
        feeHead: 'Tuition Fee',
        frequency: 'MONTHLY',
        dueDayOfMonth: '10',
        fineRuleId: 'FINE-TUITION-DAILY',
        concessionApplicable: true,
        mandatory: true,
        status: 'ACTIVE',
        amount: '2500',
        newCategory: '',
    })

    const initialForm = {
        ...DEFAULT_FEE_FORM,
        academicYear: '2026-2027',
        feeCategoryId: 'CAT-TUITION',
        feeHead: 'Tuition Fee',
        frequency: 'MONTHLY',
        dueDayOfMonth: '10',
        fineRuleId: 'FINE-TUITION-DAILY',
        concessionApplicable: true,
        mandatory: true,
        status: 'ACTIVE',
        amount: '2500',
        newCategory: '',
    }

    const totalAmount = useMemo(() => parseAmount(form.amount || form.tuitionFee), [form])

    const updateField = (field) => (value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <h2 className='text-lg font-semibold text-[#1E1E1E]'>Define Fees Structure</h2>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer'
                        aria-label='Close modal'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='px-6 py-5 space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>
                                Grade <span className='text-[#FF5722]'>*</span>
                            </label>
                            <select
                                value={form.grade}
                                onChange={(event) => updateField('grade')(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            >
                                <option value=''>Select Grade</option>
                                {MODAL_GRADES.map((grade) => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                        </div>

                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>
                                Academic Year <span className='text-[#FF5722]'>*</span>
                            </label>
                            <select
                                value={form.academicYear}
                                onChange={(event) => updateField('academicYear')(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            >
                                {FINANCE_ACADEMIC_YEARS.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Fee Category</label>
                            <select
                                value={form.feeCategoryId}
                                onChange={(event) => {
                                    const category = feeCategories.find((item) => item.id === event.target.value)
                                    setForm((prev) => ({
                                        ...prev,
                                        feeCategoryId: event.target.value,
                                        feeHead: category?.name || prev.feeHead,
                                    }))
                                }}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            >
                                {feeCategories.filter((item) => item.active).map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Fee Head</label>
                            <input value={form.feeHead} onChange={(event) => updateField('feeHead')(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5' />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Frequency</label>
                            <select value={form.frequency} onChange={(event) => updateField('frequency')(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5'>
                                {FEE_FREQUENCIES.map((item) => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                            </select>
                        </div>
                        <CurrencyInput label='Amount' required value={form.amount} onChange={updateField('amount')} />
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Due Day of Month</label>
                            <input value={form.dueDayOfMonth} onChange={(event) => updateField('dueDayOfMonth')(event.target.value.replace(/[^\d]/g, ''))} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5' />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Fine Rule</label>
                            <select value={form.fineRuleId} onChange={(event) => updateField('fineRuleId')(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5'>
                                <option value=''>None</option>
                                {fineRules.map((rule) => (
                                    <option key={rule.id} value={rule.id}>{rule.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Status</label>
                            <select value={form.status} onChange={(event) => updateField('status')(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5'>
                                <option value='ACTIVE'>Active</option>
                                <option value='INACTIVE'>Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className='flex flex-wrap gap-4 text-sm'>
                        <label className='inline-flex items-center gap-2 cursor-pointer'>
                            <input type='checkbox' checked={form.concessionApplicable} onChange={(event) => updateField('concessionApplicable')(event.target.checked)} className='accent-[#515DEF]' />
                            Concession applicable
                        </label>
                        <label className='inline-flex items-center gap-2 cursor-pointer'>
                            <input type='checkbox' checked={form.mandatory} onChange={(event) => updateField('mandatory')(event.target.checked)} className='accent-[#515DEF]' />
                            Mandatory
                        </label>
                    </div>

                    <div className='flex gap-2'>
                        <input
                            value={form.newCategory}
                            onChange={(event) => updateField('newCategory')(event.target.value)}
                            placeholder='Add custom fee category'
                            className='flex-1 text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5'
                        />
                        <button
                            type='button'
                            onClick={() => {
                                if (!form.newCategory.trim()) return
                                onAddCategory?.(form.newCategory.trim())
                                toast.success('Category added to master data.')
                                setForm((prev) => ({ ...prev, newCategory: '' }))
                            }}
                            className='text-sm border border-[#515DEF] text-[#515DEF] px-4 py-2 rounded-md cursor-pointer'
                        >
                            Add category
                        </button>
                    </div>

                    <div className='flex items-center gap-4 rounded-xl border border-[#515DEF33] bg-[#515DEF0D] px-4 py-4'>
                        <div className='size-12 rounded-full bg-[#515DEF] text-white flex items-center justify-center shrink-0'>
                            <Calculator size={22} />
                        </div>
                        <div className='flex-1 min-w-0'>
                            <p className='text-xs font-semibold text-[#808080] uppercase tracking-wide'>Total Per Student</p>
                            <p className='text-xs text-[#667085] mt-0.5'>Inclusive of all standard components</p>
                        </div>
                        <p className='text-2xl font-bold text-[#515DEF] shrink-0'>{formatCurrency(totalAmount)}</p>
                    </div>
                </div>

                <div className='flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-[#F2F4F7]'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='sm:min-w-[120px] text-sm font-medium text-[#667085] border border-[#D9D9D9] px-5 py-2.5 rounded-md hover:bg-[#F9F9F9] transition-colors cursor-pointer'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={() => {
                            if (!form.grade || !form.feeHead || !totalAmount) {
                                toast.error('Grade, fee head and amount are required.')
                                return
                            }
                            onSave?.({
                                academicYear: form.academicYear,
                                className: form.grade,
                                feeCategoryId: form.feeCategoryId,
                                feeHead: form.feeHead,
                                frequency: form.frequency,
                                amount: totalAmount,
                                dueDayOfMonth: Number(form.dueDayOfMonth) || 10,
                                fineRuleId: form.fineRuleId || null,
                                concessionApplicable: form.concessionApplicable,
                                mandatory: form.mandatory,
                                status: form.status,
                            })
                            toast.success('Fee structure saved.')
                            onClose()
                        }}
                        className='sm:min-w-[160px] bg-[#515DEF] text-white text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-all cursor-pointer'
                    >
                        Save Fee Structure
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DefineFeeStructureModal
