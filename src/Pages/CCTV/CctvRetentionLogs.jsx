import React, { useEffect, useState, useMemo } from 'react'
import {
    CalendarOff,
    Clock,
    Search,
    RefreshCw,
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    Trash2,
    Calendar,
    Archive,
    Lock
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'

const INITIAL_PURGE_LOGS = [
    {
        id: 'PURGE-2026-003',
        purgeDate: '2026-03-01',
        retentionPolicy: 'Standard 45-Day Routine Buffer Cycle',
        purgedTimeRange: '2026-01-01 to 2026-01-15',
        totalCamerasPurged: 45,
        storageFreedTB: '14.8 TB',
        purgedBy: 'Automatic NVR Cron Engine',
        auditedBy: 'Dr. K. S. Sundaram (Joint Director)',
        markedFootageExempted: 4,
        status: 'Audit Certified',
    },
    {
        id: 'PURGE-2026-002',
        purgeDate: '2026-02-15',
        retentionPolicy: 'Standard 45-Day Routine Buffer Cycle',
        purgedTimeRange: '2025-12-16 to 2025-12-31',
        totalCamerasPurged: 45,
        storageFreedTB: '15.2 TB',
        purgedBy: 'Automatic NVR Cron Engine',
        auditedBy: 'Dr. K. S. Sundaram (Joint Director)',
        markedFootageExempted: 3,
        status: 'Audit Certified',
    },
    {
        id: 'PURGE-2026-001',
        purgeDate: '2026-02-01',
        retentionPolicy: 'Standard 45-Day Routine Buffer Cycle',
        purgedTimeRange: '2025-12-01 to 2025-12-15',
        totalCamerasPurged: 45,
        storageFreedTB: '14.5 TB',
        purgedBy: 'Automatic NVR Cron Engine',
        auditedBy: 'Dr. K. S. Sundaram (Joint Director)',
        markedFootageExempted: 2,
        status: 'Audit Certified',
    },
]

const CctvRetentionLogs = () => {
    const [purgeLogs, setPurgeLogs] = useState(() => {
        const saved = localStorage.getItem('cctv_purge_logs')
        return saved ? JSON.parse(saved) : INITIAL_PURGE_LOGS
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [feedbackMessage, setFeedbackMessage] = useState('')

    useEffect(() => {
        localStorage.setItem('cctv_purge_logs', JSON.stringify(purgeLogs))
    }, [purgeLogs])

    const handleCertifyPurge = (id) => {
        setFeedbackMessage(`Purge cycle ${id} certified against marked evidence exemption checklist.`)
        setTimeout(() => setFeedbackMessage(''), 4000)
    }

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase().trim()
        return purgeLogs.filter((p) => {
            return (
                !q ||
                p.id.toLowerCase().includes(q) ||
                p.purgedTimeRange.toLowerCase().includes(q) ||
                p.auditedBy.toLowerCase().includes(q)
            )
        })
    }, [purgeLogs, searchQuery])

    const columns = [
        {
            key: 'id',
            label: 'Purge Cycle Ref',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono font-bold text-xs text-slate-900'>{row.id}</span>
                    <div className='text-[10px] text-slate-400 font-mono mt-0.5'>{row.purgeDate}</div>
                </div>
            ),
        },
        {
            key: 'retentionPolicy',
            label: 'Retention Rule & Range',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-bold text-slate-900 text-xs'>{row.retentionPolicy}</div>
                    <div className='text-[11px] text-slate-500 font-mono mt-0.5'>{row.purgedTimeRange}</div>
                </div>
            ),
        },
        {
            key: 'storageFreedTB',
            label: 'Storage Recycled & Cameras',
            required: true,
            render: (row) => (
                <div className='text-xs font-mono'>
                    <span className='font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded'>
                        {row.storageFreedTB}
                    </span>
                    <div className='text-[10px] text-slate-400 mt-0.5'>{row.totalCamerasPurged} Cameras Cleaned</div>
                </div>
            ),
        },
        {
            key: 'markedFootageExempted',
            label: 'Vault Evidentiary Exemptions',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5 font-mono text-xs text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100 w-fit'>
                    <Lock className='w-3 h-3 text-rose-600' />
                    {row.markedFootageExempted} Marked Clips Shielded
                </div>
            ),
        },
        {
            key: 'auditedBy',
            label: 'Executive Monthly Review',
            required: true,
            render: (row) => (
                <div className='text-xs'>
                    <div className='font-semibold text-slate-800'>{row.auditedBy}</div>
                    <div className='mt-0.5'>
                        <StatusBadge status={row.status} />
                    </div>
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Review',
            required: true,
            render: (row) => (
                <button
                    type='button'
                    onClick={() => handleCertifyPurge(row.id)}
                    className='text-xs px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold transition-colors'
                >
                    Re-Certify
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
                            <CalendarOff className='w-4 h-4' />
                            Automated Storage Lifecycle &amp; Governance
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Retention Policies &amp; Cyclic Purge Audit
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Routine 45-day rolling FIFO storage purge enforcement. Marked incident footage in the vault is cryptographically exempted from automated deletion until case closure.
                        </p>
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
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-4'>
                <span className='text-xs font-semibold text-slate-600'>Certified Purge Cycles: {filtered.length}</span>
                <div className='relative w-full md:w-72'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search purge cycle ref or auditor...'
                        className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Automated Purge Audit Logs ({filtered.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filtered}
                        emptyMessage='No purge audit records found.'
                    />
                </div>
            </div>
        </section>
    )
}

export default CctvRetentionLogs
