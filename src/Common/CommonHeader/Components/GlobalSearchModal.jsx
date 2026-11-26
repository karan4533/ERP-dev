import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Search,
    BookOpen,
    Users,
    Package,
    Ticket,
    Calendar,
    ArrowRight,
    X,
    FileText,
    Shield
} from 'lucide-react'

const SEARCH_DATABASE = [
    // 1. Core Modules
    { id: 'm-1', type: 'Module', title: 'Director Dashboard', subtitle: 'Academic & Executive Overview', to: '/director/dashboard', icon: BookOpen },
    { id: 'm-2', type: 'Module', title: 'Principal Dashboard', subtitle: 'School-wide operations', to: '/principal/dashboard', icon: Shield },
    { id: 'm-3', type: 'Module', title: 'Stores & Inventory', subtitle: 'Stock Master & Issue Register', to: '/stationery-store-manager/inventory', icon: Package },
    { id: 'm-4', type: 'Module', title: 'Transport Operations', subtitle: 'Bus Routes & Rosters', to: '/transport-manager/route-management', icon: FileText },
    { id: 'm-5', type: 'Module', title: 'Fees Management', subtitle: 'Fee Projection & Cheque Bounce', to: '/account-head/fees-management', icon: FileText },
    { id: 'm-6', type: 'Module', title: 'Support Tickets', subtitle: 'IT & Hardware Helpdesk', to: '/admin/support-tickets', icon: Ticket },
    { id: 'm-7', type: 'Module', title: 'Campus Maintenance', subtitle: 'EB, Civil, Plumbing & DG Fuel', to: '/joint-director/campus-maintenance', icon: FileText },
    { id: 'm-8', type: 'Module', title: 'Examinations Suite', subtitle: 'All 18 Exam Trackers & Marks', to: '/teacher/examinations/enter-marks', icon: BookOpen },
    { id: 'm-9', type: 'Module', title: 'Lesson Plan Approval', subtitle: 'Curriculum & Pedagogy Sign-off', to: '/coordinator/lesson-plan-approval', icon: BookOpen },
    { id: 'm-10', type: 'Module', title: 'Exit Formalities', subtitle: 'Staff Exit Interview & Clearance', to: '/hr/exit/exit-formalities', icon: Users },

    // 2. Sample Students
    { id: 's-1', type: 'Student', title: 'Aarav Sharma (STU-2026-001)', subtitle: 'Grade 10-A · Roll #01', to: '/coordinator/students-list', icon: Users },
    { id: 's-2', type: 'Student', title: 'Diya Patel (STU-2026-002)', subtitle: 'Grade 10-A · Roll #02', to: '/coordinator/students-list', icon: Users },
    { id: 's-3', type: 'Student', title: 'Rohan Iyer (STU-2026-003)', subtitle: 'Grade 9-B · Roll #14', to: '/coordinator/students-list', icon: Users },

    // 3. Sample Staff
    { id: 'e-1', type: 'Staff', title: 'Dr. Kavita Sharma', subtitle: 'Director of Academics · Dept: Academics', to: '/hr/employee-management/all-employees', icon: Users },
    { id: 'e-2', type: 'Staff', title: 'Ramesh Sundaram', subtitle: 'Transport Lead · Dept: Logistics', to: '/hr/employee-management/all-employees', icon: Users },
    { id: 'e-3', type: 'Staff', title: 'Meena Kapoor', subtitle: 'Stores Officer · Dept: Stationery', to: '/hr/employee-management/all-employees', icon: Users },

    // 4. Sample Inventory
    { id: 'i-1', type: 'Inventory', title: 'A4 Copier Paper (500 Sheets)', subtitle: 'Code: PAP-A4-500 · 8 Reams remaining', to: '/stationery-store-manager/inventory', icon: Package },
    { id: 'i-2', type: 'Inventory', title: 'HP 803 Black Ink Cartridge', subtitle: 'Code: PRT-HP803-BK · 24 In stock', to: '/stationery-store-manager/inventory', icon: Package },
    { id: 'i-3', type: 'Inventory', title: 'Spiral Notebook (200 Pgs)', subtitle: 'Code: NB-SPR-200 · Out of Stock', to: '/stationery-store-manager/inventory', icon: Package },
]

const GlobalSearchModal = ({ open, onClose }) => {
    const [query, setQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const inputRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50)
        } else {
            setQuery('')
        }
    }, [open])

    // Global keyboard listener for "/" and "Ctrl+K" / "Cmd+K"
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }
        if (open) {
            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
        }
    }, [open, onClose])

    if (!open) return null

    const categories = ['All', 'Module', 'Student', 'Staff', 'Inventory']

    const filteredResults = SEARCH_DATABASE.filter((item) => {
        const matchesCategory = selectedCategory === 'All' || item.type === selectedCategory
        const matchesQuery =
            !query.trim() ||
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(query.toLowerCase())
        return matchesCategory && matchesQuery
    })

    const handleSelect = (to) => {
        onClose()
        navigate(to)
    }

    return (
        <div
            className='fixed inset-0 z-400 flex items-start justify-center bg-slate-900/40 p-4 pt-16 backdrop-blur-xs sm:pt-24'
            onClick={onClose}
        >
            <div
                className='relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Header */}
                <div className='flex items-center gap-3 border-b border-slate-100 px-4 py-3.5'>
                    <Search size={18} className='text-slate-400 shrink-0' />
                    <input
                        ref={inputRef}
                        type='text'
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder='Search modules, students, employees, inventory, tickets... (or press Esc to close)'
                        className='w-full text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none'
                    />
                    {query && (
                        <button
                            type='button'
                            onClick={() => setQuery('')}
                            className='p-1 text-slate-400 hover:text-slate-600'
                        >
                            <X size={16} />
                        </button>
                    )}
                    <kbd className='hidden sm:inline-block rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500'>
                        ESC
                    </kbd>
                </div>

                {/* Filter Pills */}
                <div className='flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-xs'>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type='button'
                            onClick={() => setSelectedCategory(cat)}
                            className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                                selectedCategory === cat
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-200/60'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                    <span className='ml-auto text-[11px] text-slate-400'>
                        {filteredResults.length} matches
                    </span>
                </div>

                {/* Results List */}
                <div className='max-h-80 overflow-y-auto p-2'>
                    {filteredResults.length === 0 ? (
                        <div className='py-10 text-center text-slate-400'>
                            <p className='text-xs'>No matching records found for "{query}".</p>
                        </div>
                    ) : (
                        <div className='space-y-1'>
                            {filteredResults.map((item) => {
                                const Icon = item.icon
                                return (
                                    <button
                                        key={item.id}
                                        type='button'
                                        onClick={() => handleSelect(item.to)}
                                        className='flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-blue-50/60 group cursor-pointer'
                                    >
                                        <div className='flex items-center gap-3 min-w-0'>
                                            <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors'>
                                                <Icon size={16} />
                                            </div>
                                            <div className='min-w-0'>
                                                <p className='text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate'>
                                                    {item.title}
                                                </p>
                                                <p className='text-[11px] text-slate-500 truncate'>
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                        <div className='flex items-center gap-2 shrink-0 ml-3'>
                                            <span className='rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700'>
                                                {item.type}
                                            </span>
                                            <ArrowRight size={13} className='text-slate-400 group-hover:text-blue-600' />
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Tips */}
                <div className='flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-400'>
                    <span>Press <kbd className='font-semibold text-slate-600'>↑</kbd> <kbd className='font-semibold text-slate-600'>↓</kbd> to navigate</span>
                    <span>Press <kbd className='font-semibold text-slate-600'>/</kbd> anywhere to open</span>
                </div>
            </div>
        </div>
    )
}

export default GlobalSearchModal

