import React, { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
    Folder,
    FolderCheck,
    FolderClock,
    Lock,
    Search,
    Filter,
    Plus,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Eye,
    Download,
    Layers,
    BarChart3,
    Clock,
    UserCheck,
    ShieldAlert,
    Building2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    X,
    FileText,
    Archive,
    Check
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import {
    getPhysicalFiles,
    savePhysicalFiles,
    getFileInwardRecords,
    getFileOutwardRecords,
    logFileInward,
    issuePhysicalFile,
    returnPhysicalFile
} from './fileRoomData'

export default function FileRoomWorkspace({ defaultTab = 'overview', roleOverride = null }) {
    const { role: authRole, email: authEmail, name: authName } = useAuth()
    const { tab } = useParams()
    const activeRole = roleOverride || authRole || 'admin'
    const cleanRole = String(activeRole || '').trim().toLowerCase().replace(/-/g, '')
    const roleLabel = getProfileLabel(activeRole)

    // Role Capabilities & Institutional Authorization
    const AUTHORIZED_FILE_ROOM_ROLES = [
        'superadmin',
        'admin',
        'principal',
        'director',
        'jointdirector',
        'jointdirectorassistant',
        'prm',
        'hr',
        'librarian',
        'accounthead',
        'jointdirectoraudit',
        'processauditor',
        'qualityauditor',
        'maintenancemanager',
        'maintenance-manager'
    ]
    const isAuthorized = AUTHORIZED_FILE_ROOM_ROLES.includes(cleanRole)

    const isFileArchivist = ['admin', 'superadmin', 'director', 'principal', 'jointdirector', 'jointdirectorassistant'].includes(cleanRole)
    const isExecutive = ['director', 'principal', 'superadmin'].includes(cleanRole)

    const targetTab = tab || defaultTab
    // State
    const [activeTab, setActiveTab] = useState(targetTab)
    const [actionMessage, setActionMessage] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)

    const notify = (msg) => {
        setActionMessage(msg)
        setTimeout(() => setActionMessage(''), 4000)
    }

    // Queries
    const files = useMemo(() => {
        void refreshKey
        return getPhysicalFiles()
    }, [refreshKey])

    const inwardRecords = useMemo(() => {
        void refreshKey
        return getFileInwardRecords()
    }, [refreshKey])

    const outwardRecords = useMemo(() => {
        void refreshKey
        return getFileOutwardRecords()
    }, [refreshKey])

    // Tabs
    const availableTabs = useMemo(() => {
        return [
            { id: 'overview', label: 'File Room Overview', icon: BarChart3 },
            { id: 'file-master', label: 'Physical File Master (Rack Index)', icon: Folder },
            { id: 'inward-register', label: 'Inward Register', icon: ArrowDownRight },
            { id: 'outward-register', label: 'Outward / Custody Register', icon: ArrowUpRight },
            { id: 'return-reconciliation', label: 'Return & Reconciliation', icon: FolderCheck },
            { id: 'movement-audit', label: 'Chain of Custody Audit', icon: Layers }
        ]
    }, [])

    useEffect(() => {
        const currentTarget = tab || defaultTab
        if (currentTarget && availableTabs.some((t) => t.id === currentTarget)) {
            setActiveTab(currentTarget)
        }
    }, [tab, defaultTab, availableTabs])

    // KPIs
    const kpis = useMemo(() => {
        const totalFiles = files.length
        const availableInRoom = files.filter((f) => f.currentStatus === 'Available in File Room').length
        const checkedOut = files.filter((f) => f.currentStatus === 'Checked Out').length
        const strictlyConfidential = files.filter((f) => f.confidentialityLevel === 'Strictly Confidential').length
        const overdue = outwardRecords.filter((r) => r.status === 'Overdue Return').length

        return {
            totalFiles,
            availableInRoom,
            checkedOut,
            strictlyConfidential,
            overdue
        }
    }, [files, outwardRecords])

    // ==========================================
    // MODAL STATES
    // ==========================================
    const [isInwardModalOpen, setIsInwardModalOpen] = useState(false)
    const [inwardFormData, setInwardFormData] = useState({
        fileNumber: '',
        title: '',
        department: 'Administration',
        category: 'Official Regulatory Document',
        confidentialityLevel: 'Normal',
        sourceSender: 'CBSE Regional Office, Preet Vihar, New Delhi',
        medium: 'Speed Post Courier',
        trackingNumber: 'ED882194721IN',
        storageCoordinates: { rackNumber: 'Rack-03', shelfLevel: 'Shelf-B', boxNumber: 'Box-12' },
        summary: ''
    })

    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
    const [selectedFileForIssue, setSelectedFileForIssue] = useState(null)
    const [issueFormData, setIssueFormData] = useState({
        issuedToEmployeeId: 'EMP-ADM-001',
        issuedToEmployeeName: authName || 'Suman Rao',
        issuedToDepartment: 'Academic - Secondary',
        expectedReturnDate: '2026-11-06',
        purpose: 'Annual compliance review and audit preparation',
        directorApprovalObtained: false
    })

    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
    const [selectedRecordForReturn, setSelectedRecordForReturn] = useState(null)
    const [returnFormData, setReturnFormData] = useState({
        conditionOnReturn: 'Intact',
        remarks: 'Physical files inspected, page stamps intact.'
    })

    // Search and filter
    const [searchQuery, setSearchQuery] = useState('')
    const [deptFilter, setDeptFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [confidentialityFilter, setConfidentialityFilter] = useState('ALL')

    const filteredFiles = useMemo(() => {
        return files.filter((f) => {
            if (deptFilter !== 'ALL' && f.department !== deptFilter) return false
            if (statusFilter !== 'ALL' && f.currentStatus !== statusFilter) return false
            if (confidentialityFilter !== 'ALL' && f.confidentialityLevel !== confidentialityFilter) return false

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const match = `${f.fileNumber} ${f.title} ${f.barcode} ${f.department} ${f.storageCoordinates.rackNumber}`.toLowerCase()
                if (!match.includes(q)) return false
            }
            return true
        })
    }, [files, deptFilter, statusFilter, confidentialityFilter, searchQuery])

    // ==========================================
    // ACTION HANDLERS
    // ==========================================
    const handleInwardSubmit = (e) => {
        e.preventDefault()
        try {
            const result = logFileInward({
                fileNumber: inwardFormData.fileNumber || `FILE-2026-${Math.floor(100 + Math.random() * 900)}`,
                title: inwardFormData.title,
                department: inwardFormData.department,
                category: inwardFormData.category,
                confidentialityLevel: inwardFormData.confidentialityLevel,
                sourceSender: inwardFormData.sourceSender,
                medium: inwardFormData.medium,
                trackingNumber: inwardFormData.trackingNumber,
                storageCoordinates: inwardFormData.storageCoordinates,
                receivedByEmployeeId: 'EMP-ADM-010',
                receivedByEmployeeName: authName || 'Sunil Joshi (Head Archivist)',
                summary: inwardFormData.summary
            })
            notify(`Inward document logged under ${result.file.fileNumber}! Coordinates assigned.`)
            setIsInwardModalOpen(false)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleIssueSubmit = (e) => {
        e.preventDefault()
        if (!selectedFileForIssue) return
        try {
            const result = issuePhysicalFile({
                fileNumber: selectedFileForIssue.fileNumber,
                issuedToEmployeeId: issueFormData.issuedToEmployeeId,
                issuedToEmployeeName: issueFormData.issuedToEmployeeName,
                issuedToDepartment: issueFormData.issuedToDepartment,
                issuedByEmployeeId: 'EMP-ADM-010',
                issuedByEmployeeName: authName || 'Sunil Joshi (Head Archivist)',
                expectedReturnDate: issueFormData.expectedReturnDate,
                purpose: issueFormData.purpose,
                directorApprovalObtained: issueFormData.directorApprovalObtained
            })
            notify(`Physical file ${selectedFileForIssue.fileNumber} issued under Outward Slip ${result.outwardRecord.id}!`)
            setIsIssueModalOpen(false)
            setSelectedFileForIssue(null)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleReturnSubmit = (e) => {
        e.preventDefault()
        if (!selectedRecordForReturn) return
        try {
            returnPhysicalFile({
                outwardRecordId: selectedRecordForReturn.id,
                receivedByEmployeeId: 'EMP-ADM-010',
                receivedByEmployeeName: authName || 'Sunil Joshi (Head Archivist)',
                conditionOnReturn: returnFormData.conditionOnReturn,
                remarks: returnFormData.remarks
            })
            notify(`File ${selectedRecordForReturn.fileNumber} returned and restored to file room shelf!`)
            setIsReturnModalOpen(false)
            setSelectedRecordForReturn(null)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    if (!isAuthorized) {
        return (
            <div className='p-6 md:p-12 min-h-[60vh] flex items-center justify-center'>
                <div className='max-w-lg w-full bg-white rounded-3xl border border-slate-200/90 p-8 text-center shadow-xl space-y-4'>
                    <div className='size-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs'>
                        <Lock size={30} />
                    </div>
                    <div>
                        <span className='inline-block text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200'>
                            Access Restricted
                        </span>
                        <h2 className='text-lg font-bold text-slate-900 mt-2'>Physical File Room Access Restricted</h2>
                        <p className='text-xs text-slate-500 mt-2 leading-relaxed'>
                            The Physical File Room and institutional master rack index are restricted to authorized records custodians, department managers, and executive leadership. Your current user profile ({roleLabel}) does not possess clearance for physical dossier check-in/out.
                        </p>
                    </div>
                    <div className='pt-3 border-t border-slate-100 text-[11px] text-slate-400'>
                        To request or inspect physical archived records, submit an authorized request to Central Administration or the Records Officer.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='space-y-6 p-4 md:p-6 bg-slate-50/50 min-h-screen'>
            {/* Feedback Alert Toast */}
            {actionMessage && (
                <div className='flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs'>
                    <CheckCircle2 size={16} className='text-emerald-600 shrink-0' />
                    <span>{actionMessage}</span>
                </div>
            )}

            {/* Header: Title, Role Badge, Primary Action */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs'>
                        <Archive size={22} />
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                                Physical File Room & Archives
                            </h1>
                            <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                                {roleLabel}
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Physical document registry: rack/shelf/box coordinates, external inward docketing, custody checkouts, and confidentiality security gates.
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2.5'>
                    <button
                        onClick={() => setIsInwardModalOpen(true)}
                        className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition'
                    >
                        <Plus size={14} /> Docket Inward Document
                    </button>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className='border-b border-slate-200/80 pb-px'>
                <div className='flex items-center gap-2 overflow-x-auto scrollbar-none'>
                    {availableTabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition whitespace-nowrap ${
                                    isActive
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                <span>{tab.label}</span>
                                {tab.id === 'outward-register' && kpis.overdue > 0 && (
                                    <span className='rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2'>
                                        {kpis.overdue} overdue
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: OVERVIEW                                                           */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
                <div className='space-y-6'>
                    {/* KPI Cards */}
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
                        <div className='rounded-[1.25rem] border border-blue-100 bg-[#E8F1FD]/60 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Total Physical Files</span>
                                <Folder size={16} className='text-blue-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-slate-900'>{kpis.totalFiles}</span>
                                <span className='text-[11px] font-medium text-blue-700'>Indexed in Master</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Available on Racks</span>
                                <FolderCheck size={16} className='text-emerald-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-emerald-700'>{kpis.availableInRoom}</span>
                                <span className='text-[11px] font-medium text-emerald-800'>Ready to Access</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-amber-100 bg-amber-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Checked Out Files</span>
                                <FolderClock size={16} className='text-amber-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-amber-700'>{kpis.checkedOut}</span>
                                <span className='text-[11px] font-medium text-amber-800'>With Faculty/Dept</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-indigo-100 bg-indigo-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Strictly Confidential</span>
                                <Lock size={16} className='text-indigo-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-indigo-700'>{kpis.strictlyConfidential}</span>
                                <span className='text-[11px] font-medium text-indigo-800'>Director Sign-off Gate</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-rose-100 bg-rose-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Overdue Files</span>
                                <AlertTriangle size={16} className='text-rose-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-rose-600'>{kpis.overdue}</span>
                                <span className='text-[11px] font-medium text-rose-700'>Reconciliation Alert</span>
                            </div>
                        </div>
                    </div>

                    {/* Operational Highlights & Recent Moves */}
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                        {/* Currently Checked Out Files */}
                        <div className='lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <div className='flex items-center justify-between mb-4 border-b border-slate-100 pb-3'>
                                <div>
                                    <h3 className='text-sm font-semibold text-slate-900'>Active Custody Checkouts</h3>
                                    <p className='text-xs text-slate-500'>Physical files currently outside file room</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('outward-register')}
                                    className='text-xs font-semibold text-blue-600 hover:text-blue-700'
                                >
                                    Full Register →
                                </button>
                            </div>

                            <div className='overflow-x-auto'>
                                <table className='w-full text-left text-xs'>
                                    <thead>
                                        <tr className='border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                            <th className='py-2.5 px-3'>File Number & Title</th>
                                            <th className='py-2.5 px-3'>Custodian</th>
                                            <th className='py-2.5 px-3'>Issue Date</th>
                                            <th className='py-2.5 px-3'>Expected Return</th>
                                            <th className='py-2.5 px-3 text-center'>Status</th>
                                            <th className='py-2.5 px-3 text-right'>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-slate-100 text-slate-700'>
                                        {outwardRecords.filter((r) => r.status !== 'Returned').map((rec) => (
                                            <tr key={rec.id} className='hover:bg-slate-50/70'>
                                                <td className='py-2.5 px-3'>
                                                    <span className='font-mono font-bold text-slate-900'>{rec.fileNumber}</span>
                                                    <div className='text-slate-600'>{rec.fileTitle}</div>
                                                </td>
                                                <td className='py-2.5 px-3'>
                                                    <div className='font-semibold text-slate-900'>{rec.issuedToEmployeeName}</div>
                                                    <div className='text-[11px] text-slate-400'>{rec.issuedToDepartment}</div>
                                                </td>
                                                <td className='py-2.5 px-3 text-slate-500'>{rec.issueDate}</td>
                                                <td className='py-2.5 px-3 font-semibold text-slate-900'>{rec.expectedReturnDate}</td>
                                                <td className='py-2.5 px-3 text-center'>
                                                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                                        rec.status === 'Overdue Return' ? 'bg-rose-100 text-rose-800' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {rec.status}
                                                    </span>
                                                </td>
                                                <td className='py-2.5 px-3 text-right'>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRecordForReturn(rec)
                                                            setIsReturnModalOpen(true)
                                                        }}
                                                        className='rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700'
                                                    >
                                                        Receive Back
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Inward Docketing */}
                        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <div className='flex items-center justify-between mb-4 border-b border-slate-100 pb-3'>
                                <div>
                                    <h3 className='text-sm font-semibold text-slate-900'>Recent External Inward</h3>
                                    <p className='text-xs text-slate-500'>Official communications docketed</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('inward-register')}
                                    className='text-xs font-semibold text-blue-600 hover:text-blue-700'
                                >
                                    All ({inwardRecords.length})
                                </button>
                            </div>

                            <div className='space-y-3 text-xs'>
                                {inwardRecords.slice(0, 4).map((inw) => (
                                    <div key={inw.id} className='rounded-xl border border-slate-100 p-3 hover:bg-slate-50 space-y-1'>
                                        <div className='flex items-center justify-between'>
                                            <span className='font-mono font-bold text-slate-900'>{inw.fileNumber}</span>
                                            <span className='font-mono text-[10px] text-slate-400'>{inw.inwardDate}</span>
                                        </div>
                                        <div className='font-semibold text-slate-800'>{inw.title}</div>
                                        <div className='text-slate-500 text-[11px]'>From: {inw.sourceSender}</div>
                                        <div className='text-blue-700 font-mono text-[10px]'>
                                            Location: {inw.storageCoordinates.rackNumber} / {inw.storageCoordinates.shelfLevel}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: PHYSICAL FILE MASTER (RACK INDEX)                                   */}
            {/* ========================================================================= */}
            {activeTab === 'file-master' && (
                <div className='space-y-4'>
                    {/* Filters Bar */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                        <div className='relative flex-1 min-w-[220px]'>
                            <Search className='absolute left-3 top-2.5 text-slate-400' size={14} />
                            <input
                                type='text'
                                placeholder='Search file number, title, barcode, rack or box coordinates...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden'
                            />
                        </div>

                        <div className='flex items-center gap-2 flex-wrap'>
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden'
                            >
                                <option value='ALL'>All Departments</option>
                                <option value='Administration'>Administration</option>
                                <option value='HR & Personnel'>HR & Personnel</option>
                                <option value='Academic - Examination'>Academic - Examination</option>
                                <option value='Accounts & Finance'>Accounts & Finance</option>
                                <option value='Transport'>Transport</option>
                            </select>

                            <select
                                value={confidentialityFilter}
                                onChange={(e) => setConfidentialityFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden'
                            >
                                <option value='ALL'>All Classifications</option>
                                <option value='Normal'>Normal</option>
                                <option value='Confidential'>Confidential</option>
                                <option value='Strictly Confidential'>Strictly Confidential (Director Locked)</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden'
                            >
                                <option value='ALL'>All Statuses</option>
                                <option value='Available in File Room'>Available on Shelf</option>
                                <option value='Checked Out'>Checked Out</option>
                            </select>
                        </div>
                    </div>

                    {/* Files Master Table */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>File Number & Barcode</th>
                                        <th className='py-3 px-4'>Document Title</th>
                                        <th className='py-3 px-4'>Department</th>
                                        <th className='py-3 px-4'>Classification</th>
                                        <th className='py-3 px-4'>Physical Coordinates</th>
                                        <th className='py-3 px-4 text-center'>Current Status</th>
                                        <th className='py-3 px-4 text-right'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {filteredFiles.map((f) => (
                                        <tr key={f.fileNumber} className='hover:bg-slate-50/70'>
                                            <td className='py-3 px-4'>
                                                <div className='font-mono font-bold text-slate-900'>{f.fileNumber}</div>
                                                <div className='font-mono text-[11px] text-slate-400'>{f.barcode}</div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <div className='font-semibold text-slate-900'>{f.title}</div>
                                                <div className='text-[11px] text-slate-400'>{f.category}</div>
                                            </td>
                                            <td className='py-3 px-4 text-slate-600'>{f.department}</td>
                                            <td className='py-3 px-4'>
                                                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                                    f.confidentialityLevel === 'Strictly Confidential'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : f.confidentialityLevel === 'Confidential'
                                                        ? 'bg-amber-50 text-amber-700'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {f.confidentialityLevel}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 font-mono text-blue-700 font-semibold'>
                                                {f.storageCoordinates.rackNumber} • {f.storageCoordinates.shelfLevel} • {f.storageCoordinates.boxNumber}
                                            </td>
                                            <td className='py-3 px-4 text-center'>
                                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                    f.currentStatus === 'Available in File Room'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {f.currentStatus}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 text-right'>
                                                {f.currentStatus === 'Available in File Room' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedFileForIssue(f)
                                                            setIssueFormData((prev) => ({
                                                                ...prev,
                                                                directorApprovalObtained: f.confidentialityLevel !== 'Strictly Confidential'
                                                            }))
                                                            setIsIssueModalOpen(true)
                                                        }}
                                                        className='rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700'
                                                    >
                                                        Issue File →
                                                    </button>
                                                )}
                                                {f.currentStatus === 'Checked Out' && (
                                                    <span className='text-[11px] text-amber-700 font-medium'>
                                                        Checked Out
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: INWARD REGISTER                                                    */}
            {/* ========================================================================= */}
            {activeTab === 'inward-register' && (
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-900'>Official External Inward Register</h2>
                            <p className='text-xs text-slate-500'>
                                Letters, regulatory notices, and tenders received via Speed Post, Hand Delivery, or Govt Dispatch.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsInwardModalOpen(true)}
                            className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700'
                        >
                            <Plus size={14} /> Log Inward Letter
                        </button>
                    </div>

                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>Inward ID</th>
                                        <th className='py-3 px-4'>Date Received</th>
                                        <th className='py-3 px-4'>File Number & Subject</th>
                                        <th className='py-3 px-4'>Sender / Origin</th>
                                        <th className='py-3 px-4'>Mode & Tracking</th>
                                        <th className='py-3 px-4'>Assigned Storage Rack</th>
                                        <th className='py-3 px-4'>Docketed By</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {inwardRecords.map((inw) => (
                                        <tr key={inw.id} className='hover:bg-slate-50/70'>
                                            <td className='py-3 px-4 font-mono font-bold text-slate-900'>{inw.id}</td>
                                            <td className='py-3 px-4 text-slate-500'>{inw.inwardDate}</td>
                                            <td className='py-3 px-4'>
                                                <div className='font-mono font-semibold text-blue-700'>{inw.fileNumber}</div>
                                                <div className='text-slate-900 font-medium'>{inw.title}</div>
                                            </td>
                                            <td className='py-3 px-4 text-slate-600'>{inw.sourceSender}</td>
                                            <td className='py-3 px-4 text-slate-600'>
                                                <div>{inw.medium}</div>
                                                <div className='font-mono text-[11px] text-slate-400'>{inw.trackingNumber}</div>
                                            </td>
                                            <td className='py-3 px-4 font-mono font-bold text-slate-700'>
                                                {inw.storageCoordinates.rackNumber} / {inw.storageCoordinates.shelfLevel}
                                            </td>
                                            <td className='py-3 px-4 text-slate-500'>{inw.receivedByEmployeeName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: OUTWARD / CUSTODY REGISTER                                         */}
            {/* ========================================================================= */}
            {activeTab === 'outward-register' && (
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-900'>Outward / Custody Chain Register</h2>
                            <p className='text-xs text-slate-500'>
                                Active borrower tracking with due date timers and reconciliation markers.
                            </p>
                        </div>
                    </div>

                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>Outward Slip</th>
                                        <th className='py-3 px-4'>File Number & Title</th>
                                        <th className='py-3 px-4'>Borrower Details</th>
                                        <th className='py-3 px-4'>Issued By</th>
                                        <th className='py-3 px-4'>Expected Return</th>
                                        <th className='py-3 px-4'>Purpose</th>
                                        <th className='py-3 px-4 text-center'>Status</th>
                                        <th className='py-3 px-4 text-right'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {outwardRecords.map((out) => (
                                        <tr key={out.id} className='hover:bg-slate-50/70'>
                                            <td className='py-3 px-4 font-mono font-bold text-slate-900'>{out.id}</td>
                                            <td className='py-3 px-4'>
                                                <div className='font-mono font-semibold text-slate-900'>{out.fileNumber}</div>
                                                <div className='text-slate-600 text-[11px]'>{out.fileTitle}</div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <div className='font-semibold text-slate-900'>{out.issuedToEmployeeName}</div>
                                                <div className='text-[11px] text-slate-400'>{out.issuedToDepartment}</div>
                                            </td>
                                            <td className='py-3 px-4 text-slate-500'>{out.issuedByEmployeeName}</td>
                                            <td className='py-3 px-4 font-semibold text-slate-900'>{out.expectedReturnDate}</td>
                                            <td className='py-3 px-4 text-slate-600'>{out.purpose}</td>
                                            <td className='py-3 px-4 text-center'>
                                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                    out.status === 'Returned'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : out.status === 'Overdue Return'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {out.status}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 text-right'>
                                                {out.status !== 'Returned' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRecordForReturn(out)
                                                            setIsReturnModalOpen(true)
                                                        }}
                                                        className='rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700'
                                                    >
                                                        Receive Back
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: RETURN & RECONCILIATION                                            */}
            {/* ========================================================================= */}
            {activeTab === 'return-reconciliation' && (
                <div className='space-y-4'>
                    <div className='rounded-2xl border border-blue-100 bg-[#E8F1FD]/40 p-4 shadow-xs flex items-center justify-between'>
                        <div>
                            <h3 className='text-sm font-bold text-blue-950'>Physical Return Reconciliation & Condition Check</h3>
                            <p className='text-xs text-blue-800'>
                                Inspect returned files for page completeness, stamp integrity, and restored storage shelf locations.
                            </p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {outwardRecords.filter((r) => r.status !== 'Returned').map((rec) => (
                            <div key={rec.id} className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3'>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <span className='font-mono text-xs font-bold text-slate-900'>{rec.fileNumber}</span>
                                        <h4 className='text-sm font-semibold text-slate-900'>{rec.fileTitle}</h4>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                        rec.status === 'Overdue Return' ? 'bg-rose-100 text-rose-800' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        {rec.status}
                                    </span>
                                </div>

                                <div className='rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs space-y-1.5'>
                                    <div><b>Borrower:</b> {rec.issuedToEmployeeName} ({rec.issuedToDepartment})</div>
                                    <div><b>Issued On:</b> {rec.issueDate}</div>
                                    <div><b>Due Return Date:</b> <span className='font-bold text-slate-900'>{rec.expectedReturnDate}</span></div>
                                    <div><b>Purpose:</b> {rec.purpose}</div>
                                </div>

                                <div className='flex items-center justify-end pt-1'>
                                    <button
                                        onClick={() => {
                                            setSelectedRecordForReturn(rec)
                                            setIsReturnModalOpen(true)
                                        }}
                                        className='rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700'
                                    >
                                        Reconcile & Close Slip
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: MOVEMENT AUDIT                                                     */}
            {/* ========================================================================= */}
            {activeTab === 'movement-audit' && (
                <div className='space-y-4'>
                    <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                        <h3 className='text-sm font-semibold text-slate-900 mb-1'>Physical Archive Chain of Custody Audit Log</h3>
                        <p className='text-xs text-slate-500 mb-4'>Immutable trace of inward additions, borrower checkouts, and return reconciliations.</p>

                        <div className='space-y-3 text-xs'>
                            {outwardRecords.map((o) => (
                                <div key={o.id} className='flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50'>
                                    <div>
                                        <div className='font-semibold text-slate-900'>{o.id} • {o.fileNumber} ({o.fileTitle})</div>
                                        <div className='text-slate-500 text-[11px]'>
                                            Custodian: {o.issuedToEmployeeName} • Issue Date: {o.issueDate} • Status: {o.status}
                                        </div>
                                    </div>
                                    <span className='font-mono font-bold text-slate-700'>{o.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: DOCKET INWARD FILE                                                 */}
            {/* ========================================================================= */}
            {isInwardModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900'>Docket New Inward Document / File</h3>
                            <button onClick={() => setIsInwardModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleInwardSubmit} className='space-y-3 text-xs'>
                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Document / File Title</label>
                                <input
                                    type='text'
                                    placeholder='e.g., Annual Fire Safety Compliance Certificate'
                                    value={inwardFormData.title}
                                    onChange={(e) => setInwardFormData({ ...inwardFormData, title: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                    required
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Originating Department</label>
                                    <select
                                        value={inwardFormData.department}
                                        onChange={(e) => setInwardFormData({ ...inwardFormData, department: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2'
                                    >
                                        <option value='Administration'>Administration</option>
                                        <option value='HR & Personnel'>HR & Personnel</option>
                                        <option value='Academic - Examination'>Academic - Examination</option>
                                        <option value='Accounts & Finance'>Accounts & Finance</option>
                                        <option value='Transport'>Transport</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Confidentiality Level</label>
                                    <select
                                        value={inwardFormData.confidentialityLevel}
                                        onChange={(e) => setInwardFormData({ ...inwardFormData, confidentialityLevel: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2'
                                    >
                                        <option value='Normal'>Normal</option>
                                        <option value='Confidential'>Confidential</option>
                                        <option value='Strictly Confidential'>Strictly Confidential (Director Locked)</option>
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Source Sender / Organization</label>
                                    <input
                                        type='text'
                                        value={inwardFormData.sourceSender}
                                        onChange={(e) => setInwardFormData({ ...inwardFormData, sourceSender: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Medium & Tracking Number</label>
                                    <input
                                        type='text'
                                        value={inwardFormData.trackingNumber}
                                        onChange={(e) => setInwardFormData({ ...inwardFormData, trackingNumber: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2'
                                    />
                                </div>
                            </div>

                            {/* Storage Location Coordinates */}
                            <div className='rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-2'>
                                <label className='font-semibold text-slate-700 block'>Assign Physical Storage Coordinates</label>
                                <div className='grid grid-cols-3 gap-2'>
                                    <div>
                                        <label className='text-[10px] text-slate-500 block'>Rack Number</label>
                                        <input
                                            type='text'
                                            value={inwardFormData.storageCoordinates.rackNumber}
                                            onChange={(e) => setInwardFormData({
                                                ...inwardFormData,
                                                storageCoordinates: { ...inwardFormData.storageCoordinates, rackNumber: e.target.value }
                                            })}
                                            className='w-full rounded-lg border border-slate-200 p-1 bg-white font-mono'
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className='text-[10px] text-slate-500 block'>Shelf Level</label>
                                        <input
                                            type='text'
                                            value={inwardFormData.storageCoordinates.shelfLevel}
                                            onChange={(e) => setInwardFormData({
                                                ...inwardFormData,
                                                storageCoordinates: { ...inwardFormData.storageCoordinates, shelfLevel: e.target.value }
                                            })}
                                            className='w-full rounded-lg border border-slate-200 p-1 bg-white font-mono'
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className='text-[10px] text-slate-500 block'>Box / Bundle</label>
                                        <input
                                            type='text'
                                            value={inwardFormData.storageCoordinates.boxNumber}
                                            onChange={(e) => setInwardFormData({
                                                ...inwardFormData,
                                                storageCoordinates: { ...inwardFormData.storageCoordinates, boxNumber: e.target.value }
                                            })}
                                            className='w-full rounded-lg border border-slate-200 p-1 bg-white font-mono'
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsInwardModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700'
                                >
                                    Docket Inward & Assign Rack
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: ISSUE FILE                                                         */}
            {/* ========================================================================= */}
            {isIssueModalOpen && selectedFileForIssue && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900'>Issue Physical Document</h3>
                            <button onClick={() => setIsIssueModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleIssueSubmit} className='space-y-3 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1'>
                                <div className='font-mono font-bold text-slate-900'>{selectedFileForIssue.fileNumber}</div>
                                <div className='font-semibold text-slate-800'>{selectedFileForIssue.title}</div>
                                <div className='text-blue-700 font-mono text-[11px]'>
                                    Location: {selectedFileForIssue.storageCoordinates.rackNumber} • {selectedFileForIssue.storageCoordinates.shelfLevel}
                                </div>
                            </div>

                            {selectedFileForIssue.confidentialityLevel === 'Strictly Confidential' && (
                                <div className='p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1'>
                                    <div className='font-bold flex items-center gap-1.5'>
                                        <Lock size={14} className='text-rose-600' /> Strictly Confidential Document Gate
                                    </div>
                                    <p className='text-[11px] text-rose-800'>
                                        Requires written or explicit digital consent from the Director/Principal prior to physical handover.
                                    </p>
                                    <label className='flex items-center gap-2 pt-1 font-bold text-rose-950 cursor-pointer'>
                                        <input
                                            type='checkbox'
                                            checked={issueFormData.directorApprovalObtained}
                                            onChange={(e) => setIssueFormData({ ...issueFormData, directorApprovalObtained: e.target.checked })}
                                            className='rounded text-rose-600 focus:ring-rose-500'
                                        />
                                        <span>Director Approval Obtained</span>
                                    </label>
                                </div>
                            )}

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Borrower Faculty / Staff Name</label>
                                <input
                                    type='text'
                                    value={issueFormData.issuedToEmployeeName}
                                    onChange={(e) => setIssueFormData({ ...issueFormData, issuedToEmployeeName: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                    required
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Borrower Department</label>
                                    <input
                                        type='text'
                                        value={issueFormData.issuedToDepartment}
                                        onChange={(e) => setIssueFormData({ ...issueFormData, issuedToDepartment: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Expected Return Date</label>
                                    <input
                                        type='date'
                                        value={issueFormData.expectedReturnDate}
                                        onChange={(e) => setIssueFormData({ ...issueFormData, expectedReturnDate: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2'
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Official Purpose / Justification</label>
                                <input
                                    type='text'
                                    value={issueFormData.purpose}
                                    onChange={(e) => setIssueFormData({ ...issueFormData, purpose: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                    required
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsIssueModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700'
                                >
                                    Confirm Custody Checkout
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: RETURN FILE                                                        */}
            {/* ========================================================================= */}
            {isReturnModalOpen && selectedRecordForReturn && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900'>Verify Document Return</h3>
                            <button onClick={() => setIsReturnModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleReturnSubmit} className='space-y-3 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1'>
                                <div className='font-mono font-bold text-slate-900'>{selectedRecordForReturn.fileNumber}</div>
                                <div className='text-slate-800 font-semibold'>{selectedRecordForReturn.fileTitle}</div>
                                <div className='text-slate-500'>Returned by: {selectedRecordForReturn.issuedToEmployeeName}</div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Condition Inspection</label>
                                <select
                                    value={returnFormData.conditionOnReturn}
                                    onChange={(e) => setReturnFormData({ ...returnFormData, conditionOnReturn: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                >
                                    <option value='Intact'>Intact (Pages Complete & Undamaged)</option>
                                    <option value='Minor Wear'>Minor Wear</option>
                                    <option value='Tampered / Damaged'>Damaged / Missing Pages (Flag Incident)</option>
                                </select>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Archivist Notes</label>
                                <input
                                    type='text'
                                    value={returnFormData.remarks}
                                    onChange={(e) => setReturnFormData({ ...returnFormData, remarks: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsReturnModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700'
                                >
                                    Confirm Return & Close Slip
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

