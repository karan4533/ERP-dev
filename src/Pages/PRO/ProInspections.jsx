import React, { useEffect, useState, useMemo } from 'react'
import {
    CheckCircle2,
    Plus,
    Calendar,
    AlertTriangle,
    Eye,
    Search,
    RefreshCw,
    Building2,
    FileCheck2,
    X,
    ClipboardList,
    Send
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { proService } from '../../services/modules/proService'

const PURPOSES = [
    'ALL',
    'Routine Annual Inspection',
    'Affiliation Extension',
    'Safety Compliance',
    'Surprise Vigilance',
    'Complaint Inquiry',
]

const ProInspections = () => {
    const [inspections, setInspections] = useState([])
    const [loading, setLoading] = useState(true)
    const [purposeFilter, setPurposeFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [showLogModal, setShowLogModal] = useState(false)
    const [selectedInspection, setSelectedInspection] = useState(null)
    const [showResponseModal, setShowResponseModal] = useState(false)
    const [complianceResponseText, setComplianceResponseText] = useState('')
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // New inspection form
    const [form, setForm] = useState({
        inspectionDate: new Date().toISOString().split('T')[0],
        inspectingBody: 'Directorate of School Education (CEO Madurai Inspection Team)',
        inspectingOfficials: '',
        purpose: 'Routine Annual Inspection',
        observations: '',
        deficienciesNoted: '',
        complianceSubmissionDeadline: '',
        status: 'Action Required',
        reportAttachmentUrl: '',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await proService.getInspections()
            if (res.success && Array.isArray(res.data)) {
                setInspections(res.data)
            }
        } catch (err) {
            console.error('Failed to load inspections:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredInspections = useMemo(() => {
        return inspections.filter((item) => {
            const matchesPurpose = purposeFilter === 'ALL' || item.purpose === purposeFilter
            const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                item.inspectingBody?.toLowerCase().includes(q) ||
                item.inspectingOfficials?.toLowerCase().includes(q) ||
                item.observations?.toLowerCase().includes(q)

            return matchesPurpose && matchesStatus && matchesSearch
        })
    }, [inspections, purposeFilter, statusFilter, searchQuery])

    const handleCreateInspection = async (e) => {
        e.preventDefault()
        if (!form.inspectingBody || !form.inspectionDate || !form.purpose) {
            alert('Please fill in required fields.')
            return
        }

        try {
            const res = await proService.createInspection(form)
            if (res.success) {
                setInspections((prev) => [res.data, ...prev])
                setShowLogModal(false)
                setFeedbackMessage('Inspection log saved successfully.')
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    inspectionDate: new Date().toISOString().split('T')[0],
                    inspectingBody: 'Directorate of School Education (CEO Madurai Inspection Team)',
                    inspectingOfficials: '',
                    purpose: 'Routine Annual Inspection',
                    observations: '',
                    deficienciesNoted: '',
                    complianceSubmissionDeadline: '',
                    status: 'Action Required',
                    reportAttachmentUrl: '',
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to save inspection'}`)
            }
        } catch (err) {
            console.error('Failed to create inspection:', err)
            alert('Error logging inspection.')
        }
    }

    const handleSubmitResponse = async (e) => {
        e.preventDefault()
        if (!selectedInspection || !complianceResponseText) return

        try {
            const updatedNotes = selectedInspection.observations + `\n[Compliance Response Submitted]: ${complianceResponseText}`
            const res = await proService.updateInspection(selectedInspection.id, {
                status: 'Compliance Submitted',
                observations: updatedNotes,
            })
            if (res.success) {
                setInspections((prev) =>
                    prev.map((i) =>
                        i.id === selectedInspection.id
                            ? { ...i, status: 'Compliance Submitted', observations: updatedNotes }
                            : i
                    )
                )
                setFeedbackMessage(`Compliance response submitted for inspection ${selectedInspection.id}.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setShowResponseModal(false)
                setSelectedInspection(null)
                setComplianceResponseText('')
            }
        } catch (err) {
            console.error('Failed to submit compliance response:', err)
        }
    }

    const handleMarkCleared = async (id) => {
        try {
            const res = await proService.updateInspection(id, { status: 'Formally Cleared' })
            if (res.success) {
                setInspections((prev) =>
                    prev.map((i) => (i.id === id ? { ...i, status: 'Formally Cleared' } : i))
                )
                setFeedbackMessage('Inspection formally cleared.')
                setTimeout(() => setFeedbackMessage(''), 3000)
            }
        } catch (err) {
            console.error('Failed to clear inspection:', err)
        }
    }

    const columns = [
        {
            key: 'inspectionDate',
            label: 'Inspection Date',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-900'>
                    <Calendar className='w-3.5 h-3.5 text-slate-400' />
                    {row.inspectionDate}
                </div>
            ),
        },
        {
            key: 'inspectingBody',
            label: 'Inspecting Body & Officials',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-bold text-slate-900 text-xs'>{row.inspectingBody}</div>
                    <div className='text-[11px] text-slate-500 mt-0.5'>{row.inspectingOfficials || 'Officer details on file'}</div>
                </div>
            ),
        },
        {
            key: 'purpose',
            label: 'Purpose of Inspection',
            required: true,
            render: (row) => (
                <span className='px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800'>
                    {row.purpose}
                </span>
            ),
        },
        {
            key: 'observations',
            label: 'Key Observations & Deficiencies',
            required: true,
            render: (row) => (
                <div className='max-w-xs'>
                    <p className='text-xs text-slate-700 line-clamp-2'>{row.observations}</p>
                    {row.deficienciesNoted && (
                        <div className='text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1'>
                            <AlertTriangle className='w-3 h-3' />
                            Deficiency Flagged
                        </div>
                    )}
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
                <div className='flex items-center gap-1.5'>
                    <button
                        type='button'
                        onClick={() => setSelectedInspection(row)}
                        className='text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors'
                    >
                        Review
                    </button>
                    {row.status === 'Action Required' && (
                        <button
                            type='button'
                            onClick={() => {
                                setSelectedInspection(row)
                                setShowResponseModal(true)
                            }}
                            className='text-xs px-2.5 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors'
                        >
                            Respond
                        </button>
                    )}
                    {row.status === 'Compliance Submitted' && (
                        <button
                            type='button'
                            onClick={() => handleMarkCleared(row.id)}
                            className='text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold transition-colors'
                        >
                            Mark Cleared
                        </button>
                    )}
                </div>
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
                            <ClipboardList className='w-4 h-4' />
                            Regulatory &amp; Board Oversight
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Board &amp; Authority Inspection Log
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Registry of official inspections by CEO, CBSE panels, Fire Officers, and Health Inspectors with compliance response workflows.
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
                            onClick={() => setShowLogModal(true)}
                            className='inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Log New Inspection
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
                <div className='flex flex-wrap items-center gap-3'>
                    <div className='flex items-center gap-2'>
                        <span className='text-xs font-medium text-slate-500'>Purpose:</span>
                        <select
                            value={purposeFilter}
                            onChange={(e) => setPurposeFilter(e.target.value)}
                            className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        >
                            {PURPOSES.map((p) => (
                                <option key={p} value={p}>{p === 'ALL' ? 'All Inspection Types' : p}</option>
                            ))}
                        </select>
                    </div>

                    <div className='flex items-center gap-2'>
                        <span className='text-xs font-medium text-slate-500'>Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        >
                            <option value='ALL'>All Statuses</option>
                            <option value='Under Inspection'>Under Inspection</option>
                            <option value='Action Required'>Action Required</option>
                            <option value='Compliance Submitted'>Compliance Submitted</option>
                            <option value='Formally Cleared'>Formally Cleared</option>
                        </select>
                    </div>
                </div>

                <div className='relative w-full md:w-64'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search inspecting body or remarks...'
                        className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />
                </div>
            </div>

            {/* Inspections Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Regulatory Inspection Records ({filteredInspections.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredInspections}
                        emptyMessage='No inspection records match the filter criteria.'
                    />
                </div>
            </div>

            {/* Log New Inspection Modal */}
            {showLogModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <h3 className='text-base font-bold text-slate-900'>Log Regulatory Inspection</h3>
                            <button
                                type='button'
                                onClick={() => setShowLogModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <form onSubmit={handleCreateInspection} className='mt-4 space-y-4'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Inspection Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={form.inspectionDate}
                                        onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Purpose *</label>
                                    <select
                                        value={form.purpose}
                                        onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='Routine Annual Inspection'>Routine Annual Inspection</option>
                                        <option value='Affiliation Extension'>Affiliation Extension</option>
                                        <option value='Safety Compliance'>Safety Compliance</option>
                                        <option value='Surprise Vigilance'>Surprise Vigilance</option>
                                        <option value='Complaint Inquiry'>Complaint Inquiry</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Inspecting Body / Team *</label>
                                <input
                                    type='text'
                                    required
                                    value={form.inspectingBody}
                                    onChange={(e) => setForm({ ...form, inspectingBody: e.target.value })}
                                    placeholder='e.g. CEO Madurai Inspection Team'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Inspecting Officials (Names &amp; Designations)</label>
                                <input
                                    type='text'
                                    value={form.inspectingOfficials}
                                    onChange={(e) => setForm({ ...form, inspectingOfficials: e.target.value })}
                                    placeholder='e.g. Dr. P. Ramanathan (CEO), Thiru K. Murugan (DEO)'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Observations &amp; Remarks *</label>
                                <textarea
                                    rows={2}
                                    required
                                    value={form.observations}
                                    onChange={(e) => setForm({ ...form, observations: e.target.value })}
                                    placeholder='Key findings, verbal directions, or review remarks...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Deficiencies Noted (If any)</label>
                                <textarea
                                    rows={2}
                                    value={form.deficienciesNoted}
                                    onChange={(e) => setForm({ ...form, deficienciesNoted: e.target.value })}
                                    placeholder='Areas requiring formal rectification or compliance filing...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Compliance Submission Deadline</label>
                                    <input
                                        type='date'
                                        value={form.complianceSubmissionDeadline}
                                        onChange={(e) => setForm({ ...form, complianceSubmissionDeadline: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Initial Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='Action Required'>Action Required</option>
                                        <option value='Under Inspection'>Under Inspection</option>
                                        <option value='Compliance Submitted'>Compliance Submitted</option>
                                        <option value='Formally Cleared'>Formally Cleared</option>
                                    </select>
                                </div>
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowLogModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Save Inspection
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Submit Compliance Response Modal */}
            {showResponseModal && selectedInspection && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>Submit Compliance Response</h3>
                                <p className='text-xs text-slate-500 mt-0.5'>{selectedInspection.inspectingBody}</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowResponseModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitResponse} className='mt-4 space-y-4'>
                            {selectedInspection.deficienciesNoted && (
                                <div className='p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-900'>
                                    <span className='font-bold block'>Deficiency to Rectify:</span>
                                    {selectedInspection.deficienciesNoted}
                                </div>
                            )}

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>
                                    Official Rectification Response &amp; Evidence *
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    value={complianceResponseText}
                                    onChange={(e) => setComplianceResponseText(e.target.value)}
                                    placeholder='Describe actions taken, attached certificates, and compliance declarations...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowResponseModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    <Send className='w-3.5 h-3.5' />
                                    Submit Formal Compliance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inspection Review Modal */}
            {selectedInspection && !showResponseModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded'>
                                    {selectedInspection.purpose}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>{selectedInspection.inspectingBody}</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedInspection(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div className='grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100'>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Inspection Date</span>
                                    <span className='font-mono font-bold text-slate-900'>{selectedInspection.inspectionDate}</span>
                                </div>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Status</span>
                                    <StatusBadge status={selectedInspection.status} />
                                </div>
                                <div className='col-span-2'>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Officials</span>
                                    <span className='text-slate-800 font-medium'>{selectedInspection.inspectingOfficials || 'On File'}</span>
                                </div>
                            </div>

                            <div>
                                <span className='text-slate-400 block text-[11px] font-medium'>Observations &amp; Log</span>
                                <p className='text-slate-800 whitespace-pre-wrap mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100'>
                                    {selectedInspection.observations}
                                </p>
                            </div>

                            {selectedInspection.deficienciesNoted && (
                                <div className='p-3 bg-rose-50 rounded-xl border border-rose-100'>
                                    <span className='text-rose-800 font-bold block text-[11px]'>Deficiencies Noted:</span>
                                    <p className='text-rose-900 text-xs mt-0.5'>{selectedInspection.deficienciesNoted}</p>
                                </div>
                            )}

                            {selectedInspection.complianceSubmissionDeadline && (
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Statutory Response Deadline</span>
                                    <span className='font-mono font-bold text-amber-700'>{selectedInspection.complianceSubmissionDeadline}</span>
                                </div>
                            )}
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-2'>
                            <button
                                type='button'
                                onClick={() => setSelectedInspection(null)}
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

export default ProInspections
