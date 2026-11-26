import React, { useState, useMemo, useEffect } from 'react'
import {
    Search,
    Plus,
    Clock,
    UserCheck,
    CheckCircle2,
    X,
    RotateCcw,
    LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import {
    getVisitorLogs,
    registerVisitorCheckIn,
    recordVisitorCheckOut,
    calculateVisitDuration,
    formatCompactDuration,
    getAuthorizedStaffDirectory,
    ID_PROOF_TYPES,
} from '../GatePassSecurity/gatePassSecurityData'

export default function VisitorsWorkspace({ roleOverride = null }) {
    const { role: authRole, name: authName } = useAuth()
    const activeRole = roleOverride || authRole || 'prm'
    const roleLabel = getProfileLabel(activeRole)

    // Data States
    const [refreshKey, setRefreshKey] = useState(0)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All') // 'All', 'Checked In', 'Checked Out'
    const [dateFilter, setDateFilter] = useState('Today') // 'Today', 'All Dates'
    const [currentTime, setCurrentTime] = useState(Date.now())
    const [notification, setNotification] = useState('')

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [printableBadge, setPrintableBadge] = useState(null)

    const notify = (msg) => {
        setNotification(msg)
        setTimeout(() => setNotification(''), 4500)
    }

    // Live sync event listener
    useEffect(() => {
        const handleSync = () => setRefreshKey((k) => k + 1)
        if (typeof window !== 'undefined') {
            window.addEventListener('schoolerp-gatepass-security-sync', handleSync)
            window.addEventListener('schoolerp-visitor-updated', handleSync)
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('schoolerp-gatepass-security-sync', handleSync)
                window.removeEventListener('schoolerp-visitor-updated', handleSync)
            }
        }
    }, [])

    // Live timer update for in-progress visit durations
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now())
        }, 30000) // Update every 30s
        return () => clearInterval(interval)
    }, [])

    // Load Staff Directory
    const staffDirectory = useMemo(() => getAuthorizedStaffDirectory(), [])

    // Form State for + New Check-in Visitor
    const initialFormState = {
        visitorName: '',
        phone: '',
        personToMeet: staffDirectory[0]?.name || 'Dr. Ramanathan K',
        department: staffDirectory[0]?.department || 'Academics & Teaching',
        purpose: '',
        visitorOrganization: '',
        idProofType: 'Aadhaar Card',
        idProofNumber: '',
        remarks: '',
    }
    const [formData, setFormData] = useState(initialFormState)
    const [formErrors, setFormErrors] = useState({})

    // Auto-update department when Person to Meet changes
    const handlePersonChange = (selectedName) => {
        const staff = staffDirectory.find((s) => s.name === selectedName)
        setFormData((prev) => ({
            ...prev,
            personToMeet: selectedName,
            department: staff ? staff.department : prev.department,
        }))
    }

    // Queries: Visitor Records
    const allVisitors = useMemo(() => {
        void refreshKey
        return getVisitorLogs()
    }, [refreshKey])

    // Filtered Visitors List
    const filteredVisitors = useMemo(() => {
        const todayStr = new Date()
            .toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
            .replace(/\//g, '-')

        return allVisitors.filter((v) => {
            // Status filter
            if (statusFilter === 'Checked In' && v.status !== 'Checked In' && v.status !== 'On Campus') return false
            if (statusFilter === 'Checked Out' && v.status !== 'Checked Out') return false

            // Date filter
            if (dateFilter === 'Today' && v.entryDate && v.entryDate !== todayStr) return false

            // Search filter
            if (search) {
                const q = search.trim().toLowerCase()
                const haystack = `${v.visitorName} ${v.id} ${v.badgeNumber || ''} ${v.phone} ${v.personToMeet} ${v.department} ${v.purpose}`.toLowerCase()
                if (!haystack.includes(q)) return false
            }

            return true
        })
    }, [allVisitors, statusFilter, dateFilter, search])

    // Handle Form Submit (+ New Check-in Visitor)
    const handleCheckInSubmit = (e) => {
        e.preventDefault()
        const errors = {}
        if (!formData.visitorName.trim()) errors.visitorName = 'Visitor Full Name is required.'
        if (!formData.phone.trim()) errors.phone = 'Phone Number is required.'
        if (!formData.personToMeet.trim()) errors.personToMeet = 'Person to Meet is required.'
        if (!formData.department.trim()) errors.department = 'Department is required.'
        if (!formData.purpose.trim()) errors.purpose = 'Purpose of Visit is required.'

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            return
        }

        try {
            const recordedBy = `${authName || 'Kavita Reddy'} (${roleLabel || 'Front Office'})`
            const newRecord = registerVisitorCheckIn({
                ...formData,
                recordedBy,
                status: 'Checked In',
            })
            notify(`Visitor ${newRecord.visitorName} checked in successfully! Visitor ID: ${newRecord.id}`)
            setIsModalOpen(false)
            setFormData(initialFormState)
            setFormErrors({})
            setRefreshKey((k) => k + 1)
        } catch (err) {
            notify(`Check-in Error: ${err.message}`)
        }
    }

    // Handle Check Out
    const handleCheckOut = (visitorId, visitorName) => {
        try {
            const officerName = `${authName || 'Kavita Reddy'} (${roleLabel || 'Front Office'})`
            const updated = recordVisitorCheckOut(visitorId, officerName)
            notify(`Visitor ${visitorName} checked out successfully. Duration: ${updated.visitDuration || 'Recorded'}.`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            notify(`Check-out Error: ${err.message}`)
        }
    }

    return (
        <section className='space-y-6'>
            {/* Success / Status Notification */}
            {notification && (
                <div className='p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center justify-between shadow-xs transition-all animate-fadeIn'>
                    <div className='flex items-center gap-2'>
                        <CheckCircle2 size={16} className='text-emerald-600 shrink-0' />
                        <span>{notification}</span>
                    </div>
                    <button
                        type='button'
                        onClick={() => setNotification('')}
                        className='text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer'
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Header: Title, Subtitle, and Primary Check-in Button */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold text-slate-900'>Visitors</h1>
                    <p className='text-sm text-slate-500 mt-0.5'>
                        Manage campus visitor check-in and check-out
                    </p>
                </div>
                <button
                    type='button'
                    onClick={() => {
                        setFormData(initialFormState)
                        setFormErrors({})
                        setIsModalOpen(true)
                    }}
                    className='inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0'
                >
                    <Plus size={16} />
                    + New Check-in Visitor
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs p-4'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                    {/* Search Input */}
                    <div className='md:col-span-2'>
                        <div className='relative'>
                            <input
                                type='text'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder='Search visitors by name, ID, phone, or person to meet...'
                                className='w-full text-sm text-slate-800 border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                            />
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='w-full text-sm text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer'
                        >
                            <option value='All'>All Visitors</option>
                            <option value='Checked In'>Currently Checked In</option>
                            <option value='Checked Out'>Checked Out</option>
                        </select>
                    </div>

                    {/* Date Filter & Clear */}
                    <div className='flex gap-1.5'>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className='w-full text-sm text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer'
                        >
                            <option value='Today'>Today's Visits</option>
                            <option value='All Dates'>All Visit History</option>
                        </select>
                        {(search || statusFilter !== 'All' || dateFilter !== 'Today') && (
                            <button
                                type='button'
                                onClick={() => {
                                    setSearch('')
                                    setStatusFilter('All')
                                    setDateFilter('Today')
                                }}
                                title='Reset Filters'
                                className='px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center justify-center shrink-0'
                            >
                                <RotateCcw size={15} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Visitor Register Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='px-5 py-4 border-b border-slate-200 flex items-center justify-between'>
                    <h2 className='text-base font-bold text-slate-900'>Visitor Register</h2>
                    <span className='text-xs text-slate-500 font-medium'>
                        {filteredVisitors.length} {filteredVisitors.length === 1 ? 'record' : 'records'} displayed
                    </span>
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs uppercase bg-slate-100 text-slate-700 font-semibold border-b border-slate-200'>
                            <tr>
                                <th scope='col' className='px-4 py-3'>Visitor ID</th>
                                <th scope='col' className='px-4 py-3'>Visitor Name</th>
                                <th scope='col' className='px-4 py-3'>Phone Number</th>
                                <th scope='col' className='px-4 py-3'>Person to Meet</th>
                                <th scope='col' className='px-4 py-3'>Department</th>
                                <th scope='col' className='px-4 py-3'>Purpose</th>
                                <th scope='col' className='px-4 py-3'>Check-in</th>
                                <th scope='col' className='px-4 py-3'>Check-out</th>
                                <th scope='col' className='px-4 py-3'>Duration</th>
                                <th scope='col' className='px-4 py-3 text-center'>Status</th>
                                <th scope='col' className='px-4 py-3 text-center'>Action</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {filteredVisitors.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className='px-4 py-12 text-center text-slate-500'>
                                        <Clock size={32} className='mx-auto text-slate-300 mb-2' />
                                        No visitor records found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredVisitors.map((visitor) => {
                                    const isCheckedIn = visitor.status === 'Checked In' || visitor.status === 'On Campus'

                                    // Dynamic duration calculation: live elapsed for checked in, fixed for checked out
                                    void currentTime
                                    const duration = visitor.visitDuration || calculateVisitDuration(
                                        visitor.entryDate,
                                        visitor.entryTime,
                                        visitor.exitDate,
                                        visitor.exitTime,
                                        visitor.createdAt
                                    )

                                    return (
                                        <tr key={visitor.id} className='hover:bg-slate-50 transition-colors'>
                                            {/* Visitor ID */}
                                            <td className='px-4 py-3 font-mono text-xs font-bold text-slate-800'>
                                                {visitor.id}
                                            </td>

                                            {/* Visitor Name */}
                                            <td className='px-4 py-3'>
                                                <div className='font-semibold text-slate-900'>{visitor.visitorName}</div>
                                                {visitor.visitorOrganization && visitor.visitorOrganization !== 'Individual Visitor' && (
                                                    <div className='text-xs text-slate-500'>{visitor.visitorOrganization}</div>
                                                )}
                                            </td>

                                            {/* Phone Number */}
                                            <td className='px-4 py-3 text-xs text-slate-700 font-medium'>
                                                {visitor.phone}
                                            </td>

                                            {/* Person to Meet */}
                                            <td className='px-4 py-3 font-medium text-slate-800'>
                                                {visitor.personToMeet}
                                            </td>

                                            {/* Department */}
                                            <td className='px-4 py-3 text-xs text-slate-600'>
                                                {visitor.department}
                                            </td>

                                            {/* Purpose */}
                                            <td className='px-4 py-3 text-xs text-slate-600 max-w-xs truncate' title={visitor.purpose}>
                                                {visitor.purpose}
                                            </td>

                                            {/* Check-in Time */}
                                            <td className='px-4 py-3 font-mono text-xs text-slate-800'>
                                                <div>{visitor.entryTime}</div>
                                                <div className='text-[10px] text-slate-400'>{visitor.entryDate}</div>
                                            </td>

                                            {/* Check-out Time */}
                                            <td className='px-4 py-3 font-mono text-xs text-slate-700'>
                                                {visitor.exitTime ? (
                                                    <div>
                                                        <div>{visitor.exitTime}</div>
                                                        <div className='text-[10px] text-slate-400'>{visitor.exitDate || visitor.entryDate}</div>
                                                    </div>
                                                ) : (
                                                    <span className='text-slate-400'>—</span>
                                                )}
                                            </td>

                                            {/* Duration */}
                                            <td className='px-4 py-3 text-xs font-semibold text-slate-700'>
                                                <span
                                                    className={`inline-flex items-center gap-1.5 ${
                                                        isCheckedIn ? 'text-indigo-600' : 'text-slate-700'
                                                    }`}
                                                    title={`Visit duration: ${duration}`}
                                                >
                                                    <Clock size={12} className={isCheckedIn ? 'animate-pulse text-indigo-500 shrink-0' : 'text-slate-400 shrink-0'} />
                                                    <span className='font-mono font-bold'>{formatCompactDuration(duration)}</span>
                                                    <span className='hidden sm:inline text-slate-400 font-normal text-[11px]'>({duration})</span>
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className='px-4 py-3 text-center'>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                                        isCheckedIn
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-slate-100 text-slate-700 border-slate-300'
                                                    }`}
                                                >
                                                    {isCheckedIn ? 'Checked In' : 'Checked Out'}
                                                </span>
                                            </td>

                                            {/* Action */}
                                            <td className='px-4 py-3 text-center'>
                                                {isCheckedIn ? (
                                                    <button
                                                        type='button'
                                                        onClick={() => handleCheckOut(visitor.id, visitor.visitorName)}
                                                        className='inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer shadow-2xs'
                                                    >
                                                        Check Out
                                                    </button>
                                                ) : (
                                                    <span className='text-slate-400 font-medium text-sm'>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Count & Mockup Footnote */}
                <div className='p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2'>
                    <span>Preserved visitor audit history synchronized with Gatekeeper register.</span>
                    <span className='text-slate-400 italic text-[11px]'>Illustrative layout only. Visitor details and times are sample data.</span>
                    <span>Total registered: <strong>{allVisitors.length}</strong></span>
                </div>
            </div>

            {/* NEW CHECK-IN VISITOR MODAL */}
            {isModalOpen && (
                <div className='fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto'>
                    <div className='bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-5 my-8'>
                        {/* Modal Header */}
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div>
                                <h3 className='text-lg font-bold text-slate-900'>New Check-in Visitor</h3>
                                <p className='text-xs text-slate-500'>Register campus entry and record check-in timestamp</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setIsModalOpen(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Automatically Populated Strip */}
                        <div className='bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs'>
                            <div>
                                <span className='text-slate-500 block'>Check-in Date:</span>
                                <span className='font-bold text-slate-800'>
                                    {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                                </span>
                            </div>
                            <div>
                                <span className='text-slate-500 block'>Check-in Time:</span>
                                <span className='font-bold text-slate-800'>
                                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </span>
                            </div>
                            <div>
                                <span className='text-slate-500 block'>Initial Status:</span>
                                <span className='font-bold text-emerald-700'>Checked In</span>
                            </div>
                            <div>
                                <span className='text-slate-500 block'>Recorded By:</span>
                                <span className='font-medium text-slate-800 truncate block'>
                                    {authName || 'Kavita Reddy'}
                                </span>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCheckInSubmit} className='space-y-4'>
                            {/* Required: Full Name & Phone */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 uppercase mb-1'>
                                        Visitor Full Name <span className='text-rose-500'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        value={formData.visitorName}
                                        onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                                        placeholder='Enter full name'
                                        className={`w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:outline-none ${
                                            formErrors.visitorName
                                                ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                                                : 'border-slate-300 focus:ring-indigo-500'
                                        }`}
                                    />
                                    {formErrors.visitorName && (
                                        <p className='text-xs text-rose-600 mt-1'>{formErrors.visitorName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 uppercase mb-1'>
                                        Phone Number <span className='text-rose-500'>*</span>
                                    </label>
                                    <input
                                        type='tel'
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder='+91 98765 43210'
                                        className={`w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:outline-none ${
                                            formErrors.phone
                                                ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                                                : 'border-slate-300 focus:ring-indigo-500'
                                        }`}
                                    />
                                    {formErrors.phone && (
                                        <p className='text-xs text-rose-600 mt-1'>{formErrors.phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Required: Person to Meet & Auto-Populated Department */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 uppercase mb-1'>
                                        Person to Meet <span className='text-rose-500'>*</span>
                                    </label>
                                    <select
                                        value={formData.personToMeet}
                                        onChange={(e) => handlePersonChange(e.target.value)}
                                        className='w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer'
                                    >
                                        {staffDirectory.map((staff) => (
                                            <option key={staff.id} value={staff.name}>
                                                {staff.name} — {staff.designation}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 uppercase mb-1'>
                                        Department (Auto-Populated)
                                    </label>
                                    <input
                                        type='text'
                                        value={formData.department}
                                        readOnly
                                        className='w-full text-sm border border-slate-200 bg-slate-100 rounded-lg px-3 py-2 text-slate-700 font-medium cursor-not-allowed'
                                    />
                                </div>
                            </div>

                            {/* Required: Purpose of Visit */}
                            <div>
                                <label className='block text-xs font-semibold text-slate-700 uppercase mb-1'>
                                    Purpose of Visit <span className='text-rose-500'>*</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    placeholder='e.g., Admission inquiry, parent-teacher meeting, vendor delivery...'
                                    className={`w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:outline-none ${
                                        formErrors.purpose
                                            ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                                            : 'border-slate-300 focus:ring-indigo-500'
                                    }`}
                                />
                                {formErrors.purpose && (
                                    <p className='text-xs text-rose-600 mt-1'>{formErrors.purpose}</p>
                                )}
                            </div>

                            {/* Optional: Organization, ID Proof Type, ID Reference */}
                            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-600 uppercase mb-1'>
                                        Organization (Optional)
                                    </label>
                                    <input
                                        type='text'
                                        value={formData.visitorOrganization}
                                        onChange={(e) => setFormData({ ...formData, visitorOrganization: e.target.value })}
                                        placeholder='Company or Parent'
                                        className='w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-600 uppercase mb-1'>
                                        ID Proof Type (Optional)
                                    </label>
                                    <select
                                        value={formData.idProofType}
                                        onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
                                        className='w-full text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer'
                                    >
                                        {ID_PROOF_TYPES.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-600 uppercase mb-1'>
                                        ID Reference (Optional)
                                    </label>
                                    <input
                                        type='text'
                                        value={formData.idProofNumber}
                                        onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
                                        placeholder='ID reference number'
                                        className='w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                                    />
                                </div>
                            </div>

                            {/* Optional: Additional Remarks */}
                            <div>
                                <label className='block text-xs font-semibold text-slate-600 uppercase mb-1'>
                                    Additional Remarks (Optional)
                                </label>
                                <input
                                    type='text'
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    placeholder='Vehicle details, badge notes, special instructions...'
                                    className='w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                                />
                            </div>

                            {/* Modal Actions */}
                            <div className='flex items-center justify-end gap-3 pt-4 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsModalOpen(false)}
                                    className='px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer'
                                >
                                    <UserCheck size={16} />
                                    Check In Visitor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}
