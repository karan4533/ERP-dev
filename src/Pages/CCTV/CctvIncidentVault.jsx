import React, { useEffect, useState, useMemo } from 'react'
import {
    Archive,
    Lock,
    Search,
    RefreshCw,
    Video,
    ShieldCheck,
    Calendar,
    Clock,
    Play,
    CheckCircle2,
    X,
    FolderCheck
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'

const CctvIncidentVault = () => {
    const [vaultItems, setVaultItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [previewClip, setPreviewClip] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await cctvService.getFootageRequests()
            if (res.success && Array.isArray(res.data)) {
                // Approved requests or requests with clip delivery are stored in the incident vault
                const vaulted = res.data.filter(
                    (r) => r.currentApprovalTier === 'Approved' || r.clipDelivery !== null
                )
                setVaultItems(vaulted)
            }
        } catch (err) {
            console.error('Failed to load incident vault items:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filtered = useMemo(() => {
        return vaultItems.filter((item) => {
            const q = searchQuery.toLowerCase().trim()
            return (
                !q ||
                item.id.toLowerCase().includes(q) ||
                item.requesterName.toLowerCase().includes(q) ||
                item.reasonCategory.toLowerCase().includes(q) ||
                item.justificationText?.toLowerCase().includes(q)
            )
        })
    }, [vaultItems, searchQuery])

    const handleExtendLock = (id) => {
        setFeedbackMessage(`Retention lock extended by 60 days for incident case ${id}.`)
        setTimeout(() => setFeedbackMessage(''), 4000)
    }

    const columns = [
        {
            key: 'id',
            label: 'Incident Case Ref',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono font-bold text-xs text-slate-900'>{row.id}</span>
                    <div className='text-[10px] text-teal-700 font-semibold mt-0.5'>{row.reasonCategory}</div>
                </div>
            ),
        },
        {
            key: 'requesterName',
            label: 'Investigating Department',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-bold text-slate-900 text-xs'>{row.requesterName}</div>
                    <div className='text-[11px] text-slate-500 mt-0.5'>{row.department}</div>
                </div>
            ),
        },
        {
            key: 'incidentDate',
            label: 'Incident Date & Time',
            required: true,
            render: (row) => (
                <div className='text-xs font-mono text-slate-800'>
                    <div>{row.incidentDate}</div>
                    <div className='text-[11px] text-slate-400'>{row.timeWindowStart} - {row.timeWindowEnd}</div>
                </div>
            ),
        },
        {
            key: 'retentionLockUntil',
            label: 'Retention Lock Status',
            required: true,
            render: (row) => {
                const lockDate = row.clipDelivery?.retentionLockUntil || 'Case Resolution'
                return (
                    <div className='flex items-center gap-1.5 font-mono text-xs text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-200 w-fit'>
                        <Lock className='w-3 h-3 text-rose-600' />
                        Lock: {lockDate}
                    </div>
                )
            },
        },
        {
            key: 'actions',
            label: 'Vault Actions',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setPreviewClip(row)}
                        className='inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors shadow-xs'
                    >
                        <Play className='w-3 h-3' />
                        View Vault Clip
                    </button>
                    <button
                        type='button'
                        onClick={() => handleExtendLock(row.id)}
                        className='text-xs px-2 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors'
                    >
                        Extend Lock
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
                            <Archive className='w-4 h-4' />
                            Secure Evidence Preservation
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Incident Marked Footage Vault
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Immune from automatic 30-day routine purge cycles. Marked incident clips remain securely preserved until case closure authorized by Department Head &amp; Joint Director.
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={loadData}
                        className='inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Vault
                    </button>
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
                <div className='flex items-center gap-2 text-xs font-semibold text-slate-600'>
                    <FolderCheck className='w-4 h-4 text-teal-600' />
                    <span>Preserved Evidence Dossiers: {filtered.length}</span>
                </div>

                <div className='relative w-full md:w-72'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search case, requester or category...'
                        className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Vault Evidence Footage ({filtered.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filtered}
                        emptyMessage='No marked incident footage currently in vault.'
                    />
                </div>
            </div>

            {/* Preview Clip Modal */}
            {previewClip && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4'>
                    <div className='bg-slate-950 rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-800 text-white'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-800'>
                            <div>
                                <span className='text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded'>
                                    VAULT EVIDENCE CLIP · {previewClip.id}
                                </span>
                                <h3 className='text-sm font-bold mt-1 text-slate-100'>{previewClip.reasonCategory}</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setPreviewClip(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        {/* Video player placeholder */}
                        <div className='mt-4 relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center'>
                            <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                                <div className='rotate-[-25deg] text-white/15 text-2xl font-black font-mono select-none tracking-widest text-center'>
                                    {previewClip.requesterId} / {previewClip.id} / CONFIDENTIAL
                                </div>
                            </div>
                            <div className='text-center text-slate-600'>
                                <Video className='w-12 h-12 mx-auto stroke-1 text-slate-700' />
                                <span className='text-xs mt-2 block font-mono text-slate-500'>
                                    Encrypted Watermarked MP4 Stream
                                </span>
                            </div>
                        </div>

                        <div className='mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400'>
                            <span>Retention Lock Active Until Case Closed</span>
                            <button
                                type='button'
                                onClick={() => setPreviewClip(null)}
                                className='px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold'
                            >
                                Close Viewer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default CctvIncidentVault
