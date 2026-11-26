import React, { useState } from 'react'
import { Archive, ArrowRightLeft, CheckCircle2, Download, Plus, Search, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { DataTable, StatusBadge } from '../../../Common/ui'

const INITIAL_FILES = [
    {
        fileId: 'DOC-2026-F104',
        fileName: 'Grade 10 CBSE Board Tabulation & Roll Sheets 2025-26',
        category: 'Examination Tabulation',
        rackLocation: 'Rack A, Shelf 2, Box 08',
        retentionPeriod: 'Permanent Archival',
        custodian: 'In Archive (File Room)',
        checkOutDate: '—',
        dueDate: '—',
        status: 'In Archive',
    },
    {
        fileId: 'DOC-2026-F088',
        fileName: 'Transfer Certificates (TC) Duplicate Stubs — Batch 2024-25',
        category: 'Student Records',
        rackLocation: 'Rack B, Shelf 1, Box 14',
        retentionPeriod: '10 Years',
        custodian: 'Mr. Raman (Front Office / PRM)',
        checkOutDate: '2026-10-18',
        dueDate: '2026-10-25',
        status: 'Checked Out',
    },
    {
        fileId: 'DOC-2026-F072',
        fileName: 'School Land Title Deeds, DTCP & Building Approval Blueprints',
        category: 'Legal & Land Records',
        rackLocation: 'Fireproof Safe — Locker 2',
        retentionPeriod: 'Permanent Archival',
        custodian: 'In Archive (File Room)',
        checkOutDate: '—',
        dueDate: '—',
        status: 'In Archive',
    },
    {
        fileId: 'DOC-2026-F051',
        fileName: 'Staff Service Registers & Gratuity Records (A - M)',
        category: 'Staff Records',
        rackLocation: 'Rack C, Shelf 4, Box 02',
        retentionPeriod: 'Permanent Archival',
        custodian: 'Mrs. Jayanthi (HR Specialist)',
        checkOutDate: '2026-10-22',
        dueDate: '2026-10-24',
        status: 'Checked Out',
    },
    {
        fileId: 'DOC-2026-F030',
        fileName: 'Annual Audited Financial Balance Sheets & Tax Returns 2020-25',
        category: 'Finance & Accounts',
        rackLocation: 'Rack D, Shelf 3, Box 19',
        retentionPeriod: '8 Years',
        custodian: 'In Archive (File Room)',
        checkOutDate: '—',
        dueDate: '—',
        status: 'In Archive',
    },
]

const CATEGORIES = [
    'All Categories',
    'Student Records',
    'Staff Records',
    'Legal & Land Records',
    'Examination Tabulation',
    'Finance & Accounts',
]

const FileRoomManagement = () => {
    const [files, setFiles] = useState(INITIAL_FILES)
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All Categories')
    const [isAddModal, setIsAddModal] = useState(false)
    const [movementModal, setMovementModal] = useState({ open: false, file: null, borrower: '', dueDate: '' })

    const [newFile, setNewFile] = useState({
        fileName: '',
        category: 'Student Records',
        rackLocation: '',
        retentionPeriod: '10 Years',
    })

    const filteredFiles = files.filter((f) => {
        const matchesSearch =
            !search ||
            f.fileName.toLowerCase().includes(search.toLowerCase()) ||
            f.fileId.toLowerCase().includes(search.toLowerCase()) ||
            f.rackLocation.toLowerCase().includes(search.toLowerCase()) ||
            f.custodian.toLowerCase().includes(search.toLowerCase())
        const matchesCategory =
            selectedCategory === 'All Categories' || f.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const handleCreateFile = (e) => {
        e.preventDefault()
        if (!newFile.fileName.trim() || !newFile.rackLocation.trim()) {
            toast.error('File name and rack location are required.')
            return
        }

        const id = `DOC-2026-F${String(files.length + 1).padStart(3, '0')}`
        const record = {
            fileId: id,
            ...newFile,
            custodian: 'In Archive (File Room)',
            checkOutDate: '—',
            dueDate: '—',
            status: 'In Archive',
        }

        setFiles([record, ...files])
        setIsAddModal(false)
        setNewFile({
            fileName: '',
            category: 'Student Records',
            rackLocation: '',
            retentionPeriod: '10 Years',
        })
        toast.success(`Accession record ${id} created in physical archive.`)
    }

    const handleMovementSubmit = (e) => {
        e.preventDefault()
        const { file, borrower, dueDate } = movementModal
        if (!borrower.trim() || !dueDate) {
            toast.error('Borrower name and due date are required for check-out.')
            return
        }

        setFiles((prev) =>
            prev.map((f) =>
                f.fileId === file.fileId
                    ? {
                          ...f,
                          custodian: `${borrower.trim()} (Authorized)`,
                          checkOutDate: new Date().toISOString().slice(0, 10),
                          dueDate,
                          status: 'Checked Out',
                      }
                    : f
            )
        )
        toast.success(`Physical file ${file.fileId} checked out to ${borrower}.`)
        setMovementModal({ open: false, file: null, borrower: '', dueDate: '' })
    }

    const handleCheckIn = (file) => {
        setFiles((prev) =>
            prev.map((f) =>
                f.fileId === file.fileId
                    ? {
                          ...f,
                          custodian: 'In Archive (File Room)',
                          checkOutDate: '—',
                          dueDate: '—',
                          status: 'In Archive',
                      }
                    : f
            )
        )
        toast.success(`Physical file ${file.fileId} returned and checked into ${file.rackLocation}.`)
    }

    const columns = [
        { key: 'fileId', label: 'Accession ID', required: true, render: (row) => <span className='font-mono font-bold text-[var(--erp-ink)]'>{row.fileId}</span> },
        {
            key: 'fileName',
            label: 'File Title / Dossier',
            required: true,
            render: (row) => (
                <div>
                    <p className='font-semibold text-[var(--erp-ink)]'>{row.fileName}</p>
                    <p className='text-xs text-[var(--erp-muted)]'>{row.category} · Retention: {row.retentionPeriod}</p>
                </div>
            ),
        },
        { key: 'rackLocation', label: 'Physical Rack / Shelf', render: (row) => <span className='font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs'>{row.rackLocation}</span> },
        { key: 'custodian', label: 'Current Custody', render: (row) => <span className='text-xs font-semibold text-[var(--erp-slate)]'>{row.custodian}</span> },
        { key: 'dueDate', label: 'Due Date', render: (row) => row.dueDate !== '—' ? <span className='text-xs font-semibold text-amber-700'>{row.dueDate}</span> : '—' },
        { key: 'status', label: 'Archival Status', render: (row) => <StatusBadge status={row.status} /> },
    ]

    return (
        <section className='space-y-5'>
            <div className='flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl shadow-md'>
                <div>
                    <div className='flex items-center gap-2'>
                        <span className='rounded-lg bg-[var(--erp-indigo)]/10 p-2 text-[var(--erp-indigo)]'>
                            <Archive size={22} />
                        </span>
                        <h1 className='text-xl font-bold text-[var(--erp-ink)]'>
                            Central File Room &amp; Document Archival Management
                        </h1>
                    </div>
                    <p className='text-xs text-[var(--erp-muted)] mt-1'>
                        Authoritative physical records register, shelf/rack locator, and custody checkout chain.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setIsAddModal(true)}
                        className='inline-flex items-center gap-1.5 rounded-lg bg-[var(--erp-indigo)] px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-[var(--erp-indigo-dark)]'
                    >
                        <Plus size={16} /> New File Accession
                    </button>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 space-y-4'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div className='flex flex-wrap items-center gap-3 flex-1'>
                        <div className='relative w-full max-w-sm'>
                            <input
                                type='text'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder='Search file, rack, ID or custodian…'
                                className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 py-2 pl-9 text-[var(--erp-ink)]'
                            />
                            <Search size={16} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400' />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className='text-xs rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 py-2 text-[var(--erp-ink)]'
                        >
                            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <span className='text-xs text-[var(--erp-muted)] font-medium'>
                        Showing {filteredFiles.length} archived dossiers
                    </span>
                </div>

                <DataTable
                    caption='File Room Registry'
                    rows={filteredFiles}
                    columns={columns}
                    rowKey='fileId'
                    renderActions={(row) => (
                        row.status === 'In Archive' ? (
                            <button
                                type='button'
                                onClick={() => setMovementModal({ open: true, file: row, borrower: '', dueDate: '' })}
                                className='inline-flex items-center gap-1 rounded border border-[var(--erp-indigo)] px-2.5 py-1 text-xs font-semibold text-[var(--erp-indigo)] hover:bg-[var(--erp-indigo)] hover:text-white cursor-pointer'
                            >
                                <ArrowRightLeft size={13} /> Check Out
                            </button>
                        ) : (
                            <button
                                type='button'
                                onClick={() => handleCheckIn(row)}
                                className='inline-flex items-center gap-1 rounded border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white cursor-pointer'
                            >
                                <CheckCircle2 size={13} /> Check In Return
                            </button>
                        )
                    )}
                />
            </div>

            {/* Check Out Modal */}
            {movementModal.open && (
                <div className='fixed inset-0 z-250 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
                        <div className='flex items-center justify-between border-b border-[var(--erp-line)] pb-3'>
                            <h3 className='text-base font-bold text-[var(--erp-ink)]'>
                                Check Out Dossier: {movementModal.file?.fileId}
                            </h3>
                            <button
                                type='button'
                                onClick={() => setMovementModal({ open: false, file: null, borrower: '', dueDate: '' })}
                                className='p-1 text-[var(--erp-muted)] hover:bg-[var(--erp-canvas)] rounded-lg'
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleMovementSubmit} className='mt-4 space-y-3'>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>File Title</label>
                                <p className='text-xs font-medium text-[var(--erp-ink)] bg-slate-50 p-2 rounded-lg border'>
                                    {movementModal.file?.fileName}
                                </p>
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Borrower / Staff Name *</label>
                                <input
                                    required
                                    className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] px-3 py-2'
                                    placeholder='e.g. Mr. Raman (Front Office Head)'
                                    value={movementModal.borrower}
                                    onChange={(e) => setMovementModal({ ...movementModal, borrower: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Expected Return Date *</label>
                                <input
                                    type='date'
                                    required
                                    className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] px-3 py-2'
                                    value={movementModal.dueDate}
                                    onChange={(e) => setMovementModal({ ...movementModal, dueDate: e.target.value })}
                                />
                            </div>
                            <div className='flex justify-end gap-2 border-t pt-3'>
                                <button
                                    type='button'
                                    onClick={() => setMovementModal({ open: false, file: null, borrower: '', dueDate: '' })}
                                    className='rounded-lg border px-3 py-1.5 text-xs'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-lg bg-[var(--erp-indigo)] px-4 py-1.5 text-xs font-semibold text-white'
                                >
                                    Authorize Check Out
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Accession Modal */}
            {isAddModal && (
                <div className='fixed inset-0 z-250 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
                        <div className='flex items-center justify-between border-b border-[var(--erp-line)] pb-3'>
                            <h3 className='text-base font-bold text-[var(--erp-ink)]'>
                                New Document Accession
                            </h3>
                            <button
                                type='button'
                                onClick={() => setIsAddModal(false)}
                                className='p-1 text-[var(--erp-muted)] hover:bg-[var(--erp-canvas)] rounded-lg'
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateFile} className='mt-4 space-y-3'>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>File / Dossier Name *</label>
                                <input
                                    required
                                    className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] px-3 py-2'
                                    placeholder='e.g. CBSE 2026 Examination Roster'
                                    value={newFile.fileName}
                                    onChange={(e) => setNewFile({ ...newFile, fileName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Category *</label>
                                <select
                                    className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] px-3 py-2 bg-white'
                                    value={newFile.category}
                                    onChange={(e) => setNewFile({ ...newFile, category: e.target.value })}
                                >
                                    {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Rack, Shelf &amp; Box Location *</label>
                                <input
                                    required
                                    className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] px-3 py-2'
                                    placeholder='e.g. Rack C, Shelf 2, Box 05'
                                    value={newFile.rackLocation}
                                    onChange={(e) => setNewFile({ ...newFile, rackLocation: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Retention Policy</label>
                                <select
                                    className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] px-3 py-2 bg-white'
                                    value={newFile.retentionPeriod}
                                    onChange={(e) => setNewFile({ ...newFile, retentionPeriod: e.target.value })}
                                >
                                    <option>Permanent Archival</option>
                                    <option>10 Years</option>
                                    <option>8 Years</option>
                                    <option>5 Years</option>
                                    <option>3 Years</option>
                                </select>
                            </div>
                            <div className='flex justify-end gap-2 border-t pt-3'>
                                <button
                                    type='button'
                                    onClick={() => setIsAddModal(false)}
                                    className='rounded-lg border px-3 py-1.5 text-xs'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-lg bg-[var(--erp-indigo)] px-4 py-1.5 text-xs font-semibold text-white'
                                >
                                    Create Accession Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

export default FileRoomManagement

