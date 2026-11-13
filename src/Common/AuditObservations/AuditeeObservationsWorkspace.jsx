import React, { useState, useMemo } from 'react'
import {
    ShieldAlert,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    FileText,
    Eye,
    X,
    Send,
    Building2,
    Calendar,
    User,
    Layers,
    ChevronRight,
    ArrowUpRight,
    HelpCircle
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import {
    AUDIT_STREAMS,
    DEPARTMENT_OPTIONS,
    getDepartmentForRole,
    isExecutiveOrAuditorRole,
    getFilteredAuditeeObservations,
    getAuditeeObservationKpis,
    submitAuditeeRca,
    submitAuditeeAtr,
    receiveAuditQuantities
} from './auditeeObservationsData'
import { priorityBadgeColor, statusBadgeColor } from '../../Pages/ProcessAuditor/Observations/observationsData'

export default function AuditeeObservationsWorkspace({ roleOverride = null }) {
    const { role: authRole, name: authName } = useAuth()
    const activeRole = roleOverride || authRole || 'employee'
    const roleLabel = getProfileLabel(activeRole)
    const currentUserName = authName || roleLabel || 'Department Representative'

    const defaultDept = useMemo(() => getDepartmentForRole(activeRole), [activeRole])
    const canSelectDepartment = useMemo(() => isExecutiveOrAuditorRole(activeRole), [activeRole])

    // Filter states
    const [selectedDept, setSelectedDept] = useState(defaultDept)
    const [selectedStream, setSelectedStream] = useState('All')
    const [selectedStatus, setSelectedStatus] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [refreshNonce, setRefreshNonce] = useState(0)

    // Modal state for viewing details and submitting RCA / ATR
    const [activeObservation, setActiveObservation] = useState(null)
    const [activeTab, setActiveTab] = useState('details') // 'details' | 'rca' | 'atr'

    // Form states
    const [rcaForm, setRcaForm] = useState({
        rootCause: '',
        contributingFactors: '',
        preventiveAction: '',
    })

    const [atrForm, setAtrForm] = useState({
        actionTaken: '',
        evidence: '',
        targetDate: '',
    })

    const [receiveQtyForm, setReceiveQtyForm] = useState({
        quantityReceived: '',
        receivingNotes: '',
    })

    // Fetch filtered observations
    const observations = useMemo(() => {
        void refreshNonce
        return getFilteredAuditeeObservations({
            role: activeRole,
            department: selectedDept,
            stream: selectedStream,
            status: selectedStatus,
            query: searchQuery,
        })
    }, [activeRole, selectedDept, selectedStream, selectedStatus, searchQuery, refreshNonce])

    // KPIs
    const kpis = useMemo(() => {
        void refreshNonce
        return getAuditeeObservationKpis(activeRole, selectedDept)
    }, [activeRole, selectedDept, refreshNonce])

    const handleOpenObservation = (item) => {
        setActiveObservation(item)
        setActiveTab('details')
        setRcaForm({
            rootCause: item.rcaRootCause || '',
            contributingFactors: item.rcaContributingFactors || '',
            preventiveAction: item.rcaPreventiveAction || '',
        })
        setAtrForm({
            actionTaken: item.atrActionTaken || '',
            evidence: item.atrEvidence || '',
            targetDate: item.atrTargetDate || '',
        })
        setReceiveQtyForm({
            quantityReceived: item.quantityReceived || '',
            receivingNotes: item.receivingNotes || '',
        })
    }

    const handleCloseModal = () => {
        setActiveObservation(null)
    }

    const handleSubmitReceiveQty = (e) => {
        e.preventDefault()
        if (!receiveQtyForm.quantityReceived) {
            toast.error('Please enter the physical quantity received.')
            return
        }

        const res = receiveAuditQuantities(activeObservation.observationId, receiveQtyForm, currentUserName)
        if (res) {
            toast.success(`Quantities received and verified for audit observation ${activeObservation.observationId}.`)
            setActiveObservation(res)
            setRefreshNonce((prev) => prev + 1)
        } else {
            toast.error('Unable to record quantity receiving. Please try again.')
        }
    }

    const handleSubmitRca = (e) => {
        e.preventDefault()
        if (!rcaForm.rootCause.trim()) {
            toast.error('Please enter the root cause analysis explanation.')
            return
        }

        const res = submitAuditeeRca(activeObservation.observationId, rcaForm, currentUserName)
        if (res) {
            toast.success(`RCA submitted for ${activeObservation.observationId}. Auditor notified for review.`)
            setActiveObservation(res)
            setRefreshNonce((prev) => prev + 1)
        } else {
            toast.error('Unable to update observation. Please try again.')
        }
    }

    const handleSubmitAtr = (e) => {
        e.preventDefault()
        if (!atrForm.actionTaken.trim()) {
            toast.error('Please detail the corrective actions taken.')
            return
        }

        const res = submitAuditeeAtr(activeObservation.observationId, atrForm, currentUserName)
        if (res) {
            toast.success(`Action Taken Report submitted for ${activeObservation.observationId}. Status moved to Resolved.`)
            setActiveObservation(res)
            setRefreshNonce((prev) => prev + 1)
        } else {
            toast.error('Unable to update observation. Please try again.')
        }
    }

    return (
        <div className='min-h-screen bg-slate-50/60 p-4 md:p-6 lg:p-8 space-y-6'>
            {/* Header */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm'>
                <div>
                    <div className='flex items-center gap-3'>
                        <span className='p-2 bg-indigo-50 text-indigo-600 rounded-xl'>
                            <ShieldAlert size={24} />
                        </span>
                        <div>
                            <h1 className='text-xl md:text-2xl font-bold text-slate-900'>Received Audit Observations</h1>
                            <p className='text-sm text-slate-500 mt-0.5'>
                                Department audit findings, non-compliances, and required corrective actions (CAPA)
                            </p>
                        </div>
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                    <span className='text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200'>
                        {defaultDept === 'All' ? 'Executive Oversight' : `Auditee: ${defaultDept}`}
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between'>
                    <div>
                        <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Total Received</p>
                        <p className='text-2xl font-bold text-slate-900 mt-1'>{kpis.total}</p>
                    </div>
                    <div className='w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center'>
                        <Layers size={22} />
                    </div>
                </div>

                <div className='bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm flex items-center justify-between'>
                    <div>
                        <p className='text-xs font-semibold text-rose-600 uppercase tracking-wider'>Critical / High</p>
                        <p className='text-2xl font-bold text-rose-700 mt-1'>{kpis.critical}</p>
                    </div>
                    <div className='w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center'>
                        <AlertTriangle size={22} />
                    </div>
                </div>

                <div className='bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm flex items-center justify-between'>
                    <div>
                        <p className='text-xs font-semibold text-amber-600 uppercase tracking-wider'>Pending Response</p>
                        <p className='text-2xl font-bold text-amber-700 mt-1'>{kpis.open + kpis.inReview}</p>
                    </div>
                    <div className='w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center'>
                        <Clock size={22} />
                    </div>
                </div>

                <div className='bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm flex items-center justify-between'>
                    <div>
                        <p className='text-xs font-semibold text-emerald-600 uppercase tracking-wider'>Resolved / Closed</p>
                        <p className='text-2xl font-bold text-emerald-700 mt-1'>{kpis.resolved}</p>
                    </div>
                    <div className='w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center'>
                        <CheckCircle2 size={22} />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {/* Search */}
                    <div className='relative'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={18} />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search by ID, title, auditor...'
                            className='w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                        />
                    </div>

                    {/* Department Filter (interactive for executive/auditor, or view-only) */}
                    <div>
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            disabled={!canSelectDepartment}
                            className={`w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${!canSelectDepartment ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                        >
                            {DEPARTMENT_OPTIONS.map((dept) => (
                                <option key={dept} value={dept}>Department: {dept}</option>
                            ))}
                        </select>
                    </div>

                    {/* Audit Stream */}
                    <div>
                        <select
                            value={selectedStream}
                            onChange={(e) => setSelectedStream(e.target.value)}
                            className='w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                        >
                            {AUDIT_STREAMS.map((str) => (
                                <option key={str} value={str}>Stream: {str}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className='w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                        >
                            <option value='All'>Status: All</option>
                            <option value='Open'>Open</option>
                            <option value='Assigned'>Assigned</option>
                            <option value='In Review'>In Review</option>
                            <option value='Resolved'>Resolved</option>
                            <option value='Closed'>Closed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Observations Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='font-semibold text-slate-800'>Observations Awaiting Action ({observations.length})</h2>
                    <span className='text-xs text-slate-500'>Click any row to inspect details and submit corrective reports</span>
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-sm'>
                        <thead className='bg-slate-50/75 text-xs text-slate-600 font-semibold border-b border-slate-200'>
                            <tr>
                                <th className='px-4 py-3'>Observation ID</th>
                                <th className='px-4 py-3'>Stream & Category</th>
                                <th className='px-4 py-3'>Finding Title</th>
                                <th className='px-4 py-3'>Department</th>
                                <th className='px-4 py-3'>Severity</th>
                                <th className='px-4 py-3'>Due Date</th>
                                <th className='px-4 py-3'>Status</th>
                                <th className='px-4 py-3'>Audit Quantities</th>
                                <th className='px-4 py-3 text-right'>Action</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100 text-slate-700'>
                            {observations.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className='px-4 py-12 text-center text-slate-500'>
                                        <ShieldCheck className='size-10 mx-auto text-emerald-500 mb-2 opacity-80' />
                                        <p className='font-medium text-slate-700'>No open audit observations found</p>
                                        <p className='text-xs text-slate-400 mt-1'>
                                            {selectedDept === 'All' ? 'All departmental audit findings are closed or conforming.' : `No audit observations found for ${selectedDept}.`}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                observations.map((item) => (
                                    <tr
                                        key={item.observationId}
                                        onClick={() => handleOpenObservation(item)}
                                        className='hover:bg-slate-50/80 transition-colors cursor-pointer group'
                                    >
                                        <td className='px-4 py-3 font-semibold text-indigo-600 whitespace-nowrap'>
                                            {item.observationId}
                                        </td>
                                        <td className='px-4 py-3 whitespace-nowrap'>
                                            <span className='block text-xs font-medium text-slate-900'>{item.category}</span>
                                            <span className='block text-xs text-slate-400'>{item.stream}</span>
                                        </td>
                                        <td className='px-4 py-3 max-w-xs'>
                                            <p className='font-medium text-slate-900 truncate'>{item.title}</p>
                                            <p className='text-xs text-slate-500 truncate'>Ref: {item.auditReference}</p>
                                        </td>
                                        <td className='px-4 py-3 whitespace-nowrap'>
                                            <span className='inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium'>
                                                <Building2 size={13} className='text-slate-400' />
                                                {item.department || item.responsibleDepartment}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3 whitespace-nowrap'>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${priorityBadgeColor[item.priority] || priorityBadgeColor[item.severity] || 'bg-slate-100 text-slate-600'}`}>
                                                {item.priority || item.severity}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3 text-xs text-slate-600 whitespace-nowrap'>
                                            {item.dueDate}
                                        </td>
                                        <td className='px-4 py-3 whitespace-nowrap'>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeColor[item.status] || 'bg-slate-100 text-slate-600'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3 whitespace-nowrap text-xs'>
                                            <div className='font-semibold text-slate-800'>
                                                Given: {item.quantityGiven || item.auditQuantity || 10}
                                            </div>
                                            <div className='flex items-center gap-1.5 mt-0.5'>
                                                <span className='text-slate-500'>Recv: {item.quantityReceived ?? '—'}</span>
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${item.receivingStatus === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                                    {item.receivingStatus || 'Pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className='px-4 py-3 text-right whitespace-nowrap'>
                                            <button
                                                type='button'
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleOpenObservation(item)
                                                }}
                                                className='inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors'
                                            >
                                                <Eye size={14} />
                                                Respond
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slide-over / Modal for Observation Inspection & Response */}
            {activeObservation && (
                <div className='fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4'>
                    <div className='bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col'>
                        {/* Modal Header */}
                        <div className='p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50'>
                            <div>
                                <div className='flex items-center gap-2'>
                                    <span className='text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100'>
                                        {activeObservation.observationId}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityBadgeColor[activeObservation.priority] || priorityBadgeColor[activeObservation.severity]}`}>
                                        {activeObservation.priority || activeObservation.severity}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeColor[activeObservation.status]}`}>
                                        {activeObservation.status}
                                    </span>
                                </div>
                                <h2 className='text-lg font-bold text-slate-900 mt-2'>{activeObservation.title}</h2>
                                <p className='text-xs text-slate-500 mt-1'>
                                    Audit Ref: {activeObservation.auditReference} · Department: {activeObservation.department} · Due: {activeObservation.dueDate}
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={handleCloseModal}
                                className='p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Navigation Tabs */}
                        <div className='flex border-b border-slate-200 bg-white px-6 gap-6'>
                            <button
                                type='button'
                                onClick={() => setActiveTab('details')}
                                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Observation Details
                            </button>
                            <button
                                type='button'
                                onClick={() => setActiveTab('rca')}
                                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'rca' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Root Cause Analysis (RCA) {activeObservation.rcaSubmitted && '✓'}
                            </button>
                            <button
                                type='button'
                                onClick={() => setActiveTab('atr')}
                                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'atr' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Action Taken Report (ATR) {activeObservation.atrSubmitted && '✓'}
                            </button>
                            <button
                                type='button'
                                onClick={() => setActiveTab('receive-qty')}
                                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'receive-qty' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                Receive Audit Quantities {activeObservation.receivingStatus === 'Received' && '✓'}
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className='p-6 overflow-y-auto space-y-6 flex-1'>
                            {activeTab === 'details' && (
                                <div className='space-y-4'>
                                    <div className='bg-slate-50 p-4 rounded-xl border border-slate-200'>
                                        <h3 className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-2'>Auditor's Description</h3>
                                        <p className='text-sm text-slate-800 leading-relaxed'>{activeObservation.description}</p>
                                    </div>

                                    <div className='grid grid-cols-2 gap-4 text-sm'>
                                        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
                                            <span className='text-xs text-slate-400 block'>Audit Location</span>
                                            <span className='font-medium text-slate-800'>{activeObservation.location || 'Campus venue'}</span>
                                        </div>
                                        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
                                            <span className='text-xs text-slate-400 block'>Assigned Auditee</span>
                                            <span className='font-medium text-slate-800'>{activeObservation.assignTo || activeObservation.responsiblePerson}</span>
                                        </div>
                                        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
                                            <span className='text-xs text-slate-400 block'>Category</span>
                                            <span className='font-medium text-slate-800'>{activeObservation.category}</span>
                                        </div>
                                        <div className='bg-slate-50 p-3 rounded-xl border border-slate-100'>
                                            <span className='text-xs text-slate-400 block'>Audit Evidence</span>
                                            <span className='font-medium text-indigo-600'>{activeObservation.evidence || 'Attached in audit workbook'}</span>
                                        </div>
                                    </div>

                                    {activeObservation.timeline && (
                                        <div className='mt-4 pt-4 border-t border-slate-100'>
                                            <h4 className='text-xs font-bold text-slate-500 uppercase tracking-wider mb-3'>Workflow Progression</h4>
                                            <div className='flex items-center gap-2 overflow-x-auto py-2'>
                                                {activeObservation.timeline.map((step, idx) => (
                                                    <div key={step.stage} className='flex items-center gap-2 shrink-0'>
                                                        <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${step.done ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                            {step.stage}
                                                        </div>
                                                        {idx < activeObservation.timeline.length - 1 && (
                                                            <ChevronRight size={14} className='text-slate-300' />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'rca' && (
                                <form onSubmit={handleSubmitRca} className='space-y-4'>
                                    <div className='bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 text-xs text-indigo-900'>
                                        As the auditee department head or owner, identify the root cause of this non-compliance to prevent recurrence.
                                    </div>

                                    <div>
                                        <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'>
                                            Root Cause Analysis Summary *
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={rcaForm.rootCause}
                                            onChange={(e) => setRcaForm({ ...rcaForm, rootCause: e.target.value })}
                                            placeholder='Explain why this gap or non-compliance occurred...'
                                            className='w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'>
                                            Contributing Factors & System Dependencies
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={rcaForm.contributingFactors}
                                            onChange={(e) => setRcaForm({ ...rcaForm, contributingFactors: e.target.value })}
                                            placeholder='Staffing transitions, material delays, vendor dependency...'
                                            className='w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'>
                                            Preventive Action Proposed
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={rcaForm.preventiveAction}
                                            onChange={(e) => setRcaForm({ ...rcaForm, preventiveAction: e.target.value })}
                                            placeholder='SOP update, refresher training, daily checkpoint...'
                                            className='w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                                        />
                                    </div>

                                    <div className='flex justify-end gap-3 pt-2'>
                                        <button
                                            type='button'
                                            onClick={handleCloseModal}
                                            className='px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors'
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type='submit'
                                            className='inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors'
                                        >
                                            <Send size={15} />
                                            Submit RCA
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'atr' && (
                                <form onSubmit={handleSubmitAtr} className='space-y-4'>
                                    <div className='bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-900'>
                                        Action Taken Report (ATR): Document the physical or process correction implemented to resolve this finding.
                                    </div>

                                    <div>
                                        <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'>
                                            Corrective Action Taken *
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={atrForm.actionTaken}
                                            onChange={(e) => setAtrForm({ ...atrForm, actionTaken: e.target.value })}
                                            placeholder='Detailed actions executed to correct the observation...'
                                            className='w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                                            required
                                        />
                                    </div>

                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                        <div>
                                            <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'>
                                                Evidence File Name / Reference
                                            </label>
                                            <input
                                                type='text'
                                                value={atrForm.evidence}
                                                onChange={(e) => setAtrForm({ ...atrForm, evidence: e.target.value })}
                                                placeholder='e.g. updated-log-photo.jpg'
                                                className='w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'>
                                                Resolution Date
                                            </label>
                                            <input
                                                type='text'
                                                value={atrForm.targetDate}
                                                onChange={(e) => setAtrForm({ ...atrForm, targetDate: e.target.value })}
                                                placeholder='DD-MM-YYYY'
                                                className='w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                                            />
                                        </div>
                                    </div>

                                    <div className='flex justify-end gap-3 pt-2'>
                                        <button
                                            type='button'
                                            onClick={handleCloseModal}
                                            className='px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors'
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type='submit'
                                            className='inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors'
                                        >
                                            <CheckCircle2 size={15} />
                                            Submit Action Taken Report
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'receive-qty' && (
                                <form onSubmit={handleSubmitReceiveQty} className='space-y-4'>
                                    <div className='bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950'>
                                        Physical Quantity Receiving: Confirm and accept quantities raised during audit. Verify physical stock count against the quantity issued/given by audit.
                                    </div>

                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                        <div className='bg-slate-50 p-3.5 rounded-xl border border-slate-200'>
                                            <span className='text-xs text-slate-500 block uppercase font-bold text-[10px]'>Quantity Given / Raised by Audit</span>
                                            <span className='text-lg font-black text-slate-800'>{activeObservation.quantityGiven || activeObservation.auditQuantity || 10} Units</span>
                                        </div>
                                        <div className='bg-slate-50 p-3.5 rounded-xl border border-slate-200'>
                                            <span className='text-xs text-slate-500 block uppercase font-bold text-[10px]'>Current Receiving Status</span>
                                            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${activeObservation.receivingStatus === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {activeObservation.receivingStatus || 'Pending Receipt'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'>
                                            Actual Quantity Received *
                                        </label>
                                        <input
                                            type='number'
                                            min='0'
                                            value={receiveQtyForm.quantityReceived}
                                            onChange={(e) => setReceiveQtyForm({ ...receiveQtyForm, quantityReceived: e.target.value })}
                                            placeholder='e.g. 10'
                                            required
                                            className='w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                                        />
                                    </div>

                                    <div>
                                        <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5'>
                                            Receiving Inspection Notes / Discrepancy Remarks
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={receiveQtyForm.receivingNotes}
                                            onChange={(e) => setReceiveQtyForm({ ...receiveQtyForm, receivingNotes: e.target.value })}
                                            placeholder='Physical condition verified, seal intact, counted and added to departmental stock ledger...'
                                            className='w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                                        />
                                    </div>

                                    <div className='flex justify-end gap-3 pt-2'>
                                        <button
                                            type='button'
                                            onClick={handleCloseModal}
                                            className='px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors'
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type='submit'
                                            className='inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors'
                                        >
                                            <CheckCircle2 size={15} />
                                            Confirm Quantity Received
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

