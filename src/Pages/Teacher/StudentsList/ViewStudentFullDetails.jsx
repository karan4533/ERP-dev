import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft,
    Printer,
    FileText,
    Calendar,
    GraduationCap,
    Bed,
    Clock,
    Award,
    CheckCircle2,
    AlertCircle,
    UserCheck,
    Bus
} from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import { getStudentFullProfileById, ATTENDANCE_RECORDS, attendanceBadgeColor } from './studentFullProfileData'
import { hostelService } from '../../../services/modules/hostelService'
import { academicService } from '../../../services/modules/academicService'

const Section = ({ title, icon: Icon, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-6 border border-slate-100 print:shadow-none print:border-slate-300 print:p-4'>
        <div className='flex items-center gap-2 mb-6 border-b border-slate-100 pb-3 print:pb-2'>
            {Icon && <Icon className='text-[#515DEF] print:text-black shrink-0' size={20} />}
            <h2 className='text-lg font-bold text-slate-900'>{title}</h2>
        </div>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>{label}</span>
        <span className='text-sm text-slate-800 font-medium whitespace-pre-wrap wrap-break-word'>{value || '—'}</span>
    </div>
)

const ViewStudentFullDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const a = getStudentFullProfileById(id)

    const [hostelEnrolment, setHostelEnrolment] = useState(null)
    const [academicDossier, setAcademicDossier] = useState(null)

    useEffect(() => {
        if (!id) return

        // 1. Fetch live hostel enrolment
        const fetchHostel = async () => {
            try {
                // Try with direct ID, or mapped short ID (e.g. STU-001)
                let res = await hostelService.getEnrolmentByStudentId(id)
                if (!res?.data) {
                    const fallbackId = id === 'STU-2024-1042' ? 'STU-001' : id === 'STU-2024-1087' ? 'STU-002' : id === 'STU-2024-1156' ? 'STU-003' : id
                    res = await hostelService.getEnrolmentByStudentId(fallbackId)
                }
                if (res?.success && res.data) {
                    setHostelEnrolment(res.data)
                }
            } catch (err) {
                console.warn('Could not load hostel enrolment for student dossier:', err)
            }
        }

        // 2. Fetch academic dossier & report data
        const fetchAcademic = async () => {
            try {
                const res = await academicService.getStudentDossier(id)
                if (res?.success && res.data) {
                    setAcademicDossier(res.data)
                }
            } catch (err) {
                console.warn('Could not load academic dossier:', err)
            }
        }

        fetchHostel()
        fetchAcademic()
    }, [id])

    if (!a) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/teacher/user-management/students-list')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Student record not found or could not be loaded.
                </div>
            </section>
        )
    }

    const addr = a.address
    const contact = a.contact
    const transport = a.transport
    const parent = a.parent
    const parentAddr = parent.address
    const parentContact = parent.contact

    const displayName = [a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ')

    // Default scholastic performance breakdown
    const scholasticResults = [
        { subject: 'English Communicative', code: '101', theory: 74, practical: 18, total: 92, max: 100, pct: 92, grade: 'A+', points: 10, pass: true, faculty: 'Ms. Sunita Roy' },
        { subject: 'Mathematics Standard', code: '041', theory: 76, practical: 19, total: 95, max: 100, pct: 95, grade: 'A+', points: 10, pass: true, faculty: 'Mr. Arvind Swamy' },
        { subject: 'Science & Technology', code: '086', theory: 71, practical: 18, total: 89, max: 100, pct: 89, grade: 'A', points: 9, pass: true, faculty: 'Dr. Meenakshi' },
        { subject: 'Social Science', code: '087', theory: 68, practical: 17, total: 85, max: 100, pct: 85, grade: 'A', points: 9, pass: true, faculty: 'Mrs. Jayashree' },
        { subject: 'Hindi Course A', code: '002', theory: 72, practical: 18, total: 90, max: 100, pct: 90, grade: 'A+', points: 10, pass: true, faculty: 'Mr. Rajeshwar' },
        { subject: 'Computer Applications', code: '165', theory: 40, practical: 50, total: 90, max: 100, pct: 90, grade: 'A+', points: 10, pass: true, faculty: 'Mr. Karthik' },
    ]

    const grandTotal = scholasticResults.reduce((sum, s) => sum + s.total, 0)
    const grandMax = scholasticResults.reduce((sum, s) => sum + s.max, 0)
    const overallPct = ((grandTotal / grandMax) * 100).toFixed(1)
    const gpa = (scholasticResults.reduce((sum, s) => sum + s.points, 0) / scholasticResults.length).toFixed(2)

    return (
        <section className='space-y-6 max-w-6xl mx-auto'>
            {/* Top Action Bar (hidden when printing) */}
            <div className='flex flex-wrap items-center justify-between gap-3 print:hidden'>
                <button
                    type='button'
                    onClick={() => navigate(`/teacher/user-management/students-list/view/${id}`)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-lg px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer font-medium'
                >
                    <ArrowLeft size={18} />
                    Back to student profile
                </button>
                <div className='flex items-center gap-3'>
                    <button
                        type='button'
                        onClick={() => window.print()}
                        className='inline-flex items-center gap-2 text-sm bg-[#515DEF] text-white rounded-lg px-5 py-2.5 hover:bg-indigo-700 transition-colors font-semibold shadow-sm cursor-pointer'
                    >
                        <Printer size={18} />
                        Print Student Dossier / Export PDF
                    </button>
                </div>
            </div>

            {/* Print Only Institutional Banner */}
            <div className='hidden print:block border-b-2 border-slate-900 pb-4 mb-4 text-center'>
                <h1 className='text-xl font-bold uppercase tracking-wider text-slate-900'>
                    Queens Matriculation & Higher Secondary School
                </h1>
                <p className='text-xs text-slate-600 mt-0.5'>
                    Affiliated to CBSE, New Delhi • Institutional Code: QMIS-600028 • Academic Year 2025-2026
                </p>
                <p className='text-sm font-semibold uppercase tracking-wide text-indigo-900 mt-2 bg-slate-100 py-1 rounded'>
                    Comprehensive Student Academic & Administrative Dossier
                </p>
            </div>

            {/* Profile Overview Card */}
            <div className='bg-white rounded-2xl shadow-md p-6 border border-slate-100 print:shadow-none print:border-slate-300'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6'>
                    <div className='flex items-center gap-5'>
                        <img
                            src={a.profileImage || mo_user}
                            alt=''
                            className='w-24 h-24 rounded-full object-cover ring-4 ring-indigo-50 print:ring-0 print:w-20 print:h-20'
                        />
                        <div>
                            <div className='flex items-center gap-2.5'>
                                <h1 className='text-2xl font-bold text-slate-900'>{displayName}</h1>
                                <span className='px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#515DEF] text-white print:bg-slate-200 print:text-black'>
                                    {a.class} - {a.classSection}
                                </span>
                            </div>
                            <p className='text-sm text-slate-600 mt-1.5'>
                                <span className='font-semibold text-slate-900'>Admission No:</span> {a.admissionNumber}
                                {' · '}
                                <span className='font-semibold text-slate-900'>Roll No:</span> {a.rollNumber}
                                {' · '}
                                <span className='font-semibold text-slate-900'>Academic Standing:</span> {academicDossier?.scholasticRank ? `Rank ${academicDossier.scholasticRank}` : 'Distinction (A+)'}
                            </p>
                            <div className='flex flex-wrap gap-2 mt-2.5'>
                                <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                                    <CheckCircle2 size={13} /> Status: {a.status}
                                </span>
                                {hostelEnrolment ? (
                                    <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200'>
                                        <Bed size={13} /> Hostel Resident ({hostelEnrolment.hostelBlockName || 'Block A'})
                                    </span>
                                ) : (
                                    <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200'>
                                        <Bus size={13} /> Day Scholar
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className='p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1 text-right sm:min-w-[200px] print:bg-white print:border-slate-300'>
                        <span className='text-xs font-bold uppercase tracking-wider text-slate-500'>Cumulative Attendance</span>
                        <span className='text-2xl font-extrabold text-emerald-600'>95.1%</span>
                        <span className='text-xs text-slate-500'>135 / 142 Sessions Present</span>
                    </div>
                </div>
            </div>

            {/* Attendance History Section */}
            <Section title='Attendance History & Verification' icon={Clock}>
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
                    <div className='p-3.5 bg-slate-50 rounded-xl border border-slate-100 print:bg-white'>
                        <span className='text-xs font-semibold text-slate-500 uppercase block'>Total Working Days</span>
                        <span className='text-lg font-bold text-slate-900 mt-1 block'>142 Days</span>
                    </div>
                    <div className='p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 print:bg-white'>
                        <span className='text-xs font-semibold text-emerald-700 uppercase block'>Days Present</span>
                        <span className='text-lg font-bold text-emerald-800 mt-1 block'>135 Days (95.1%)</span>
                    </div>
                    <div className='p-3.5 bg-amber-50/60 rounded-xl border border-amber-100 print:bg-white'>
                        <span className='text-xs font-semibold text-amber-700 uppercase block'>Approved Leaves</span>
                        <span className='text-lg font-bold text-amber-800 mt-1 block'>4 Days</span>
                    </div>
                    <div className='p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 print:bg-white'>
                        <span className='text-xs font-semibold text-rose-700 uppercase block'>Unexcused Absences</span>
                        <span className='text-lg font-bold text-rose-800 mt-1 block'>3 Days</span>
                    </div>
                </div>

                <h3 className='text-sm font-bold text-slate-800 uppercase tracking-wider mb-3'>Recent Biometric / Class Register Logs</h3>
                <div className='overflow-x-auto border border-slate-200 rounded-xl print:border-slate-300'>
                    <table className='w-full text-left text-sm'>
                        <thead className='bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-200'>
                            <tr>
                                <th className='px-4 py-2.5'>Date</th>
                                <th className='px-4 py-2.5'>Day</th>
                                <th className='px-4 py-2.5'>Check-In</th>
                                <th className='px-4 py-2.5'>Check-Out</th>
                                <th className='px-4 py-2.5'>Status</th>
                                <th className='px-4 py-2.5'>Class Period / Remarks</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {ATTENDANCE_RECORDS.map((log, idx) => (
                                <tr key={idx} className='hover:bg-slate-50/50'>
                                    <td className='px-4 py-2.5 font-medium text-slate-900'>{log.date}</td>
                                    <td className='px-4 py-2.5 text-slate-600'>{log.day}</td>
                                    <td className='px-4 py-2.5 text-slate-600 font-mono text-xs'>{log.checkIn}</td>
                                    <td className='px-4 py-2.5 text-slate-600 font-mono text-xs'>{log.checkOut}</td>
                                    <td className='px-4 py-2.5'>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${attendanceBadgeColor[log.status] || 'bg-slate-100 text-slate-700'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className='px-4 py-2.5 text-slate-600 text-xs'>{log.remarks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            {/* Academic Examination Marks & Results Section */}
            <Section title='Academic Examination Marks & Results (CBSE Assessment)' icon={GraduationCap}>
                <div className='flex flex-wrap items-center justify-between gap-4 p-4 mb-5 rounded-xl bg-indigo-50/60 border border-indigo-100 print:bg-white print:border-slate-300'>
                    <div>
                        <span className='text-xs font-bold text-indigo-900 uppercase block'>Summative Assessment Evaluation</span>
                        <span className='text-sm font-medium text-indigo-800'>Academic Session: 2025-2026 • Term 2 Comprehensive Evaluation</span>
                    </div>
                    <div className='flex items-center gap-4 text-right'>
                        <div>
                            <span className='text-xs text-slate-500 block uppercase'>Grand Total</span>
                            <span className='text-lg font-bold text-slate-900'>{grandTotal} / {grandMax} ({overallPct}%)</span>
                        </div>
                        <div className='pl-4 border-l border-indigo-200'>
                            <span className='text-xs text-slate-500 block uppercase'>Overall Grade</span>
                            <span className='text-lg font-bold text-emerald-700'>A+ (Distinction)</span>
                        </div>
                    </div>
                </div>

                <div className='overflow-x-auto border border-slate-200 rounded-xl print:border-slate-300 mb-4'>
                    <table className='w-full text-left text-sm'>
                        <thead className='bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-200'>
                            <tr>
                                <th className='px-4 py-2.5'>Subject Name</th>
                                <th className='px-4 py-2.5'>Code</th>
                                <th className='px-4 py-2.5 text-center'>Theory (80)</th>
                                <th className='px-4 py-2.5 text-center'>IA/Practical (20)</th>
                                <th className='px-4 py-2.5 text-center'>Total Marks</th>
                                <th className='px-4 py-2.5 text-center'>Grade</th>
                                <th className='px-4 py-2.5 text-center'>Grade Point</th>
                                <th className='px-4 py-2.5'>Faculty</th>
                                <th className='px-4 py-2.5 text-center'>Result</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {scholasticResults.map((sub, idx) => (
                                <tr key={idx} className='hover:bg-slate-50/50'>
                                    <td className='px-4 py-2.5 font-medium text-slate-900'>{sub.subject}</td>
                                    <td className='px-4 py-2.5 font-mono text-xs text-slate-500'>{sub.code}</td>
                                    <td className='px-4 py-2.5 text-center text-slate-700'>{sub.theory}</td>
                                    <td className='px-4 py-2.5 text-center text-slate-700'>{sub.practical}</td>
                                    <td className='px-4 py-2.5 text-center font-bold text-slate-900'>{sub.total} / {sub.max}</td>
                                    <td className='px-4 py-2.5 text-center'>
                                        <span className='px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200'>
                                            {sub.grade}
                                        </span>
                                    </td>
                                    <td className='px-4 py-2.5 text-center font-bold text-slate-800'>{sub.points}</td>
                                    <td className='px-4 py-2.5 text-slate-600 text-xs'>{sub.faculty}</td>
                                    <td className='px-4 py-2.5 text-center'>
                                        <span className='px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700'>
                                            Pass
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className='bg-slate-50 font-semibold text-xs border-t border-slate-200 text-slate-900'>
                            <tr>
                                <td colSpan={4} className='px-4 py-2.5 text-right font-bold'>Aggregate Marks & Percentage:</td>
                                <td className='px-4 py-2.5 text-center font-extrabold text-sm text-indigo-700'>{grandTotal} / {grandMax}</td>
                                <td className='px-4 py-2.5 text-center font-extrabold text-sm text-emerald-700'>A+</td>
                                <td className='px-4 py-2.5 text-center font-extrabold text-sm text-slate-900'>GPA {gpa}</td>
                                <td colSpan={2} className='px-4 py-2.5 text-center font-bold text-emerald-700 uppercase'>Result: PASS (FIRST CLASS)</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className='p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5'>
                    <Award className='text-amber-600 shrink-0 mt-0.5' size={18} />
                    <div>
                        <span className='font-bold uppercase tracking-wider block'>Class Teacher Academic Remark</span>
                        <p className='mt-0.5'>
                            Aarav maintains outstanding scholastic consistency across all curriculum stems. Demonstrates analytical maturity in Mathematics and Science, with active participation in class discussions and co-scholastic debates.
                        </p>
                    </div>
                </div>
            </Section>

            {/* Boarding / Hostel Resident Status Section */}
            <Section title='Boarding & Residential Accommodation Status' icon={Bed}>
                {hostelEnrolment ? (
                    <div className='space-y-4'>
                        <div className='p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 flex items-center justify-between'>
                            <div>
                                <span className='text-xs font-bold text-indigo-900 uppercase block'>Residential Classification</span>
                                <span className='text-base font-bold text-indigo-800'>Resident Scholar / Full Boarder</span>
                            </div>
                            <span className='px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white'>
                                Active Enrolment
                            </span>
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                            <Field label='Hostel Block' value={hostelEnrolment.hostelBlockName || 'Block A - Boys Senior Wing'} />
                            <Field label='Room Allocation' value={`Room ${hostelEnrolment.roomNumber || 'A-201'}`} />
                            <Field label='Bed Assigned' value={`Bed ${hostelEnrolment.bedNumber || 'B1'}`} />
                            <Field label='Check-in Date' value={hostelEnrolment.checkInDate || '19/12/2025'} />
                            <Field label='Hostel Warden' value='Mr. M. Kumar (+91 98401 23456)' />
                            <Field label='Annual Hostel Fee' value={`₹${Number(hostelEnrolment.annualHostelFee || 48000).toLocaleString('en-IN')}`} />
                            <Field label='Fee Integration' value='Synced to Central Fee Management (FH-HSTL)' />
                            <Field label='Emergency Contact' value='+91 98401 23456 (Warden Office)' />
                        </div>
                    </div>
                ) : (
                    <div className='p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between print:bg-white'>
                        <div>
                            <span className='text-xs font-bold text-slate-500 uppercase block'>Residential Classification</span>
                            <span className='text-base font-bold text-slate-800'>Day Scholar (Non-Boarding Student)</span>
                            <p className='text-xs text-slate-500 mt-1'>
                                Daily school commute serviced via School Bus Route {transport.routeList || 'Route 1'} at stop {transport.busStop || 'Main Gate'}.
                            </p>
                        </div>
                        <span className='px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700'>
                            Day Commuter
                        </span>
                    </div>
                )}
            </Section>

            {/* Admission Details */}
            <Section title='Admission & Institutional Enrollment' icon={FileText}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Admission date' value={a.admissionDate} />
                    <Field label='Class' value={a.class} />
                    <Field label='Class section' value={a.classSection} />
                    <Field label='Registration fees' value={a.registrationFees} />
                    <Field label='Batch year' value={a.batchYear} />
                    <Field label='Batch end year' value={a.batchEndYear} />
                    <Field label='Fees timeline' value={a.feesTimeline} />
                    <Field label='Status' value={a.status} />
                    <Field label='Student ID' value={a.studentId} />
                </div>
            </Section>

            {/* Student Personal Information */}
            <Section title='Student Demographic & Medical Profile' icon={UserCheck}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='First name' value={a.firstName} />
                    <Field label='Middle name' value={a.middleName} />
                    <Field label='Last name' value={a.lastName} />
                    <Field label='Gender' value={a.gender} />
                    <Field label='Religion' value={a.religion} />
                    <Field label='Caste' value={a.caste} />
                    <Field label='Date of birth' value={a.dateOfBirth} />
                    <Field label='Blood group' value={a.bloodGroup} />
                    <Field label='Height' value={a.height} />
                    <Field label='Weight' value={a.weight} />
                    <div className='lg:col-span-3'>
                        <Field label='Medical history' value={a.medicalHistory} />
                    </div>
                    <div className='lg:col-span-3'>
                        <Field label='Previous school' value={a.previousSchool} />
                    </div>
                </div>
            </Section>

            {/* Transport Details */}
            <Section title='Transport & Commute Allocation' icon={Bus}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Assigned Route' value={transport.routeList} />
                    <Field label='Designated Bus Stop' value={transport.busStop} />
                    <Field label='Transport Fee Schedule' value='₹2,400 / Term' />
                </div>
            </Section>

            {/* Parent & Guardian Information */}
            <Section title='Parent & Guardian Context' icon={UserCheck}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Father name' value={parent.fatherName} />
                    <Field label='Mother name' value={parent.motherName} />
                    <Field label='Father occupation' value={parent.fatherOccupation} />
                    <Field label='Mother occupation' value={parent.motherOccupation} />
                    <Field label='Father yearly income' value={parent.fatherYearlyIncome} />
                    <Field label='Mother yearly income' value={parent.motherYearlyIncome} />
                    <Field label='Siblings' value={parent.siblings} />
                </div>
            </Section>

            {/* Addresses and Contact */}
            <Section title='Residential & Contact Coordinates' icon={FileText}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-3'>
                        <Field label='Student Residential Address' value={addr.address} />
                    </div>
                    <Field label='Country' value={addr.country} />
                    <Field label='State' value={addr.state} />
                    <Field label='City' value={addr.city} />
                    <Field label='Mobile number' value={contact.mobileNumber} />
                    <Field label='Alternative number' value={contact.alternativeNumber} />
                    <Field label='Email' value={contact.email} />
                </div>
            </Section>

            {/* Print Signature Footer */}
            <div className='hidden print:grid grid-cols-3 gap-8 mt-12 pt-8 border-t-2 border-slate-400 text-center text-xs'>
                <div>
                    <div className='h-12'></div>
                    <div className='border-t border-slate-900 pt-1 font-bold'>Class Teacher Signature</div>
                    <div className='text-slate-500'>Verified & Recorded</div>
                </div>
                <div>
                    <div className='h-12'></div>
                    <div className='border-t border-slate-900 pt-1 font-bold'>Academic Coordinator</div>
                    <div className='text-slate-500'>Dean of Academics</div>
                </div>
                <div>
                    <div className='h-12'></div>
                    <div className='border-t border-slate-900 pt-1 font-bold'>Principal / Head of Institution</div>
                    <div className='text-slate-500'>Seal & Affiliation Stamp</div>
                </div>
            </div>
        </section>
    )
}

export default ViewStudentFullDetails
