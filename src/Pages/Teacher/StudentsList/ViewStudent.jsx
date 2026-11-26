import React from 'react'
import { useNavigate, useParams, NavLink } from 'react-router-dom'
import {
    ArrowLeft,
    ChevronRight,
    Users,
    CreditCard,
    BookOpen,
    CheckCircle2,
    AlertCircle,
    Phone,
    Mail,
    Award,
    Printer
} from 'lucide-react'
import { getStudentById } from './studentsListData'
import StudentAttendanceDetails from './Components/StudentAttendanceDetails'
import StudentResultDetails from './Components/StudentResultDetails'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>{label}</span>
        <span className='text-sm text-slate-800 font-medium whitespace-pre-wrap wrap-break-word'>
            {value || '—'}
        </span>
    </div>
)

const ViewStudent = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const student = getStudentById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-3 print:hidden'>
                <button
                    type='button'
                    onClick={() => navigate('/teacher/user-management/students-list')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-lg px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer font-medium'
                >
                    <ArrowLeft size={18} />
                    Back to Students List
                </button>
                <div className='flex items-center gap-3'>
                    <button
                        type='button'
                        onClick={() => window.print()}
                        className='inline-flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg px-4 py-2 font-medium cursor-pointer transition-colors'
                    >
                        <Printer size={16} />
                        Print Profile
                    </button>
                    <NavLink
                        to={`/teacher/user-management/students-list/view/${id}/full`}
                        className='inline-flex items-center gap-2 text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg px-4 py-2 hover:bg-indigo-100 transition-colors font-semibold cursor-pointer'
                    >
                        Detailed Administrative Dossier
                        <ChevronRight size={16} />
                    </NavLink>
                </div>
            </div>

            {!student ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-slate-500'>
                    Student record not found or could not be loaded.
                </div>
            ) : (
                <>
                    {/* Header Card */}
                    <div className='bg-white rounded-2xl shadow-md p-6'>
                        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                            <div className='flex items-center gap-4'>
                                <img
                                    src={student.profile}
                                    alt={student.name}
                                    className='w-18 h-18 rounded-full object-cover ring-4 ring-indigo-50'
                                />
                                <div>
                                    <div className='flex items-center gap-2'>
                                        <h1 className='text-2xl font-bold text-slate-900'>{student.name}</h1>
                                        <span className='px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#515DEF] text-white'>
                                            Roll: {student.rollNumber}
                                        </span>
                                    </div>
                                    <p className='text-sm text-slate-500 mt-1'>
                                        Admission No: <strong>{student.admissionNumber}</strong> • Class: <strong>{student.className} - {student.section}</strong> (Allotted Class 10-A)
                                    </p>
                                </div>
                            </div>

                            {/* Fee Badge */}
                            <div className='p-3 rounded-xl border flex items-center gap-3 self-start sm:self-auto bg-slate-50 border-slate-200'>
                                <CreditCard className={student.feeStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'} size={24} />
                                <div>
                                    <span className='text-xs text-slate-500 block uppercase font-semibold'>Current Fee Status</span>
                                    <span className={`text-sm font-bold ${student.feeStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {student.feeStatus === 'Paid' ? 'Paid in Full' : `Pending (${student.pendingFeeAmount})`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className='mt-6 pt-6 border-t border-slate-100'>
                            <h2 className='text-base font-bold text-slate-900 mb-4'>Personal Information</h2>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
                                <Field label='Full Name' value={student.name} />
                                <Field label='Gender' value={student.gender} />
                                <Field label='Date Of Birth' value={student.dateOfBirth} />
                                <Field label='Student Email' value={student.email} />
                                <Field label='Mobile Number' value={student.mobileNumber} />
                                <Field label='City & State' value={`${student.city || ''}, ${student.state || ''}`} />
                                <Field label='Country' value={student.country || 'India'} />
                                <Field label='Class & Section' value={`${student.className} - ${student.section}`} />
                            </div>
                        </div>
                    </div>

                    {/* Consolidated Parent & Guardian Information */}
                    <div className='bg-white rounded-2xl shadow-md p-6'>
                        <div className='flex items-center gap-2 mb-4'>
                            <Users className='text-[#515DEF]' size={20} />
                            <h2 className='text-lg font-bold text-slate-900'>Parent & Guardian Information</h2>
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100'>
                            <div className='space-y-1'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Father / Primary Guardian</span>
                                <p className='text-sm font-bold text-slate-900'>{student.parentName}</p>
                                <p className='text-xs text-slate-500'>Occupation: {student.parentOccupation || 'Professional'}</p>
                            </div>
                            <div className='space-y-1'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Mother Name</span>
                                <p className='text-sm font-bold text-slate-900'>{student.motherName || 'Not recorded'}</p>
                                <p className='text-xs text-slate-500'>Relationship: Parent</p>
                            </div>
                            <div className='space-y-1'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Primary Contact Phone</span>
                                <div className='flex items-center gap-1.5 text-sm font-bold text-slate-900'>
                                    <Phone size={14} className='text-slate-400' />
                                    {student.parentContact || student.mobileNumber}
                                </div>
                                <p className='text-xs text-slate-500'>Available during school hours</p>
                            </div>
                            <div className='space-y-1'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Parent Email</span>
                                <div className='flex items-center gap-1.5 text-sm font-medium text-slate-800'>
                                    <Mail size={14} className='text-slate-400' />
                                    {student.parentEmail || 'parent.contact@email.com'}
                                </div>
                            </div>
                            <div className='space-y-1'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Residential Address</span>
                                <p className='text-sm text-slate-800'>
                                    {student.city}, {student.state}, {student.country}
                                </p>
                            </div>
                            <div className='space-y-1'>
                                <span className='text-xs font-semibold text-slate-500 uppercase'>Emergency Verification</span>
                                <span className='inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200'>
                                    <CheckCircle2 size={12} /> Contact Verified
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Fee Payment History & Status */}
                    <div className='bg-white rounded-2xl shadow-md p-6'>
                        <div className='flex items-center justify-between mb-4'>
                            <div className='flex items-center gap-2'>
                                <CreditCard className='text-[#515DEF]' size={20} />
                                <h2 className='text-lg font-bold text-slate-900'>Fee Status & Payment History</h2>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                student.feeStatus === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                                {student.feeStatus === 'Paid' ? 'Paid in Full' : 'Fee Pending'}
                            </span>
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4'>
                            <div className='p-4 rounded-xl bg-slate-50 border border-slate-100'>
                                <span className='text-xs text-slate-500 block uppercase font-semibold'>Total Annual Fees</span>
                                <span className='text-lg font-bold text-slate-900'>{student.totalFees || '₹65,000'}</span>
                            </div>
                            <div className='p-4 rounded-xl bg-slate-50 border border-slate-100'>
                                <span className='text-xs text-slate-500 block uppercase font-semibold'>Term 1 (Academic 2025-26)</span>
                                <span className='text-sm font-semibold text-emerald-600 block mt-1'>
                                    {student.term1Status || 'Paid (₹32,500)'}
                                </span>
                            </div>
                            <div className='p-4 rounded-xl bg-slate-50 border border-slate-100'>
                                <span className='text-xs text-slate-500 block uppercase font-semibold'>Term 2 (Academic 2025-26)</span>
                                <span className={`text-sm font-semibold block mt-1 ${
                                    student.feeStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                    {student.term2Status || (student.feeStatus === 'Paid' ? 'Paid (₹32,500)' : 'Pending (₹18,500 Due)')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Student History & Conduct Card */}
                    <div className='bg-white rounded-2xl shadow-md p-6'>
                        <div className='flex items-center gap-2 mb-4'>
                            <BookOpen className='text-[#515DEF]' size={20} />
                            <h2 className='text-lg font-bold text-slate-900'>Student History & Academic Profile</h2>
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                            <div className='p-3.5 rounded-xl bg-slate-50 border border-slate-100'>
                                <span className='text-xs text-slate-500 block uppercase font-semibold'>Admission Date</span>
                                <span className='text-sm font-bold text-slate-800'>{student.studentHistory?.admissionDate || '12-06-2023'}</span>
                            </div>
                            <div className='p-3.5 rounded-xl bg-slate-50 border border-slate-100'>
                                <span className='text-xs text-slate-500 block uppercase font-semibold'>Previous School</span>
                                <span className='text-sm font-bold text-slate-800'>{student.studentHistory?.previousSchool || 'Secondary School'}</span>
                            </div>
                            <div className='p-3.5 rounded-xl bg-slate-50 border border-slate-100'>
                                <span className='text-xs text-slate-500 block uppercase font-semibold'>Academic Standing</span>
                                <span className='text-sm font-bold text-indigo-700'>{student.studentHistory?.academicStanding || 'A Grade (Distinction)'}</span>
                            </div>
                            <div className='p-3.5 rounded-xl bg-slate-50 border border-slate-100'>
                                <span className='text-xs text-slate-500 block uppercase font-semibold'>Overall Attendance Rate</span>
                                <span className='text-sm font-bold text-emerald-700'>{student.studentHistory?.attendanceRate || '95.5%'}</span>
                            </div>
                        </div>
                        {student.studentHistory?.achievements && (
                            <div className='mt-4 p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-start gap-2.5'>
                                <Award className='text-amber-600 shrink-0 mt-0.5' size={18} />
                                <div>
                                    <span className='text-xs font-bold text-amber-900 uppercase'>Co-Curricular & Special Achievements</span>
                                    <p className='text-xs text-amber-800 mt-0.5'>{student.studentHistory.achievements}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Attendance Information */}
                    <div>
                        <h2 className='text-xl font-semibold text-black mb-4'>Recent Attendance History</h2>
                        <StudentAttendanceDetails studentId={student.id || id} studentName={student.name} />
                    </div>

                    {/* Results */}
                    <div>
                        <h2 className='text-xl font-semibold text-black mb-4'>Academic Results & Assessments</h2>
                        <StudentResultDetails studentId={student.id || id} studentName={student.name} />
                    </div>
                </>
            )}
        </section>
    )
}

export default ViewStudent
