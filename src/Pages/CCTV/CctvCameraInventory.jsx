import React, { useEffect, useState, useMemo } from 'react'
import {
    Camera,
    Plus,
    Search,
    RefreshCw,
    Video,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    Play,
    X,
    Filter,
    Edit3
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'
import { CCTV_CAMERA_STATUS } from '../../services/models/index'

const ZONES = [
    'ALL',
    'Campus Perimeter & Gates',
    'Academic Blocks & Corridors',
    'Science Laboratories Wing',
    'Dining Hall & Cafeteria',
    'Sports Arena & Playgrounds',
    'Hostel Blocks & Common Areas',
    'Transport Yard & Bus Bays',
    'Administrative Wing & Foyer',
]

const CctvCameraInventory = () => {
    const [cameras, setCameras] = useState([])
    const [loading, setLoading] = useState(true)
    const [zoneFilter, setZoneFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [previewCamera, setPreviewCamera] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // New camera form
    const [form, setForm] = useState({
        name: '',
        zone: 'Campus Perimeter & Gates',
        cameraType: 'Fixed Dome',
        ipAddress: '',
        nvrChannel: 'NVR-1 / CH-05',
        resolutionSpecs: '4K Ultra HD (30 FPS)',
        storageRetentionDays: 45,
        currentStatus: CCTV_CAMERA_STATUS.ONLINE,
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await cctvService.getCameras()
            if (res.success && Array.isArray(res.data)) {
                setCameras(res.data)
            }
        } catch (err) {
            console.error('Failed to load camera inventory:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredCameras = useMemo(() => {
        return cameras.filter((cam) => {
            const matchesZone = zoneFilter === 'ALL' || cam.zone === zoneFilter
            const matchesStatus = statusFilter === 'ALL' || cam.currentStatus === statusFilter
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                cam.id?.toLowerCase().includes(q) ||
                cam.name?.toLowerCase().includes(q) ||
                cam.ipAddress?.toLowerCase().includes(q) ||
                cam.zone?.toLowerCase().includes(q)

            return matchesZone && matchesStatus && matchesSearch
        })
    }, [cameras, zoneFilter, statusFilter, searchQuery])

    const handleCreateCamera = async (e) => {
        e.preventDefault()
        if (!form.name || !form.zone || !form.ipAddress || !form.nvrChannel) {
            alert('Please fill in required fields.')
            return
        }

        try {
            const res = await cctvService.createCamera(form)
            if (res.success) {
                setCameras((prev) => [res.data, ...prev])
                setShowAddModal(false)
                setFeedbackMessage(`Camera ${res.data.name} successfully registered.`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    name: '',
                    zone: 'Campus Perimeter & Gates',
                    cameraType: 'Fixed Dome',
                    ipAddress: '',
                    nvrChannel: 'NVR-1 / CH-05',
                    resolutionSpecs: '4K Ultra HD (30 FPS)',
                    storageRetentionDays: 45,
                    currentStatus: CCTV_CAMERA_STATUS.ONLINE,
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to create camera'}`)
            }
        } catch (err) {
            console.error('Error adding camera:', err)
        }
    }

    const handleToggleStatus = async (camId, current) => {
        const next =
            current === CCTV_CAMERA_STATUS.ONLINE
                ? CCTV_CAMERA_STATUS.OFFLINE
                : current === CCTV_CAMERA_STATUS.OFFLINE
                ? CCTV_CAMERA_STATUS.MAINTENANCE
                : CCTV_CAMERA_STATUS.ONLINE

        try {
            const res = await cctvService.updateCamera(camId, { currentStatus: next })
            if (res.success) {
                setCameras((prev) =>
                    prev.map((c) => (c.id === camId ? { ...c, currentStatus: next } : c))
                )
                setFeedbackMessage(`Camera ${camId} status switched to ${next}.`)
                setTimeout(() => setFeedbackMessage(''), 3000)
            }
        } catch (err) {
            console.error('Status toggle failed:', err)
        }
    }

    const columns = [
        {
            key: 'id',
            label: 'Cam ID & Type',
            required: true,
            render: (row) => (
                <div>
                    <span className='font-mono text-xs font-bold text-slate-900'>{row.id}</span>
                    <div className='text-[10px] text-slate-400 font-medium mt-0.5'>{row.cameraType || 'IP Camera'}</div>
                </div>
            ),
        },
        {
            key: 'name',
            label: 'Camera Name & Physical Zone',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-bold text-slate-900 text-xs'>{row.name}</div>
                    <div className='text-[11px] text-teal-700 font-medium mt-0.5'>{row.zone}</div>
                </div>
            ),
        },
        {
            key: 'network',
            label: 'Network IP & NVR Feed',
            required: true,
            render: (row) => (
                <div className='font-mono text-xs text-slate-700'>
                    <div>{row.ipAddress}</div>
                    <div className='text-[10px] text-slate-400'>{row.nvrChannel}</div>
                </div>
            ),
        },
        {
            key: 'resolutionSpecs',
            label: 'Resolution & Retention',
            required: true,
            render: (row) => (
                <div className='text-xs'>
                    <span className='font-medium text-slate-800'>{row.resolutionSpecs}</span>
                    <div className='text-[10px] text-slate-400 font-mono mt-0.5'>{row.storageRetentionDays || 45} Days Buffer</div>
                </div>
            ),
        },
        {
            key: 'currentStatus',
            label: 'Health Status',
            required: true,
            render: (row) => (
                <button
                    type='button'
                    onClick={() => handleToggleStatus(row.id, row.currentStatus)}
                    className='focus:outline-hidden'
                    title='Click to cycle status: Online -> Offline -> Maintenance'
                >
                    <span
                        className={`px-2 py-0.5 rounded text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all hover:opacity-80 ${
                            row.currentStatus === CCTV_CAMERA_STATUS.ONLINE
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : row.currentStatus === CCTV_CAMERA_STATUS.OFFLINE
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                    >
                        {row.currentStatus}
                    </span>
                </button>
            ),
        },
        {
            key: 'actions',
            label: 'Live Stream',
            required: true,
            render: (row) => (
                <button
                    type='button'
                    onClick={() => setPreviewCamera(row)}
                    className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold transition-colors'
                >
                    <Play className='w-3 h-3' />
                    RTSP Feed
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
                            <Camera className='w-4 h-4' />
                            Surveillance Infrastructure
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Camera Asset Inventory &amp; Physical Locations
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Interactive register of CCTV cameras across academic corridors, laboratories, transport bays, perimeter gates, and hostel wings.
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
                            onClick={() => setShowAddModal(true)}
                            className='inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Add Camera Asset
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
                        <span className='text-xs font-medium text-slate-500'>Zone:</span>
                        <select
                            value={zoneFilter}
                            onChange={(e) => setZoneFilter(e.target.value)}
                            className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        >
                            {ZONES.map((z) => (
                                <option key={z} value={z}>{z === 'ALL' ? 'All Campus Zones' : z}</option>
                            ))}
                        </select>
                    </div>

                    <div className='flex items-center gap-2'>
                        <span className='text-xs font-medium text-slate-500'>Health:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        >
                            <option value='ALL'>All Statuses</option>
                            <option value={CCTV_CAMERA_STATUS.ONLINE}>Online / Active</option>
                            <option value={CCTV_CAMERA_STATUS.OFFLINE}>Offline</option>
                            <option value={CCTV_CAMERA_STATUS.MAINTENANCE}>Under Maintenance</option>
                        </select>
                    </div>
                </div>

                <div className='relative w-full md:w-64'>
                    <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search ID, name, IP or zone...'
                        className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    />
                </div>
            </div>

            {/* Cameras Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Installed Surveillance Cameras ({filteredCameras.length})
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredCameras}
                        emptyMessage='No cameras match the selected filters.'
                    />
                </div>
            </div>

            {/* Add Camera Modal */}
            {showAddModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <h3 className='text-base font-bold text-slate-900'>Register New Camera Asset</h3>
                            <button
                                type='button'
                                onClick={() => setShowAddModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-5 h-5' />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCamera} className='mt-4 space-y-4'>
                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Camera Name / Location *</label>
                                <input
                                    type='text'
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder='e.g. Science Wing Corridor - 2nd Floor'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Campus Zone *</label>
                                    <select
                                        value={form.zone}
                                        onChange={(e) => setForm({ ...form, zone: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        {ZONES.filter((z) => z !== 'ALL').map((z) => (
                                            <option key={z} value={z}>{z}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Camera Hardware Type</label>
                                    <select
                                        value={form.cameraType}
                                        onChange={(e) => setForm({ ...form, cameraType: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='Fixed Dome'>Fixed Dome</option>
                                        <option value='Outdoor Bullet'>Outdoor Bullet</option>
                                        <option value='PTZ 360 Optical Zoom'>PTZ 360 Optical Zoom</option>
                                        <option value='Panoramic Fisheye'>Panoramic Fisheye</option>
                                        <option value='Thermal'>Thermal</option>
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Static IP Address *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.ipAddress}
                                        onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                                        placeholder='192.168.10.120'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>NVR Channel *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.nvrChannel}
                                        onChange={(e) => setForm({ ...form, nvrChannel: e.target.value })}
                                        placeholder='NVR-2 / CH-08'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Resolution</label>
                                    <select
                                        value={form.resolutionSpecs}
                                        onChange={(e) => setForm({ ...form, resolutionSpecs: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='4K Ultra HD (30 FPS)'>4K Ultra HD (30 FPS)</option>
                                        <option value='1080p Full HD (25 FPS)'>1080p Full HD (25 FPS)</option>
                                        <option value='720p HD (30 FPS)'>720p HD (30 FPS)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Storage Retention (Days)</label>
                                    <input
                                        type='number'
                                        value={form.storageRetentionDays}
                                        onChange={(e) => setForm({ ...form, storageRetentionDays: Number(e.target.value) })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowAddModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Save Camera Asset
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Live RTSP Preview Modal */}
            {previewCamera && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4'>
                    <div className='bg-slate-950 rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-800 text-white'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-800'>
                            <div>
                                <span className='text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded'>
                                    {previewCamera.id} · LIVE STREAM
                                </span>
                                <h3 className='text-sm font-bold mt-1 text-slate-100'>{previewCamera.name}</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setPreviewCamera(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        {/* Simulated video feed */}
                        <div className='mt-4 relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center'>
                            <div className='absolute top-3 left-3 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded'>
                                <span className='w-2 h-2 rounded-full bg-emerald-500 animate-ping' />
                                REC {new Date().toLocaleTimeString()}
                            </div>
                            <div className='absolute bottom-3 left-3 text-[11px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded'>
                                {previewCamera.ipAddress} · {previewCamera.resolutionSpecs}
                            </div>
                            <div className='text-center text-slate-600'>
                                <Camera className='w-12 h-12 mx-auto stroke-1 text-slate-700' />
                                <span className='text-xs mt-2 block font-mono text-slate-500'>
                                    RTSP Stream Feed Active · Channel {previewCamera.nvrChannel}
                                </span>
                            </div>
                        </div>

                        <div className='mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400'>
                            <span>Zone: {previewCamera.zone}</span>
                            <button
                                type='button'
                                onClick={() => setPreviewCamera(null)}
                                className='px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold'
                            >
                                Close Feed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default CctvCameraInventory
