import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Camera,
    Video,
    ShieldAlert,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Eye,
    Download,
    RefreshCw,
    Layers,
    Lock,
    ShieldCheck,
    Archive,
    History,
    CalendarOff,
    ArrowUpRight
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { cctvService } from '../../services/modules/cctvService'

const cameraColumns = [
    { key: 'id', label: 'Cam ID', required: true },
    { key: 'name', label: 'Camera Name / Location', required: true },
    { key: 'zone', label: 'Zone', required: true },
    { key: 'ipAddress', label: 'IP Address', required: true },
    { key: 'nvrChannel', label: 'NVR Channel', required: true },
    { key: 'resolutionSpecs', label: 'Resolution', required: true },
    { key: 'currentStatus', label: 'Health Status', required: true, render: (row) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            row.currentStatus === 'Online / Active'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : row.currentStatus === 'Offline'
                ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
            {row.currentStatus}
        </span>
    )},
]

const footageRequestColumns = [
    { key: 'id', label: 'Req ID', required: true },
    { key: 'incidentDate', label: 'Incident Date', required: true },
    { key: 'timeWindowStart', label: 'Time Window', required: true, render: (row) => (
        <span className='font-mono text-xs text-slate-700'>
            {row.timeWindowStart} - {row.timeWindowEnd}
        </span>
    )},
    { key: 'requesterName', label: 'Requester', required: true },
    { key: 'department', label: 'Department', required: true },
    { key: 'reasonCategory', label: 'Category', required: true },
    { key: 'currentApprovalTier', label: 'Approval Stage', required: true, render: (row) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            row.currentApprovalTier === 'Approved'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : row.currentApprovalTier === 'Rejected'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
            {row.currentApprovalTier}
        </span>
    )},
    { key: 'isSensitive', label: 'MD Review', required: true, render: (row) => (
        row.isSensitive ? (
            <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit'>
                <Lock className='w-3 h-3' /> Sensitive
            </span>
        ) : (
            <span className='text-xs text-slate-400'>Standard</span>
        )
    )},
]

const CctvDashboard = () => {
    const [stats, setStats] = useState({
        totalCameras: 0,
        onlineCameras: 0,
        offlineCameras: 0,
        pendingRequests: 0,
        totalRequests: 0,
    })
    const [cameras, setCameras] = useState([])
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)

    const loadDashboardData = async () => {
        setLoading(true)
        try {
            const [statsRes, camsRes, reqsRes] = await Promise.all([
                cctvService.getCctvStats(),
                cctvService.getCameras(),
                cctvService.getFootageRequests(),
            ])

            if (statsRes.success) setStats(statsRes.data)
            if (camsRes.success && Array.isArray(camsRes.data)) setCameras(camsRes.data.slice(0, 6))
            if (reqsRes.success && Array.isArray(reqsRes.data)) setRequests(reqsRes.data.slice(0, 6))
        } catch (err) {
            console.error('Failed to load CCTV dashboard data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDashboardData()
    }, [])

    return (
        <section className='space-y-6 p-1'>
            {/* Header Banner */}
            <div className='rounded-2xl bg-white p-5 border border-slate-200 shadow-xs'>
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                    <div>
                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-700'>
                            <Camera className='w-4 h-4 text-green-700' />
                            Campus Surveillance &amp; Camera Control Operations
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            CCTV Surveillance &amp; Footage Governance Dashboard
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Real-time camera stream health, NVR storage monitoring, multi-tier footage requisition approval chains (Requester &rarr; Dept Head &rarr; JD &rarr; MD), watermarked clip delivery, and 30-to-60 day retention policies.
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={loadDashboardData}
                            className='inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors w-fit'
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh Camera Feeds
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Action Navigation Grid */}
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
                <Link to="/cctv/cameras" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <Camera className='w-5 h-5 text-teal-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Camera Inventory</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>Asset locations</span>
                </Link>

                <Link to="/cctv/operational-status" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <ShieldCheck className='w-5 h-5 text-emerald-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Daily Shift Status</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>Health logs</span>
                </Link>

                <Link to="/cctv/footage-requests" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <Video className='w-5 h-5 text-indigo-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Requisition Queue</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>Multi-tier approval</span>
                </Link>

                <Link to="/cctv/incident-vault" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <Archive className='w-5 h-5 text-purple-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Incident Vault</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>Preserved evidence</span>
                </Link>

                <Link to="/cctv/delivery-logs" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <History className='w-5 h-5 text-slate-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Delivery &amp; Downloads</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>Watermarked clips</span>
                </Link>

                <Link to="/cctv/retention-logs" className='p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col items-center text-center'>
                    <CalendarOff className='w-5 h-5 text-rose-600 mb-1.5' />
                    <span className='text-xs font-bold text-slate-800'>Retention Audit</span>
                    <span className='text-[10px] text-slate-400 mt-0.5'>Purge schedules</span>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                <Link to="/cctv/cameras" className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between hover:border-teal-300 transition-colors'>
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Monitored Cameras</div>
                        <div className='text-2xl font-black text-slate-900 mt-1'>{stats.totalCameras}</div>
                        <div className='text-[11px] text-slate-400 mt-0.5'>Across 8 Campus Zones</div>
                    </div>
                    <span className='p-3 rounded-2xl bg-slate-100 text-slate-700'>
                        <Camera className='w-5 h-5' />
                    </span>
                </Link>

                <Link to="/cctv/cameras" className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between hover:border-emerald-300 transition-colors'>
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Online Live Feeds</div>
                        <div className='text-2xl font-black text-emerald-600 mt-1'>{stats.onlineCameras}</div>
                        <div className='text-[11px] text-emerald-600 font-semibold mt-0.5'>Healthy Stream Buffering</div>
                    </div>
                    <span className='p-3 rounded-2xl bg-emerald-50 text-emerald-600'>
                        <CheckCircle2 className='w-5 h-5' />
                    </span>
                </Link>

                <Link to="/cctv/cameras" className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between hover:border-rose-300 transition-colors'>
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Offline / Degraded</div>
                        <div className='text-2xl font-black text-rose-600 mt-1'>{stats.offlineCameras}</div>
                        <div className='text-[11px] text-rose-500 font-semibold mt-0.5'>
                            {stats.offlineCameras > 0 ? 'Maintenance Ticket Raised' : 'Zero Signal Faults'}
                        </div>
                    </div>
                    <span className='p-3 rounded-2xl bg-rose-50 text-rose-600'>
                        <AlertTriangle className='w-5 h-5' />
                    </span>
                </Link>

                <Link to="/cctv/footage-requests" className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between hover:border-amber-300 transition-colors'>
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Pending Requisitions</div>
                        <div className='text-2xl font-black text-amber-600 mt-1'>{stats.pendingRequests}</div>
                        <div className='text-[11px] text-amber-600 font-semibold mt-0.5'>Multi-Tier Approval Queue</div>
                    </div>
                    <span className='p-3 rounded-2xl bg-amber-50 text-amber-600'>
                        <Clock className='w-5 h-5' />
                    </span>
                </Link>
            </div>

            {/* Footage Requisition Approval Queue */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <div>
                        <h2 className='text-sm font-bold text-slate-900'>Multi-Tier Footage Requisitions &amp; Delivery Queue</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>Incident footage requests undergoing approval (Requester &rarr; Dept Head &rarr; JD &rarr; MD)</p>
                    </div>
                    <Link to="/cctv/footage-requests" className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors'>
                        <Clock className='w-3.5 h-3.5' />
                        {requests.length} Requests &rarr;
                    </Link>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={footageRequestColumns}
                        data={requests}
                        emptyMessage='No active footage requests in approval queue.'
                    />
                </div>
            </div>

            {/* Camera Asset Status Roster */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <div>
                        <h2 className='text-sm font-bold text-slate-900'>Camera Asset Health &amp; Daily Operational Status</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>Live network and channel diagnostics across campus security zones</p>
                    </div>
                    <Link to="/cctv/cameras" className='text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1'>
                        Manage Cameras <ArrowUpRight className='w-3.5 h-3.5' />
                    </Link>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={cameraColumns}
                        data={cameras}
                        emptyMessage='No camera hardware records found.'
                    />
                </div>
            </div>
        </section>
    )
}

export default CctvDashboard
