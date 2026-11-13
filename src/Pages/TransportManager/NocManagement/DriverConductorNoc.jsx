import React, { useEffect, useState, useMemo } from 'react'
import {
    FileCheck,
    Plus,
    Calendar,
    Search,
    RefreshCw,
    Printer,
    Download,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ShieldCheck,
    Car,
    Bus,
    Key,
    Fuel,
    Wrench,
    HeartPulse,
    CreditCard,
    FileText,
    X,
    Filter,
    Award
} from 'lucide-react'
import { DataTable, StatusBadge } from '../../../Common/ui'
import { transportService } from '../../../services/modules/transportService'

const STAFF_TYPES = ['All Staff', 'Driver', 'Conductor']
const STATUSES = ['All Statuses', 'Clearance In Progress', 'Cleared / NOC Issued', 'On Hold / Penalty Pending']

const CHECKLIST_ITEMS = [
    { key: 'vehicleKeys', label: 'Vehicle Ignition & Cabin Keys Surrendered', icon: Key },
    { key: 'fuelCard', label: 'Fleet Fuel Card Returned & Balance Reconciled', icon: Fuel },
    { key: 'toolKit', label: 'Vehicle Tool Kit, Jack & Spare Tyre Inspected', icon: Wrench },
    { key: 'firstAid', label: 'First Aid Kit & Fire Extinguisher Accounted', icon: HeartPulse },
    { key: 'fastag', label: 'FASTag De-linked & Toll Dues Reconciled', icon: CreditCard },
    { key: 'finesCleared', label: 'Traffic E-Challans / RTO Fines Cleared', icon: AlertTriangle },
    { key: 'kmAuditVerified', label: 'Odometer KM Audit Verified Against Logbook', icon: FileText },
]

const DriverConductorNoc = () => {
    const [clearances, setClearances] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStaffType, setSelectedStaffType] = useState('All Staff')
    const [selectedStatus, setSelectedStatus] = useState('All Statuses')
    const [showInitiateModal, setShowInitiateModal] = useState(false)
    const [selectedClearance, setSelectedClearance] = useState(null)
    const [certificateViewRecord, setCertificateViewRecord] = useState(null)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    // Form for new NOC handover
    const [form, setForm] = useState({
        staffType: 'Driver',
        staffId: 'EMP-DRV-015',
        staffName: '',
        licenseNo: '',
        vehicleAssigned: 'BUS-04 (TN-58-BZ-4190)',
        clearances: {
            vehicleKeys: false,
            fuelCard: false,
            toolKit: false,
            firstAid: false,
            fastag: false,
            finesCleared: false,
            kmAuditVerified: false,
        },
        remarks: '',
        nocStatus: 'Clearance In Progress',
    })

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await transportService.getNocClearances()
            if (res.success && Array.isArray(res.data)) {
                setClearances(res.data)
            }
        } catch (err) {
            console.error('Failed to load NOC clearances:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredClearances = useMemo(() => {
        return clearances.filter((c) => {
            const q = searchQuery.toLowerCase().trim()
            const matchesSearch =
                !q ||
                c.staffName?.toLowerCase().includes(q) ||
                c.staffId?.toLowerCase().includes(q) ||
                c.licenseNo?.toLowerCase().includes(q) ||
                c.vehicleAssigned?.toLowerCase().includes(q) ||
                c.certificateNo?.toLowerCase().includes(q)

            const matchesType = selectedStaffType === 'All Staff' || c.staffType === selectedStaffType
            const matchesStatus = selectedStatus === 'All Statuses' || c.nocStatus === selectedStatus

            return matchesSearch && matchesType && matchesStatus
        })
    }, [clearances, searchQuery, selectedStaffType, selectedStatus])

    // KPI Metrics
    const kpiMetrics = useMemo(() => {
        const total = filteredClearances.length
        const inProgress = filteredClearances.filter((c) => c.nocStatus === 'Clearance In Progress').length
        const issued = filteredClearances.filter((c) => c.nocStatus === 'Cleared / NOC Issued').length
        const onHold = filteredClearances.filter((c) => c.nocStatus === 'On Hold / Penalty Pending').length
        return { total, inProgress, issued, onHold }
    }, [filteredClearances])

    const handleInitiateSubmit = async (e) => {
        e.preventDefault()
        if (!form.staffName.trim() || !form.licenseNo.trim() || !form.vehicleAssigned.trim()) {
            alert('Please fill in staff name, license/badge number, and assigned vehicle.')
            return
        }

        try {
            const res = await transportService.createNocClearance(form)
            if (res.success) {
                setClearances((prev) => [res.data, ...prev])
                setShowInitiateModal(false)
                setFeedbackMessage(`NOC handover workflow initiated for ${res.data.staffName} (${res.data.staffType}).`)
                setTimeout(() => setFeedbackMessage(''), 4000)
                setForm({
                    staffType: 'Driver',
                    staffId: `EMP-DRV-${Math.floor(100 + Math.random() * 900)}`,
                    staffName: '',
                    licenseNo: '',
                    vehicleAssigned: 'BUS-04 (TN-58-BZ-4190)',
                    clearances: {
                        vehicleKeys: false,
                        fuelCard: false,
                        toolKit: false,
                        firstAid: false,
                        fastag: false,
                        finesCleared: false,
                        kmAuditVerified: false,
                    },
                    remarks: '',
                    nocStatus: 'Clearance In Progress',
                })
            } else {
                alert(`Error: ${res.error?.message || 'Failed to initiate NOC clearance'}`)
            }
        } catch (err) {
            console.error('Error initiating NOC:', err)
        }
    }

    const handleChecklistToggle = async (key) => {
        if (!selectedClearance) return
        const currentClearances = selectedClearance.clearances || {}
        const updated = {
            ...selectedClearance,
            clearances: {
                ...currentClearances,
                [key]: !currentClearances[key],
            },
        }

        try {
            const res = await transportService.updateNocClearance(selectedClearance.id, updated)
            if (res.success) {
                setSelectedClearance(res.data)
                setClearances((prev) => prev.map((c) => (c.id === selectedClearance.id ? res.data : c)))
            }
        } catch (err) {
            console.error('Failed to toggle checklist item:', err)
        }
    }

    const handleIssueCertificate = async (clearance) => {
        try {
            const res = await transportService.issueNocCertificate(clearance.id, {
                issuedBy: 'A. David Raj (Transport Manager)',
                issuedDate: new Date().toISOString().split('T')[0],
            })

            if (res.success) {
                setClearances((prev) => prev.map((c) => (c.id === clearance.id ? res.data : c)))
                if (selectedClearance && selectedClearance.id === clearance.id) {
                    setSelectedClearance(res.data)
                }
                setFeedbackMessage(`Official NOC Certificate ${res.data.certificateNo} issued for ${res.data.staffName}!`)
                setTimeout(() => setFeedbackMessage(''), 5000)
            } else {
                alert(`Cannot Issue NOC: ${res.error?.message || res.error || 'All checklist items must be cleared'}`)
            }
        } catch (err) {
            console.error('Failed to issue certificate:', err)
        }
    }

    const columns = [
        {
            key: 'staff',
            label: 'Crew Member & Designation',
            required: true,
            render: (row) => (
                <div>
                    <div className='font-bold text-slate-900 text-xs'>{row.staffName}</div>
                    <div className='flex items-center gap-1.5 mt-1'>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.staffType === 'Driver' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                            {row.staffType}
                        </span>
                        <span className='text-[10px] text-slate-400 font-mono'>{row.staffId}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'vehicle',
            label: 'Assigned Vehicle & License',
            required: true,
            render: (row) => (
                <div className='text-xs'>
                    <div className='font-medium text-slate-800 flex items-center gap-1'>
                        <Bus className='w-3.5 h-3.5 text-teal-600' />
                        {row.vehicleAssigned}
                    </div>
                    <div className='text-[10px] text-slate-500 font-mono mt-0.5'>
                        Badge / DL: {row.licenseNo}
                    </div>
                </div>
            ),
        },
        {
            key: 'clearanceScore',
            label: '7-Item Checklist Progress',
            required: true,
            render: (row) => {
                const cl = row.clearances || {}
                const clearedCount = Object.values(cl).filter(Boolean).length
                const percent = Math.round((clearedCount / 7) * 100)

                return (
                    <div className='text-xs w-36'>
                        <div className='flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1'>
                            <span>{clearedCount} of 7 Cleared</span>
                            <span className={clearedCount === 7 ? 'text-emerald-700' : 'text-amber-700'}>{percent}%</span>
                        </div>
                        <div className='w-full bg-slate-100 rounded-full h-1.5 overflow-hidden'>
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${clearedCount === 7 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                )
            },
        },
        {
            key: 'nocStatus',
            label: 'NOC Status',
            required: true,
            render: (row) => (
                <div>
                    <StatusBadge status={row.nocStatus} />
                    {row.certificateNo && (
                        <div className='text-[10px] text-emerald-700 font-mono mt-0.5'>
                            {row.certificateNo}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            required: true,
            render: (row) => (
                <div className='flex items-center gap-1.5'>
                    <button
                        type='button'
                        onClick={() => setSelectedClearance(row)}
                        className='text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors'
                    >
                        Checklist
                    </button>
                    {row.nocStatus === 'Cleared / NOC Issued' && (
                        <button
                            type='button'
                            onClick={() => setCertificateViewRecord(row)}
                            className='inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shadow-xs'
                        >
                            <Award className='w-3 h-3' />
                            Certificate
                        </button>
                    )}
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
                            <FileCheck className='w-4 h-4' />
                            Fleet Human Resources &amp; Custodial Handover
                        </div>
                        <h1 className='text-2xl font-bold text-slate-900 mt-1'>
                            Driver &amp; Conductor NOC Management
                        </h1>
                        <p className='text-xs text-slate-500 mt-1 max-w-2xl'>
                            Dedicated No Objection Certificate (NOC) and clearance workflow for transport drivers and conductors verifying keys, toolkits, fuel cards, FASTags, and traffic fines.
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            type='button'
                            onClick={loadData}
                            className='inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type='button'
                            onClick={() => setShowInitiateModal(true)}
                            className='inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                        >
                            <Plus className='w-4 h-4' />
                            Initiate Crew NOC
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

            {/* KPI Cards */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Total NOC Requests</div>
                    <div className='text-2xl font-bold text-slate-900 mt-1 font-mono'>{kpiMetrics.total}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Drivers &amp; conductors registered</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Clearances In Progress</div>
                    <div className='text-2xl font-bold text-amber-600 mt-1 font-mono'>{kpiMetrics.inProgress}</div>
                    <div className='text-[10px] text-slate-400 mt-0.5'>Checklist audit active</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>Cleared / NOC Issued</div>
                    <div className='text-2xl font-bold text-emerald-600 mt-1 font-mono'>{kpiMetrics.issued}</div>
                    <div className='text-[10px] text-emerald-600 mt-0.5 font-medium'>Official certificates granted</div>
                </div>
                <div className='p-4 bg-white rounded-2xl border border-slate-200 shadow-xs'>
                    <div className='text-xs font-medium text-slate-500'>On Hold / Fines Pending</div>
                    <div className='text-2xl font-bold text-rose-600 mt-1 font-mono'>{kpiMetrics.onHold}</div>
                    <div className='text-[10px] text-rose-500 mt-0.5 font-semibold'>Penalty or fuel mismatch</div>
                </div>
            </div>

            {/* Filters */}
            <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3'>
                <div className='flex items-center gap-3 w-full md:w-auto flex-wrap'>
                    <div className='relative w-full md:w-64'>
                        <Search className='w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2' />
                        <input
                            type='text'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search crew name, ID, vehicle...'
                            className='w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                        />
                    </div>

                    <select
                        value={selectedStaffType}
                        onChange={(e) => setSelectedStaffType(e.target.value)}
                        className='px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    >
                        {STAFF_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className='px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500'
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className='text-xs font-semibold text-slate-500'>
                    Showing {filteredClearances.length} clearance records
                </div>
            </div>

            {/* Table */}
            <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                <div className='p-4 border-b border-slate-100 flex items-center justify-between'>
                    <h2 className='text-sm font-bold text-slate-900'>
                        Crew Handover &amp; NOC Clearance Register
                    </h2>
                </div>
                <div className='p-2'>
                    <DataTable
                        columns={columns}
                        data={filteredClearances}
                        emptyMessage='No NOC clearance records match the selected filters.'
                    />
                </div>
            </div>

            {/* Initiate Modal */}
            {showInitiateModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div className='flex items-center gap-2'>
                                <FileCheck className='w-5 h-5 text-teal-600' />
                                <h3 className='text-base font-bold text-slate-900'>Initiate Crew Relieving &amp; NOC</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowInitiateModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <form onSubmit={handleInitiateSubmit} className='mt-4 space-y-4'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Staff Role *</label>
                                    <select
                                        value={form.staffType}
                                        onChange={(e) => setForm({ ...form, staffType: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    >
                                        <option value='Driver'>Driver</option>
                                        <option value='Conductor'>Conductor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Staff ID</label>
                                    <input
                                        type='text'
                                        value={form.staffId}
                                        onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Full Name *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.staffName}
                                        onChange={(e) => setForm({ ...form, staffName: e.target.value })}
                                        placeholder='e.g. T. Shanmugam'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold text-slate-700 mb-1'>Driving License / Badge No *</label>
                                    <input
                                        type='text'
                                        required
                                        value={form.licenseNo}
                                        onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
                                        placeholder='e.g. TN-58-2015-004921'
                                        className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Assigned Vehicle &amp; Plate *</label>
                                <input
                                    type='text'
                                    required
                                    value={form.vehicleAssigned}
                                    onChange={(e) => setForm({ ...form, vehicleAssigned: e.target.value })}
                                    placeholder='e.g. BUS-04 (TN-58-BZ-4190)'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div>
                                <label className='block text-xs font-semibold text-slate-700 mb-1'>Remarks / Handover Reason</label>
                                <textarea
                                    rows={2}
                                    value={form.remarks}
                                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                                    placeholder='Specify relieving reason, resignation date, or transfer notice...'
                                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowInitiateModal(false)}
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    Start Clearance Workflow
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Clearance Checklist Modal */}
            {selectedClearance && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between pb-3 border-b border-slate-100'>
                            <div>
                                <span className='text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono'>
                                    {selectedClearance.id}
                                </span>
                                <h3 className='text-sm font-bold text-slate-900 mt-1'>
                                    NOC Clearance Checklist — {selectedClearance.staffName}
                                </h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedClearance(null)}
                                className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        <div className='mt-4 space-y-4 text-xs'>
                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs'>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Designation:</span>
                                    <span className='font-semibold text-slate-900'>{selectedClearance.staffType} ({selectedClearance.staffId})</span>
                                </div>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Vehicle Assigned:</span>
                                    <span className='font-semibold text-slate-900'>{selectedClearance.vehicleAssigned}</span>
                                </div>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>License / Badge:</span>
                                    <span className='font-mono text-slate-800'>{selectedClearance.licenseNo}</span>
                                </div>
                                <div>
                                    <span className='text-slate-400 block text-[11px] font-medium'>Current Status:</span>
                                    <StatusBadge status={selectedClearance.nocStatus} />
                                </div>
                            </div>

                            {/* 7 Item Interactive Checklist */}
                            <div>
                                <span className='font-bold text-slate-800 block text-xs uppercase tracking-wider mb-2'>
                                    Mandatory Handover Checkpoints (Click to verify)
                                </span>
                                <div className='space-y-2'>
                                    {CHECKLIST_ITEMS.map((item) => {
                                        const ItemIcon = item.icon
                                        const isChecked = Boolean(selectedClearance.clearances?.[item.key])
                                        return (
                                            <div
                                                key={item.key}
                                                onClick={() => handleChecklistToggle(item.key)}
                                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                                    isChecked
                                                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                                }`}
                                            >
                                                <div className='flex items-center gap-2.5'>
                                                    <ItemIcon className={`w-4 h-4 ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`} />
                                                    <span className={`text-xs ${isChecked ? 'font-semibold' : ''}`}>{item.label}</span>
                                                </div>
                                                <div className='shrink-0 ml-2'>
                                                    {isChecked ? (
                                                        <CheckCircle2 className='w-4 h-4 text-emerald-600' />
                                                    ) : (
                                                        <div className='w-4 h-4 rounded-full border border-slate-300' />
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className='p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1'>
                                <span className='text-[11px] text-slate-500 block font-medium'>Remarks:</span>
                                <p className='text-slate-900'>{selectedClearance.remarks || 'No remarks recorded.'}</p>
                            </div>
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-between'>
                            <button
                                type='button'
                                onClick={() => setSelectedClearance(null)}
                                className='px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                            >
                                Close
                            </button>
                            {selectedClearance.nocStatus !== 'Cleared / NOC Issued' ? (
                                <button
                                    type='button'
                                    onClick={() => handleIssueCertificate(selectedClearance)}
                                    className='inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs'
                                >
                                    <Award className='w-4 h-4' />
                                    Issue Official NOC Certificate
                                </button>
                            ) : (
                                <button
                                    type='button'
                                    onClick={() => {
                                        setCertificateViewRecord(selectedClearance)
                                        setSelectedClearance(null)
                                    }}
                                    className='inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs'
                                >
                                    <Award className='w-4 h-4' />
                                    View NOC Certificate
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Official NOC Certificate View Modal */}
            {certificateViewRecord && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4'>
                    <div className='bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto print:p-2 print:shadow-none'>
                        <div className='flex items-center justify-between pb-4 border-b border-slate-200 print:hidden'>
                            <span className='text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full'>
                                Official Transport Clearance
                            </span>
                            <div className='flex items-center gap-2'>
                                <button
                                    type='button'
                                    onClick={() => window.print()}
                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors'
                                >
                                    <Printer className='w-3.5 h-3.5 text-slate-600' />
                                    Print Certificate
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setCertificateViewRecord(null)}
                                    className='p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                >
                                    <X className='w-5 h-5' />
                                </button>
                            </div>
                        </div>

                        {/* Certificate Document Canvas */}
                        <div className='mt-4 p-6 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 space-y-6 print:border-none print:bg-white'>
                            {/* Certificate Header */}
                            <div className='text-center space-y-1 pb-4 border-b-2 border-slate-300'>
                                <div className='flex justify-center'>
                                    <div className='w-12 h-12 rounded-full bg-teal-700 flex items-center justify-center text-white mb-2 shadow-sm'>
                                        <ShieldCheck className='w-7 h-7' />
                                    </div>
                                </div>
                                <h2 className='text-lg font-black uppercase tracking-wider text-slate-900'>
                                    School ERP Transport &amp; Fleet Directorate
                                </h2>
                                <p className='text-xs font-semibold text-teal-800 uppercase tracking-widest'>
                                    Official Transport Custodial Handover Certificate
                                </p>
                                <div className='text-[11px] font-mono font-bold text-slate-600 pt-1'>
                                    Certificate Ref: {certificateViewRecord.certificateNo}
                                </div>
                            </div>

                            {/* Body Paragraph */}
                            <div className='text-xs leading-relaxed space-y-3 text-slate-800'>
                                <p>
                                    This is to certify that <span className='font-bold uppercase text-slate-900'>{certificateViewRecord.staffName}</span>, bearing Staff ID <span className='font-mono font-bold'>{certificateViewRecord.staffId}</span> and License / Badge No. <span className='font-mono font-bold'>{certificateViewRecord.licenseNo}</span>, serving as <span className='font-bold text-slate-900'>{certificateViewRecord.staffType}</span> assigned to Vehicle <span className='font-bold text-teal-800'>{certificateViewRecord.vehicleAssigned}</span>, has formally completed all mandatory equipment surrenders and transport clearances.
                                </p>

                                {/* Checklist Verification Grid */}
                                <div className='p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-[11px]'>
                                    <div className='font-bold text-slate-800 mb-1.5 uppercase tracking-wide text-[10px]'>
                                        Verified Inventory &amp; Clearances:
                                    </div>
                                    <div className='grid grid-cols-2 gap-y-1.5 gap-x-3'>
                                        <div className='flex items-center gap-1.5 text-emerald-800'>
                                            <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                                            <span>Vehicle Keys Handed Over</span>
                                        </div>
                                        <div className='flex items-center gap-1.5 text-emerald-800'>
                                            <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                                            <span>Fleet Fuel Card Reconciled</span>
                                        </div>
                                        <div className='flex items-center gap-1.5 text-emerald-800'>
                                            <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                                            <span>Tool Kit &amp; Spare Tyre Checked</span>
                                        </div>
                                        <div className='flex items-center gap-1.5 text-emerald-800'>
                                            <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                                            <span>First Aid &amp; Extinguisher OK</span>
                                        </div>
                                        <div className='flex items-center gap-1.5 text-emerald-800'>
                                            <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                                            <span>FASTag Account De-linked</span>
                                        </div>
                                        <div className='flex items-center gap-1.5 text-emerald-800'>
                                            <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                                            <span>Zero Pending Traffic Challans</span>
                                        </div>
                                    </div>
                                </div>

                                <p className='text-slate-600 text-[11px] italic'>
                                    The transport maintenance and fleet records confirm zero outstanding financial liabilities or missing equipment against this crew member.
                                </p>
                            </div>

                            {/* Signatures */}
                            <div className='pt-6 border-t border-slate-300 flex items-end justify-between text-xs'>
                                <div>
                                    <div className='font-mono text-slate-500 text-[10px]'>Date of Issuance:</div>
                                    <div className='font-bold font-mono text-slate-800'>{certificateViewRecord.issuedDate || '2026-03-10'}</div>
                                    <div className='text-[10px] text-emerald-700 font-semibold mt-0.5'>Digitally Certified</div>
                                </div>
                                <div className='text-right'>
                                    <div className='font-bold text-slate-900'>{certificateViewRecord.issuedBy || 'A. David Raj'}</div>
                                    <div className='text-[10px] text-slate-500 font-medium'>Transport Manager &amp; Fleet In-charge</div>
                                    <div className='text-[10px] text-teal-800 font-semibold'>School ERP Fleet Directorate</div>
                                </div>
                            </div>
                        </div>

                        <div className='mt-6 pt-3 border-t border-slate-100 flex items-center justify-end print:hidden'>
                            <button
                                type='button'
                                onClick={() => setCertificateViewRecord(null)}
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

export default DriverConductorNoc
