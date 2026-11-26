import React, { useState } from 'react'
import { AlertCircle, Camera, CheckCircle, Clock, Play, ShieldAlert, Video, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { DataTable, StatusBadge } from '../../../Common/ui'

const INITIAL_CAMERAS = [
    {
        id: 'CAM-01',
        name: 'Main Gate & Security Guard Cabin',
        zone: 'Campus Perimeter',
        ipAddress: '192.168.10.101',
        channel: 'NVR-1 / CH-01',
        resolution: '4K Ultra HD (30 FPS)',
        storageRetention: '45 Days',
        status: 'Active',
    },
    {
        id: 'CAM-02',
        name: 'Academic Block A — Ground Floor Foyer',
        zone: 'Academic Blocks',
        ipAddress: '192.168.10.102',
        channel: 'NVR-1 / CH-02',
        resolution: '4K Ultra HD (30 FPS)',
        storageRetention: '45 Days',
        status: 'Active',
    },
    {
        id: 'CAM-03',
        name: 'Senior Science & Composite Chemistry Lab',
        zone: 'Laboratory Wing',
        ipAddress: '192.168.10.108',
        channel: 'NVR-2 / CH-04',
        resolution: '1080p Full HD (25 FPS)',
        storageRetention: '30 Days',
        status: 'Active',
    },
    {
        id: 'CAM-04',
        name: 'Dining Hall & Kitchen Serving Counter',
        zone: 'Café & Dining',
        ipAddress: '192.168.10.115',
        channel: 'NVR-2 / CH-09',
        resolution: '1080p Full HD (25 FPS)',
        storageRetention: '30 Days',
        status: 'Active',
    },
    {
        id: 'CAM-05',
        name: 'East Sports Arena & Football Ground',
        zone: 'Sports Ground',
        ipAddress: '192.168.10.124',
        channel: 'NVR-3 / CH-01',
        resolution: '4K PTZ Optical Zoom',
        storageRetention: '45 Days',
        status: 'Maintenance Required',
    },
]

const INITIAL_INCIDENTS = [
    {
        requestId: 'REQ-CCTV-2026-081',
        date: '2026-10-21',
        timeWindow: '08:15 AM - 08:45 AM',
        camera: 'Main Gate & Security Guard Cabin',
        requestedBy: 'Transport Manager (Mr. Selvam)',
        reason: 'Minor van bumper scraping during morning drop-off queue',
        approvalStatus: 'Approved by Joint Director',
    },
    {
        requestId: 'REQ-CCTV-2026-079',
        date: '2026-10-16',
        timeWindow: '01:10 PM - 01:40 PM',
        camera: 'Academic Block A — Ground Floor Foyer',
        requestedBy: 'Primary Coordinator (Ms. Priya Nair)',
        reason: 'Lost student spectacles case reported near notice board',
        approvalStatus: 'Footage Reviewed & Closed',
    },
]

const CCTVManagement = () => {
    const [cameras, setCameras] = useState(INITIAL_CAMERAS)
    const [incidents, setIncidents] = useState(INITIAL_INCIDENTS)
    const [activeTab, setActiveTab] = useState('cameras')
    const [requestModal, setRequestModal] = useState(false)
    const [playbackModal, setPlaybackModal] = useState({ open: false, camera: null })

    const [reqForm, setReqForm] = useState({
        date: new Date().toISOString().slice(0, 10),
        timeWindow: '09:00 AM - 10:00 AM',
        camera: 'Main Gate & Security Guard Cabin',
        requestedBy: 'Academic Coordinator',
        reason: '',
    })

    const handleCreateRequest = (e) => {
        e.preventDefault()
        if (!reqForm.reason.trim()) {
            toast.error('Justification reason is required for CCTV footage access.')
            return
        }

        const newReq = {
            requestId: `REQ-CCTV-2026-${String(incidents.length + 80).padStart(3, '0')}`,
            ...reqForm,
            approvalStatus: 'Pending Joint Director Approval',
        }

        setIncidents([newReq, ...incidents])
        setRequestModal(false)
        setReqForm({
            date: new Date().toISOString().slice(0, 10),
            timeWindow: '09:00 AM - 10:00 AM',
            camera: 'Main Gate & Security Guard Cabin',
            requestedBy: 'Academic Coordinator',
            reason: '',
        })
        toast.success(`Footage request ${newReq.requestId} routed to Joint Director for authorization.`)
    }

    const cameraColumns = [
        { key: 'id', label: 'Camera ID', required: true, render: (row) => <span className='font-mono font-bold'>{row.id}</span> },
        {
            key: 'name',
            label: 'Camera Name / Location',
            required: true,
            render: (row) => (
                <div>
                    <p className='font-semibold text-[var(--erp-ink)]'>{row.name}</p>
                    <p className='text-xs text-[var(--erp-muted)]'>{row.zone} · {row.channel}</p>
                </div>
            ),
        },
        { key: 'ipAddress', label: 'Network Stream IP', render: (row) => <span className='font-mono text-xs'>{row.ipAddress}</span> },
        { key: 'resolution', label: 'Stream Specs', render: (row) => <span className='text-xs font-medium text-slate-700'>{row.resolution}</span> },
        { key: 'storageRetention', label: 'NVR Retention', render: (row) => <span className='text-xs text-slate-600'>{row.storageRetention}</span> },
        { key: 'status', label: 'Stream Health', render: (row) => <StatusBadge status={row.status} /> },
    ]

    const incidentColumns = [
        { key: 'requestId', label: 'Request Ref', required: true, render: (row) => <span className='font-mono font-bold'>{row.requestId}</span> },
        { key: 'date', label: 'Incident Date', render: (row) => `${row.date} (${row.timeWindow})` },
        { key: 'camera', label: 'Camera Requested' },
        { key: 'requestedBy', label: 'Requester' },
        { key: 'reason', label: 'Stated Justification', render: (row) => <span className='text-xs font-medium text-[var(--erp-ink)]'>{row.reason}</span> },
        { key: 'approvalStatus', label: 'Governance Gate', render: (row) => <StatusBadge status={row.approvalStatus} /> },
    ]

    return (
        <section className='space-y-5'>
            <div className='flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl shadow-md'>
                <div>
                    <div className='flex items-center gap-2'>
                        <span className='rounded-lg bg-slate-900 p-2 text-white'>
                            <Camera size={22} />
                        </span>
                        <h1 className='text-xl font-bold text-[var(--erp-ink)]'>
                            Campus CCTV &amp; Surveillance Governance
                        </h1>
                    </div>
                    <p className='text-xs text-[var(--erp-muted)] mt-1'>
                        NVR storage buffers, live camera health monitoring, and authorized incident footage requests.
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setRequestModal(true)}
                        className='inline-flex items-center gap-1.5 rounded-lg bg-[var(--erp-indigo)] px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-[var(--erp-indigo-dark)]'
                    >
                        <Video size={16} /> Request Footage Playback
                    </button>
                </div>
            </div>

            {/* Quick KPI stats */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                <div className='bg-white p-4 rounded-2xl shadow-md'>
                    <p className='text-xs text-[#808080] uppercase'>Active Cameras</p>
                    <p className='text-2xl font-bold text-emerald-600 mt-1'>64 / 64</p>
                </div>
                <div className='bg-white p-4 rounded-2xl shadow-md'>
                    <p className='text-xs text-[#808080] uppercase'>NVR Storage Health</p>
                    <p className='text-2xl font-bold text-[var(--erp-indigo)] mt-1'>100% OK</p>
                </div>
                <div className='bg-white p-4 rounded-2xl shadow-md'>
                    <p className='text-xs text-[#808080] uppercase'>Active Playback Requests</p>
                    <p className='text-2xl font-bold text-amber-600 mt-1'>{incidents.length}</p>
                </div>
                <div className='bg-white p-4 rounded-2xl shadow-md'>
                    <p className='text-xs text-[#808080] uppercase'>Retention Buffer</p>
                    <p className='text-2xl font-bold text-slate-800 mt-1'>45 Days</p>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md overflow-hidden'>
                <div className='flex border-b border-[var(--erp-line)] px-5 pt-3 gap-5'>
                    <button
                        type='button'
                        onClick={() => setActiveTab('cameras')}
                        className={`pb-3 text-sm font-semibold border-b-2 cursor-pointer ${
                            activeTab === 'cameras'
                                ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]'
                                : 'border-transparent text-[var(--erp-slate)]'
                        }`}
                    >
                        Camera Inventory &amp; Stream Health
                    </button>
                    <button
                        type='button'
                        onClick={() => setActiveTab('incidents')}
                        className={`pb-3 text-sm font-semibold border-b-2 cursor-pointer ${
                            activeTab === 'incidents'
                                ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]'
                                : 'border-transparent text-[var(--erp-slate)]'
                        }`}
                    >
                        Footage Playback Requests &amp; Audit Trail
                    </button>
                </div>

                <div className='p-4'>
                    {activeTab === 'cameras' ? (
                        <DataTable
                            caption='Camera inventory'
                            rows={cameras}
                            columns={cameraColumns}
                            rowKey='id'
                            renderActions={(row) => (
                                <button
                                    type='button'
                                    onClick={() => setPlaybackModal({ open: true, camera: row })}
                                    className='inline-flex items-center gap-1 rounded border border-[var(--erp-indigo)] px-2.5 py-1 text-xs font-semibold text-[var(--erp-indigo)] hover:bg-[var(--erp-indigo)] hover:text-white cursor-pointer'
                                >
                                    <Play size={12} /> Inspect Stream
                                </button>
                            )}
                        />
                    ) : (
                        <DataTable
                            caption='Incident footage requests'
                            rows={incidents}
                            columns={incidentColumns}
                            rowKey='requestId'
                        />
                    )}
                </div>
            </div>

            {/* Playback Preview Modal */}
            {playbackModal.open && (
                <div className='fixed inset-0 z-250 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-2xl rounded-2xl bg-slate-900 text-white p-6 shadow-2xl'>
                        <div className='flex items-center justify-between border-b border-slate-700 pb-3'>
                            <div className='flex items-center gap-2'>
                                <span className='h-3 w-3 rounded-full bg-red-500 animate-pulse'></span>
                                <h3 className='text-sm font-bold tracking-wide'>
                                    LIVE CCTV FEED: {playbackModal.camera?.name}
                                </h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setPlaybackModal({ open: false, camera: null })}
                                className='p-1 text-slate-400 hover:text-white'
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className='my-4 aspect-video bg-black rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden'>
                            <div className='absolute top-3 left-3 text-[10px] font-mono text-emerald-400 bg-black/70 px-2 py-1 rounded'>
                                RTSP LIVE: {playbackModal.camera?.ipAddress} · 30 FPS · 4K UHD
                            </div>
                            <div className='absolute top-3 right-3 text-[10px] font-mono text-slate-400 bg-black/70 px-2 py-1 rounded'>
                                {new Date().toLocaleTimeString()} · REC ON
                            </div>
                            <Video size={48} className='text-slate-600 mb-2' />
                            <p className='text-xs text-slate-400 font-mono'>
                                Secure CCTV video stream active on local school NVR subnet.
                            </p>
                        </div>
                        <div className='flex items-center justify-between text-xs text-slate-400'>
                            <span>Retention policy: {playbackModal.camera?.storageRetention} buffer</span>
                            <button
                                type='button'
                                onClick={() => setPlaybackModal({ open: false, camera: null })}
                                className='px-4 py-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-600'
                            >
                                Close Stream
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Footage Modal */}
            {requestModal && (
                <div className='fixed inset-0 z-250 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
                        <div className='flex items-center justify-between border-b border-[var(--erp-line)] pb-3'>
                            <h3 className='text-base font-bold text-[var(--erp-ink)]'>
                                Request Incident Footage Access
                            </h3>
                            <button
                                type='button'
                                onClick={() => setRequestModal(false)}
                                className='p-1 text-[var(--erp-muted)] hover:bg-[var(--erp-canvas)] rounded-lg'
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRequest} className='mt-4 space-y-3'>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Incident Date *</label>
                                <input
                                    type='date'
                                    required
                                    className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] px-3 py-2'
                                    value={reqForm.date}
                                    onChange={(e) => setReqForm({ ...reqForm, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Time Window *</label>
                                <input
                                    required
                                    className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] px-3 py-2'
                                    placeholder='e.g. 08:30 AM - 09:15 AM'
                                    value={reqForm.timeWindow}
                                    onChange={(e) => setReqForm({ ...reqForm, timeWindow: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Target Camera Zone *</label>
                                <select
                                    className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] px-3 py-2 bg-white'
                                    value={reqForm.camera}
                                    onChange={(e) => setReqForm({ ...reqForm, camera: e.target.value })}
                                >
                                    {cameras.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Official Reason / Purpose *</label>
                                <textarea
                                    required
                                    rows={3}
                                    className='w-full text-xs rounded-lg border border-[var(--erp-line-strong)] px-3 py-2'
                                    placeholder='State incident details, involved parties, or inspection need...'
                                    value={reqForm.reason}
                                    onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
                                />
                            </div>
                            <div className='flex justify-end gap-2 border-t pt-3'>
                                <button
                                    type='button'
                                    onClick={() => setRequestModal(false)}
                                    className='rounded-lg border px-3 py-1.5 text-xs'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-lg bg-[var(--erp-indigo)] px-4 py-1.5 text-xs font-semibold text-white'
                                >
                                    Submit Request to JD
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

export default CCTVManagement

