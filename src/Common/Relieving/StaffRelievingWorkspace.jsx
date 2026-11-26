import React, { useState, useMemo } from 'react'
import {
    FileCheck2,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Upload,
    User,
    Building2,
    Download,
    FileText,
    ArrowRight,
    Send,
    HelpCircle,
    ShieldAlert,
    Check,
    X,
    Laptop,
    BookOpen,
    DollarSign,
    Briefcase,
    GraduationCap,
    Plus,
    Search,
    Truck,
    Package,
    School
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import { ENTERPRISE_EMPLOYEES } from '../AttendanceAndLeave/attendanceLeaveData'
import { getExits, saveExits, nextId } from '../../Pages/HR/domain/hrStore'
import {
    getAllTcRequests,
    createTcRequest,
    approveTcRequest,
    forwardTcRequestToSuperAdmin,
    rejectTcRequest,
    updateNocClearance,
    statusBadgeColor,
    DEFAULT_NOC_CLEARANCES
} from '../TcRequest/tcRequestData'

const NOC_CLEARANCE_STEPS = [
    { key: 'departmentClearance', label: 'Department HOD Sign-off', icon: Building2, desc: 'Syllabus, grade register, and project task handover completed' },
    { key: 'handover', label: 'Successor Colleague Handover', icon: User, desc: 'Operational responsibilities handed over to designated successor' },
    { key: 'assets', label: 'IT Assets & Device Return', icon: Laptop, desc: 'Laptop, ID card, smart tag, and access keys surrendered to IT & Stores' },
    { key: 'documents', label: 'Library & Documents Clearance', icon: BookOpen, desc: 'All borrowed library books returned and catalog fines cleared' },
    { key: 'finance', label: 'Finance & Accounts Settlement', icon: DollarSign, desc: 'Final salary, PF, gratuity, and pending travel/reimbursement audited' },
    { key: 'hrClearance', label: 'Central HR NOC & Exit Formalities', icon: FileCheck2, desc: 'Exit interview recorded, notice period verified, and relieving authorized' }
]

const STUDENT_NOC_DEPARTMENTS = [
    { key: 'finance', label: 'Finance & Accounts', icon: DollarSign, desc: 'Tuition fees, lab fees & bus fees reconciliation' },
    { key: 'library', label: 'Library Information Center', icon: BookOpen, desc: 'Return of all borrowed books and no-due certificate' },
    { key: 'transport', label: 'Transport Logistics', icon: Truck, desc: 'Bus route pass return and route fare clearance' },
    { key: 'stores', label: 'Stores & Uniforms', icon: Package, desc: 'Lab kit, sports gear, and equipment returns' },
    { key: 'academics', label: 'Academics & Examination', icon: School, desc: 'Grade book sign-off, marksheets & cumulative record' }
]

export default function StaffRelievingWorkspace({ roleOverride = null }) {
    const { role: authRole, email: authEmail, name: authName } = useAuth()
    const activeRole = (roleOverride || authRole || 'teacher').toLowerCase().replace(/[-_\s]/g, '')
    const roleLabel = getProfileLabel(roleOverride || authRole || 'teacher')

    // Top view tab: staff relieving vs student TC clearance
    const [viewMode, setViewMode] = useState('staff')

    // Find current employee profile
    const currentEmployee = useMemo(() => {
        return (
            ENTERPRISE_EMPLOYEES.find(
                (e) => (authEmail && e.email.toLowerCase() === authEmail.toLowerCase()) ||
                       e.roleKey.toLowerCase().replace(/[-_\s]/g, '') === activeRole
            ) || ENTERPRISE_EMPLOYEES[0]
        )
    }, [authEmail, activeRole])

    const employeeId = currentEmployee?.id || 'EMP-TCH-006'
    const employeeName = authName || currentEmployee?.name || roleLabel

    // Live Exits from HR Store
    const [refreshKey, setRefreshKey] = useState(0)
    const exits = useMemo(() => {
        void refreshKey
        return getExits()
    }, [refreshKey])

    const existingExit = useMemo(() => {
        return exits.find((x) => x.employeeId === employeeId) || null
    }, [exits, employeeId])

    // Relieving application form state
    const [exitType, setExitType] = useState('Resignation')
    const [noticeStart, setNoticeStart] = useState(() => new Date().toISOString().split('T')[0])
    const [lastWorkingDate, setLastWorkingDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() + 30)
        return d.toISOString().split('T')[0]
    })
    const [reason, setReason] = useState('')
    const [handoverColleague, setHandoverColleague] = useState(
        ENTERPRISE_EMPLOYEES.find((e) => e.id !== employeeId)?.name || 'Sandy Selva'
    )
    const [attachedFile, setAttachedFile] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Student TC State
    const [tcRequests, setTcRequests] = useState(() => getAllTcRequests())
    const [tcSearch, setTcSearch] = useState('')
    const [tcStatusFilter, setTcStatusFilter] = useState('All')
    const [selectedTcForClearance, setSelectedTcForClearance] = useState(null)
    const [showNewTcModal, setShowNewTcModal] = useState(false)
    const [newTcForm, setNewTcForm] = useState({
        studentName: '',
        admissionNumber: '',
        classSection: '10-A',
        reason: 'Family relocation to another city',
        transferTo: 'Delhi Public School',
        lastDateOfAttendance: new Date().toISOString().split('T')[0],
        requestedBy: 'Parent'
    })

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only PDF, PNG, and JPEG files are allowed.')
            return
        }
        setAttachedFile({
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: file.type
        })
        toast.success(`Attached resignation document: ${file.name}`)
    }

    const handleSubmitApplication = (e) => {
        e.preventDefault()
        if (!lastWorkingDate) {
            toast.error('Proposed Last Working Date is required.')
            return
        }
        if (!reason.trim()) {
            toast.error('Please provide a specific reason for relieving.')
            return
        }

        setIsSubmitting(true)
        try {
            const currentExits = getExits()
            const newExitId = nextId('EXT-2026', currentExits)
            const newRecord = {
                id: newExitId,
                employeeId,
                lastWorkingDate,
                exitType,
                reason: reason.trim(),
                noticePeriod: '30 days',
                noticeServed: false,
                handover: false,
                assets: false,
                documents: false,
                finance: false,
                departmentClearance: false,
                hrClearance: false,
                exitInterview: false,
                handoverColleague,
                attachmentName: attachedFile?.name || 'Resignation_Letter.pdf',
                appliedDate: new Date().toISOString().split('T')[0],
                status: 'Initiated'
            }

            saveExits([newRecord, ...currentExits])
            toast.success('Relieving Application submitted successfully! HR & Department Head notified.')
            setRefreshKey((k) => k + 1)
        } catch (err) {
            toast.error(err.message || 'Failed to submit application.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Toggle staff NOC clearance step (for authorized roles/managers/HR)
    const handleToggleStaffClearance = (stepKey) => {
        if (!existingExit) return
        const updated = {
            ...existingExit,
            [stepKey]: !existingExit[stepKey]
        }
        const updatedExits = exits.map((x) => (x.id === existingExit.id ? updated : x))
        saveExits(updatedExits)
        setRefreshKey((k) => k + 1)
        toast.success(`Updated clearance status for ${stepKey}!`)
    }

    // Clearance completion count
    const completedNocCount = useMemo(() => {
        if (!existingExit) return 0
        return NOC_CLEARANCE_STEPS.filter((step) => Boolean(existingExit[step.key])).length
    }, [existingExit])

    const isFullyCleared = completedNocCount === NOC_CLEARANCE_STEPS.length

    // Student TC filtered list
    const filteredTcRequests = useMemo(() => {
        return tcRequests.filter((r) => {
            const matchesSearch =
                !tcSearch ||
                r.studentName?.toLowerCase().includes(tcSearch.toLowerCase()) ||
                r.admissionNumber?.toLowerCase().includes(tcSearch.toLowerCase()) ||
                r.requestId?.toLowerCase().includes(tcSearch.toLowerCase()) ||
                r.classSection?.toLowerCase().includes(tcSearch.toLowerCase())
            const matchesStatus =
                tcStatusFilter === 'All' ||
                (tcStatusFilter === 'Pending Review' && (r.status === 'Pending PRM Review' || r.status === 'Pending Super Admin Approval')) ||
                r.status === tcStatusFilter
            return matchesSearch && matchesStatus
        })
    }, [tcRequests, tcSearch, tcStatusFilter])

    // Student TC Create
    const handleCreateTcSubmit = (e) => {
        e.preventDefault()
        if (!newTcForm.studentName.trim()) {
            toast.error('Student Name is required.')
            return
        }
        try {
            const created = createTcRequest({
                studentName: newTcForm.studentName.trim(),
                admissionNumber: newTcForm.admissionNumber.trim() || `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                classSection: newTcForm.classSection,
                reason: newTcForm.reason.trim(),
                transferTo: newTcForm.transferTo.trim(),
                lastDateOfAttendance: newTcForm.lastDateOfAttendance,
                requestedBy: newTcForm.requestedBy
            })
            setTcRequests(getAllTcRequests())
            setShowNewTcModal(false)
            setNewTcForm({
                studentName: '',
                admissionNumber: '',
                classSection: '10-A',
                reason: 'Family relocation to another city',
                transferTo: 'Delhi Public School',
                lastDateOfAttendance: new Date().toISOString().split('T')[0],
                requestedBy: 'Parent'
            })
            toast.success(`Transfer Certificate request ${created.requestId} submitted with 5-department clearance initiated!`)
        } catch (err) {
            toast.error(err.message || 'Failed to create TC request.')
        }
    }

    // Toggle single department clearance on a student TC
    const handleToggleStudentClearance = (requestId, deptKey, currentStatus) => {
        const nextStatus = currentStatus === 'Cleared' ? 'Pending' : 'Cleared'
        const updated = updateNocClearance(
            requestId,
            deptKey,
            nextStatus,
            nextStatus === 'Cleared' ? 'Verified by Department Manager. All records and dues clear.' : 'Pending physical return or fee audit.'
        )
        if (updated) {
            setTcRequests(getAllTcRequests())
            if (selectedTcForClearance?.id === requestId) {
                setSelectedTcForClearance(updated)
            }
            toast.success(`Department [${deptKey.toUpperCase()}] marked as ${nextStatus}`)
        }
    }

    // Super Admin / Principal approval
    const handleApproveTc = (requestId) => {
        const updated = approveTcRequest(requestId, 'Transfer Certificate approved and issued by Principal / Super Admin.')
        if (updated) {
            setTcRequests(getAllTcRequests())
            if (selectedTcForClearance?.id === requestId) {
                setSelectedTcForClearance(updated)
            }
            toast.success(`TC ${requestId} Approved & Transfer Certificate Issued!`)
        }
    }

    // PRM Forward to Super Admin
    const handleForwardTc = (requestId) => {
        const updated = forwardTcRequestToSuperAdmin(requestId, 'PRM verification complete. Forwarded for final approval.')
        if (updated) {
            setTcRequests(getAllTcRequests())
            if (selectedTcForClearance?.id === requestId) {
                setSelectedTcForClearance(updated)
            }
            toast.success(`TC ${requestId} forwarded for Super Admin Approval.`)
        }
    }

    return (
        <div className='min-h-screen bg-slate-50/60 p-4 md:p-6 lg:p-8 space-y-6 font-inter'>
            {/* Header with Dual View Tabs */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs'>
                        {viewMode === 'staff' ? <FileCheck2 size={24} /> : <GraduationCap size={24} />}
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-xl md:text-2xl font-bold tracking-tight text-slate-900'>
                                {viewMode === 'staff' ? 'Staff Relieving & HR NOC Clearance' : 'Student TC Request & Department Clearances'}
                            </h1>
                            <span className='rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200'>
                                {employeeId}
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            {viewMode === 'staff'
                                ? 'Formal employee resignation submission, handover logging, and departmental NOC sign-off tracking.'
                                : 'Student Transfer Certificate (TC) processing, 5-department manager clearances, and certificate generation.'}
                        </p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className='flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80'>
                    <button
                        type='button'
                        onClick={() => setViewMode('staff')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'staff'
                                ? 'bg-white text-indigo-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Briefcase size={14} />
                        <span>Staff Relieving</span>
                    </button>
                    <button
                        type='button'
                        onClick={() => setViewMode('student_tc')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'student_tc'
                                ? 'bg-white text-indigo-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <GraduationCap size={14} />
                        <span>Student TC Clearance</span>
                        <span className='ml-1 px-1.5 py-0.2 rounded-md bg-indigo-50 text-[10px] text-indigo-700 font-bold'>
                            {tcRequests.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* VIEW MODE 1: STAFF RELIEVING & NOC */}
            {viewMode === 'staff' && (
                <>
                    {/* Employee Profile & Notice Terms Banner */}
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Employee Name</span>
                            <p className='text-base font-bold text-slate-900 mt-0.5'>{employeeName}</p>
                            <p className='text-xs text-slate-500'>{currentEmployee?.designation || roleLabel}</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Department</span>
                            <p className='text-base font-bold text-slate-900 mt-0.5'>{currentEmployee?.department || 'Academics'}</p>
                            <p className='text-xs text-slate-500'>Category: {currentEmployee?.category || 'Academic'}</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Policy Notice Period</span>
                            <p className='text-base font-bold text-indigo-600 mt-0.5'>30 Calendar Days</p>
                            <p className='text-xs text-slate-500'>Standard School HR Service Agreement</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Current Exit State</span>
                            <p className='text-base font-bold text-slate-900 mt-0.5'>
                                {existingExit ? existingExit.status : 'Active Employment'}
                            </p>
                            <p className='text-xs text-slate-500'>
                                {existingExit ? `Initiated on ${existingExit.appliedDate || existingExit.lastWorkingDate}` : 'No active relieving request'}
                            </p>
                        </div>
                    </div>

                    {/* TWO-COLUMN LAYOUT: APPLICATION FORM vs NOC CLEARANCE TRACKER */}
                    <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
                        {/* Left Column: Relieving Application Interface */}
                        <div className='lg:col-span-6 space-y-6'>
                            <div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-xs'>
                                <div className='border-b border-slate-100 pb-3 mb-4'>
                                    <h2 className='text-base font-bold text-slate-900 flex items-center gap-2'>
                                        <FileText size={18} className='text-indigo-600' />
                                        {existingExit ? 'Submitted Relieving Application' : 'Apply for Relieving / Resignation'}
                                    </h2>
                                    <p className='text-xs text-slate-500 mt-0.5'>
                                        Please review your last working date and mandatory handover responsibilities.
                                    </p>
                                </div>

                                {existingExit ? (
                                    <div className='space-y-4 text-xs'>
                                        <div className='rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 space-y-2 text-slate-700'>
                                            <div className='flex items-center justify-between'>
                                                <span className='font-semibold text-slate-500'>Application Reference:</span>
                                                <span className='font-mono font-bold text-indigo-700'>{existingExit.id}</span>
                                            </div>
                                            <div className='flex items-center justify-between'>
                                                <span className='font-semibold text-slate-500'>Exit Type:</span>
                                                <span className='font-semibold text-slate-900'>{existingExit.exitType}</span>
                                            </div>
                                            <div className='flex items-center justify-between'>
                                                <span className='font-semibold text-slate-500'>Proposed Last Working Date:</span>
                                                <span className='font-bold text-slate-900'>{existingExit.lastWorkingDate}</span>
                                            </div>
                                            <div className='flex items-center justify-between'>
                                                <span className='font-semibold text-slate-500'>Handover Colleague:</span>
                                                <span className='font-semibold text-slate-900'>{existingExit.handoverColleague || 'Designated Teacher'}</span>
                                            </div>
                                            <div className='pt-2 border-t border-indigo-100'>
                                                <span className='font-semibold text-slate-500 block mb-1'>Reason for Departure:</span>
                                                <p className='text-slate-800 italic'>{existingExit.reason}</p>
                                            </div>
                                        </div>

                                        {isFullyCleared ? (
                                            <div className='rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-3'>
                                                <CheckCircle2 size={32} className='text-emerald-600 mx-auto' />
                                                <div>
                                                    <p className='text-sm font-bold text-emerald-900'>All Departmental Clearances Approved!</p>
                                                    <p className='text-xs text-emerald-700 mt-0.5'>Your official relieving and experience certificates are authorized for generation.</p>
                                                </div>
                                                <button
                                                    type='button'
                                                    onClick={() => toast.success('Downloaded Official Relieving & Experience Certificate (PDF)')}
                                                    className='inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer'
                                                >
                                                    <Download size={14} /> Download Relieving Certificate (PDF)
                                                </button>
                                            </div>
                                        ) : (
                                            <div className='rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-xs text-amber-800'>
                                                <Clock size={16} className='text-amber-600 shrink-0 mt-0.5' />
                                                <div>
                                                    <p className='font-bold'>Clearance in Progress with Respective Departments</p>
                                                    <p className='mt-0.5'>Each department manager is actively reviewing your handover, returned materials, and financial settlements.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitApplication} className='space-y-4 text-xs'>
                                        <div>
                                            <label className='block font-semibold text-slate-700 mb-1'>Exit Type</label>
                                            <select
                                                value={exitType}
                                                onChange={(e) => setExitType(e.target.value)}
                                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none'
                                            >
                                                <option value='Resignation'>Formal Resignation</option>
                                                <option value='Relocation'>Relocation / Personal Move</option>
                                                <option value='Career Advancement'>Higher Studies / Career Advancement</option>
                                                <option value='Health / Family'>Family / Health Care</option>
                                            </select>
                                        </div>

                                        <div className='grid grid-cols-2 gap-3'>
                                            <div>
                                                <label className='block font-semibold text-slate-700 mb-1'>Notice Start Date</label>
                                                <input
                                                    type='date'
                                                    value={noticeStart}
                                                    onChange={(e) => setNoticeStart(e.target.value)}
                                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none'
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className='block font-semibold text-slate-700 mb-1'>Proposed Last Working Date</label>
                                                <input
                                                    type='date'
                                                    value={lastWorkingDate}
                                                    onChange={(e) => setLastWorkingDate(e.target.value)}
                                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none'
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className='block font-semibold text-slate-700 mb-1'>Handover Colleague / Successor</label>
                                            <select
                                                value={handoverColleague}
                                                onChange={(e) => setHandoverColleague(e.target.value)}
                                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none'
                                            >
                                                {ENTERPRISE_EMPLOYEES.filter((e) => e.id !== employeeId).map((emp) => (
                                                    <option key={emp.id} value={emp.name}>
                                                        {emp.name} ({emp.designation} - {emp.department})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className='block font-semibold text-slate-700 mb-1'>Reason for Relieving</label>
                                            <textarea
                                                rows={3}
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder='Please describe the specific reasons for your departure and any transition notes...'
                                                className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none'
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className='block font-semibold text-slate-700 mb-1'>
                                                Formal Resignation Document (.pdf, .png, .jpg)
                                            </label>
                                            <div className='border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative'>
                                                <input
                                                    type='file'
                                                    accept='.pdf,image/png,image/jpeg,image/jpg'
                                                    onChange={handleFileChange}
                                                    className='absolute inset-0 opacity-0 cursor-pointer w-full h-full'
                                                />
                                                <Upload size={20} className='text-slate-400 mx-auto mb-1' />
                                                <p className='text-xs font-semibold text-indigo-600'>Click or drop resignation letter here</p>
                                                <p className='text-[10px] text-slate-400 mt-0.5'>Supports PDF, PNG, JPG (Max 5MB)</p>
                                                {attachedFile && (
                                                    <div className='mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold'>
                                                        <FileText size={12} />
                                                        <span>{attachedFile.name} ({attachedFile.size})</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type='submit'
                                            disabled={isSubmitting}
                                            className='w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer'
                                        >
                                            {isSubmitting ? 'Submitting Application...' : 'Submit Relieving Application & Begin NOC'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Multi-Department Manager-Level HR NOC Tracker */}
                        <div className='lg:col-span-6 space-y-6'>
                            <div className='bg-white p-6 rounded-2xl border border-slate-200 shadow-xs'>
                                <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-4'>
                                    <div>
                                        <h2 className='text-base font-bold text-slate-900 flex items-center gap-2'>
                                            <ShieldAlert size={18} className='text-indigo-600' />
                                            Departmental NOC Clearance Tracker
                                        </h2>
                                        <p className='text-xs text-slate-500 mt-0.5'>
                                            Mandatory sign-offs required before official relieving and full & final settlement.
                                        </p>
                                    </div>
                                    <span className='font-bold text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700'>
                                        {completedNocCount} of {NOC_CLEARANCE_STEPS.length} Cleared
                                    </span>
                                </div>

                                <div className='space-y-3 text-xs'>
                                    {NOC_CLEARANCE_STEPS.map((step, idx) => {
                                        const Icon = step.icon
                                        const isCleared = existingExit ? Boolean(existingExit[step.key]) : false
                                        return (
                                            <div
                                                key={step.key}
                                                className={`rounded-xl border p-4 transition-all flex items-start justify-between gap-3 ${
                                                    isCleared
                                                        ? 'bg-emerald-50/40 border-emerald-200'
                                                        : 'bg-white border-slate-200/90'
                                                }`}
                                            >
                                                <div className='flex items-start gap-3'>
                                                    <div className={`p-2 rounded-xl mt-0.5 ${
                                                        isCleared ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <div>
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-slate-400 font-bold'>Step {idx + 1}.</span>
                                                            <h3 className={`font-bold ${isCleared ? 'text-emerald-900' : 'text-slate-900'}`}>
                                                                {step.label}
                                                            </h3>
                                                        </div>
                                                        <p className='text-slate-500 text-[11px] mt-0.5 leading-relaxed'>
                                                            {step.desc}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className='flex items-center gap-2 shrink-0'>
                                                    {existingExit && (
                                                        <button
                                                            type='button'
                                                            onClick={() => handleToggleStaffClearance(step.key)}
                                                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                                                isCleared
                                                                    ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                                            }`}
                                                        >
                                                            {isCleared ? 'Reopen' : 'Sign Off'}
                                                        </button>
                                                    )}
                                                    {isCleared ? (
                                                        <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800'>
                                                            <CheckCircle2 size={12} /> Cleared
                                                        </span>
                                                    ) : (
                                                        <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200'>
                                                            <Clock size={12} /> Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* VIEW MODE 2: STUDENT TC & DEPARTMENT CLEARANCE */}
            {viewMode === 'student_tc' && (
                <div className='space-y-6'>
                    {/* Top Stats Banner */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Total TC Applications</span>
                            <p className='text-2xl font-bold text-slate-900 mt-1'>{tcRequests.length}</p>
                            <p className='text-xs text-slate-500'>Active and completed cases</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Pending PRM Review</span>
                            <p className='text-2xl font-bold text-amber-600 mt-1'>
                                {tcRequests.filter((r) => r.status === 'Pending PRM Review').length}
                            </p>
                            <p className='text-xs text-slate-500'>Initial verification needed</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Super Admin Review</span>
                            <p className='text-2xl font-bold text-blue-600 mt-1'>
                                {tcRequests.filter((r) => r.status === 'Pending Super Admin Approval').length}
                            </p>
                            <p className='text-xs text-slate-500'>Final clearance approval</p>
                        </div>
                        <div className='bg-white p-4 rounded-2xl border border-slate-200 shadow-xs'>
                            <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Approved & Issued</span>
                            <p className='text-2xl font-bold text-emerald-600 mt-1'>
                                {tcRequests.filter((r) => r.status === 'Approved').length}
                            </p>
                            <p className='text-xs text-slate-500'>Official certificates generated</p>
                        </div>
                    </div>

                    {/* Filter and Action Header */}
                    <div className='bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
                        <div className='flex flex-wrap items-center gap-3 flex-1'>
                            <div className='relative flex-1 min-w-[220px] max-w-md'>
                                <Search size={16} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400' />
                                <input
                                    type='text'
                                    placeholder='Search by student, admission #, or TC ID...'
                                    value={tcSearch}
                                    onChange={(e) => setTcSearch(e.target.value)}
                                    className='w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500'
                                />
                            </div>

                            <select
                                value={tcStatusFilter}
                                onChange={(e) => setTcStatusFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500'
                            >
                                <option value='All'>All Statuses</option>
                                <option value='Pending Review'>Pending Review</option>
                                <option value='Pending PRM Review'>Pending PRM Review</option>
                                <option value='Pending Super Admin Approval'>Pending Super Admin Approval</option>
                                <option value='Approved'>Approved</option>
                                <option value='Rejected'>Rejected</option>
                            </select>
                        </div>

                        <button
                            type='button'
                            onClick={() => setShowNewTcModal(true)}
                            className='inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer'
                        >
                            <Plus size={15} />
                            <span>Raise Student TC Request</span>
                        </button>
                    </div>

                    {/* TC Requests Table */}
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-200/80 bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]'>
                                        <th className='py-3.5 px-4'>TC ID & Date</th>
                                        <th className='py-3.5 px-4'>Student & Admission #</th>
                                        <th className='py-3.5 px-4'>Class</th>
                                        <th className='py-3.5 px-4'>Reason & Transfer To</th>
                                        <th className='py-3.5 px-4'>Department Clearances</th>
                                        <th className='py-3.5 px-4'>Status</th>
                                        <th className='py-3.5 px-4 text-right'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {filteredTcRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className='py-8 text-center text-slate-400'>
                                                No Student TC requests found matching filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTcRequests.map((req) => {
                                            const clearances = req.nocClearances || DEFAULT_NOC_CLEARANCES
                                            const clearedCount = clearances.filter((c) => c.status === 'Cleared').length
                                            return (
                                                <tr key={req.id} className='hover:bg-slate-50/70 transition-colors'>
                                                    <td className='py-3.5 px-4'>
                                                        <span className='font-mono font-bold text-indigo-700 block'>{req.requestId}</span>
                                                        <span className='text-[10px] text-slate-400'>{req.requestedOn}</span>
                                                    </td>
                                                    <td className='py-3.5 px-4'>
                                                        <span className='font-bold text-slate-900 block'>{req.studentName}</span>
                                                        <span className='text-[10px] text-slate-400 font-mono'>{req.admissionNumber}</span>
                                                    </td>
                                                    <td className='py-3.5 px-4 font-semibold text-slate-700'>{req.classSection}</td>
                                                    <td className='py-3.5 px-4 max-w-xs'>
                                                        <p className='truncate text-slate-800 font-medium'>{req.reason}</p>
                                                        <p className='truncate text-[10px] text-slate-400'>To: {req.transferTo}</p>
                                                    </td>
                                                    <td className='py-3.5 px-4'>
                                                        <div className='flex items-center gap-1.5'>
                                                            {clearances.map((c) => (
                                                                <span
                                                                    key={c.departmentKey}
                                                                    title={`${c.department}: ${c.status}`}
                                                                    className={`size-2.5 rounded-full ${
                                                                        c.status === 'Cleared' ? 'bg-emerald-500' : 'bg-amber-400'
                                                                    }`}
                                                                />
                                                            ))}
                                                            <span className='text-[11px] font-semibold text-slate-600 ml-1'>
                                                                {clearedCount}/5 Cleared
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className='py-3.5 px-4'>
                                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                            statusBadgeColor[req.status] || 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className='py-3.5 px-4 text-right'>
                                                        <div className='inline-flex items-center gap-1.5 justify-end'>
                                                            <button
                                                                type='button'
                                                                onClick={() => setSelectedTcForClearance(req)}
                                                                className='rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer'
                                                            >
                                                                Clearance NOC
                                                            </button>

                                                            {req.status === 'Pending PRM Review' && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() => handleForwardTc(req.id)}
                                                                    className='rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition cursor-pointer'
                                                                >
                                                                    Forward
                                                                </button>
                                                            )}

                                                            {req.status === 'Pending Super Admin Approval' && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() => handleApproveTc(req.id)}
                                                                    className='rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer'
                                                                >
                                                                    Approve
                                                                </button>
                                                            )}

                                                            {req.status === 'Approved' && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() => toast.success(`Downloaded Transfer Certificate: ${req.tcDocumentName || 'TC.pdf'}`)}
                                                                    className='rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-200 transition cursor-pointer'
                                                                >
                                                                    <Download size={12} className='inline mr-1' /> TC PDF
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 1: RAISE STUDENT TC REQUEST */}
            {showNewTcModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 text-xs'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-4'>
                            <div className='flex items-center gap-2'>
                                <GraduationCap size={18} className='text-indigo-600' />
                                <h3 className='text-base font-bold text-slate-900'>Raise Student Transfer Certificate (TC)</h3>
                            </div>
                            <button
                                type='button'
                                onClick={() => setShowNewTcModal(false)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer'
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTcSubmit} className='space-y-3.5'>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Student Full Name</label>
                                <input
                                    type='text'
                                    value={newTcForm.studentName}
                                    onChange={(e) => setNewTcForm({ ...newTcForm, studentName: e.target.value })}
                                    placeholder='e.g. Rohan V. Verma'
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                    required
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Admission Number</label>
                                    <input
                                        type='text'
                                        value={newTcForm.admissionNumber}
                                        onChange={(e) => setNewTcForm({ ...newTcForm, admissionNumber: e.target.value })}
                                        placeholder='ADM-2026-1048'
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Class & Section</label>
                                    <select
                                        value={newTcForm.classSection}
                                        onChange={(e) => setNewTcForm({ ...newTcForm, classSection: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                    >
                                        <option value='9-A'>Class 9 - Section A</option>
                                        <option value='9-B'>Class 9 - Section B</option>
                                        <option value='10-A'>Class 10 - Section A</option>
                                        <option value='10-B'>Class 10 - Section B</option>
                                        <option value='11-Science'>Class 11 - Science</option>
                                        <option value='12-Science'>Class 12 - Science</option>
                                    </select>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Transfer To (New School)</label>
                                    <input
                                        type='text'
                                        value={newTcForm.transferTo}
                                        onChange={(e) => setNewTcForm({ ...newTcForm, transferTo: e.target.value })}
                                        placeholder='e.g. Delhi Public School'
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Last Date of Attendance</label>
                                    <input
                                        type='date'
                                        value={newTcForm.lastDateOfAttendance}
                                        onChange={(e) => setNewTcForm({ ...newTcForm, lastDateOfAttendance: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Reason for Leaving</label>
                                <textarea
                                    rows={2}
                                    value={newTcForm.reason}
                                    onChange={(e) => setNewTcForm({ ...newTcForm, reason: e.target.value })}
                                    placeholder='Relocation, guardian job transfer, admission to another board...'
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                    required
                                />
                            </div>

                            <div className='flex items-center justify-end gap-2 pt-3 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setShowNewTcModal(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition cursor-pointer'
                                >
                                    Submit TC & Initiate Clearances
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: 5-DEPARTMENT MANAGER CLEARANCES DIALOG */}
            {selectedTcForClearance && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200 text-xs space-y-4 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div>
                                <div className='flex items-center gap-2'>
                                    <h3 className='text-base font-bold text-slate-900'>Departmental NOC Clearances</h3>
                                    <span className='font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded'>
                                        {selectedTcForClearance.requestId}
                                    </span>
                                </div>
                                <p className='text-xs text-slate-500 mt-0.5'>
                                    Student: <strong className='text-slate-800'>{selectedTcForClearance.studentName}</strong> ({selectedTcForClearance.classSection} · {selectedTcForClearance.admissionNumber})
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelectedTcForClearance(null)}
                                className='p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer'
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* List of 5 Departments */}
                        <div className='space-y-3'>
                            {(selectedTcForClearance.nocClearances || DEFAULT_NOC_CLEARANCES).map((noc) => {
                                const deptMeta = STUDENT_NOC_DEPARTMENTS.find((d) => d.key === noc.departmentKey) || {
                                    icon: Building2,
                                    desc: 'Department verification'
                                }
                                const Icon = deptMeta.icon
                                const isCleared = noc.status === 'Cleared'

                                return (
                                    <div
                                        key={noc.departmentKey}
                                        className={`rounded-xl border p-3.5 transition-all flex items-start justify-between gap-3 ${
                                            isCleared ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/60 border-slate-200'
                                        }`}
                                    >
                                        <div className='flex items-start gap-3'>
                                            <div className={`p-2 rounded-xl mt-0.5 ${
                                                isCleared ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                                <Icon size={16} />
                                            </div>
                                            <div>
                                                <div className='flex items-center gap-2'>
                                                    <h4 className='font-bold text-slate-900'>{noc.department}</h4>
                                                    <span className='text-[10px] text-slate-500'>Manager: {noc.manager}</span>
                                                </div>
                                                <p className='text-[11px] text-slate-600 mt-0.5'>{noc.remarks || deptMeta.desc}</p>
                                                {noc.date && <p className='text-[10px] text-slate-400 mt-0.5'>Date: {noc.date}</p>}
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-2 shrink-0'>
                                            <button
                                                type='button'
                                                onClick={() => handleToggleStudentClearance(selectedTcForClearance.id, noc.departmentKey, noc.status)}
                                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                                    isCleared
                                                        ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                                                }`}
                                            >
                                                {isCleared ? 'Reopen Dues' : 'Mark Cleared'}
                                            </button>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                isCleared
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {isCleared ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {noc.status}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div className='flex items-center justify-between pt-3 border-t border-slate-100'>
                            <div className='text-xs text-slate-500'>
                                All 5 departmental clearances must be cleared before the Principal can issue the final TC.
                            </div>
                            <div className='flex items-center gap-2'>
                                {selectedTcForClearance.status === 'Pending PRM Review' && (
                                    <button
                                        type='button'
                                        onClick={() => handleForwardTc(selectedTcForClearance.id)}
                                        className='rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition cursor-pointer'
                                    >
                                        Forward to Super Admin
                                    </button>
                                )}
                                {selectedTcForClearance.status === 'Pending Super Admin Approval' && (
                                    <button
                                        type='button'
                                        onClick={() => handleApproveTc(selectedTcForClearance.id)}
                                        className='rounded-xl bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 transition cursor-pointer'
                                    >
                                        Approve & Issue Certificate
                                    </button>
                                )}
                                <button
                                    type='button'
                                    onClick={() => setSelectedTcForClearance(null)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer'
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
