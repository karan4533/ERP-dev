import React, { useState, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import {
    BookOpen,
    Plus,
    Search,
    Filter,
    Download,
    CheckCircle2,
    XCircle,
    Clock,
    ShoppingBag,
    User,
    Calendar,
    Sparkles,
    X,
    BookCheck,
    AlertCircle
} from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { useAuth } from '../../../context/AuthContext'

const STORAGE_KEY = 'school-erp-library-book-requests-v1'

const INITIAL_REQUESTS = [
    {
        id: 'BR-2026-001',
        bookTitle: 'Concepts of Physics (Vol 1 & 2)',
        author: 'H.C. Verma',
        isbn: '978-8177091878',
        requesterId: 'STU-10-A-01',
        requesterName: 'Aariv Doddi',
        requesterType: 'Student',
        classSection: 'Grade 10-A',
        department: 'Physics / Science',
        purpose: 'Reference for CBSE Board preparation and competitive exams.',
        priority: 'High',
        requestDate: '2026-10-24',
        status: 'Approved & Reserved',
        adminRemarks: 'Procurement initiated with Bharati Bhawan distributors.',
    },
    {
        id: 'BR-2026-002',
        bookTitle: 'Advanced Organic Chemistry: Structure and Mechanisms',
        author: 'Francis A. Carey, Richard J. Sundberg',
        isbn: '978-0387683461',
        requesterId: 'EMP-TCH-004',
        requesterName: 'Dr. Ramesh Sharma',
        requesterType: 'Staff',
        classSection: 'Senior Faculty',
        department: 'Chemistry',
        purpose: 'Curriculum development and lesson planning for Grade 11-12 Advanced batches.',
        priority: 'High',
        requestDate: '2026-10-26',
        status: 'Procured',
        adminRemarks: 'Added to Main Library Science Block A, Shelf 4.',
    },
    {
        id: 'BR-2026-003',
        bookTitle: 'To Kill a Mockingbird (Graphic Novel Edition)',
        author: 'Harper Lee, Fred Fordham',
        isbn: '978-0062798183',
        requesterId: 'STU-09-B-14',
        requesterName: 'Priya Patel',
        requesterType: 'Student',
        classSection: 'Grade 9-B',
        department: 'English Literature',
        purpose: 'Supplementary reading for Book Club and English term project.',
        priority: 'Standard',
        requestDate: '2026-11-02',
        status: 'Pending Review',
        adminRemarks: '',
    },
    {
        id: 'BR-2026-004',
        bookTitle: 'Python Data Science Handbook: Essential Tools for Working with Data',
        author: 'Jake VanderPlas',
        isbn: '978-1491957660',
        requesterId: 'EMP-TCH-009',
        requesterName: 'Anita Menon',
        requesterType: 'Staff',
        classSection: 'Computer Science HOD',
        department: 'Computer Science',
        purpose: 'Coding lab reference material for AI & Data Analysis elective module.',
        priority: 'Standard',
        requestDate: '2026-11-05',
        status: 'Pending Review',
        adminRemarks: '',
    },
    {
        id: 'BR-2026-005',
        bookTitle: 'The Story of Civilization: Complete Set',
        author: 'Will Durant',
        isbn: '978-1567310238',
        requesterId: 'STU-12-C-08',
        requesterName: 'Kabir Mehta',
        requesterType: 'Student',
        classSection: 'Grade 12-C',
        department: 'History',
        purpose: 'Out of scope multi-volume private reading.',
        priority: 'Low',
        requestDate: '2026-10-15',
        status: 'Rejected',
        adminRemarks: 'Multiple volume encyclopedia exceeding institutional loan budget for individual student; digital archive accessible in Computer Lab.',
    },
]

const readRequests = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
    } catch {
        /* ignore */
    }
    return INITIAL_REQUESTS
}

const saveRequests = (items) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
        /* ignore */
    }
}

export default function BookRequestsList() {
    const { role } = useAuth()
    const [requests, setRequests] = useState(readRequests)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [typeFilter, setTypeFilter] = useState('ALL')
    const [exportModal, setExportModal] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [actionNotes, setActionNotes] = useState('')

    // New Request Form State
    const [newForm, setNewForm] = useState({
        bookTitle: '',
        author: '',
        isbn: '',
        requesterName: '',
        requesterId: '',
        requesterType: 'Student',
        classSection: '',
        department: '',
        purpose: '',
        priority: 'Standard',
    })

    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            const matchesSearch = !searchTerm ||
                r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.department.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
            const matchesType = typeFilter === 'ALL' || r.requesterType === typeFilter

            return matchesSearch && matchesStatus && matchesType
        })
    }, [requests, searchTerm, statusFilter, typeFilter])

    // KPIs
    const stats = useMemo(() => {
        return {
            total: requests.length,
            pending: requests.filter((r) => r.status === 'Pending Review').length,
            approved: requests.filter((r) => r.status === 'Approved & Reserved').length,
            procured: requests.filter((r) => r.status === 'Procured').length,
        }
    }, [requests])

    const handleCreateRequest = (e) => {
        e.preventDefault()
        const newRecord = {
            id: `BR-2026-${String(requests.length + 1).padStart(3, '0')}`,
            ...newForm,
            requestDate: new Date().toISOString().split('T')[0],
            status: 'Pending Review',
            adminRemarks: '',
        }
        const updated = [newRecord, ...requests]
        setRequests(updated)
        saveRequests(updated)
        setIsAddModalOpen(false)
        setNewForm({
            bookTitle: '',
            author: '',
            isbn: '',
            requesterName: '',
            requesterId: '',
            requesterType: 'Student',
            classSection: '',
            department: '',
            purpose: '',
            priority: 'Standard',
        })
    }

    const handleUpdateStatus = (id, newStatus, remarks = '') => {
        const updated = requests.map((r) =>
            r.id === id ? { ...r, status: newStatus, adminRemarks: remarks || r.adminRemarks } : r
        )
        setRequests(updated)
        saveRequests(updated)
        setSelectedRequest(null)
        setActionNotes('')
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Approved & Reserved':
                return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'Procured':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200'
            case 'Rejected':
                return 'bg-rose-50 text-rose-700 border-rose-200'
            default:
                return 'bg-amber-50 text-amber-700 border-amber-200'
        }
    }

    return (
        <section className='space-y-4'>
            {/* Unified Book Management Navigation Tabs */}
            <div className='flex items-center gap-2 border-b border-slate-200 pb-2'>
                <NavLink
                    to='/librarian/book-management/book-list'
                    className='px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors'
                >
                    Book Catalog
                </NavLink>
                <NavLink
                    to='/librarian/issued-books/issued-book-list'
                    className='px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors'
                >
                    Issued Books Register
                </NavLink>
                <NavLink
                    to='/librarian/book-requests'
                    className='px-4 py-2 rounded-xl text-xs font-bold bg-[#515DEF] text-white shadow-xs'
                >
                    Book Requests & Requisitions
                </NavLink>
            </div>

            {/* Header & Primary Action */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-slate-900'>Book Requisitions &amp; Requests</h1>
                    <p className='text-xs text-slate-500 mt-1'>
                        Manage member title requests, procurement requisitions, and reservation queues for students and staff.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setIsAddModalOpen(true)}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#434ec9] shadow-xs cursor-pointer'
                    >
                        <Plus size={16} />
                        Submit Book Requisition
                    </button>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-xl text-xs font-medium hover:bg-slate-50 cursor-pointer shadow-xs'
                    >
                        <Download size={15} />
                        Export
                    </button>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                    <span className='text-xs font-medium text-slate-500'>Total Requisitions</span>
                    <p className='text-2xl font-bold text-slate-900 mt-1'>{stats.total}</p>
                </div>
                <div className='bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20'>
                    <span className='text-xs font-medium text-amber-700'>Pending Review</span>
                    <p className='text-2xl font-bold text-amber-700 mt-1'>{stats.pending}</p>
                </div>
                <div className='bg-white p-4 rounded-2xl border border-blue-200 shadow-xs bg-blue-50/20'>
                    <span className='text-xs font-medium text-blue-700'>Approved &amp; Reserved</span>
                    <p className='text-2xl font-bold text-blue-700 mt-1'>{stats.approved}</p>
                </div>
                <div className='bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20'>
                    <span className='text-xs font-medium text-emerald-700'>Procured to Catalog</span>
                    <p className='text-2xl font-bold text-emerald-700 mt-1'>{stats.procured}</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4 justify-between'>
                <div className='relative w-full md:w-80'>
                    <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
                    <input
                        type='text'
                        placeholder='Search title, author, requester...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-[#515DEF]'
                    />
                </div>
                <div className='flex items-center gap-2 w-full md:w-auto overflow-x-auto'>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className='text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-[#515DEF]'
                    >
                        <option value='ALL'>All Statuses</option>
                        <option value='Pending Review'>Pending Review</option>
                        <option value='Approved & Reserved'>Approved &amp; Reserved</option>
                        <option value='Procured'>Procured</option>
                        <option value='Rejected'>Rejected</option>
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className='text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-[#515DEF]'
                    >
                        <option value='ALL'>All Members</option>
                        <option value='Student'>Students</option>
                        <option value='Staff'>Staff</option>
                    </select>
                </div>
            </div>

            {/* Requisitions Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-xs'>
                        <thead className='bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px]'>
                            <tr>
                                <th className='px-4 py-3.5'>Req ID &amp; Date</th>
                                <th className='px-4 py-3.5'>Book Title &amp; Details</th>
                                <th className='px-4 py-3.5'>Requester</th>
                                <th className='px-4 py-3.5'>Priority</th>
                                <th className='px-4 py-3.5'>Status</th>
                                <th className='px-4 py-3.5 text-right'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className='p-8 text-center text-slate-400'>
                                        No book requests match the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className='hover:bg-slate-50/60 transition-colors'>
                                        <td className='px-4 py-3.5 whitespace-nowrap'>
                                            <span className='font-mono font-bold text-slate-800'>{req.id}</span>
                                            <div className='text-[11px] text-slate-400 mt-0.5'>{req.requestDate}</div>
                                        </td>
                                        <td className='px-4 py-3.5 max-w-xs'>
                                            <div className='font-semibold text-slate-900'>{req.bookTitle}</div>
                                            <div className='text-[11px] text-slate-500 mt-0.5'>
                                                By {req.author} {req.isbn && `· ISBN: ${req.isbn}`}
                                            </div>
                                            {req.purpose && (
                                                <div className='text-[11px] text-slate-400 italic line-clamp-1 mt-0.5'>
                                                    &ldquo;{req.purpose}&rdquo;
                                                </div>
                                            )}
                                        </td>
                                        <td className='px-4 py-3.5 whitespace-nowrap'>
                                            <div className='font-medium text-slate-800 flex items-center gap-1.5'>
                                                <User size={12} className='text-slate-400' />
                                                {req.requesterName}
                                            </div>
                                            <div className='text-[11px] text-slate-400 mt-0.5'>
                                                <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${req.requesterType === 'Student' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                    {req.requesterType}
                                                </span>
                                                {' · '}{req.classSection || req.department}
                                            </div>
                                        </td>
                                        <td className='px-4 py-3.5 whitespace-nowrap'>
                                            <span className={`text-[11px] font-semibold ${req.priority === 'High' ? 'text-rose-600' : req.priority === 'Low' ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {req.priority}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3.5 whitespace-nowrap'>
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3.5 text-right whitespace-nowrap space-x-1.5'>
                                            {req.status === 'Pending Review' && (
                                                <>
                                                    <button
                                                        type='button'
                                                        onClick={() => setSelectedRequest(req)}
                                                        className='px-2.5 py-1 bg-[#515DEF] text-white rounded-lg text-xs font-semibold hover:bg-[#434ec9]'
                                                    >
                                                        Review &amp; Action
                                                    </button>
                                                </>
                                            )}
                                            {req.status === 'Approved & Reserved' && (
                                                <button
                                                    type='button'
                                                    onClick={() => handleUpdateStatus(req.id, 'Procured', 'Catalog accession number generated.')}
                                                    className='px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700'
                                                >
                                                    Mark Procured
                                                </button>
                                            )}
                                            {req.status === 'Procured' && (
                                                <span className='text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1'>
                                                    <CheckCircle2 size={12} /> Available
                                                </span>
                                            )}
                                            {req.status === 'Rejected' && (
                                                <span className='text-[11px] text-slate-400'>
                                                    Closed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ACTION MODAL */}
            {selectedRequest && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <h3 className='text-sm font-bold text-slate-800'>
                                Review Requisition: {selectedRequest.id}
                            </h3>
                            <button
                                type='button'
                                onClick={() => setSelectedRequest(null)}
                                className='p-1 text-slate-400 hover:text-slate-600 rounded-lg'
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5'>
                            <div><strong className='text-slate-700'>Book Title:</strong> {selectedRequest.bookTitle}</div>
                            <div><strong className='text-slate-700'>Author:</strong> {selectedRequest.author}</div>
                            <div><strong className='text-slate-700'>Requester:</strong> {selectedRequest.requesterName} ({selectedRequest.requesterType})</div>
                            <div><strong className='text-slate-700'>Justification:</strong> {selectedRequest.purpose || 'Not specified'}</div>
                        </div>

                        <div>
                            <label className='text-xs font-semibold text-slate-700 block mb-1'>
                                Librarian Remarks / Procurement Note
                            </label>
                            <textarea
                                rows={2}
                                value={actionNotes}
                                onChange={(e) => setActionNotes(e.target.value)}
                                placeholder='e.g., Authorized for Q2 library acquisition fund...'
                                className='w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                            />
                        </div>

                        <div className='flex items-center justify-end gap-2 pt-2 border-t'>
                            <button
                                type='button'
                                onClick={() => handleUpdateStatus(selectedRequest.id, 'Rejected', actionNotes || 'Declined after library committee review.')}
                                className='px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold'
                            >
                                Reject Request
                            </button>
                            <button
                                type='button'
                                onClick={() => handleUpdateStatus(selectedRequest.id, 'Approved & Reserved', actionNotes || 'Approved. Requisition forwarded to acquisition department.')}
                                className='px-4 py-2 bg-[#515DEF] hover:bg-[#434ec9] text-white rounded-lg text-xs font-semibold shadow-xs'
                            >
                                Approve &amp; Reserve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW REQUISITION MODAL */}
            {isAddModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4'>
                        <div className='flex items-center justify-between border-b pb-3'>
                            <div className='flex items-center gap-2'>
                                <BookOpen className='text-[#515DEF]' size={18} />
                                <h3 className='text-sm font-bold text-slate-800'>Submit Book Requisition</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setIsAddModalOpen(false)}
                                className='p-1 text-slate-400 hover:text-slate-600 rounded-lg'
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRequest} className='space-y-3 text-xs'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 block mb-1'>Book Title *</label>
                                    <input
                                        type='text'
                                        required
                                        value={newForm.bookTitle}
                                        onChange={(e) => setNewForm({ ...newForm, bookTitle: e.target.value })}
                                        className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                        placeholder='e.g., Organic Chemistry'
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 block mb-1'>Author / Editor *</label>
                                    <input
                                        type='text'
                                        required
                                        value={newForm.author}
                                        onChange={(e) => setNewForm({ ...newForm, author: e.target.value })}
                                        className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                        placeholder='e.g., Morrison & Boyd'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 block mb-1'>ISBN (Optional)</label>
                                    <input
                                        type='text'
                                        value={newForm.isbn}
                                        onChange={(e) => setNewForm({ ...newForm, isbn: e.target.value })}
                                        className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                        placeholder='978-XXXXXXXXXX'
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 block mb-1'>Department / Subject</label>
                                    <input
                                        type='text'
                                        value={newForm.department}
                                        onChange={(e) => setNewForm({ ...newForm, department: e.target.value })}
                                        className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                        placeholder='e.g., Science / Chemistry'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 block mb-1'>Requester Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={newForm.requesterName}
                                        onChange={(e) => setNewForm({ ...newForm, requesterName: e.target.value })}
                                        className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                        placeholder='Member full name'
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 block mb-1'>Requester Type *</label>
                                    <select
                                        value={newForm.requesterType}
                                        onChange={(e) => setNewForm({ ...newForm, requesterType: e.target.value })}
                                        className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-[#515DEF]'
                                    >
                                        <option value='Student'>Student</option>
                                        <option value='Staff'>Staff / Faculty</option>
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 block mb-1'>Class / Section / Role</label>
                                    <input
                                        type='text'
                                        value={newForm.classSection}
                                        onChange={(e) => setNewForm({ ...newForm, classSection: e.target.value })}
                                        className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                        placeholder='e.g., Grade 10-A or Math Faculty'
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 block mb-1'>Priority</label>
                                    <select
                                        value={newForm.priority}
                                        onChange={(e) => setNewForm({ ...newForm, priority: e.target.value })}
                                        className='w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-[#515DEF]'
                                    >
                                        <option value='Standard'>Standard</option>
                                        <option value='High'>High (Urgent Curriculum)</option>
                                        <option value='Low'>Low (General Reading)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 block mb-1'>Purpose / Academic Need</label>
                                <textarea
                                    rows={2}
                                    value={newForm.purpose}
                                    onChange={(e) => setNewForm({ ...newForm, purpose: e.target.value })}
                                    className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-[#515DEF]'
                                    placeholder='Describe why this book is requested...'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t'>
                                <button
                                    type='button'
                                    onClick={() => setIsAddModalOpen(false)}
                                    className='px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 bg-[#515DEF] hover:bg-[#434ec9] text-white rounded-lg font-semibold shadow-xs'
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

