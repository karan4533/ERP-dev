import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    User,
    Briefcase,
    Phone,
    MapPin,
    History,
    FileText,
    CalendarCheck,
    CalendarOff,
    Activity,
    Shield,
    Camera,
    Check,
    Save,
    Lock,
    Eye,
    EyeOff,
    FileCheck2,
    GraduationCap,
    Clock,
    CheckCircle2,
    Download,
    AlertCircle,
    ArrowRight,
    Building2,
    Laptop,
    BookOpen,
    DollarSign
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../../context/AuthContext'
import { getProfileLabel } from '../../Authentication/profileOptions'
import { getExits, saveExits, nextId } from '../../HR/domain/hrStore'
import { getAllTcRequests, createTcRequest } from '../../../Common/TcRequest/tcRequestData'
import { ENTERPRISE_EMPLOYEES } from '../../../Common/AttendanceAndLeave/attendanceLeaveData'

const TABS = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'professional', label: 'Professional Details', icon: Briefcase },
    { id: 'contact', label: 'Contact Details', icon: Phone },
    { id: 'address', label: 'Address & Residence', icon: MapPin },
    { id: 'employment', label: 'Employment History', icon: History },
    { id: 'documents', label: 'Documents Vault', icon: FileText },
    { id: 'attendance', label: 'Attendance Summary', icon: CalendarCheck },
    { id: 'leave', label: 'Leave Balances', icon: CalendarOff },
    { id: 'activity', label: 'Activity History', icon: Activity },
    { id: 'security', label: 'Security & 2FA', icon: Shield },
]

const MyProfilePage = () => {
    const navigate = useNavigate()
    const { role, name: authName, email, employeeId: authEmployeeId, department: authDepartment, completePasswordChange } = useAuth()
    const roleLabel = getProfileLabel(role)
    const displayName = authName || (roleLabel ?? 'Staff User')
    const [currentPwd, setCurrentPwd] = useState('')
    const [newPwd, setNewPwd] = useState('')
    const [pwdStatus, setPwdStatus] = useState({ type: '', message: '' })
    const [updatingPwd, setUpdatingPwd] = useState(false)

    const isStudentOrParent = role === 'student' || role === 'parent'
    const roleTabs = useMemo(() => {
        if (isStudentOrParent) {
            return [
                ...TABS,
                { id: 'tc', label: 'Transfer Certificate (TC)', icon: GraduationCap }
            ]
        }
        return [
            ...TABS,
            { id: 'relieving', label: 'Relieving & NOC Clearance', icon: FileCheck2 }
        ]
    }, [isStudentOrParent])

    const [activeTab, setActiveTab] = useState('personal')
    const [savedSuccess, setSavedSuccess] = useState(false)
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

    // Form states
    const [personalInfo, setPersonalInfo] = useState({
        fullName: displayName,
        gender: 'Female',
        dob: '1985-06-14',
        bloodGroup: 'O+',
        nationality: 'Indian',
        languages: 'English, Tamil, Hindi',
    })

    const [contactInfo, setContactInfo] = useState({
        officialEmail: email || 'user@school.com',
        personalEmail: 'personal.contact@gmail.com',
        phone: '+91 98401 23456',
        emergencyContact: '+91 94440 98765 (Spouse)',
    })

    // Staff Relieving Quick State
    const [exitsList, setExitsList] = useState(() => getExits())
    const activeRole = (role || 'teacher').toLowerCase().replace(/[-_\s]/g, '')
    const currentEmployee = useMemo(() => {
        return (
            ENTERPRISE_EMPLOYEES.find(
                (e) => (email && e.email.toLowerCase() === email.toLowerCase()) ||
                       e.roleKey?.toLowerCase().replace(/[-_\s]/g, '') === activeRole
            ) || ENTERPRISE_EMPLOYEES[0]
        )
    }, [email, activeRole])
    const employeeId = currentEmployee?.id || 'EMP-TCH-006'
    const myExit = useMemo(() => exitsList.find((x) => x.employeeId === employeeId) || null, [exitsList, employeeId])
    const [relievingDate, setRelievingDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() + 30)
        return d.toISOString().split('T')[0]
    })
    const [relievingReason, setRelievingReason] = useState('')
    const [isSubmittingRelieving, setIsSubmittingRelieving] = useState(false)

    // Student TC Quick State
    const [tcList, setTcList] = useState(() => getAllTcRequests())
    const [tcReason, setTcReason] = useState('Family relocation to another city')
    const [tcTransferTo, setTcTransferTo] = useState('Delhi Public School, Bangalore')
    const [isSubmittingTc, setIsSubmittingTc] = useState(false)

    const handleApplyRelieving = (e) => {
        e.preventDefault()
        if (!relievingReason.trim()) {
            toast.error('Please specify a reason for relieving.')
            return
        }
        setIsSubmittingRelieving(true)
        try {
            const allExits = getExits()
            const newExit = {
                id: nextId('EXT-2026', allExits),
                employeeId,
                lastWorkingDate: relievingDate,
                exitType: 'Resignation',
                reason: relievingReason.trim(),
                noticePeriod: '30 days',
                noticeServed: false,
                handover: false,
                assets: false,
                documents: false,
                finance: false,
                departmentClearance: false,
                hrClearance: false,
                exitInterview: false,
                appliedDate: new Date().toISOString().split('T')[0],
                status: 'Initiated'
            }
            saveExits([newExit, ...allExits])
            setExitsList(getExits())
            toast.success('Relieving & NOC request submitted directly from your profile!')
        } catch (err) {
            toast.error(err.message || 'Failed to submit relieving request.')
        } finally {
            setIsSubmittingRelieving(false)
        }
    }

    const handleApplyTc = (e) => {
        e.preventDefault()
        setIsSubmittingTc(true)
        try {
            const newReq = createTcRequest({
                studentName: displayName,
                admissionNumber: 'ADM-2026-104',
                classSection: '10-A',
                reason: tcReason.trim(),
                transferTo: tcTransferTo.trim(),
                lastDateOfAttendance: new Date().toISOString().split('T')[0],
                requestedBy: role === 'parent' ? 'Parent' : 'Student'
            })
            setTcList(getAllTcRequests())
            toast.success(`Transfer Certificate request ${newReq.requestId} submitted from your profile!`)
        } catch (err) {
            toast.error(err.message || 'Failed to submit TC request.')
        } finally {
            setIsSubmittingTc(false)
        }
    }

    const handleSave = (e) => {
        e.preventDefault()
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 3000)
    }

    return (
        <div className='space-y-6 pb-8 font-inter'>
            {/* Profile Overview Card (Reference Design Aesthetic) */}
            <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-6 shadow-xs'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6'>
                    <div className='flex items-center gap-5'>
                        <div className='relative'>
                            <img
                                src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'
                                alt={displayName}
                                className='size-20 rounded-full object-cover ring-4 ring-blue-50'
                            />
                            <button
                                type='button'
                                aria-label='Update photo'
                                className='absolute bottom-0 right-0 flex size-6.5 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs hover:bg-blue-700 transition-colors'
                            >
                                <Camera size={13} />
                            </button>
                        </div>

                        <div>
                            <div className='flex items-center gap-2.5 flex-wrap'>
                                <h1 className='text-xl font-bold tracking-tight text-slate-900'>
                                    {displayName}
                                </h1>
                                <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                                    {roleLabel}
                                </span>
                                <span className='flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100'>
                                    <span className='size-1.5 rounded-full bg-emerald-500' />
                                    Active Employment
                                </span>
                            </div>
                            <div className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500'>
                                <span>Employee ID: <strong className='text-slate-700'>{authEmployeeId || employeeId}</strong></span>
                                <span>·</span>
                                <span>Dept: <strong className='text-slate-700'>{authDepartment || currentEmployee?.department || 'Academic Administration'}</strong></span>
                                <span>·</span>
                                <span>Email: <strong className='text-slate-700'>{email || '—'}</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className='flex items-center gap-2 self-start sm:self-center flex-wrap'>
                        {!isStudentOrParent ? (
                            <button
                                type='button'
                                onClick={() => setActiveTab('relieving')}
                                className='inline-flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-100 transition-colors cursor-pointer'
                            >
                                <FileCheck2 size={14} />
                                Apply for Relieving & NOC
                            </button>
                        ) : (
                            <button
                                type='button'
                                onClick={() => setActiveTab('tc')}
                                className='inline-flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-100 transition-colors cursor-pointer'
                            >
                                <GraduationCap size={14} />
                                Apply for Student TC
                            </button>
                        )}
                        <button
                            type='button'
                            onClick={handleSave}
                            className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer'
                        >
                            <Save size={14} />
                            Save Changes
                        </button>
                    </div>
                </div>

                {savedSuccess && (
                    <div className='mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200'>
                        <Check size={16} />
                        Profile updates have been recorded and synced to the administrative ledger.
                    </div>
                )}
            </div>

            {/* Navigation Tabs Bar */}
            <div className='flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 bg-white px-2 py-1.5 rounded-2xl shadow-2xs sidebar-scroll-hide'>
                {roleTabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            type='button'
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <Icon size={14} />
                            <span>{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Tab Contents Area */}
            <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-6 shadow-xs'>
                {/* 1. Personal Information */}
                {activeTab === 'personal' && (
                    <form onSubmit={handleSave} className='space-y-5'>
                        <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                            Personal Identity & Demographics
                        </h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs'>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Full Name</label>
                                <input
                                    type='text'
                                    value={personalInfo.fullName}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Date of Birth</label>
                                <input
                                    type='date'
                                    value={personalInfo.dob}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, dob: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Gender</label>
                                <select
                                    value={personalInfo.gender}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                >
                                    <option>Female</option>
                                    <option>Male</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Blood Group</label>
                                <input
                                    type='text'
                                    value={personalInfo.bloodGroup}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, bloodGroup: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Nationality</label>
                                <input
                                    type='text'
                                    value={personalInfo.nationality}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, nationality: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Languages Spoken</label>
                                <input
                                    type='text'
                                    value={personalInfo.languages}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, languages: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                        </div>
                    </form>
                )}

                {/* 2. Professional Details */}
                {activeTab === 'professional' && (
                    <div className='space-y-4 text-xs'>
                        <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                            Institutional Appointment & Position
                        </h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                            <div className='rounded-xl bg-slate-50 p-3.5'>
                                <p className='text-slate-400 font-medium'>Designation</p>
                                <p className='font-bold text-slate-900 mt-1 text-sm'>{roleLabel}</p>
                            </div>
                            <div className='rounded-xl bg-slate-50 p-3.5'>
                                <p className='text-slate-400 font-medium'>Department</p>
                                <p className='font-bold text-slate-900 mt-1 text-sm'>Academic Wing</p>
                            </div>
                            <div className='rounded-xl bg-slate-50 p-3.5'>
                                <p className='text-slate-400 font-medium'>Employment Status</p>
                                <p className='font-bold text-emerald-700 mt-1 text-sm'>Permanent / Confirmed</p>
                            </div>
                            <div className='rounded-xl bg-slate-50 p-3.5'>
                                <p className='text-slate-400 font-medium'>Reporting Authority</p>
                                <p className='font-bold text-slate-900 mt-1 text-sm'>Principal / DA</p>
                            </div>
                            <div className='rounded-xl bg-slate-50 p-3.5'>
                                <p className='text-slate-400 font-medium'>Date of Joining</p>
                                <p className='font-bold text-slate-900 mt-1 text-sm'>01 June 2021 (5 Years)</p>
                            </div>
                            <div className='rounded-xl bg-slate-50 p-3.5'>
                                <p className='text-slate-400 font-medium'>Work Schedule</p>
                                <p className='font-bold text-slate-900 mt-1 text-sm'>Mon–Fri: 08:15 – 16:30 IST</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Contact Details */}
                {activeTab === 'contact' && (
                    <form onSubmit={handleSave} className='space-y-5'>
                        <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                            Communications & Emergency Directory
                        </h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs'>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Official School Email</label>
                                <input
                                    type='email'
                                    disabled
                                    value={contactInfo.officialEmail}
                                    className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed'
                                />
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Personal Email</label>
                                <input
                                    type='email'
                                    value={contactInfo.personalEmail}
                                    onChange={(e) => setContactInfo({ ...contactInfo, personalEmail: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Primary Mobile Phone</label>
                                <input
                                    type='tel'
                                    value={contactInfo.phone}
                                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Emergency Contact Details</label>
                                <input
                                    type='text'
                                    value={contactInfo.emergencyContact}
                                    onChange={(e) => setContactInfo({ ...contactInfo, emergencyContact: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                        </div>
                    </form>
                )}

                {/* 4. Address Details */}
                {activeTab === 'address' && (
                    <div className='space-y-4 text-xs'>
                        <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                            Residential Address Information
                        </h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <div className='rounded-xl border border-slate-200 bg-slate-50/50 p-4'>
                                <p className='font-bold text-slate-900 mb-1'>Permanent Address</p>
                                <p className='text-slate-600 leading-relaxed'>
                                    Plot No. 42, Green Avenue, Alagarkovil Main Road,<br />
                                    Madurai, Tamil Nadu – 625002<br />
                                    Country: India
                                </p>
                            </div>
                            <div className='rounded-xl border border-slate-200 bg-slate-50/50 p-4'>
                                <p className='font-bold text-slate-900 mb-1'>Current Residence Address</p>
                                <p className='text-slate-600 leading-relaxed'>
                                    Apartment 3B, Staff Quarters Wing A, Queen Mira Campus,<br />
                                    Madurai, Tamil Nadu – 625014<br />
                                    Country: India
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Employment History */}
                {activeTab === 'employment' && (
                    <div className='space-y-4 text-xs'>
                        <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                            Prior Experience & Academic Qualifications
                        </h2>
                        <div className='space-y-3'>
                            <div className='rounded-xl border border-slate-200 p-3.5'>
                                <p className='font-bold text-slate-800'>Queen Mira International School</p>
                                <p className='text-blue-600 font-semibold'>{roleLabel} (2021 – Present)</p>
                                <p className='text-slate-500 mt-1'>Leading curriculum design, teacher evaluations, Bloom's Taxonomy implementation, and institutional accreditation.</p>
                            </div>
                            <div className='rounded-xl border border-slate-200 p-3.5'>
                                <p className='font-bold text-slate-800'>Delhi Public School, Coimbatore</p>
                                <p className='text-slate-600 font-semibold'>Senior Subject Coordinator (2016 – 2021)</p>
                                <p className='text-slate-500 mt-1'>Managed secondary school examination suites and student pastoral care initiatives.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. Documents Vault */}
                {activeTab === 'documents' && (
                    <div className='space-y-4 text-xs'>
                        <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                            Verified Statutory & Verification Documents
                        </h2>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                            {[
                                { title: 'Aadhaar Card (Verified)', file: 'aadhaar_doc_signed.pdf', date: '01 Jun 2021' },
                                { title: 'PAN Card Verification', file: 'pan_card_qmis.pdf', date: '01 Jun 2021' },
                                { title: 'Master of Education Degree', file: 'm_ed_degree_cert.pdf', date: '15 May 2015' },
                                { title: 'Staff Appointment Letter', file: 'qmis_appointment_letter.pdf', date: '01 Jun 2021' },
                                { title: 'Biometric Access Clearance', file: 'essl_security_pass.pdf', date: '10 Aug 2026' },
                            ].map((doc) => (
                                <div key={doc.title} className='flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition-colors'>
                                    <div>
                                        <p className='font-semibold text-slate-800'>{doc.title}</p>
                                        <p className='text-slate-400 mt-0.5'>{doc.file}</p>
                                    </div>
                                    <button type='button' className='text-blue-600 font-semibold hover:underline'>
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 7. Attendance Summary */}
                {activeTab === 'attendance' && (
                    <div className='space-y-4 text-xs'>
                        <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                            Biometric Punch Records & Attendance Scorecard
                        </h2>
                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4'>
                            <div className='rounded-xl bg-blue-50 p-4 border border-blue-100'>
                                <p className='text-slate-500 font-medium'>Current Month Rate</p>
                                <p className='text-2xl font-bold text-blue-700 mt-1'>98.2%</p>
                                <p className='text-slate-400 mt-1'>22/22 Working Days</p>
                            </div>
                            <div className='rounded-xl bg-slate-50 p-4 border border-slate-200'>
                                <p className='text-slate-500 font-medium'>Average In-Time</p>
                                <p className='text-2xl font-bold text-slate-800 mt-1'>08:12 AM</p>
                                <p className='text-slate-400 mt-1'>Gate 1 SilkBio punch</p>
                            </div>
                            <div className='rounded-xl bg-slate-50 p-4 border border-slate-200'>
                                <p className='text-slate-500 font-medium'>Late Exceptions</p>
                                <p className='text-2xl font-bold text-slate-800 mt-1'>0</p>
                                <p className='text-emerald-600 font-semibold mt-1'>Zero violations</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 8. Leave Summary */}
                {activeTab === 'leave' && (
                    <div className='space-y-4 text-xs'>
                        <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                            Statutory Leave Entitlements & Balances
                        </h2>
                        <div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
                            {[
                                { type: 'Casual Leave (CL)', available: 8, total: 12 },
                                { type: 'Medical Leave (ML)', available: 10, total: 12 },
                                { type: 'Earned Leave (EL)', available: 18, total: 20 },
                                { type: 'On Duty (OD)', available: 5, total: 8 },
                            ].map((l) => (
                                <div key={l.type} className='rounded-xl border border-slate-200 p-3.5 bg-slate-50/50'>
                                    <p className='font-semibold text-slate-700'>{l.type}</p>
                                    <p className='text-xl font-bold text-slate-900 mt-1.5'>{l.available} <span className='text-xs text-slate-400 font-normal'>/ {l.total} days</span></p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 9. Activity History */}
                {activeTab === 'activity' && (
                    <div className='space-y-4 text-xs'>
                        <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                            User Session Audit & Transaction Log
                        </h2>
                        <div className='space-y-2.5'>
                            {[
                                { action: 'Logged in from Chrome on Windows', time: 'Today, 08:14 AM', ip: '192.168.1.104' },
                                { action: 'Approved Grade 10 Lesson Plan (Mathematics)', time: 'Yesterday, 03:45 PM', ip: '192.168.1.104' },
                                { action: 'Generated Annual Exam Marks Consolidation', time: '28 Oct 2026, 11:20 AM', ip: '192.168.1.104' },
                                { action: 'Updated Password & Security credentials', time: '15 Oct 2026, 09:12 AM', ip: '192.168.1.104' },
                            ].map((act, i) => (
                                <div key={i} className='flex items-center justify-between rounded-xl bg-slate-50 p-3'>
                                    <div>
                                        <p className='font-medium text-slate-800'>{act.action}</p>
                                        <p className='text-slate-400 text-[11px] mt-0.5'>{act.time}</p>
                                    </div>
                                    <span className='font-mono text-[10px] text-slate-400'>{act.ip}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 10. Security Settings */}
                {activeTab === 'security' && (
                    <div className='space-y-5 text-xs max-w-xl'>
                        <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                            Password & Two-Factor Authentication (2FA)
                        </h2>
                        <div className='flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-slate-50/50'>
                            <div>
                                <p className='font-bold text-slate-900'>Two-Factor Authentication (2FA)</p>
                                <p className='text-slate-500 mt-0.5'>Secure OTP authentication required on new device sign-ins.</p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                                className={`rounded-full px-3 py-1 font-semibold text-xs transition-colors cursor-pointer ${
                                    twoFactorEnabled
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-200 text-slate-600'
                                }`}
                            >
                                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                            </button>
                        </div>

                        <div className='space-y-3 pt-2'>
                            <p className='font-bold text-slate-900'>Change Workspace Password</p>
                            {pwdStatus.message && (
                                <div className={`rounded-xl px-3 py-2 text-xs font-medium ${pwdStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                    {pwdStatus.message}
                                </div>
                            )}
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Current Password</label>
                                <input
                                    type='password'
                                    value={currentPwd}
                                    onChange={(e) => setCurrentPwd(e.target.value)}
                                    placeholder='••••••••••••'
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>New Password</label>
                                <input
                                    type='password'
                                    value={newPwd}
                                    onChange={(e) => setNewPwd(e.target.value)}
                                    placeholder='Minimum 10 characters with letter & number'
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <button
                                type='button'
                                disabled={updatingPwd}
                                onClick={async () => {
                                    setPwdStatus({ type: '', message: '' })
                                    if (!currentPwd || !newPwd) {
                                        setPwdStatus({ type: 'error', message: 'Enter both your current and new password.' })
                                        return
                                    }
                                    setUpdatingPwd(true)
                                    try {
                                        await completePasswordChange(currentPwd, newPwd)
                                        setCurrentPwd('')
                                        setNewPwd('')
                                        setPwdStatus({ type: 'success', message: 'Password updated on server.' })
                                        toast.success('Password updated successfully!')
                                    } catch (err) {
                                        setPwdStatus({ type: 'error', message: err?.message || 'Unable to update password.' })
                                    } finally {
                                        setUpdatingPwd(false)
                                    }
                                }}
                                className='rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-black transition-colors cursor-pointer disabled:opacity-60'
                            >
                                {updatingPwd ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                )}

                {/* 11. Relieving & NOC Clearance (Staff) */}
                {activeTab === 'relieving' && (
                    <div className='space-y-5 text-xs'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div>
                                <h2 className='text-sm font-semibold tracking-tight text-slate-900 flex items-center gap-2'>
                                    <FileCheck2 size={16} className='text-indigo-600' />
                                    Staff Relieving & Multi-Department NOC
                                </h2>
                                <p className='text-slate-500 mt-0.5'>
                                    Submit a formal resignation or view the status of your department sign-offs.
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={() => navigate('/staff-relieving')}
                                className='inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer'
                            >
                                Open Full Relieving Workspace <ArrowRight size={13} />
                            </button>
                        </div>

                        {myExit ? (
                            <div className='rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-4'>
                                <div className='flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3'>
                                    <div>
                                        <span className='font-mono font-bold text-indigo-700'>{myExit.id}</span>
                                        <p className='text-slate-900 font-bold mt-0.5'>
                                            Status: <span className='text-indigo-600'>{myExit.status}</span>
                                        </p>
                                    </div>
                                    <div className='text-right'>
                                        <span className='text-slate-400 text-[11px] block'>Proposed Last Working Day</span>
                                        <span className='font-bold text-slate-800'>{myExit.lastWorkingDate}</span>
                                    </div>
                                </div>

                                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700'>
                                    <div className='p-3 rounded-xl bg-white border border-slate-200'>
                                        <span className='text-[10px] text-slate-400 font-semibold block'>Handover</span>
                                        <span className='font-bold text-slate-800'>{myExit.handover ? '✓ Completed' : '⏳ In Progress'}</span>
                                    </div>
                                    <div className='p-3 rounded-xl bg-white border border-slate-200'>
                                        <span className='text-[10px] text-slate-400 font-semibold block'>Assets & IT Return</span>
                                        <span className='font-bold text-slate-800'>{myExit.assets ? '✓ Surrendered' : '⏳ Pending'}</span>
                                    </div>
                                    <div className='p-3 rounded-xl bg-white border border-slate-200'>
                                        <span className='text-[10px] text-slate-400 font-semibold block'>Finance Settlement</span>
                                        <span className='font-bold text-slate-800'>{myExit.finance ? '✓ Settled' : '⏳ Pending'}</span>
                                    </div>
                                </div>

                                {myExit.hrClearance ? (
                                    <div className='p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center justify-between'>
                                        <span>✓ Final HR NOC Approved. Relieving Certificate is available.</span>
                                        <button
                                            type='button'
                                            onClick={() => toast.success('Downloaded Relieving Certificate (PDF)')}
                                            className='px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold'
                                        >
                                            Download
                                        </button>
                                    </div>
                                ) : (
                                    <p className='text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-medium'>
                                        Clearance is underway across IT, Library, Finance and HOD.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleApplyRelieving} className='space-y-3.5 max-w-lg'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Proposed Last Working Date</label>
                                    <input
                                        type='date'
                                        value={relievingDate}
                                        onChange={(e) => setRelievingDate(e.target.value)}
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Reason for Departure</label>
                                    <textarea
                                        rows={3}
                                        value={relievingReason}
                                        onChange={(e) => setRelievingReason(e.target.value)}
                                        placeholder='Please mention reason for resigning / relieving (e.g. higher studies, relocation)...'
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                        required
                                    />
                                </div>
                                <button
                                    type='submit'
                                    disabled={isSubmittingRelieving}
                                    className='rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 transition cursor-pointer'
                                >
                                    {isSubmittingRelieving ? 'Submitting...' : 'Submit Relieving Application'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* 12. Student TC Request (Student / Parent) */}
                {activeTab === 'tc' && (
                    <div className='space-y-5 text-xs'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div>
                                <h2 className='text-sm font-semibold tracking-tight text-slate-900 flex items-center gap-2'>
                                    <GraduationCap size={16} className='text-indigo-600' />
                                    Student Transfer Certificate (TC) Requests
                                </h2>
                                <p className='text-slate-500 mt-0.5'>
                                    Submit and track your Transfer Certificate and 5-department NOC clearances.
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={() => navigate('/student/tc-request')}
                                className='inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer'
                            >
                                View All Requests <ArrowRight size={13} />
                            </button>
                        </div>

                        {tcList.length > 0 && (
                            <div className='space-y-3'>
                                <h3 className='font-bold text-slate-900'>Existing TC Applications</h3>
                                {tcList.map((req) => (
                                    <div key={req.id} className='rounded-xl border border-slate-200 p-4 bg-slate-50/50 flex items-center justify-between gap-4'>
                                        <div>
                                            <div className='flex items-center gap-2'>
                                                <span className='font-mono font-bold text-indigo-700'>{req.requestId}</span>
                                                <span className='font-semibold text-slate-900'>· {req.studentName}</span>
                                                <span className='text-slate-400'>({req.classSection})</span>
                                            </div>
                                            <p className='text-slate-500 mt-1'>Destination: {req.transferTo} · Date: {req.requestedOn}</p>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <span className='px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200'>
                                                {req.status}
                                            </span>
                                            {req.status === 'Approved' && (
                                                <button
                                                    type='button'
                                                    onClick={() => toast.success(`Downloaded Transfer Certificate: ${req.tcDocumentName || 'TC.pdf'}`)}
                                                    className='px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold'
                                                >
                                                    <Download size={12} className='inline mr-1' /> PDF
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className='pt-2 border-t border-slate-100 max-w-lg'>
                            <h3 className='font-bold text-slate-900 mb-2'>Submit New TC Request</h3>
                            <form onSubmit={handleApplyTc} className='space-y-3'>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>New School / College Name</label>
                                    <input
                                        type='text'
                                        value={tcTransferTo}
                                        onChange={(e) => setTcTransferTo(e.target.value)}
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='block font-semibold text-slate-700 mb-1'>Reason for Transfer</label>
                                    <textarea
                                        rows={2}
                                        value={tcReason}
                                        onChange={(e) => setTcReason(e.target.value)}
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500'
                                        required
                                    />
                                </div>
                                <button
                                    type='submit'
                                    disabled={isSubmittingTc}
                                    className='rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 transition cursor-pointer'
                                >
                                    {isSubmittingTc ? 'Submitting...' : 'Submit TC Request & Initiate Clearances'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyProfilePage

