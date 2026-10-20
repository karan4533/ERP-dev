import React, { useEffect, useMemo, useState } from 'react'
import {
    BadgeCheck,
    Check,
    Plus,
    Save,
    Send,
    X,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useFinance } from '../../financeDomain/FinanceContext'
import { CLASS_LEVEL_OPTIONS } from '../../../Admin/Class/ClassDetails/classDetailsOptions'
import { DEFAULT_ACADEMIC_YEAR } from '../../financeDomain/financeConstants'
import {
    buildAcademicYearOptions,
    buildCampusClassOptions,
    loadAdminAcademicYears,
} from '../feeCampusOptions'

const DEFAULT_CATEGORY_SEEDS = [
    'Tuition Fee',
    'Exam Fee',
    'Lab Fee',
    'Activity Fee',
    'Transport Fee',
    'Books Fee',
    'Miscellaneous',
]

/**
 * Bulk category seed + optional draft structures.
 * Prefer Define Fees Structure for amount + frequency schedule (parent-facing split).
 */
const ConfigureFeeStructureModal = ({ isOpen, onClose, onOpenDefine }) => {
    const {
        feeCategories,
        students,
        feeStructures,
        saveFeeCategories,
        defineFeeStructure,
    } = useFinance()
    const [numberOfTerms, setNumberOfTerms] = useState('3')
    const [categories, setCategories] = useState([])
    const [newCategory, setNewCategory] = useState('')
    const [createDrafts, setCreateDrafts] = useState(false)
    const [defaultAmount, setDefaultAmount] = useState('2500')
    const [saving, setSaving] = useState(false)
    const [adminYears, setAdminYears] = useState([])
    const [draftYear, setDraftYear] = useState(DEFAULT_ACADEMIC_YEAR)

    const classOptions = useMemo(
        () => buildCampusClassOptions({ students, feeStructures }),
        [students, feeStructures],
    )
    const { years: yearOptions, currentYear } = useMemo(
        () => buildAcademicYearOptions({ students, feeStructures, adminYears }),
        [students, feeStructures, adminYears],
    )

    useEffect(() => {
        if (!isOpen) return undefined
        let cancelled = false
        loadAdminAcademicYears()
            .then((years) => { if (!cancelled) setAdminYears(years) })
            .catch(() => { if (!cancelled) setAdminYears([]) })
        return () => { cancelled = true }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const existing = (feeCategories || [])
            .filter((item) => item.active !== false)
            .map((item) => ({ id: item.id, label: item.name, selected: true, existing: true }))
        const byLabel = new Map(existing.map((row) => [row.label.toLowerCase(), row]))
        DEFAULT_CATEGORY_SEEDS.forEach((label) => {
            const key = label.toLowerCase()
            if (!byLabel.has(key)) {
                byLabel.set(key, {
                    id: label.toLowerCase().replace(/\s+/g, '-'),
                    label,
                    selected: ['Tuition Fee', 'Exam Fee', 'Activity Fee', 'Transport Fee'].includes(label),
                    existing: false,
                })
            } else if (label === 'Transport Fee') {
                byLabel.set(key, { ...byLabel.get(key), selected: true })
            }
        })
        setCategories([...byLabel.values()])
        setNumberOfTerms('3')
        setNewCategory('')
        setCreateDrafts(false)
        setDefaultAmount('2500')
        setDraftYear(currentYear || yearOptions[0] || DEFAULT_ACADEMIC_YEAR)
    }, [isOpen, feeCategories, currentYear, yearOptions])

    const selectedCount = useMemo(
        () => categories.filter((category) => category.selected).length,
        [categories],
    )

    const toggleCategory = (id) => {
        setCategories((prev) => prev.map((category) => (
            category.id === id ? { ...category, selected: !category.selected } : category
        )))
    }

    const handleAddCategory = () => {
        const label = newCategory.trim()
        if (!label) return
        const id = label.toLowerCase().replace(/\s+/g, '-')
        if (categories.some((category) => category.id === id || category.label.toLowerCase() === label.toLowerCase())) {
            setNewCategory('')
            return
        }
        setCategories((prev) => [...prev, { id, label, selected: true, existing: false }])
        setNewCategory('')
    }

    const handleSave = async () => {
        const selected = categories.filter((category) => category.selected)
        if (!selected.length) {
            toast.error('Select at least one fee category.')
            return
        }
        setSaving(true)
        try {
            const { categoryIds, persist, feeCategories: latestCategories } = await saveFeeCategories(
                selected.map((row) => row.label),
            )
            if (!persist?.success) {
                toast.error(persist?.message || 'Could not save categories to finance API.')
                return
            }

            let created = 0
            let installments = 0
            let latestStructures = feeStructures
            let latestInstallments
            if (createDrafts) {
                const amount = Number(defaultAmount) || 0
                if (!amount) {
                    toast.error('Enter a default amount for draft structures.')
                    return
                }
                const year = draftYear || currentYear || DEFAULT_ACADEMIC_YEAR
                const yearMeta = adminYears.find((item) => item.name === year)
                const startDate = yearMeta?.startDate || yearMeta?.start_date || ''
                const classes = classOptions.length ? classOptions : CLASS_LEVEL_OPTIONS
                const frequency = Number(numberOfTerms) >= 3 ? 'TERM_WISE' : 'MONTHLY'
                for (let classIndex = 0; classIndex < classes.length; classIndex += 1) {
                    const className = classes[classIndex]
                    for (let index = 0; index < selected.length; index += 1) {
                        const category = selected[index]
                        const feeCategoryId = categoryIds[index]
                        const already = (latestStructures || []).some(
                            (row) => row.className === className
                                && row.feeCategoryId === feeCategoryId
                                && row.academicYear === year,
                        )
                        if (already) continue
                        const result = await defineFeeStructure({
                            academicYear: year,
                            className,
                            feeCategoryId,
                            feeHead: category.label,
                            frequency,
                            amount,
                            dueDayOfMonth: 10,
                            fineRuleId: null,
                            concessionApplicable: true,
                            mandatory: category.label.toLowerCase().includes('tuition'),
                            status: 'ACTIVE',
                        }, {
                            startDate,
                            feeCategories: latestCategories,
                            feeStructures: latestStructures,
                            installments: latestInstallments,
                        })
                        created += 1
                        installments += result?.installmentsCreated || 0
                        latestStructures = result?.feeStructures
                        latestInstallments = result?.installments
                    }
                }
            }

            toast.success(
                createDrafts
                    ? `API saved ${selected.length} categor${selected.length === 1 ? 'y' : 'ies'}, ${created} structure(s), ${installments} installment row(s).`
                    : persist.api
                        ? `Saved ${selected.length} fee categor${selected.length === 1 ? 'y' : 'ies'} to the finance API.`
                        : `Saved ${selected.length} categor${selected.length === 1 ? 'y' : 'ies'} (offline / pending sync).`,
            )
            onClose()
        } catch (error) {
            toast.error(error?.message || 'Save failed.')
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <div>
                        <h2 className='text-lg font-semibold text-[#1E1E1E]'>Configure Fee Categories</h2>
                        <p className='text-xs text-[#667085] mt-0.5'>
                            Bulk-save categories to the finance API. For amount + Term/Quarterly/Monthly/One-shot split, use Define Fees Structure.
                        </p>
                    </div>
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
                    <div className='rounded-xl border border-[#515DEF33] bg-[#515DEF0D] px-4 py-3 text-sm text-[#667085]'>
                        Categories are also managed inside{' '}
                        <button
                            type='button'
                            onClick={() => {
                                onClose()
                                onOpenDefine?.()
                            }}
                            className='font-semibold text-[#515DEF] hover:underline cursor-pointer'
                        >
                            Define Fees Structure
                        </button>
                        {' '}together with the payment frequency schedule parents see.
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Campus classes</label>
                            <input
                                type='text'
                                readOnly
                                value={String(classOptions.length)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 bg-[#F9FAFB] cursor-not-allowed'
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Academic year (drafts)</label>
                            <select
                                value={draftYear}
                                onChange={(event) => setDraftYear(event.target.value)}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            >
                                {yearOptions.map((year) => {
                                    const meta = adminYears.find((item) => item.name === year)
                                    return (
                                        <option key={year} value={year}>
                                            {year}{meta?.isCurrent ? ' (current)' : ''}
                                        </option>
                                    )
                                })}
                            </select>
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Default terms (for drafts)</label>
                            <input
                                type='text'
                                inputMode='numeric'
                                value={numberOfTerms}
                                onChange={(event) => setNumberOfTerms(event.target.value.replace(/[^\d]/g, ''))}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
                        </div>
                    </div>

                    <div>
                        <div className='flex items-center justify-between gap-3 mb-3'>
                            <label className='text-sm font-medium text-[#808080]'>Categories</label>
                            <span className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide'>
                                {selectedCount} selected · API save
                            </span>
                        </div>

                        <div className='rounded-xl border border-[#EDEEF5] bg-[#F9F9F9] p-4 flex flex-wrap gap-2'>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type='button'
                                    onClick={() => toggleCategory(category.id)}
                                    className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                                        category.selected
                                            ? 'bg-[#515DEF] text-white border-[#515DEF]'
                                            : 'bg-white text-[#667085] border-[#D9D9D9] hover:border-[#515DEF] hover:text-[#515DEF]'
                                    }`}
                                >
                                    {category.selected ? <Check size={14} /> : <Plus size={14} />}
                                    {category.label}
                                </button>
                            ))}
                        </div>

                        <div className='relative mt-3'>
                            <input
                                type='text'
                                value={newCategory}
                                onChange={(event) => setNewCategory(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault()
                                        handleAddCategory()
                                    }
                                }}
                                placeholder='Add new fee category...'
                                className='w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 pr-11 focus:outline-none focus:border-[#515DEF]'
                            />
                            <button
                                type='button'
                                onClick={handleAddCategory}
                                className='absolute right-2 top-1/2 -translate-y-1/2 text-[#515DEF] hover:opacity-80 cursor-pointer'
                                aria-label='Add category'
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>

                    <label className='flex items-start gap-3 rounded-xl border border-[#EDEEF5] p-4 cursor-pointer'>
                        <input
                            type='checkbox'
                            checked={createDrafts}
                            onChange={(event) => setCreateDrafts(event.target.checked)}
                            className='mt-1 accent-[#515DEF]'
                        />
                        <span className='text-sm text-[#667085]'>
                            Also create draft fee structures for every campus class × selected category
                            (uses Term Wise / Monthly schedule and writes installment rows for parents).
                        </span>
                    </label>
                    {createDrafts && (
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Default amount per structure</label>
                            <input
                                type='text'
                                inputMode='numeric'
                                value={defaultAmount}
                                onChange={(event) => setDefaultAmount(event.target.value.replace(/[^\d]/g, ''))}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5'
                            />
                        </div>
                    )}

                    <div className='flex items-center gap-2 text-xs font-bold text-[#4CAF50] uppercase tracking-wide'>
                        <BadgeCheck size={18} />
                        Writes via PUT /finance/state
                    </div>
                </div>

                <div className='flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-[#F2F4F7] bg-[#FAFAFA]'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='sm:min-w-[120px] text-sm font-medium text-[#667085] border border-[#D9D9D9] bg-white px-5 py-2.5 rounded-md hover:bg-[#F9F9F9] transition-colors cursor-pointer'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        disabled={saving}
                        onClick={handleSave}
                        className='inline-flex items-center justify-center gap-2 sm:min-w-[180px] bg-[#515DEF] text-white text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-60'
                    >
                        {saving ? 'Saving to API…' : 'Save to API'}
                        <Save size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfigureFeeStructureModal
