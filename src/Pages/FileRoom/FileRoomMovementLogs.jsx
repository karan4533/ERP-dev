import React, { useEffect, useState, useMemo } from 'react'
import {
    History,
    Search,
    RefreshCw,
    Archive,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    Clock,
    Filter,
    ShieldCheck,
    UserCheck,
    MapPin
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { fileRoomService } from '../../services/modules/fileRoomService'

const INITIAL_MOVEMENT_LOGS = [
    {
        id: 'LOG-MOV-2026-001',
        timestamp: '2026-03-11T16:20:00Z',
        action: 'CHECKED_OUT',
        fileRefNo: 'EXAM/CBSE/X/2025-26/TAB-01',
        fileName: 'Grade 10 CBSE Board Examination Tabulation Register',
        actorId: 'EMP-FLR-001',
        actorName: 'K. Rajendran (Custodian)',
        recipientName: 'M. Anand (Academics Coordinator)',
        department: 'Academics',
        movementPath: 'Room 102 (Rack A, Shelf 01) → Secondary Academic Wing',
        remarks: 'Released pursuant to JD Access Requisition REQ-FLR-2026-003.',
    },
    {
        id: 'LOG-MOV-2026-002',
        timestamp: '2026-03-10T11:45:00Z',
        action: 'RETURNED',
        fileRefNo: 'HR/STAFF/SRV/2026/DOS-01',
        fileName: 'Staff Service Registers & Verification Dossiers',
        actorId: 'EMP-FLR-001',
        actorName: 'K. Rajendran (Custodian)',
        recipientName: 'P. Kavitha (HR Manager)',
        department: 'HR',
        movementPath: 'HR Department → Room 101 Vault (Fireproof Locker)',
        remarks: 'Returned in Mint condition with all police clearance stubs sealed.',
    },
    {
        id: 'LOG-MOV-2026-003',
        timestamp: '2026-03-08T09:30:00Z',
        action: 'REGISTERED',
        fileRefNo: 'FIN/AUDIT/2025-26/LEDG-04',
        fileName: 'Financial Year 2025-26 Capital Expenditure Ledger Vouchers',
        actorId: 'EMP-FLR-001',
        actorName: 'K. Rajendran (Custodian)',
        recipientName: 'Self (Archive)',
        department: 'Finance',
        movementPath: 'Finance Office → Room 102 (Cupboard 02, Shelf 03, Box 12)',
        remarks: 'New archival deposit registered with 10-year audit retention policy.',
    },
    {
        id: 'LOG-MOV-2026-004',
        timestamp: '2026-03-05T14:15:00Z',
        action: 'AUDIT_INSPECTED',
        fileRefNo: 'LEGAL/CAMPUS/2026/DEED-01',
        fileName: 'Institutional Land Ownership Title Deeds, Patta & DTCP Approvals',
        actorId: 'EMP-DIR-001',
        actorName: 'Dr. V. Thirunavukkarasu (Managing Director)',
        recipientName: 'Executive Council',
        department: 'Executive Governance',
        movementPath: 'Room 101 Vault (Locker 01) — Inspected In-Situ',
        remarks: 'Executive annual spot check of parent deed documents; no removal.',
    },
    {
        id: 'LOG-MOV-2026-005',
        timestamp: '2026-03-02T10:00:00Z',
        action: 'CHECKED_OUT',
        fileRefNo: 'STU/TC/2025-26/STUB-01',
        fileName: 'Student Transfer Certificate (TC) Stubs & Caution Deposit Clearances',
        actorId: 'EMP-FLR-001',
        actorName: 'K. Rajendran (Custodian)',
        recipientName: 'K. Sangeetha (Senior Teacher)',
        department: 'Academics',
        movementPath: 'Room 102 (Rack C) → Administration Counter',
        remarks: 'Issued for verifying student transfer clearance document.',
    },
]

const FileRoomMovementLogs = () => {
    const [logs, setLogs] = useState(() => {
        const saved = localStorage.getItem('fileroom_movement_logs')
        return saved ? JSON.parse(saved) : INITIAL_MOVEMENT_LOGS
    })
    const [actionFilter, setActionFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        localStorage.setItem('fileroom_movement_logs', JSON.stringify(logs))
    }, [logs])

    const filteredLogs = useMemo(() => {
        return logs.filter((item) => {
            const matchesAction = actionFilter === 'ALL' || item.action === actionFilter
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                item.fileRefNo.toLowerCase().includes(q) ||
                item.fileName.toLowerCase().includes(q) ||
                item.recipientName.toLowerCase().includes(q) ||
                item.department.toLowerCase().includes(q)

            return matchesAction && matchesSearch
        })
    }, [logs, actionFilter, searchQuery])

    const columns = [
        {
            key: 'timestamp',
            label: 'Timestamp & Action',
            required: true,
            render: (row) => (
                <div>
                    <div className='flex items-center gap-1.5'>
                        <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                row.action === 'CHECKED_OUT'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : row.action === 'RETURNED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : row.action === 'REGISTERED'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                        >
                            {row.action}
                        </span>
                    </div>
                    <span className='font-mono text-[11px] text-slate-400 block mt-1'>
                        {row.timestamp.replace('T', ' ').slice(0, 16)}
                    </span>
                </div>
            ),
        },
        {
            key: 'fileRefNo',
            label: 'Document Dossier',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-bold text-slate-900 text-xs'>{row.fileName}</div>
                    <div className='font-mono text-[11px] text-teal-700 font-semibold mt-0.5'>{row.fileRefNo}</div>
                </div>
            ),
        },
        {
            key: 'movementPath',
            label: 'Movement Origin & Destination',
            required: true,
            render: (row) => (
                <div className='font-mono text-xs text-slate-700 max-w-sm'>
                    <div className='bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-1.5'>
                        <MapPin className='w-3 h-3 text-slate-400 shrink-0' />
                        <span className='line-clamp-2'>{row.movementPath}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'parties',
            label: 'Custodian & Borrower',
            required: true,
            render: (row) => (
                <div className='text-xs'>
                    <div className='font-semibold text-slate-800'>{row.recipientName}</div>
                    <div className='text-[11px] text-slate-400 mt-0.5'>Handled by: {row.actorName}</div>
                </div>
            ),
        },
        {
            key: 'remarks',
            label: 'Audit Justification Notes',
            required: true,
            render: (row) => <span className='text-xs text-slate-600 line-clamp-2'>{row.remarks}</span>,
        },
    ]

    return (
        <section className='space-y-6 p-1'>
            {/* Header */}
            <div className='rounded-2xl bg-white p-5 border border-slate-200 shadow-xs'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700'>
                            <History className='w-4 h-4' />
                            Immutable Custody Audit Trail
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Chain of Custody &amp; File Movement Audit Logs
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Permanent cryptographic movement history tracking registrations, checkouts, vault returns, in-situ audits, and custodial handovers.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div className='flex items-center gap-2'>
                    <span className='text-xs font-semibold text-slate-500'>Movement Event:</span>
                    {['ALL', 'CHECKED_OUT', 'RETURNED', 'REGISTERED', 'AUDIT_INSPECTED'].map((act) => (
                        <button
                            key={act}
                            type='button'
                            onClick={() => setActionFilter(act)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                actionFilter === act
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                            {act === 'ALL' ? 'All Movements' : act.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className='relative w-full md:w-72'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search barcode, file, or recipient...'
                        className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Custodial Movement Records ({filteredLogs.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredLogs}
                        emptyMessage='No file movement audit logs found matching criteria.'
                    />
                </div>
            </div>
        </section>
    )
}

export default FileRoomMovementLogs
