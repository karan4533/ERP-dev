import React, { useEffect, useState, useMemo } from 'react'
import {
    Award,
    Plus,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Archive,
    ExternalLink,
    Search,
    RefreshCw,
    Building2,
    X,
    Check
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { proService } from '../../services/modules/proService'

const BOARDS = [
    'ALL',
    'CBSE',
    'Cambridge International CAIE',
    'Tamil Nadu State Board',
    'RTE Authority',
    'Vocational Board',
]

const ProAffiliations = () => {
    const [affiliations, setAffiliations] = useState([])
    const [loading, setLoading] = useState(true)
    const [boardFilter, setBoardFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedAffiliation, setSelectedAffiliation] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // Form state
    const [form, setForm] = useState({
        boardAuthority: 'CBSE',
        affiliationCode: '',
        sanctionedGrades: 'Pre-KG to Grade 12',
        validityStartDate: new Date().toISOString().split('T')[0],
        validityEndDate: '',
        renewalDueDate: '',
        status: 'Active / In-Force',
        fileRoomLocation: 'Cupboard 04, Shelf 01, Box 08',
        conditionsCompliance: [
            { id: 1, conditionText: 'Maintain mandatory student-teacher ratio of 1:30', deadline: '2026-12-31', status: 'Complied' },
            { id: 2, conditionText: 'Annual fire safety certificate renewal submission', deadline: '2026-06-30', status: 'Complied' },
        ],
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await proService.getAffiliations()
            if (res.success && Array.isArray(res.data)) {
                setAffiliations(res.data)
            }
        } catch (err) {
            console.error('Failed to load affiliations:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredList = useMemo(() => {
        return affiliations.filter((item) => {
            const matchesBoard = boardFilter === 'ALL' || item.boardAuthority === boardFilter
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                item.affiliationCode?.toLowerCase().includes(q) ||
                item.boardAuthority?.toLowerCase().includes(q) ||
                item.sanctionedGrades?.toLowerCase().includes(q)

            return matchesBoard && matchesSearch
        })
    }, [affiliations, boardFilter, searchQuery])

    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        if (!form.affiliationCode || !form.validityStartDate || !form.validityEndDate) {
            alert('Please fill in required fields.')
            return
        }

        try {
            const res = await proService.createAffiliation(form)
            if (res.success) {
                setAffiliations((prev) => [res.data, ...prev])
                setShowAddModal(false)
                setFeedbackMessage(`Affiliation ${res.data.affiliationCode} successfully saved.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
            } else {
                alert(`Error: ${res.error?.message || 'Failed to save affiliation'}`)
            }
        } catch (err) {
            console.error('Failed to create affiliation:', err)
            alert('Error creating affiliation record.')
        }
    }

    const handleToggleCondition = async (affId, condId) => {
        const aff = affiliations.find((a) => a.id === affId)
        if (!aff) return

        const updatedConditions = (aff.conditionsCompliance || []).map((c) => {
            if (c.id === condId) {
                return {
                    ...c,
                    status: c.status === 'Complied' ? 'Pending' : 'Complied',
                }
            }
            return c
        })

        try {
            const res = await proService.updateAffiliation(affId, {
                conditionsCompliance: updatedConditions,
            })
            if (res.success) {
                setAffiliations((prev) =>
                    prev.map((a) => (a.id === affId ? { ...a, conditionsCompliance: updatedConditions } : a))
                )
                if (selectedAffiliation?.id === affId) {
                    setSelectedAffiliation((prev) => ({ ...prev, conditionsCompliance: updatedConditions }))
                }
                setFeedbackMessage('Condition compliance updated.')
                setTimeout(() => setFeedbackMessage(''), 3000)
            }
        } catch (err) {
            console.error('Failed to toggle condition:', err)
        }
    }

    const columns = [
        {
            key: 'boardAuthority',
            label: 'Board / Authority',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-bold text-slate-900 text-xs'>{row.boardAuthority}</span>
                    <div className='font-mono text-teal-700 text-[11px] font-semibold mt-0.5'>{row.affiliationCode}</div>
                </div>
            ),
        },
        {
            key: 'sanctionedGrades',
            label: 'Sanctioned Grades',
            required: true,
            render: (row) => <span className='text-xs text-slate-700 font-medium'>{row.sanctionedGrades}</span>,
        },
        {
            key: 'validity',
            label: 'Validity Period',
            required: true,
            render: (row) => (
                <div className='text-xs font-mono text-slate-800'>
                    <span>{row.validityStartDate}</span>
                    <span className='text-slate-400 mx-1'>to</span>
                    <span className='font-bold text-slate-900'>{row.validityEndDate}</span>
                </div>
            ),
        },
        {
            key: 'renewalDueDate',
            label: 'Renewal Due Date',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5 font-mono text-xs text-amber-700 font-semibold'>
                    <Calendar className='w-3.5 h-3.5 text-amber-500' />
                    {row.renewalDueDate || 'N/A'}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            required: true,
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: 'actions',
            label: 'Actions',
            required: true,
            render: (row) => (
                <button
                    type='button'
                    onClick={() => setSelectedAffiliation(row)}
                    className='text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold transition-colors'
                >
                    Review Conditions
                </button>
            ),
        },
    ]

    return (
        <section className='space-y-6 p-1'>
            {/* Header */}
            <div className='rounded-2xl bg-white p-5 border border-slate-200 shadow-xs'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700'>
                            <Award className='w-4 h-4' />
                            Statutory Affiliations &amp; Recognitions
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Board Affiliations &amp; Recognitions
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Oversight of accreditation codes, validity periods, RTE clearances, and compliance with statutory board conditions.
                        </p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <button
                            type='button'
                            onClick={loadData}
                            className='inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type='button'
                            onClick={() => setShowAddModal(true)}
                            className='inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Add Affiliation
                        </button>
                    </div>
                </div>

                {feedbackMessage && (
                    <div className='mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800 flex items-center gap-2'>
                        <CheckCircle2 className='w-4 h-4 text-teal-600' />
                        {feedbackMessage}
                    </div>
                )}
            </div>

            {/* Filter Bar */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-xs font-semibold text-slate-500 mr-1'>Board Authority:</span>
                    {BOARDS.map((b) => (
                        <button
                            key={b}
                            type='button'
                            onClick={() => setBoardFilter(b)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                boardFilter === b
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            {b === 'ALL' ? 'All Boards' : b}
                        </button>
                    ))}
                </div>

                <div className='relative w-full md:w-64'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search affiliation or grades...'
                        className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />
                </div>
            </div>

            {/* Affiliations Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Institutional Affiliation Records ({filteredList.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredList}
                        emptyMessage='No affiliations found matching the criteria.'
                    />
                </div>
            </div>

            {/* Add Affiliation Modal */}
            {showAddModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <h3 className='text-base font-bold text-slate-900'>Add Affiliation / Recognition</h3>
                            <button
                                type='button'
                                onClick={() => setShowAddModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className='mt-4 space-y-4'>
                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Board Authority *</label>
                                <select
                                    value={form.boardAuthority}
                                    onChange={(e) => setForm({ ...form, boardAuthority: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                >
                                    <option value='CBSE'>CBSE (Central Board of Secondary Education)</option>
                                    <option value='Cambridge International CAIE'>Cambridge International CAIE</option>
                                    <option value='Tamil Nadu State Board'>Tamil Nadu State Board (Matriculation)</option>
                                    <option value='RTE Authority'>RTE Act Recognition (CEO)</option>
                                    <option value='Vocational Board'>National Skill Qualification Framework (NSQF)</option>
                                </select>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Affiliation Code *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.affiliationCode}
                                        onChange={(e) => setForm({ ...form, affiliationCode: e.target.value })}
                                        placeholder='e.g. CBSE/AFF/1930882'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Sanctioned Grades *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.sanctionedGrades}
                                        onChange={(e) => setForm({ ...form, sanctionedGrades: e.target.value })}
                                        placeholder='e.g. Pre-KG to Grade 12'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Validity Start Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={form.validityStartDate}
                                        onChange={(e) => setForm({ ...form, validityStartDate: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Validity End Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={form.validityEndDate}
                                        onChange={(e) => setForm({ ...form, validityEndDate: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Renewal Due Date</label>
                                    <input
                                        type='date'
                                        value={form.renewalDueDate}
                                        onChange={(e) => setForm({ ...form, renewalDueDate: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>File Room Physical Location</label>
                                    <input
                                        type='text'
                                        value={form.fileRoomLocation}
                                        onChange={(e) => setForm({ ...form, fileRoomLocation: e.target.value })}
                                        placeholder='Cupboard 04, Shelf 01, Box 08'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowAddModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Save Affiliation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Review Conditions Modal */}
            {selectedAffiliation && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>
                                    {selectedAffiliation.boardAuthority} Compliance Conditions
                                </h3>
                                <div className='font-mono text-xs text-teal-700 font-semibold'>
                                    {selectedAffiliation.affiliationCode}
                                </div>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedAffiliation(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3'>
                            <div className='flex items-center justify-between text-xs text-slate-500'>
                                <span>Specific Conditions Stipulated by Board:</span>
                                <span className='font-mono text-[11px] text-slate-400'>
                                    Archive: {selectedAffiliation.fileRoomLocation || 'Vault'}
                                </span>
                            </div>

                            <div className='space-y-2 max-h-60 overflow-y-auto pr-1'>
                                {(selectedAffiliation.conditionsCompliance || []).map((cond) => {
                                    const isComplied = cond.status === 'Complied'
                                    return (
                                        <div
                                            key={cond.id}
                                            className={`p-3 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                                                isComplied ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                                            }`}
                                        >
                                            <div className='text-xs'>
                                                <div className={`font-medium ${isComplied ? 'text-emerald-900' : 'text-slate-800'}`}>
                                                    {cond.conditionText}
                                                </div>
                                                <div className='text-[11px] text-slate-500 mt-1 flex items-center gap-2'>
                                                    <span>Target Date: {cond.deadline}</span>
                                                    <span>·</span>
                                                    <span className={isComplied ? 'text-emerald-700 font-bold' : 'text-amber-700 font-semibold'}>
                                                        {cond.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                type='button'
                                                onClick={() => handleToggleCondition(selectedAffiliation.id, cond.id)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                                                    isComplied
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-slate-200 text-slate-700 hover:bg-emerald-600 hover:text-white'
                                                }`}
                                            >
                                                {isComplied ? 'Complied' : 'Mark Complied'}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedAffiliation(null)}
                                className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default ProAffiliations
