import React, { useEffect, useState, useMemo } from 'react'
import {
    FileText,
    Plus,
    Filter,
    Search,
    RefreshCw,
    Building2,
    Calendar,
    ArrowDownLeft,
    ArrowUpRight,
    Paperclip,
    Archive,
    CheckCircle2,
    AlertTriangle,
    X,
    Eye,
    Edit3
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { proService } from '../../services/modules/proService'

const DEPARTMENTS = [
    'ALL',
    'CBSE Regional Office',
    'Directorate of School Education, Tamil Nadu',
    'District Collectorate (Disaster & Safety)',
    'Fire & Rescue Services Department',
    'Tamil Nadu Pollution Control Board (TNPCB)',
    'Revenue Department & Tashildar Office',
    'Corporation Public Health Department',
]

const COMPLIANCE_STATUSES = [
    'ALL',
    'Notice Received',
    'Under Department Review',
    'Pending Compliance',
    'Draft',
    'Dispatched',
    'Complied & Closed',
]

const ProCorrespondence = () => {
    const [correspondence, setCorrespondence] = useState([])
    const [loading, setLoading] = useState(true)
    const [directionFilter, setDirectionFilter] = useState('ALL') // ALL, Inward, Outward
    const [deptFilter, setDeptFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // Form state
    const [form, setForm] = useState({
        direction: 'Inward',
        referenceNumber: '',
        subject: '',
        governmentDepartment: 'CBSE Regional Office',
        authorityOfficer: '',
        receivedOrDispatchedDate: new Date().toISOString().split('T')[0],
        statutoryDeadline: '',
        complianceStatus: 'Notice Received',
        fileRoomRefId: 'FILE-2026-006',
        financeChallanRef: '',
        nextActionNotes: '',
        escalationLevel: 'Normal',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await proService.getCorrespondence()
            if (res.success && Array.isArray(res.data)) {
                setCorrespondence(res.data)
            }
        } catch (err) {
            console.error('Failed to load correspondence:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredList = useMemo(() => {
        return correspondence.filter((item) => {
            const matchesDirection = directionFilter === 'ALL' || item.direction === directionFilter
            const matchesDept = deptFilter === 'ALL' || item.governmentDepartment === deptFilter
            const matchesStatus = statusFilter === 'ALL' || item.complianceStatus === statusFilter
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                item.referenceNumber?.toLowerCase().includes(q) ||
                item.subject?.toLowerCase().includes(q) ||
                item.authorityOfficer?.toLowerCase().includes(q) ||
                item.governmentDepartment?.toLowerCase().includes(q)

            return matchesDirection && matchesDept && matchesStatus && matchesSearch
        })
    }, [correspondence, directionFilter, deptFilter, statusFilter, searchQuery])

    const handleRegisterSubmit = async (e) => {
        e.preventDefault()
        if (!form.referenceNumber || !form.subject || !form.governmentDepartment) {
            alert('Please provide reference number, subject, and government department.')
            return
        }

        try {
            const res = await proService.createCorrespondence(form)
            if (res.success) {
                setCorrespondence((prev) => [res.data, ...prev])
                setShowRegisterModal(false)
                setFeedbackMessage(`Correspondence ${res.data.referenceNumber} successfully recorded.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    direction: 'Inward',
                    referenceNumber: '',
                    subject: '',
                    governmentDepartment: 'CBSE Regional Office',
                    authorityOfficer: '',
                    receivedOrDispatchedDate: new Date().toISOString().split('T')[0],
                    statutoryDeadline: '',
                    complianceStatus: 'Notice Received',
                    fileRoomRefId: 'FILE-2026-006',
                    financeChallanRef: '',
                    nextActionNotes: '',
                    escalationLevel: 'Normal',
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to create correspondence'}`)
            }
        } catch (err) {
            console.error('Registration failed:', err)
            alert('Failed to register correspondence.')
        }
    }

    const handleUpdateStatus = async (id, nextStatus) => {
        try {
            const res = await proService.updateCorrespondence(id, { complianceStatus: nextStatus })
            if (res.success) {
                setCorrespondence((prev) =>
                    prev.map((item) => (item.id === id ? { ...item, complianceStatus: nextStatus } : item))
                )
                if (selectedItem?.id === id) {
                    setSelectedItem((prev) => ({ ...prev, complianceStatus: nextStatus }))
                }
                setFeedbackMessage(`Status updated to ${nextStatus}.`)
                setTimeout(() => setFeedbackMessage(''), 3000)
            }
        } catch (err) {
            console.error('Status update failed:', err)
        }
    }

    const columns = [
        {
            key: 'referenceNumber',
            label: 'Ref Number / Direction',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono text-xs font-bold text-slate-900'>{row.referenceNumber}</span>
                    <div className='flex items-center gap-1.5 mt-1'>
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                row.direction === 'Inward'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                        >
                            {row.direction === 'Inward' ? (
                                <ArrowDownLeft className='w-3 h-3' />
                            ) : (
                                <ArrowUpRight className='w-3 h-3' />
                            )}
                            {row.direction}
                        </span>
                        <span className='text-[11px] text-slate-400 font-mono'>{row.receivedOrDispatchedDate}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'subject',
            label: 'Subject & Authority',
            required: true,
            render: (row) => (
                <div className='max-w-md'>
                    <div className='font-semibold text-slate-900 text-xs line-clamp-1'>{row.subject}</div>
                    <div className='text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2'>
                        <span className='font-medium text-slate-700'>{row.governmentDepartment}</span>
                        {row.authorityOfficer && (
                            <span className='text-slate-400'>· Attn: {row.authorityOfficer}</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'fileRoomRefId',
            label: 'File Room Custody',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5'>
                    <Archive className='w-3.5 h-3.5 text-teal-600' />
                    <span className='font-mono text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100'>
                        {row.fileRoomRefId || 'Not Linked'}
                    </span>
                </div>
            ),
        },
        {
            key: 'statutoryDeadline',
            label: 'Statutory Deadline',
            required: true,
            render: (row) => {
                if (!row.statutoryDeadline) {
                    return <span className='text-xs text-slate-400 font-mono'>N/A</span>
                }
                const isOverdue = new Date(row.statutoryDeadline) < new Date()
                return (
                    <div className='flex items-center gap-1.5 font-mono text-xs'>
                        <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                        <span className={isOverdue ? 'text-rose-700 font-bold' : 'text-slate-800'}>
                            {row.statutoryDeadline}
                        </span>
                    </div>
                )
            },
        },
        {
            key: 'complianceStatus',
            label: 'Compliance Status',
            required: true,
            render: (row) => <StatusBadge status={row.complianceStatus} />,
        },
        {
            key: 'actions',
            label: 'Actions',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5'>
                    <button
                        type='button'
                        onClick={() => setSelectedItem(row)}
                        className='text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors flex items-center gap-1'
                    >
                        <Eye className='w-3 h-3' />
                        View
                    </button>
                    {row.complianceStatus !== 'Complied & Closed' ? (
                        <button
                            type='button'
                            onClick={() => handleUpdateStatus(row.id, 'Complied & Closed')}
                            className='text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold transition-colors'
                        >
                            Close Case
                        </button>
                    ) : (
                        <button
                            type='button'
                            onClick={() => handleUpdateStatus(row.id, 'Pending Compliance')}
                            className='text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold transition-colors'
                        >
                            Re-open
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
                            <Building2 className='w-4 h-4' />
                            Official Government Licensing
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Government Correspondence Register
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Complete tracking of inward notices, show-cause orders, outward compliance returns, statutory deadlines, and File Room custody linkages.
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
                            onClick={() => setShowRegisterModal(true)}
                            className='inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Register Correspondence
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

            {/* Filter & Search Bar */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                    {/* Direction Filters */}
                    <div className='flex items-center gap-2'>
                        <span className='text-xs font-semibold text-slate-500'>Flow:</span>
                        {['ALL', 'Inward', 'Outward'].map((dir) => (
                            <button
                                key={dir}
                                type='button'
                                onClick={() => setDirectionFilter(dir)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                    directionFilter === dir
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                            >
                                {dir === 'ALL' ? 'All Communications' : dir}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className='relative w-full md:w-72'>
                        <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search reference, subject, or officer...'
                            className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                        />
                    </div>
                </div>

                <div className='flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100'>
                    <div className='flex items-center gap-2'>
                        <span className='text-xs font-medium text-slate-500'>Department:</span>
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        >
                            {DEPARTMENTS.map((d) => (
                                <option key={d} value={d}>
                                    {d === 'ALL' ? 'All Government Departments' : d}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='flex items-center gap-2'>
                        <span className='text-xs font-medium text-slate-500'>Compliance:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        >
                            {COMPLIANCE_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s === 'ALL' ? 'All Compliance States' : s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Correspondence Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Official Correspondence Records ({filteredList.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredList}
                        emptyMessage='No correspondence found matching the query.'
                    />
                </div>
            </div>

            {/* Register New Correspondence Modal */}
            {showRegisterModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-4 border-b border-slate-100'>
                            <h3 className='text-base font-bold text-slate-900'>Register New Government Correspondence</h3>
                            <button
                                type='button'
                                onClick={() => setShowRegisterModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <form onSubmit={handleRegisterSubmit} className='mt-4 space-y-4'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Direction *</label>
                                    <select
                                        value={form.direction}
                                        onChange={(e) => setForm({ ...form, direction: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='Inward'>Inward (From Authority)</option>
                                        <option value='Outward'>Outward (Dispatched by School)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Reference Number *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.referenceNumber}
                                        onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                                        placeholder='e.g. CBSE/RO/CHN/2026/AFF-882'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Subject *</label>
                                <input
                                    type='text'
                                    required
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    placeholder='Official subject line of the letter or order'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Government Department *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.governmentDepartment}
                                        onChange={(e) => setForm({ ...form, governmentDepartment: e.target.value })}
                                        placeholder='e.g. Directorate of School Education'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Authority Official / Signatory</label>
                                    <input
                                        type='text'
                                        value={form.authorityOfficer}
                                        onChange={(e) => setForm({ ...form, authorityOfficer: e.target.value })}
                                        placeholder='e.g. Chief Educational Officer (CEO)'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Date (Received / Dispatched) *</label>
                                    <input
                                        type='date'
                                        required
                                        value={form.receivedOrDispatchedDate}
                                        onChange={(e) => setForm({ ...form, receivedOrDispatchedDate: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Statutory Deadline (If any)</label>
                                    <input
                                        type='date'
                                        value={form.statutoryDeadline}
                                        onChange={(e) => setForm({ ...form, statutoryDeadline: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-3 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Compliance Status</label>
                                    <select
                                        value={form.complianceStatus}
                                        onChange={(e) => setForm({ ...form, complianceStatus: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='Notice Received'>Notice Received</option>
                                        <option value='Under Department Review'>Under Department Review</option>
                                        <option value='Pending Compliance'>Pending Compliance</option>
                                        <option value='Dispatched'>Dispatched</option>
                                        <option value='Complied & Closed'>Complied & Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>File Room Ref ID</label>
                                    <input
                                        type='text'
                                        value={form.fileRoomRefId}
                                        onChange={(e) => setForm({ ...form, fileRoomRefId: e.target.value })}
                                        placeholder='e.g. FILE-2026-006'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Finance Challan Ref</label>
                                    <input
                                        type='text'
                                        value={form.financeChallanRef}
                                        onChange={(e) => setForm({ ...form, financeChallanRef: e.target.value })}
                                        placeholder='e.g. CHAL-2026-041'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Follow-up &amp; Action Notes</label>
                                <textarea
                                    rows={2}
                                    value={form.nextActionNotes}
                                    onChange={(e) => setForm({ ...form, nextActionNotes: e.target.value })}
                                    placeholder='Specify action required, assigned officer, or compliance notes...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowRegisterModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Save Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Correspondence Detail Drawer / Modal */}
            {selectedItem && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase tracking-wider'>
                                    {selectedItem.direction} Correspondence
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1 font-mono'>
                                    {selectedItem.referenceNumber}
                                </h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedItem(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div>
                                <span className='text-slate-400 block text-[11px] font-medium'>Subject</span>
                                <span className='text-slate-900 font-bold text-sm'>{selectedItem.subject}</span>
                            </div>

                            <div className='grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100'>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Authority Department</span>
                                    <span className='font-semibold text-slate-800'>{selectedItem.governmentDepartment}</span>
                                </div>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Officer</span>
                                    <span className='font-medium text-slate-800'>{selectedItem.authorityOfficer || 'Not Specified'}</span>
                                </div>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Date</span>
                                    <span className='font-mono font-medium text-slate-800'>{selectedItem.receivedOrDispatchedDate}</span>
                                </div>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Statutory Deadline</span>
                                    <span className='font-mono font-bold text-rose-700'>{selectedItem.statutoryDeadline || 'None'}</span>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>File Room Custody</span>
                                    <div className='flex items-center gap-1 font-mono text-teal-700 font-semibold mt-0.5'>
                                        <Archive className='w-3.5 h-3.5' />
                                        {selectedItem.fileRoomRefId || 'Unlinked'}
                                    </div>
                                </div>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Treasury Challan</span>
                                    <span className='font-mono text-slate-800 font-semibold block mt-0.5'>
                                        {selectedItem.financeChallanRef || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className='text-slate-400 block text-[11px] font-medium'>Status</span>
                                <div className='mt-1'>
                                    <StatusBadge status={selectedItem.complianceStatus} />
                                </div>
                            </div>

                            {selectedItem.nextActionNotes && (
                                <div className='p-3 bg-amber-50 rounded-xl border border-amber-100'>
                                    <span className='text-amber-800 block text-[11px] font-bold'>Action Notes:</span>
                                    <p className='text-amber-900 text-xs mt-0.5'>{selectedItem.nextActionNotes}</p>
                                </div>
                            )}
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                                {selectedItem.complianceStatus !== 'Complied & Closed' ? (
                                    <button
                                        type='button'
                                        onClick={() => handleUpdateStatus(selectedItem.id, 'Complied & Closed')}
                                        className='px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors'
                                    >
                                        Mark Complied &amp; Close
                                    </button>
                                ) : (
                                    <button
                                        type='button'
                                        onClick={() => handleUpdateStatus(selectedItem.id, 'Pending Compliance')}
                                        className='px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors'
                                    >
                                        Re-open Case
                                    </button>
                                )}
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedItem(null)}
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

export default ProCorrespondence
