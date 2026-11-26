import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Building2,
    Calendar,
    FileText,
    Landmark,
    ShieldCheck,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Award,
    FileCheck2,
    ArrowUpRight,
    RefreshCw,
    Receipt,
    Archive,
    Database,
    ClipboardList
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../Common/ui'
import { proService } from '../../services/modules/proService'

const correspondenceColumns = [
    { key: 'referenceNumber', label: 'Reference No.', required: true },
    { key: 'direction', label: 'Direction', required: true, render: (row) => (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${row.direction === 'Inward' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
            {row.direction}
        </span>
    )},
    { key: 'governmentDepartment', label: 'Department / Authority', required: true },
    { key: 'subject', label: 'Subject', required: true },
    { key: 'statutoryDeadline', label: 'Statutory Deadline', required: true },
    { key: 'complianceStatus', label: 'Status', required: true, render: (row) => <StatusBadge status={row.complianceStatus} /> },
]

const permitColumns = [
    { key: 'permitType', label: 'Permit / NOC Type', required: true },
    { key: 'permitNumber', label: 'Permit No.', required: true },
    { key: 'issuingAuthority', label: 'Issuing Body', required: true },
    { key: 'expiryDate', label: 'Expiry Date', required: true },
    { key: 'status', label: 'Validity Status', required: true, render: (row) => <StatusBadge status={row.status} /> },
]

const calendarColumns = [
    { key: 'date', label: 'Due Date', required: true },
    { key: 'title', label: 'Compliance Item', required: true },
    { key: 'type', label: 'Category', required: true },
    { key: 'department', label: 'Authority', required: true },
    { key: 'priority', label: 'Urgency', required: true, render: (row) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${row.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' : row.priority === 'Urgent' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-700'}`}>
            {row.priority}
        </span>
    )},
]

const ProDashboard = () => {
    const [stats, setStats] = useState({
        totalCorrespondence: 0,
        pendingCorrespondence: 0,
        activePermits: 0,
        permitsNeedingAttention: 0,
        totalInspections: 0,
        actionRequiredInspections: 0,
    })
    const [correspondenceList, setCorrespondenceList] = useState([])
    const [permitsList, setPermitsList] = useState([])
    const [calendarEvents, setCalendarEvents] = useState([])
    const [loading, setLoading] = useState(true)

    const loadDashboardData = async () => {
        setLoading(true)
        try {
            const [statsRes, corrRes, permitsRes, calRes] = await Promise.all([
                proService.getComplianceStats(),
                proService.getCorrespondence(),
                proService.getPermits(),
                proService.getComplianceCalendar(),
            ])

            if (statsRes.success) setStats(statsRes.data)
            if (corrRes.success && Array.isArray(corrRes.data)) setCorrespondenceList(corrRes.data.slice(0, 5))
            if (permitsRes.success && Array.isArray(permitsRes.data)) setPermitsList(permitsRes.data.slice(0, 5))
            if (calRes.success && Array.isArray(calRes.data)) setCalendarEvents(calRes.data.slice(0, 6))
        } catch (err) {
            console.error('Failed to load PRO dashboard data:', err)
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
                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700'>
                            <Building2 className='w-4 h-4' />
                            Public Relations &amp; Government Licensing Office
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            PRO Governance &amp; Statutory Compliance Dashboard
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Centralized tracking of regulatory board affiliations, municipal/fire permits, government correspondence, compliance deadlines, and inspection oversight.
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={loadDashboardData}
                            className='inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors w-fit'
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh Telemetry
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                <Link to="/pro/correspondence" className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between hover:border-blue-300 transition-colors'>
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Govt Correspondence</div>
                        <div className='text-2xl font-black text-slate-900 mt-1'>{stats.totalCorrespondence}</div>
                        <div className='text-[11px] text-amber-600 font-semibold mt-0.5'>{stats.pendingCorrespondence} Pending Review</div>
                    </div>
                    <span className='p-3 rounded-2xl bg-blue-50 text-blue-600'>
                        <FileText className='w-5 h-5' />
                    </span>
                </Link>

                <Link to="/pro/permits" className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between hover:border-emerald-300 transition-colors'>
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Statutory Permits</div>
                        <div className='text-2xl font-black text-slate-900 mt-1'>{stats.activePermits}</div>
                        <div className='text-[11px] text-emerald-600 font-semibold mt-0.5'>Active &amp; Valid in Archive</div>
                    </div>
                    <span className='p-3 rounded-2xl bg-emerald-50 text-emerald-600'>
                        <ShieldCheck className='w-5 h-5' />
                    </span>
                </Link>

                <Link to="/pro/permits" className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between hover:border-rose-300 transition-colors'>
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Permit Renewals Due</div>
                        <div className='text-2xl font-black text-rose-600 mt-1'>{stats.permitsNeedingAttention}</div>
                        <div className='text-[11px] text-rose-500 font-semibold mt-0.5'>Action Required / Renewal</div>
                    </div>
                    <span className='p-3 rounded-2xl bg-rose-50 text-rose-600'>
                        <AlertTriangle className='w-5 h-5' />
                    </span>
                </Link>

                <Link to="/pro/inspections" className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between hover:border-purple-300 transition-colors'>
                    <div>
                        <div className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Board Inspections</div>
                        <div className='text-2xl font-black text-purple-900 mt-1'>{stats.totalInspections}</div>
                        <div className='text-[11px] text-purple-600 font-semibold mt-0.5'>{stats.actionRequiredInspections} Follow-ups Cleared</div>
                    </div>
                    <span className='p-3 rounded-2xl bg-purple-50 text-purple-600'>
                        <Award className='w-5 h-5' />
                    </span>
                </Link>
            </div>

            {/* Compliance Calendar & Deadlines */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                    <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-bold text-slate-900'>Upcoming Statutory Deadlines &amp; Filings</h2>
                            <p className='text-xs text-slate-500 mt-0.5'>Official compliance submissions synchronized across departments</p>
                        </div>
                        <Link
                            to="/pro/statutory-calendar"
                            className='inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors'
                        >
                            <Calendar className='w-3.5 h-3.5' />
                            Open Compliance Calendar
                        </Link>
                    </div>
                    <div className='p-2'>
                        <DataTable
                            columns={calendarColumns}
                            data={calendarEvents}
                            emptyMessage='No impending statutory deadlines in the compliance calendar.'
                        />
                    </div>
                </div>

                <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between'>
                    <div>
                        <h2 className='text-sm font-bold text-slate-900'>Inter-Departmental Linkages</h2>
                        <p className='text-xs text-slate-500 mt-0.5'>Custody &amp; Financial Accounting</p>

                        <div className='mt-4 space-y-3'>
                            <Link to="/pro/file-room" className='block p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors'>
                                <div className='flex items-center justify-between text-xs font-bold text-slate-800'>
                                    <span className='flex items-center gap-1.5'><Archive className='w-3.5 h-3.5 text-teal-600' /> File Room Archive Custody</span>
                                    <span className='text-emerald-700 font-semibold'>Linked →</span>
                                </div>
                                <p className='text-[11px] text-slate-500 mt-1'>
                                    Government permits, affiliation sanction letters, and inspection clearance orders stored with physical coordinates.
                                </p>
                            </Link>

                            <Link to="/pro/challans" className='block p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors'>
                                <div className='flex items-center justify-between text-xs font-bold text-slate-800'>
                                    <span className='flex items-center gap-1.5'><Receipt className='w-3.5 h-3.5 text-indigo-600' /> Finance Treasury Verification</span>
                                    <span className='text-emerald-700 font-semibold'>Synchronized →</span>
                                </div>
                                <p className='text-[11px] text-slate-500 mt-1'>
                                    Treasury challans, board affiliation fees, and municipal inspection charges cross-referenced with Finance vouchers.
                                </p>
                            </Link>

                            <Link to="/pro/affiliations" className='block p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors'>
                                <div className='flex items-center justify-between text-xs font-bold text-slate-800'>
                                    <span className='flex items-center gap-1.5'><Award className='w-3.5 h-3.5 text-purple-600' /> Board Affiliations (CBSE/CAIE)</span>
                                    <span className='text-purple-700 font-semibold'>View Roster →</span>
                                </div>
                                <p className='text-[11px] text-slate-500 mt-1'>
                                    Recognition codes, renewal cycles, and stipulated inspection conditions tracking.
                                </p>
                            </Link>

                            <Link to="/pro/erp-data-handover" className='block p-3 rounded-xl bg-teal-50/50 border border-teal-100 hover:bg-teal-100/50 transition-colors'>
                                <div className='flex items-center justify-between text-xs font-bold text-teal-900'>
                                    <span className='flex items-center gap-1.5'><Database className='w-3.5 h-3.5 text-teal-600' /> PRO Data Given For ERP Team</span>
                                    <span className='text-teal-700 font-semibold'>Handover Workspace →</span>
                                </div>
                                <p className='text-[11px] text-slate-500 mt-1'>
                                    Batch tracking for regulatory, affiliation, licensing, and fee structures transferred to the ERP tech team.
                                </p>
                            </Link>

                            <Link to="/pro/daily-work-update" className='block p-3 rounded-xl bg-blue-50/50 border border-blue-100 hover:bg-blue-100/50 transition-colors'>
                                <div className='flex items-center justify-between text-xs font-bold text-blue-900'>
                                    <span className='flex items-center gap-1.5'><ClipboardList className='w-3.5 h-3.5 text-blue-600' /> Daily Work Update</span>
                                    <span className='text-blue-700 font-semibold'>Daily Logs →</span>
                                </div>
                                <p className='text-[11px] text-slate-500 mt-1'>
                                    Field visits, authority meetings (DEO, RTO, Fire, Municipal), documentation, and next follow-up milestones.
                                </p>
                            </Link>
                        </div>
                    </div>

                    <div className='mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center'>
                        PRO System v2.0 · Standard Operating Procedure § 9.2
                    </div>
                </div>
            </div>

            {/* Recent Correspondence & Permits Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                    <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-bold text-slate-900'>Recent Government Communications</h2>
                            <p className='text-xs text-slate-500 mt-0.5'>Inward letters, show-cause notices &amp; outward compliance responses</p>
                        </div>
                        <Link to="/pro/correspondence" className='text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1'>
                            View All <ArrowUpRight className='w-3.5 h-3.5' />
                        </Link>
                    </div>
                    <div className='p-2'>
                        <DataTable
                            columns={correspondenceColumns}
                            data={correspondenceList}
                            emptyMessage='No correspondence records recorded.'
                        />
                    </div>
                </div>

                <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                    <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-bold text-slate-900'>Statutory Permits &amp; NOC Tracker</h2>
                            <p className='text-xs text-slate-500 mt-0.5'>Fire safety, structural stability, sanitary certificates &amp; licenses</p>
                        </div>
                        <Link to="/pro/permits" className='text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1'>
                            Manage Permits <ArrowUpRight className='w-3.5 h-3.5' />
                        </Link>
                    </div>
                    <div className='p-2'>
                        <DataTable
                            columns={permitColumns}
                            data={permitsList}
                            emptyMessage='No statutory permits found.'
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ProDashboard
