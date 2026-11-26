import React, { useEffect, useState, useMemo } from 'react'
import {
    FolderOpen,
    Plus,
    Search,
    Filter,
    RefreshCw,
    Archive,
    MapPin,
    Lock,
    Clock,
    CheckCircle2,
    ArrowRightLeft,
    X,
    Eye,
    ShieldAlert,
    Calendar,
    Edit3,
    Paperclip,
    AlertTriangle,
    RotateCcw
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { fileRoomService } from '../../services/modules/fileRoomService'
import { CONFIDENTIALITY_TIERS } from '../../services/models/index'

// Student & Staff record categories are excluded/hidden per client review specifications
const CATEGORIES = [
    'ALL',
    'Examination Tabulation & Result Sheets',
    'Institutional Legal Deeds, DTCP Blueprints & Title Deeds',
    'Government Affiliation & Statutory Permitting Files',
    'Financial Audit Registers, Ledgers & Vouchers',
    'Procurement, Vendor Agreements & Contracts',
    'General Administrative Directives & Policies',
]

const EXCLUDED_CATEGORIES = [
    'Student Academic & Cumulative Records',
    'Student Transfer Certificates (TC) & Clearance Stubs',
    'Staff Dossiers, Service Books & Police Verifications',
]

const DEPARTMENTS = [
    'ALL',
    'Academics',
    'Administration',
    'HR',
    'Finance',
    'Operations / Facilities',
    'Executive Governance',
    'PRO',
]

const FileRoomRepository = () => {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [deptFilter, setDeptFilter] = useState('ALL')
    const [confidentialityFilter, setConfidentialityFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [dateValidationWarning, setDateValidationWarning] = useState('')
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // Rename state
    const [renameModalFile, setRenameModalFile] = useState(null)
    const [newFileName, setNewFileName] = useState('')
    const [renameError, setRenameError] = useState('')

    // New file form
    const [form, setForm] = useState({
        fileRefNo: '',
        fileName: '',
        category: 'Examination Tabulation & Result Sheets',
        ownerDepartment: 'Academics',
        academicYear: '2025-2026',
        accessionDate: new Date().toISOString().split('T')[0],
        isReturnable: 'Returnable',
        storageLocation: {
            building: 'Administrative Block',
            room: 'Central File Archive (Room 102)',
            cupboardRack: 'Rack A',
            shelfLevel: 'Shelf 01',
            boxFolder: 'Box 01',
        },
        confidentiality: 'Standard / Public',
        designatedApproverRole: 'principal',
        retentionRule: 'Permanent Archival',
        currentLocationStatus: 'In File Room',
        attachment: null,
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await fileRoomService.getFiles()
            if (res.success && Array.isArray(res.data)) {
                setFiles(res.data)
            }
        } catch (err) {
            console.error('Failed to load file repository:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    // Handle date changes with automatic range inversion prevention
    const handleFromDateChange = (val) => {
        setFromDate(val)
        if (toDate && val > toDate) {
            setDateValidationWarning('From Date was later than To Date. Auto-adjusted To Date to match.')
            setToDate(val)
            setTimeout(() => setDateValidationWarning(''), 4000)
        } else {
            setDateValidationWarning('')
        }
    }

    const handleToDateChange = (val) => {
        if (fromDate && val < fromDate) {
            setDateValidationWarning('To Date cannot be earlier than From Date. Auto-adjusted From Date.')
            setFromDate(val)
            setToDate(val)
            setTimeout(() => setDateValidationWarning(''), 4000)
        } else {
            setToDate(val)
            setDateValidationWarning('')
        }
    }

    const resetFilters = () => {
        setCategoryFilter('ALL')
        setDeptFilter('ALL')
        setConfidentialityFilter('ALL')
        setFromDate('')
        setToDate('')
        setSearchQuery('')
        setDateValidationWarning('')
    }

    const filteredFiles = useMemo(() => {
        return files.filter((f) => {
            // Exclude Student & Staff records per requirement R1
            if (EXCLUDED_CATEGORIES.includes(f.category)) {
                return false
            }

            const matchesCat = categoryFilter === 'ALL' || f.category === categoryFilter
            const matchesDept = deptFilter === 'ALL' || f.ownerDepartment === deptFilter
            const matchesConf =
                confidentialityFilter === 'ALL' || f.confidentiality === confidentialityFilter

            // Date filtering: compare against accessionDate, lastMovementDate, or createdAt
            const fileDate = f.accessionDate || f.lastMovementDate || f.createdAt?.split('T')[0] || ''
            if (fromDate && fileDate && fileDate < fromDate) return false
            if (toDate && fileDate && fileDate > toDate) return false

            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                f.fileRefNo?.toLowerCase().includes(q) ||
                f.fileName?.toLowerCase().includes(q) ||
                f.category?.toLowerCase().includes(q) ||
                f.ownerDepartment?.toLowerCase().includes(q) ||
                f.storageLocation?.cupboardRack?.toLowerCase().includes(q) ||
                f.storageLocation?.boxFolder?.toLowerCase().includes(q)

            return matchesCat && matchesDept && matchesConf && matchesSearch
        })
    }, [files, categoryFilter, deptFilter, confidentialityFilter, fromDate, toDate, searchQuery])

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB limit.')
            return
        }
        setForm((prev) => ({
            ...prev,
            attachment: {
                fileName: file.name,
                fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                mimeType: file.type || 'application/pdf',
                uploadedAt: new Date().toISOString(),
            },
        }))
    }

    const handleRegisterSubmit = async (e) => {
        e.preventDefault()
        if (!form.fileRefNo || !form.fileName || !form.category || !form.ownerDepartment) {
            alert('Please provide all mandatory file fields.')
            return
        }

        try {
            const res = await fileRoomService.registerFile(form)
            if (res.success) {
                setFiles((prev) => [res.data, ...prev])
                setShowRegisterModal(false)
                setFeedbackMessage(`File ${res.data.fileRefNo} successfully registered into custody.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    fileRefNo: '',
                    fileName: '',
                    category: 'Examination Tabulation & Result Sheets',
                    ownerDepartment: 'Academics',
                    academicYear: '2025-2026',
                    accessionDate: new Date().toISOString().split('T')[0],
                    isReturnable: 'Returnable',
                    storageLocation: {
                        building: 'Administrative Block',
                        room: 'Central File Archive (Room 102)',
                        cupboardRack: 'Rack A',
                        shelfLevel: 'Shelf 01',
                        boxFolder: 'Box 01',
                    },
                    confidentiality: 'Standard / Public',
                    designatedApproverRole: 'principal',
                    retentionRule: 'Permanent Archival',
                    currentLocationStatus: 'In File Room',
                    attachment: null,
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to register file'}`)
            }
        } catch (err) {
            console.error('File registration failed:', err)
            alert('File registration failed.')
        }
    }

    const handleRenameSubmit = async (e) => {
        e.preventDefault()
        if (!newFileName || newFileName.trim().length < 3) {
            setRenameError('File name must be at least 3 characters.')
            return
        }

        try {
            const res = await fileRoomService.renameFile(renameModalFile.id, newFileName.trim())
            if (res.success) {
                setFiles((prev) =>
                    prev.map((f) => (f.id === renameModalFile.id ? { ...f, fileName: newFileName.trim() } : f))
                )
                setFeedbackMessage(`File name updated to "${newFileName.trim()}".`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setRenameModalFile(null)
                setNewFileName('')
                setRenameError('')
            } else {
                setRenameError(res.error || 'Failed to rename file.')
            }
        } catch (err) {
            console.error('Rename failed:', err)
            setRenameError('File rename failed.')
        }
    }

    const columns = [
        {
            key: 'fileRefNo',
            label: 'Barcode / File Ref',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900'>
                    <Archive className='w-3.5 h-3.5 text-teal-600' />
                    {row.fileRefNo}
                </div>
            ),
        },
        {
            key: 'fileName',
            label: 'Physical Document Title & Category',
            required: true,
            render: (row) => (
                <div className='max-w-md'>
                    <div className='flex items-center gap-1.5'>
                        <span className='font-bold text-slate-900 text-xs'>{row.fileName}</span>
                        {row.attachment && (
                            <span
                                className='p-0.5 rounded text-teal-600 bg-teal-50 border border-teal-200 inline-flex items-center'
                                title={`Scanned Document: ${row.attachment.fileName} (${row.attachment.fileSize})`}
                            >
                                <Paperclip className='w-3 h-3' />
                            </span>
                        )}
                    </div>
                    <div className='text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2'>
                        <span className='bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded'>{row.category}</span>
                        <span>Dept: <strong className='text-slate-700'>{row.ownerDepartment}</strong></span>
                        {row.accessionDate && (
                            <span className='text-slate-400 font-mono'>Registered: {row.accessionDate}</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'storageLocation',
            label: 'Physical Coordinates (Rack/Shelf/Box)',
            required: true,
            render: (row) => {
                const loc = row.storageLocation || {}
                return (
                    <div className='font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center gap-1.5'>
                        <MapPin className='w-3 h-3 text-slate-400' />
                        <span>{loc.cupboardRack || loc.rackNo || 'Rack'}</span>
                        <span className='text-slate-300'>/</span>
                        <span>{loc.shelfLevel || loc.shelfNo || 'Shelf'}</span>
                        <span className='text-slate-300'>/</span>
                        <span className='font-semibold text-teal-800'>{loc.boxFolder || loc.boxNo || 'Box'}</span>
                    </div>
                )
            },
        },
        {
            key: 'confidentiality',
            label: 'Confidentiality Tier',
            required: true,
            render: (row) => (
                <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        row.confidentiality?.includes('MD')
                            ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200'
                            : row.confidentiality?.includes('Executive')
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                    }`}
                >
                    {row.confidentiality?.includes('MD') ? 'Strictly Confidential (MD)' : row.confidentiality}
                </span>
            ),
        },
        {
            key: 'currentLocationStatus',
            label: 'Status',
            required: true,
            render: (row) => <StatusBadge status={row.currentLocationStatus} />,
        },
        {
            key: 'actions',
            label: 'Actions',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5'>
                    <button
                        type='button'
                        onClick={() => setSelectedFile(row)}
                        className='text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors'
                    >
                        Dossier
                    </button>
                    <button
                        type='button'
                        onClick={() => {
                            setRenameModalFile(row)
                            setNewFileName(row.fileName)
                            setRenameError('')
                        }}
                        className='text-xs px-2 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold transition-colors flex items-center gap-1'
                    >
                        <Edit3 className='w-3 h-3' /> Rename
                    </button>
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
                            <FolderOpen className='w-4 h-4' />
                            Physical Document Custody &amp; Archives
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Document Repository &amp; File Master Register
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Master registry of institutional physical files, board affiliations, audit vouchers, and statutory deeds with 4-tier coordinates, file uploads, and date filtering.
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
                            Register Physical File
                        </button>
                    </div>
                </div>

                {dateValidationWarning && (
                    <div className='mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800 flex items-center gap-2'>
                        <AlertTriangle className='w-4 h-4 text-amber-600 shrink-0' />
                        {dateValidationWarning}
                    </div>
                )}

                {feedbackMessage && (
                    <div className='mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800 flex items-center gap-2'>
                        <CheckCircle2 className='w-4 h-4 text-teal-600 shrink-0' />
                        {feedbackMessage}
                    </div>
                )}
            </div>

            {/* Filter Bar: Date Range, Department, Category, Security Tier & Search */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='flex flex-wrap items-center gap-3'>
                        {/* Date Range Filtering */}
                        <div className='flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200'>
                            <Calendar className='w-3.5 h-3.5 text-teal-600' />
                            <span className='font-semibold text-slate-500'>Date:</span>
                            <input
                                type='date'
                                value={fromDate}
                                onChange={(e) => handleFromDateChange(e.target.value)}
                                className='px-1.5 py-0.5 text-xs rounded border border-slate-200 bg-white font-mono'
                                title='From Accession / Registration Date'
                            />
                            <span className='text-slate-400'>to</span>
                            <input
                                type='date'
                                value={toDate}
                                onChange={(e) => handleToDateChange(e.target.value)}
                                className='px-1.5 py-0.5 text-xs rounded border border-slate-200 bg-white font-mono'
                                title='To Accession / Registration Date'
                            />
                        </div>

                        {/* Department Filter */}
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-slate-500'>Department:</span>
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                            >
                                {DEPARTMENTS.map((d) => (
                                    <option key={d} value={d}>
                                        {d === 'ALL' ? 'All Departments' : d}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-slate-500'>Category:</span>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 max-w-[220px] truncate'
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c === 'ALL' ? 'All Document Categories' : c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Security Tier Filter */}
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-slate-500'>Security:</span>
                            <select
                                value={confidentialityFilter}
                                onChange={(e) => setConfidentialityFilter(e.target.value)}
                                className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                            >
                                <option value='ALL'>All Security Tiers</option>
                                <option value='Standard / Public'>Standard / Public</option>
                                <option value='Department Restricted'>Department Restricted</option>
                                <option value='Executive Confidential (HOD / JD Sign-off)'>Executive Confidential</option>
                                <option value='Strictly Confidential / MD Approval Only'>Strictly Confidential (MD Only)</option>
                            </select>
                        </div>

                        {(categoryFilter !== 'ALL' || deptFilter !== 'ALL' || confidentialityFilter !== 'ALL' || fromDate || toDate || searchQuery) && (
                            <button
                                type='button'
                                onClick={resetFilters}
                                className='text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1'
                            >
                                <RotateCcw className='w-3 h-3' /> Reset
                            </button>
                        )}
                    </div>

                    {/* Search by barcode, title, rack */}
                    <div className='relative w-full md:w-64'>
                        <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search barcode, title, rack...'
                            className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </div>
                </div>
            </div>

            {/* Files Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Cataloged Physical Records ({filteredFiles.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredFiles}
                        emptyMessage='No physical files found matching the search and date criteria.'
                    />
                </div>
            </div>

            {/* Register New Physical File Modal */}
            {showRegisterModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <h3 className='text-base font-bold text-slate-900'>Register New Physical File</h3>
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
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>File Ref / Barcode *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.fileRefNo}
                                        onChange={(e) => setForm({ ...form, fileRefNo: e.target.value })}
                                        placeholder='e.g. EXAM/CBSE/X/2026/TAB-05'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Owner Department *</label>
                                    <select
                                        value={form.ownerDepartment}
                                        onChange={(e) => setForm({ ...form, ownerDepartment: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        {DEPARTMENTS.filter((d) => d !== 'ALL').map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Physical File Title *</label>
                                <input
                                    type='text'
                                    required
                                    value={form.fileName}
                                    onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                                    placeholder='Descriptive title of physical dossier or binder'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='grid grid-cols-3 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Category Classification *</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Accession Date *</label>
                                    <input
                                        type='date'
                                        required
                                        value={form.accessionDate}
                                        onChange={(e) => setForm({ ...form, accessionDate: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Returnable Status</label>
                                    <select
                                        value={form.isReturnable}
                                        onChange={(e) => setForm({ ...form, isReturnable: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='Returnable'>Returnable</option>
                                        <option value='Non-Returnable'>Non-Returnable</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Confidentiality Tier *</label>
                                <select
                                    value={form.confidentiality}
                                    onChange={(e) => setForm({ ...form, confidentiality: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                >
                                    <option value='Standard / Public'>Standard / Public</option>
                                    <option value='Department Restricted'>Department Restricted</option>
                                    <option value='Executive Confidential (HOD / JD Sign-off)'>Executive Confidential</option>
                                    <option value='Strictly Confidential / MD Approval Only'>Strictly Confidential / MD Approval Only</option>
                                </select>
                            </div>

                            {/* Scanned Document File Upload */}
                            <div className='p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2'>
                                <label className='block text-xs font-bold text-slate-800 flex items-center gap-1.5'>
                                    <Paperclip className='w-3.5 h-3.5 text-teal-600' />
                                    Scanned Dossier Attachment (PDF / Image, Max 10MB)
                                </label>
                                <input
                                    type='file'
                                    accept='.pdf,.jpg,.jpeg,.png,.docx'
                                    onChange={handleFileUpload}
                                    className='block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100'
                                />
                                {form.attachment && (
                                    <div className='text-[11px] text-teal-800 font-medium flex items-center gap-1.5 bg-white p-2 rounded border border-teal-100'>
                                        <CheckCircle2 className='w-3.5 h-3.5 text-teal-600 shrink-0' />
                                        <span>Uploaded: <strong>{form.attachment.fileName}</strong> ({form.attachment.fileSize})</span>
                                    </div>
                                )}
                            </div>

                            {/* 4-Tier Storage Coordinates */}
                            <div className='p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3'>
                                <div className='flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider'>
                                    <MapPin className='w-3.5 h-3.5 text-teal-600' />
                                    Physical Storage Coordinates (Building &rarr; Room &rarr; Rack &rarr; Shelf &rarr; Box)
                                </div>

                                <div className='grid grid-cols-2 gap-3'>
                                    <div>
                                        <label className='block text-[11px] font-semibold text-slate-600 mb-1'>Building</label>
                                        <input
                                            type='text'
                                            value={form.storageLocation.building}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    storageLocation: { ...form.storageLocation, building: e.target.value },
                                                })
                                            }
                                            className='w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-[11px] font-semibold text-slate-600 mb-1'>Archive Room</label>
                                        <input
                                            type='text'
                                            value={form.storageLocation.room}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    storageLocation: { ...form.storageLocation, room: e.target.value },
                                                })
                                            }
                                            className='w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white'
                                        />
                                    </div>
                                </div>

                                <div className='grid grid-cols-3 gap-3'>
                                    <div>
                                        <label className='block text-[11px] font-semibold text-slate-600 mb-1'>Cupboard / Rack *</label>
                                        <input
                                            type='text'
                                            required
                                            value={form.storageLocation.cupboardRack}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    storageLocation: { ...form.storageLocation, cupboardRack: e.target.value },
                                                })
                                            }
                                            placeholder='e.g. Rack A'
                                            className='w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-[11px] font-semibold text-slate-600 mb-1'>Shelf Level *</label>
                                        <input
                                            type='text'
                                            required
                                            value={form.storageLocation.shelfLevel}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    storageLocation: { ...form.storageLocation, shelfLevel: e.target.value },
                                                })
                                            }
                                            placeholder='e.g. Shelf 02'
                                            className='w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-[11px] font-semibold text-slate-600 mb-1'>Box / Folder No. *</label>
                                        <input
                                            type='text'
                                            required
                                            value={form.storageLocation.boxFolder}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    storageLocation: { ...form.storageLocation, boxFolder: e.target.value },
                                                })
                                            }
                                            placeholder='e.g. Box 08'
                                            className='w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono'
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Retention Policy</label>
                                    <select
                                        value={form.retentionRule}
                                        onChange={(e) => setForm({ ...form, retentionRule: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='Permanent Archival'>Permanent Archival</option>
                                        <option value='10 Years'>10 Years</option>
                                        <option value='Retirement + 10 Years'>Retirement + 10 Years</option>
                                        <option value='5 Years Post-Graduation'>5 Years Post-Graduation</option>
                                        <option value='3 Years Audit Clearance'>3 Years Audit Clearance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Designated Approver Role</label>
                                    <select
                                        value={form.designatedApproverRole}
                                        onChange={(e) => setForm({ ...form, designatedApproverRole: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='principal'>Principal</option>
                                        <option value='director'>Managing Director (MD)</option>
                                        <option value='jointdirector'>Joint Director (JD)</option>
                                        <option value='accounthead'>Account Head</option>
                                        <option value='hr'>HR Manager</option>
                                    </select>
                                </div>
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
                                    Register &amp; Store File
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rename / Change File Name Modal */}
            {renameModalFile && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>Rename Physical File</h3>
                                <span className='text-[11px] font-mono text-teal-700'>{renameModalFile.fileRefNo}</span>
                            </div>
                            <button
                                type='button'
                                onClick={() => setRenameModalFile(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleRenameSubmit} className='mt-4 space-y-3 text-xs'>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>New File Name / Title *</label>
                                <input
                                    type='text'
                                    required
                                    value={newFileName}
                                    onChange={(e) => {
                                        setNewFileName(e.target.value)
                                        setRenameError('')
                                    }}
                                    placeholder='Enter revised descriptive title'
                                    className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500'
                                />
                                {renameError && (
                                    <span className='text-[11px] text-rose-600 mt-1 block font-medium'>{renameError}</span>
                                )}
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setRenameModalFile(null)}
                                    className='px-3.5 py-1.5 font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-3.5 py-1.5 font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                                >
                                    Save Rename
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* File Dossier Detail Modal */}
            {selectedFile && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase font-mono'>
                                    {selectedFile.fileRefNo}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>{selectedFile.fileName}</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedFile(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-3 text-xs'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-slate-500'>Category:</span>
                                    <span className='font-semibold text-slate-900'>{selectedFile.category}</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-slate-500'>Owner Department:</span>
                                    <span className='font-medium text-slate-800'>{selectedFile.ownerDepartment}</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-slate-500'>Accession Date:</span>
                                    <span className='font-mono text-slate-800'>{selectedFile.accessionDate || selectedFile.lastMovementDate || 'Permanent'}</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-slate-500'>Loan Policy:</span>
                                    <span className='font-semibold text-teal-800'>{selectedFile.isReturnable || 'Returnable'}</span>
                                </div>
                            </div>

                            {selectedFile.attachment && (
                                <div className='p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                        <Paperclip className='w-4 h-4 text-teal-600' />
                                        <div>
                                            <span className='font-semibold text-teal-900 block'>{selectedFile.attachment.fileName}</span>
                                            <span className='text-[10px] text-teal-700'>{selectedFile.attachment.fileSize} · Scanned Document</span>
                                        </div>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={() => alert(`Simulated preview of ${selectedFile.attachment.fileName}`)}
                                        className='text-[11px] px-2.5 py-1 rounded bg-teal-600 text-white font-semibold hover:bg-teal-700'
                                    >
                                        Preview
                                    </button>
                                </div>
                            )}

                            <div className='p-3 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2'>
                                <div className='text-xs font-bold text-teal-900 flex items-center gap-1.5'>
                                    <MapPin className='w-3.5 h-3.5 text-teal-700' />
                                    Physical Coordinates
                                </div>
                                <div className='grid grid-cols-2 gap-2 text-slate-700 font-mono'>
                                    <div>Building: {selectedFile.storageLocation?.building}</div>
                                    <div>Room: {selectedFile.storageLocation?.room}</div>
                                    <div>Rack: {selectedFile.storageLocation?.cupboardRack || selectedFile.storageLocation?.rackNo}</div>
                                    <div>Shelf: {selectedFile.storageLocation?.shelfLevel || selectedFile.storageLocation?.shelfNo}</div>
                                    <div>Box/Folder: {selectedFile.storageLocation?.boxFolder || selectedFile.storageLocation?.boxNo}</div>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Security Tier</span>
                                    <span className='font-bold text-slate-800 block mt-0.5'>{selectedFile.confidentiality}</span>
                                </div>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Custody Status</span>
                                    <div className='mt-0.5'>
                                        <StatusBadge status={selectedFile.currentLocationStatus} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedFile(null)}
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

export default FileRoomRepository
