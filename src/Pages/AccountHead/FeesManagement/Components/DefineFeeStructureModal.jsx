import React, { useEffect, useMemo, useState } from 'react'
import { Calculator, CalendarClock, Plus, X } from 'lucide-react'
import { FEE_FREQUENCIES, DEFAULT_ACADEMIC_YEAR } from '../../financeDomain/financeConstants'
import { useFinance } from '../../financeDomain/FinanceContext'
import {
    ALL_CLASSES_LABEL,
    buildAcademicYearOptions,
    buildCampusClassOptions,
    loadAdminAcademicYears,
} from '../feeCampusOptions'
import { buildPaymentSchedule, getFrequencyPlan } from '../feePaymentSchedule'
import {
    loadTransportRouteOptions,
    routeAmountForFrequency,
    syncTransportFeeAmountToRoute,
} from '../transportRouteFeeSync'
import { parseFeeAmount } from '../../../TransportManager/RouteManagement/feeHelpers'
import { toast } from 'react-toastify'

const parseAmount = (value) => {
    const parsed = Number(String(value).replace(/[^\d.]/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

const formatDueDate = (iso) => {
    if (!iso) return '—'
    try {
        return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return iso
    }
}

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

const DEFAULT_CATEGORY_SEEDS = [
    'Tuition Fee',
    'Exam Fee',
    'Lab Fee',
    'Activity Fee',
    'Transport Fee',
    'Books Fee',
    'Miscellaneous',
]

const DefineFeeStructureModal = ({ isOpen, onClose, editingStructure = null }) => {
    const {
        feeCategories,
        fineRules,
        students,
        feeStructures,
        defineFeeStructure,
        addFeeCategory,
        saveFeeCategories,
    } = useFinance()
    const [adminYears, setAdminYears] = useState([])
    const [saving, setSaving] = useState(false)
    const isEdit = Boolean(editingStructure?.id)

    const classOptions = useMemo(
        () => buildCampusClassOptions({ students, feeStructures }),
        [students, feeStructures],
    )
    const { years: yearOptions, currentYear } = useMemo(
        () => buildAcademicYearOptions({ students, feeStructures, adminYears }),
        [students, feeStructures, adminYears],
    )

    const [form, setForm] = useState({
        grade: '',
        academicYear: DEFAULT_ACADEMIC_YEAR,
        feeCategoryId: '',
        feeHead: '',
        frequency: 'TERM_WISE',
        dueDayOfMonth: '10',
        fineRuleId: '',
        concessionApplicable: true,
        mandatory: true,
        status: 'ACTIVE',
        amount: '',
        newCategory: '',
        routeId: '',
        routeName: '',
    })
    const [categoryDrafts, setCategoryDrafts] = useState([])
    const [routeOptions, setRouteOptions] = useState([])
    const [loadingRoutes, setLoadingRoutes] = useState(false)

    useEffect(() => {
        if (!isOpen) return undefined
        let cancelled = false
        loadAdminAcademicYears()
            .then((years) => {
                if (!cancelled) setAdminYears(years)
            })
            .catch(() => {
                if (!cancelled) setAdminYears([])
            })
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
        setCategoryDrafts([...byLabel.values()])
        const firstCategory = (feeCategories || []).find((item) => item.active !== false)
        if (editingStructure?.id) {
            setForm({
                grade: editingStructure.className || '',
                academicYear: editingStructure.academicYear || currentYear || yearOptions[0] || DEFAULT_ACADEMIC_YEAR,
                feeCategoryId: editingStructure.feeCategoryId || firstCategory?.id || '',
                feeHead: editingStructure.feeHead || firstCategory?.name || '',
                frequency: editingStructure.frequency || 'TERM_WISE',
                dueDayOfMonth: String(editingStructure.dueDayOfMonth ?? 10),
                fineRuleId: editingStructure.fineRuleId || '',
                concessionApplicable: editingStructure.concessionApplicable !== false,
                mandatory: editingStructure.mandatory !== false,
                status: editingStructure.status || 'ACTIVE',
                amount: editingStructure.amount != null ? String(Math.round(Number(editingStructure.amount) || 0)) : '',
                newCategory: '',
                routeId: editingStructure.routeId || '',
                routeName: editingStructure.routeName || '',
            })
            return
        }
        setForm((prev) => ({
            ...prev,
            grade: '',
            academicYear: currentYear || yearOptions[0] || DEFAULT_ACADEMIC_YEAR,
            feeCategoryId: firstCategory?.id || '',
            feeHead: firstCategory?.name || '',
            frequency: 'TERM_WISE',
            dueDayOfMonth: '10',
            fineRuleId: '',
            concessionApplicable: true,
            mandatory: true,
            status: 'ACTIVE',
            amount: '',
            newCategory: '',
            routeId: '',
            routeName: '',
        }))
    }, [isOpen, feeCategories, currentYear, yearOptions, editingStructure])

    const totalAmount = useMemo(() => parseAmount(form.amount), [form.amount])
    const activeCategories = useMemo(
        () => (feeCategories || []).filter((item) => item.active !== false),
        [feeCategories],
    )
    const transportSelected = useMemo(() => {
        const fromActive = activeCategories.find((item) => item.id === form.feeCategoryId)
        const fromDraft = categoryDrafts.find((item) => (
            item.id === form.feeCategoryId
            || `CAT-${item.label.toUpperCase().replace(/\s+/g, '-')}` === form.feeCategoryId
        ))
        const label = String(fromActive?.name || fromDraft?.label || form.feeHead || '').toLowerCase()
        return label.includes('transport') || String(form.feeCategoryId || '').toUpperCase().includes('TRANSPORT')
    }, [activeCategories, categoryDrafts, form.feeCategoryId, form.feeHead])

    useEffect(() => {
        if (!isOpen || !transportSelected) return
        setForm((prev) => (prev.grade === ALL_CLASSES_LABEL ? prev : { ...prev, grade: ALL_CLASSES_LABEL }))
    }, [isOpen, transportSelected])

    useEffect(() => {
        if (!isOpen || !transportSelected) return undefined
        let cancelled = false
        setLoadingRoutes(true)
        loadTransportRouteOptions()
            .then((rows) => {
                if (!cancelled) setRouteOptions(rows)
            })
            .catch(() => {
                if (!cancelled) setRouteOptions([])
            })
            .finally(() => {
                if (!cancelled) setLoadingRoutes(false)
            })
        return () => { cancelled = true }
    }, [isOpen, transportSelected])

    const yearStartDate = useMemo(() => {
        const meta = adminYears.find((item) => item.name === form.academicYear)
        return meta?.startDate || meta?.start_date || ''
    }, [adminYears, form.academicYear])

    const schedule = useMemo(() => buildPaymentSchedule({
        amount: totalAmount,
        frequency: form.frequency,
        academicYear: form.academicYear,
        startDate: yearStartDate,
        dueDayOfMonth: Number(form.dueDayOfMonth) || 10,
    }), [form.academicYear, form.dueDayOfMonth, form.frequency, totalAmount, yearStartDate])

    const frequencyHelp = getFrequencyPlan(form.frequency).help

    const updateField = (field) => (value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const toggleCategoryDraft = (id) => {
        setCategoryDrafts((prev) => prev.map((row) => (
            row.id === id ? { ...row, selected: !row.selected } : row
        )))
    }

    const handleAddLocalCategory = () => {
        const label = form.newCategory.trim()
        if (!label) return
        const id = label.toLowerCase().replace(/\s+/g, '-')
        if (categoryDrafts.some((row) => row.id === id || row.label.toLowerCase() === label.toLowerCase())) {
            setForm((prev) => ({ ...prev, newCategory: '' }))
            return
        }
        setCategoryDrafts((prev) => [...prev, { id, label, selected: true, existing: false }])
        setForm((prev) => ({
            ...prev,
            newCategory: '',
            feeHead: prev.feeHead || label,
        }))
    }

    const handleSaveCategoriesOnly = async () => {
        const selected = categoryDrafts.filter((row) => row.selected).map((row) => row.label)
        if (!selected.length) {
            toast.error('Select at least one fee category.')
            return
        }
        setSaving(true)
        try {
            const { categoryIds, persist } = await saveFeeCategories(selected)
            if (!persist?.success) {
                toast.error(persist?.message || 'Could not save categories.')
                return
            }
            toast.success(
                persist.api
                    ? `Saved ${selected.length} categor${selected.length === 1 ? 'y' : 'ies'} to campus finance API.`
                    : `Saved ${selected.length} categor${selected.length === 1 ? 'y' : 'ies'} (offline / pending sync).`,
            )
            const firstId = categoryIds[0]
            const firstLabel = selected[0]
            setForm((prev) => ({
                ...prev,
                feeCategoryId: firstId || prev.feeCategoryId,
                feeHead: prev.feeHead || firstLabel,
            }))
        } finally {
            setSaving(false)
        }
    }

    const handleRouteChange = (routeId) => {
        const selected = routeOptions.find((row) => row.id === routeId)
        const amountFromRoute = selected
            ? parseFeeAmount(routeAmountForFrequency(selected, form.frequency))
            : null
        setForm((prev) => ({
            ...prev,
            routeId,
            routeName: selected?.label || '',
            feeHead: selected
                ? `Transport Fee — ${selected.label}`
                : (prev.feeHead.startsWith('Transport Fee') ? 'Transport Fee' : prev.feeHead),
            amount: amountFromRoute != null
                ? String(Math.round(amountFromRoute))
                : prev.amount,
        }))
    }

    const handleSaveStructure = async () => {
        if (!form.grade || !form.feeHead || !totalAmount) {
            toast.error('Class, fee head and amount are required.')
            return
        }
        if (transportSelected && !form.routeId) {
            toast.error('Select a transport route for this fee amount.')
            return
        }
        setSaving(true)
        try {
            // Persist any newly selected categories first so the structure can reference them.
            const selectedLabels = categoryDrafts.filter((row) => row.selected).map((row) => row.label)
            let latestCategories
            if (selectedLabels.length) {
                const saved = await saveFeeCategories(selectedLabels)
                latestCategories = saved.feeCategories
            }

            let categoryId = form.feeCategoryId
            if (!categoryId && form.feeHead) {
                categoryId = addFeeCategory(form.feeHead) || ''
            }
            // If user picked a draft category label matching fee head, resolve id
            if (!categoryId && form.feeHead) {
                categoryId = `CAT-${form.feeHead.toUpperCase().replace(/\s+/g, '-')}`
            }

            const structureId = editingStructure?.id || (
                transportSelected && form.routeId
                    ? `FS-TRANSPORT-ROUTE-${form.routeId}`
                    : undefined
            )

            const result = await defineFeeStructure({
                id: structureId,
                academicYear: form.academicYear,
                className: form.grade,
                feeCategoryId: categoryId,
                feeHead: form.feeHead,
                frequency: form.frequency,
                amount: totalAmount,
                dueDayOfMonth: Number(form.dueDayOfMonth) || 10,
                fineRuleId: form.fineRuleId || null,
                concessionApplicable: form.concessionApplicable,
                mandatory: form.mandatory,
                status: form.status,
                routeId: transportSelected ? form.routeId : undefined,
                routeName: transportSelected ? form.routeName : undefined,
                source: transportSelected ? 'transport-route-fee' : undefined,
            }, { startDate: yearStartDate, feeCategories: latestCategories })

            if (transportSelected && form.routeId) {
                const synced = await syncTransportFeeAmountToRoute({
                    routeId: form.routeId,
                    amount: totalAmount,
                    frequency: form.frequency,
                })
                if (!synced?.success) {
                    toast.warning(synced?.message || 'Fee saved, but route tariff in Transport Manager was not updated.')
                }
            }

            const verb = isEdit ? 'Updated' : 'Saved'
            const routePart = transportSelected && form.routeName ? ` · ${form.routeName}` : ''
            if (!result?.persist?.success) {
                toast.error(result?.persist?.message || 'Fee structure saved locally but API push failed.')
            } else if (result.persist.api) {
                toast.success(
                    `${verb} ${form.grade}${routePart} · ${schedule.planLabel} · ${result.installmentsCreated} installment row(s) for ${result.studentsMatched} student(s). Synced to API.`,
                )
            } else {
                toast.success(
                    `${verb} ${form.grade}${routePart} · ${schedule.planLabel}. ${result.persist.message || 'Will sync when API is ready.'}`,
                )
            }
            if (!result.studentsMatched && !transportSelected) {
                toast.info('No finance students in this class yet. Import enrolled students (Settings) so parents see dues.')
            }
            if (transportSelected) {
                toast.info('Route amount synced. Enroll students on this route to bill Fee Collection.')
            }
            onClose()
        } catch (error) {
            toast.error(error?.message || 'Could not save fee structure.')
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <div>
                        <h2 className='text-lg font-semibold text-[#1E1E1E]'>
                            {isEdit ? 'Edit Fees Structure' : 'Define Fees Structure'}
                        </h2>
                        <p className='text-xs text-[#667085] mt-0.5'>
                            {isEdit
                                ? 'Update amount, frequency, or class — unpaid installments are regenerated and synced to the finance API.'
                                : 'Categories, amount, and payment frequency (with installment split) — saved to the campus finance API.'}
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
                    <div>
                        <div className='flex items-center justify-between gap-3 mb-2'>
                            <label className='text-sm font-medium text-[#808080]'>Fee categories</label>
                            <button
                                type='button'
                                disabled={saving}
                                onClick={handleSaveCategoriesOnly}
                                className='text-xs font-medium text-[#515DEF] hover:underline cursor-pointer disabled:opacity-50'
                            >
                                Save categories to API
                            </button>
                        </div>
                        <div className='rounded-xl border border-[#EDEEF5] bg-[#F9F9F9] p-3 flex flex-wrap gap-2'>
                            {categoryDrafts.map((category) => (
                                <button
                                    key={category.id}
                                    type='button'
                                    onClick={() => toggleCategoryDraft(category.id)}
                                    className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                                        category.selected
                                            ? 'bg-[#515DEF] text-white border-[#515DEF]'
                                            : 'bg-white text-[#667085] border-[#D9D9D9]'
                                    }`}
                                >
                                    <Plus size={14} className={category.selected ? 'opacity-80' : ''} />
                                    {category.label}
                                </button>
                            ))}
                        </div>
                        <div className='flex gap-2 mt-3'>
                            <input
                                value={form.newCategory}
                                onChange={(event) => updateField('newCategory')(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault()
                                        handleAddLocalCategory()
                                    }
                                }}
                                placeholder='Add custom fee category'
                                className='flex-1 text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5'
                            />
                            <button
                                type='button'
                                onClick={handleAddLocalCategory}
                                className='text-sm border border-[#515DEF] text-[#515DEF] px-4 py-2 rounded-md cursor-pointer'
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>
                                Class <span className='text-[#FF5722]'>*</span>
                            </label>
                            <select
                                value={form.grade}
                                onChange={(event) => updateField('grade')(event.target.value)}
                                disabled={transportSelected}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF] disabled:bg-[#F2F4F7]'
                            >
                                <option value=''>Select class</option>
                                {classOptions.map((grade) => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                            {transportSelected && (
                                <p className='text-xs text-[#515DEF]'>
                                    Transport is school-wide — Class is set to {ALL_CLASSES_LABEL}. Pick a route below to set its amount.
                                </p>
                            )}
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
                            <label className='text-sm font-medium text-[#808080]'>Fee Category</label>
                            <select
                                value={form.feeCategoryId}
                                onChange={(event) => {
                                    const value = event.target.value
                                    const fromActive = activeCategories.find((item) => item.id === value)
                                    const fromDraft = categoryDrafts.find((item) => (
                                        item.id === value
                                        || `CAT-${item.label.toUpperCase().replace(/\s+/g, '-')}` === value
                                    ))
                                    const label = fromActive?.name || fromDraft?.label || ''
                                    const transport = String(label).toLowerCase().includes('transport')
                                        || String(value).toUpperCase().includes('TRANSPORT')
                                    setForm((prev) => ({
                                        ...prev,
                                        feeCategoryId: value,
                                        feeHead: transport ? (prev.routeName ? `Transport Fee — ${prev.routeName}` : 'Transport Fee') : (label || prev.feeHead),
                                        grade: transport ? ALL_CLASSES_LABEL : (prev.grade === ALL_CLASSES_LABEL ? '' : prev.grade),
                                        routeId: transport ? prev.routeId : '',
                                        routeName: transport ? prev.routeName : '',
                                    }))
                                }}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            >
                                <option value=''>Select category</option>
                                {categoryDrafts.filter((row) => row.selected).map((category) => (
                                    <option key={category.id} value={category.existing ? category.id : `CAT-${category.label.toUpperCase().replace(/\s+/g, '-')}`}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {transportSelected && (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='flex flex-col gap-y-2'>
                                <label className='text-sm font-medium text-[#808080]'>
                                    Route <span className='text-[#FF5722]'>*</span>
                                </label>
                                <select
                                    value={form.routeId}
                                    onChange={(event) => handleRouteChange(event.target.value)}
                                    className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                                >
                                    <option value=''>{loadingRoutes ? 'Loading routes…' : 'Select route'}</option>
                                    {form.routeId && !routeOptions.some((row) => row.id === form.routeId) && (
                                        <option value={form.routeId}>{form.routeName || form.routeId}</option>
                                    )}
                                    {routeOptions.map((route) => (
                                        <option key={route.id} value={route.id}>{route.label}</option>
                                    ))}
                                </select>
                                <p className='text-xs text-[#667085]'>
                                    Amount you save applies to this route (and its stops) in Transport Manager.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Fee Head</label>
                            <input value={form.feeHead} onChange={(event) => updateField('feeHead')(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5' />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Frequency to pay</label>
                            <select value={form.frequency} onChange={(event) => updateField('frequency')(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5'>
                                {FEE_FREQUENCIES.map((item) => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                            </select>
                            <p className='text-xs text-[#667085]'>{frequencyHelp}</p>
                        </div>
                        <CurrencyInput label='Total amount' required value={form.amount} onChange={updateField('amount')} />
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Due day of month</label>
                            <input value={form.dueDayOfMonth} onChange={(event) => updateField('dueDayOfMonth')(event.target.value.replace(/[^\d]/g, ''))} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5' />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Fine Rule</label>
                            <select value={form.fineRuleId} onChange={(event) => updateField('fineRuleId')(event.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5'>
                                <option value=''>None</option>
                                {(fineRules || []).map((rule) => (
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

                    <div className='rounded-xl border border-[#515DEF33] bg-[#515DEF0D] p-4 space-y-3'>
                        <div className='flex items-start gap-3'>
                            <div className='size-10 rounded-full bg-[#515DEF] text-white flex items-center justify-center shrink-0'>
                                <CalendarClock size={18} />
                            </div>
                            <div className='flex-1 min-w-0'>
                                <p className='text-sm font-semibold text-[#1E1E1E]'>Payment split — {schedule.planLabel}</p>
                                <p className='text-xs text-[#667085] mt-0.5'>{schedule.help}</p>
                                {schedule.nextDue && totalAmount > 0 && (
                                    <p className='text-xs font-medium text-[#515DEF] mt-1'>
                                        Next due: {schedule.nextDue.label} · {formatCurrency(schedule.nextDue.amount)} by {formatDueDate(schedule.nextDue.dueDate)}
                                    </p>
                                )}
                            </div>
                            <div className='text-right shrink-0'>
                                <p className='text-[10px] font-semibold text-[#808080] uppercase'>Total</p>
                                <p className='text-xl font-bold text-[#515DEF]'>{formatCurrency(totalAmount)}</p>
                            </div>
                        </div>
                        {totalAmount > 0 ? (
                            <div className='overflow-x-auto rounded-lg border border-white/60 bg-white'>
                                <table className='w-full text-sm'>
                                    <thead>
                                        <tr className='text-left text-[#667085] border-b border-[#F2F4F7]'>
                                            <th className='px-3 py-2 font-medium'>Part</th>
                                            <th className='px-3 py-2 font-medium'>Amount</th>
                                            <th className='px-3 py-2 font-medium'>Pay by</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schedule.parts.map((part) => (
                                            <tr key={part.index} className='border-b border-[#F2F4F7] last:border-0'>
                                                <td className='px-3 py-2 text-[#1E1E1E] font-medium'>{part.label}</td>
                                                <td className='px-3 py-2 text-[#1E1E1E]'>{formatCurrency(part.amount)}</td>
                                                <td className='px-3 py-2 text-[#667085]'>{formatDueDate(part.dueDate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className='text-xs text-[#667085]'>Enter a total amount to preview the installment split parents will see.</p>
                        )}
                    </div>

                    <div className='flex items-center gap-4 rounded-xl border border-[#EDEEF5] px-4 py-3'>
                        <div className='size-10 rounded-full bg-[#F2F4F7] text-[#515DEF] flex items-center justify-center shrink-0'>
                            <Calculator size={18} />
                        </div>
                        <p className='text-xs text-[#667085]'>
                            {transportSelected
                                ? 'Transport Fee uses All Classes. Route amounts live in Transport Manager; student enrollment posts the payable bill to Fee Collection.'
                                : 'Saving creates installment rows for finance students in this class so Parent → Academic Payment shows the same schedule.'}
                        </p>
                    </div>
                </div>

                <div className='flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-[#F2F4F7]'>
                    <button
                        type='button'
                        onClick={onClose}
                        disabled={saving}
                        className='sm:min-w-[120px] text-sm font-medium text-[#667085] border border-[#D9D9D9] px-5 py-2.5 rounded-md hover:bg-[#F9F9F9] transition-colors cursor-pointer'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        disabled={saving}
                        onClick={handleSaveStructure}
                        className='sm:min-w-[180px] bg-[#515DEF] text-white text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-60'
                    >
                        {saving ? 'Saving to API…' : (isEdit ? 'Update Fee Structure' : 'Save Fee Structure')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DefineFeeStructureModal
