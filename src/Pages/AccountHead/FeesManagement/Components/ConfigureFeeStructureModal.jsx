import React, { useEffect, useMemo, useState } from 'react'
import {
    BarChart3,
    BadgeCheck,
    Check,
    Plus,
    Save,
    Send,
    X,
} from 'lucide-react'
import { DEFAULT_CONFIGURE_FORM } from '../feesManagementData'

const ConfigureFeeStructureModal = ({ isOpen, onClose }) => {
    const [numberOfGrades, setNumberOfGrades] = useState(DEFAULT_CONFIGURE_FORM.numberOfGrades)
    const [numberOfTerms, setNumberOfTerms] = useState(DEFAULT_CONFIGURE_FORM.numberOfTerms)
    const [categories, setCategories] = useState(DEFAULT_CONFIGURE_FORM.categories)
    const [newCategory, setNewCategory] = useState('')

    useEffect(() => {
        if (isOpen) {
            setNumberOfGrades(DEFAULT_CONFIGURE_FORM.numberOfGrades)
            setNumberOfTerms(DEFAULT_CONFIGURE_FORM.numberOfTerms)
            setCategories(DEFAULT_CONFIGURE_FORM.categories.map((category) => ({ ...category })))
            setNewCategory('')
        }
    }, [isOpen])

    const selectedCount = useMemo(
        () => categories.filter((category) => category.selected).length,
        [categories]
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
        if (categories.some((category) => category.id === id)) {
            setNewCategory('')
            return
        }

        setCategories((prev) => [...prev, { id, label, selected: true }])
        setNewCategory('')
    }

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <h2 className='text-lg font-semibold text-[#1E1E1E]'>Configure Fee Structure</h2>
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
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>No. of Grades</label>
                            <input
                                type='text'
                                inputMode='numeric'
                                value={numberOfGrades}
                                onChange={(event) => setNumberOfGrades(event.target.value.replace(/[^\d]/g, ''))}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>No. of Terms</label>
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
                                Select Included Fees
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

                    <div className='flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-dashed border-[#515DEF66] bg-[#515DEF0D] px-4 py-4'>
                        <div className='size-11 rounded-lg bg-[#515DEF1A] text-[#515DEF] flex items-center justify-center shrink-0'>
                            <BarChart3 size={20} />
                        </div>
                        <div className='flex-1 min-w-0'>
                            <p className='text-sm font-semibold text-[#1E1E1E]'>Configuration Summary</p>
                            <div className='flex flex-wrap gap-2 mt-2'>
                                <span className='text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-[#EDEEF5] text-[#667085]'>
                                    Grades: {numberOfGrades || '0'}
                                </span>
                                <span className='text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-[#EDEEF5] text-[#667085]'>
                                    Terms: {numberOfTerms || '0'}
                                </span>
                                <span className='text-xs font-medium px-2.5 py-1 rounded-full bg-[#515DEF1A] text-[#515DEF]'>
                                    Categories: {selectedCount}
                                </span>
                            </div>
                        </div>
                        <div className='flex items-center gap-2 shrink-0'>
                            <BadgeCheck size={18} className='text-[#4CAF50]' />
                            <span className='text-xs font-bold text-[#4CAF50] uppercase tracking-wide'>Status: Ready</span>
                        </div>
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
                        onClick={onClose}
                        className='inline-flex items-center justify-center gap-2 sm:min-w-[180px] bg-[#515DEF] text-white text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-all cursor-pointer'
                    >
                        Save Configuration
                        <Save size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfigureFeeStructureModal
