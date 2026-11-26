import React, { useEffect, useState, useMemo } from 'react'
import {
    History,
    Download,
    Eye,
    Video,
    Search,
    RefreshCw,
    ShieldCheck,
    CheckCircle2,
    Calendar,
    Lock,
    ExternalLink,
    Play,
    X,
    FileText
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'

const CctvDeliveryLogs = () => {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [deliverModal, setDeliverModal] = useState(null)
    const [selectedAuditLog, setSelectedAuditLog] = useState(null)
    const [deliveryParams, setDeliveryParams] = useState({
        clipPreparedBy: 'S. Selvakumar (Camera Room)',
        clipDurationSeconds: 1800,
        fileSizeBytes: 350000000,
    })
    const [feedbackMessage, setFeedbackMessage] = useState('')

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await cctvService.getFootageRequests()
            if (res.success && Array.isArray(res.data)) {
                setRequests(res.data)
            }
        } catch (err) {
            console.error('Failed to load CCTV delivery records:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filtered = useMemo(() => {
        return requests.filter((r) => {
            const q = searchQuery.toLowerCase().trim()
            return (
                !q ||
                r.id.toLowerCase().includes(q) ||
                r.requesterName.toLowerCase().includes(q) ||
                r.department.toLowerCase().includes(q)
            )
        })
    }, [requests, searchQuery])

    const handleDeliverClip = async (e) => {
        e.preventDefault()
        if (!deliverModal) return

        try {
            const res = await cctvService.deliverClip(deliverModal.id, deliveryParams)
            if (res.success) {
                setFeedbackMessage(`Watermarked clip package generated & delivered for ${deliverModal.id}.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setDeliverModal(null)
                loadData()
            } else {
                alert(`Error: ${res.error?.message || 'Failed to deliver clip'}`)
            }
        } catch (err) {
            console.error('Clip delivery error:', err)
        }
    }

    const handleLogDownload = async (reqId, action = 'DOWNLOAD') => {
        try {
            const res = await cctvService.logAccessDownload(reqId, {
                userId: 'EMP-TCH-008',
                userName: 'Authorized Viewer',
                action,
            })
            if (res.success) {
                setFeedbackMessage(`Access event logged: ${action} on footage ${reqId}.`)
                setTimeout(() => setFeedbackMessage(''), 3000)
                loadData()
            }
        } catch (err) {
            console.error('Access logging error:', err)
        }
    }

    const columns = [
        {
            key: 'id',
            label: 'Request Ref',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono font-bold text-xs text-slate-900'>{row.id}</span>
                    <div className='text-[10px] text-slate-400 mt-0.5'>{row.incidentDate}</div>
                </div>
            ),
        },
        {
            key: 'requesterName',
            label: 'Recipient & Department',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-bold text-slate-900 text-xs'>{row.requesterName}</div>
                    <div className='text-[11px] text-slate-500 mt-0.5'>{row.department}</div>
                </div>
            ),
        },
        {
            key: 'deliveryStatus',
            label: 'Watermarked Clip Delivery',
            required: true,
            render: (row) => {
                const clip = row.clipDelivery
                if (!clip) {
                    return row.currentApprovalTier === 'Approved' ? (
                        <button
                            type='button'
                            onClick={() => setDeliverModal(row)}
                            className='text-xs px-2.5 py-1 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-semibold transition-colors shadow-xs'
                        >
                            Generate Watermarked Clip
                        </button>
                    ) : (
                        <span className='text-xs text-slate-400'>Pending Approval</span>
                    )
                }

                return (
                    <div className='text-xs'>
                        <div className='font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 flex items-center gap-1 w-fit'>
                            <Video className='w-3 h-3 text-teal-600' />
                            {clip.watermarkText}
                        </div>
                        <div className='text-[10px] text-slate-400 mt-1'>
                            Expiry: {clip.downloadExpiryDate?.split('T')[0]} (48h link)
                        </div>
                    </div>
                )
            },
        },
        {
            key: 'auditLog',
            label: 'Access Audit Count',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setSelectedAuditLog(row)}
                        className='text-xs font-mono font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded'
                    >
                        {row.auditLog?.length || 0} Access Events &rarr;
                    </button>
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Streaming / Download',
            required: true,
            render: (row) => {
                if (!row.clipDelivery) return <span className='text-xs text-slate-300'>—</span>
                return (
                    <div className='flex items-center gap-1.5'>
                        <button
                            type='button'
                            onClick={() => handleLogDownload(row.id, 'STREAM_VIEW')}
                            className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold transition-colors'
                        >
                            <Play className='w-3 h-3' /> Stream
                        </button>
                        <button
                            type='button'
                            onClick={() => handleLogDownload(row.id, 'DOWNLOAD')}
                            className='inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors'
                            title='Download & log access'
                        >
                            <Download className='w-3 h-3' />
                        </button>
                    </div>
                )
            },
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
                            Forensic Evidence Tracking
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Footage Delivery &amp; Download Access Logs
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Cryptographically watermarked video delivery packages with 48-hour download expiry and immutable download access logging reviewed monthly by the Joint Director.
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={loadData}
                        className='inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Logs
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
                <span className='text-xs font-semibold text-slate-600'>Delivered Footage Packages: {filtered.length}</span>
                <div className='relative w-full md:w-72'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search request, requester or dept...'
                        className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Watermarked Footage Packages &amp; Access Register ({filtered.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filtered}
                        emptyMessage='No footage delivery records match the search.'
                    />
                </div>
            </div>

            {/* Generate & Deliver Clip Modal */}
            {deliverModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>Generate Watermarked Clip Package</h3>
                                <p className='text-xs text-slate-500 font-mono mt-0.5'>{deliverModal.id}</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setDeliverModal(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleDeliverClip} className='mt-4 space-y-4'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs'>
                                <div className='font-bold text-slate-900'>Watermark Payload:</div>
                                <div className='font-mono text-teal-800 text-[11px] mt-1 bg-teal-50 p-1.5 rounded'>
                                    {deliverModal.requesterId} / {deliverModal.id} / CONFIDENTIAL
                                </div>
                                <div className='text-slate-500 mt-1'>
                                    Recipient: {deliverModal.requesterName} ({deliverModal.department})
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Clip Extractor / Prepared By</label>
                                <input
                                    type='text'
                                    required
                                    value={deliveryParams.clipPreparedBy}
                                    onChange={(e) => setDeliveryParams({ ...deliveryParams, clipPreparedBy: e.target.value })}
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Duration (Seconds)</label>
                                    <input
                                        type='number'
                                        value={deliveryParams.clipDurationSeconds}
                                        onChange={(e) => setDeliveryParams({ ...deliveryParams, clipDurationSeconds: Number(e.target.value) })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Download Expiry</label>
                                    <input
                                        type='text'
                                        disabled
                                        value='48 Hours (Locked)'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500'
                                    />
                                </div>
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setDeliverModal(null)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Encode &amp; Deliver Clip
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Audit Log Timeline Modal */}
            {selectedAuditLog && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <h3 className='text-sm font-bold text-slate-900'>Access &amp; Audit Log History</h3>
                                <p className='text-xs text-slate-500 font-mono mt-0.5'>{selectedAuditLog.id}</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedAuditLog(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-2 max-h-72 overflow-y-auto pr-1'>
                            {(selectedAuditLog.auditLog || []).map((log, index) => (
                                <div key={index} className='p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs'>
                                    <div className='flex items-center justify-between'>
                                        <span className='font-mono font-bold text-teal-800'>{log.action}</span>
                                        <span className='text-[10px] text-slate-400 font-mono'>{log.timestamp.replace('T', ' ').slice(0, 19)}</span>
                                    </div>
                                    <div className='text-slate-700 mt-1'>
                                        Actor: <span className='font-semibold'>{log.actorName}</span> ({log.actorId})
                                    </div>
                                    <div className='text-slate-400 text-[10px] mt-0.5'>
                                        IP: {log.ipAddress || '192.168.1.1'} {log.notes && `· Notes: ${log.notes}`}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end'>
                            <button
                                type='button'
                                onClick={() => setSelectedAuditLog(null)}
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

export default CctvDeliveryLogs
