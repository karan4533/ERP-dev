import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarCheck } from 'lucide-react'
import mo_user from '../../../../assets/images/no-profile.png'

const MOCK_TEACHER = {
    profileImage: null,
    staffId: 'STF-2024-0156',
    userId: 'USR-100156',
    firstName: 'Anita',
    middleName: 'R.',
    lastName: 'Verma',
    gender: 'Female',
    dateOfBirth: '1988-07-14',
    bloodGroup: 'O+',
    height: '162 cm',
    weight: '58 kg',
    medicalHistory: 'No chronic conditions reported.',
    address: {
        address: '18, Model Town, Block C',
        country: 'India',
        state: 'Haryana',
        city: 'Gurgaon',
        zipCode: '122002',
    },
    contact: {
        mobileNumber: '+91 91234 56789',
        alternativeNumber: '+91 91234 56780',
        email: 'anita.verma@example.com',
    },
    professionalInfo: {
        qualification: 'M.Sc. Mathematics, B.Ed.',
        subject: 'Mathematics',
        yearsOfExperience: '8 years',
        previousSchool: 'Ryan International School, Sector 40',
        joiningDate: '2019-04-01',
    },
    employmentInfo: {
        employeeType: 'Full-time',
        salary: '₹45,000 / month',
        workShift: 'Morning (8:00 AM – 2:00 PM)',
        assignedClass: 'Class 9, Class 10',
        assignedSubjects: 'Mathematics, Statistics',
    },
    account: {
        username: 'anita.verma',
        password: 'Teacher@123',
    },
    documents: {
        idProof: 'Aadhaar Card',
        qualificationCertificate: 'M.Sc. Mathematics Certificate',
        experienceCertificate: 'Experience Letter – Ryan International',
    },
}

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value}</span>
    </div>
)

const ATTENDANCE_RECORDS = [
    { date: '03-03-2026', day: 'Monday', checkIn: '07:52 AM', checkOut: '02:05 PM', status: 'Present', remarks: 'Class 9 & 10 mathematics periods completed' },
    { date: '04-03-2026', day: 'Tuesday', checkIn: '07:48 AM', checkOut: '02:00 PM', status: 'Present', remarks: 'Conducted unit test evaluation' },
    { date: '05-03-2026', day: 'Wednesday', checkIn: '—', checkOut: '—', status: 'Leave', remarks: 'Medical leave — fever and rest advised' },
    { date: '06-03-2026', day: 'Thursday', checkIn: '08:12 AM', checkOut: '02:10 PM', status: 'Present', remarks: 'Arrived late due to morning traffic' },
    { date: '07-03-2026', day: 'Friday', checkIn: '07:50 AM', checkOut: '12:30 PM', status: 'Half Day', remarks: 'Left early for CBSE teacher training workshop' },
    { date: '10-03-2026', day: 'Monday', checkIn: '07:55 AM', checkOut: '02:00 PM', status: 'Present', remarks: 'Parent-teacher meeting duty completed' },
    { date: '11-03-2026', day: 'Tuesday', checkIn: '—', checkOut: '—', status: 'Absent', remarks: 'Absent without prior leave application' },
]

const attendanceBadgeColor = {
    Present: 'bg-[#4CAF5033] text-[#4CAF50]',
    Absent: 'bg-[#FF000033] text-[#FF0000]',
    Leave: 'bg-[#FF980033] text-[#FF9800]',
    'Half Day': 'bg-[#2196F333] text-[#2196F3]',
}

const ViewTeacher = () => {
    const navigate = useNavigate()
    const t = MOCK_TEACHER
    const addr = t.address
    const contact = t.contact
    const prof = t.professionalInfo
    const emp = t.employmentInfo
    const acct = t.account
    const docs = t.documents

    const displayName = [t.firstName, t.middleName, t.lastName].join(' ')
    const presentDays = ATTENDANCE_RECORDS.filter((record) => record.status === 'Present').length
    const attendanceRate = Math.round((presentDays / ATTENDANCE_RECORDS.length) * 100)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/principal/employees-management/teachers')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                    <img
                        src={t.profileImage || mo_user}
                        alt=''
                        className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100'
                    />
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{displayName}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            <span className='font-medium text-[#1E1E1E]'>
                                Staff ID: {t.staffId}
                            </span>
                            {' · '}
                            <span className='text-[#808080]'>User ID: {t.userId}</span>
                        </p>
                    </div>
                </div>
            </div>

            <Section title='Personal information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='First name' value={t.firstName} />
                    <Field label='Middle name' value={t.middleName} />
                    <Field label='Last name' value={t.lastName} />
                    <Field label='Gender' value={t.gender} />
                    <Field label='Date of birth' value={t.dateOfBirth} />
                    <Field label='Blood group' value={t.bloodGroup} />
                    <Field label='Height' value={t.height} />
                    <Field label='Weight' value={t.weight} />
                    <Field label='Medical history' value={t.medicalHistory} />
                    <div className='lg:col-span-3'>
                        <Field label='Street / full address' value={addr.address} />
                    </div>
                    <Field label='Country' value={addr.country} />
                    <Field label='State' value={addr.state} />
                    <Field label='City' value={addr.city} />
                    <Field label='Zip code' value={addr.zipCode} />
                    <Field label='Mobile number' value={contact.mobileNumber} />
                    <Field label='Alternative number' value={contact.alternativeNumber} />
                    <Field label='Email' value={contact.email} />
                </div>
            </Section>

            <Section title='Professional information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Qualification' value={prof.qualification} />
                    <Field label='Subject' value={prof.subject} />
                    <Field label='Years of experience' value={prof.yearsOfExperience} />
                    <Field label='Previous school' value={prof.previousSchool} />
                    <Field label='Joining date' value={prof.joiningDate} />
                </div>
            </Section>

            <Section title='Employment information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Employee type' value={emp.employeeType} />
                    <Field label='Salary' value={emp.salary} />
                    <Field label='Work shift' value={emp.workShift} />
                    <Field label='Assigned class' value={emp.assignedClass} />
                    <Field label='Assigned subjects' value={emp.assignedSubjects} />
                </div>
            </Section>

            <Section title='Account'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Username' value={acct.username} />
                    <Field label='Password' value={acct.password} />
                </div>
            </Section>

            <Section title='Documents'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='ID proof' value={docs.idProof} />
                    <Field label='Qualification certificate' value={docs.qualificationCertificate} />
                    <Field label='Experience certificate' value={docs.experienceCertificate} />
                </div>
            </Section>

            <div className='bg-white rounded-2xl shadow-sm border border-[#EEF0F6] overflow-hidden'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-[#EEF0F6] bg-linear-to-r from-[#F8F9FF] to-white'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2.5 rounded-xl bg-[#515DEF]/10'>
                            <CalendarCheck className='w-5 h-5 text-[#515DEF]' />
                        </div>
                        <div>
                            <h2 className='text-lg font-semibold text-[#0C1E5B]'>Attendance Record</h2>
                            <p className='text-sm text-[#808080]'>Recent attendance history for this month</p>
                        </div>
                    </div>
                    <div className='flex flex-wrap gap-3'>
                        <div className='rounded-xl border border-[#E8ECF4] bg-[#FAFBFD] px-4 py-2 text-center min-w-[100px]'>
                            <p className='text-xs text-[#808080] uppercase tracking-wide'>Present</p>
                            <p className='text-lg font-bold text-[#4CAF50]'>{presentDays}</p>
                        </div>
                        <div className='rounded-xl border border-[#E8ECF4] bg-[#FAFBFD] px-4 py-2 text-center min-w-[100px]'>
                            <p className='text-xs text-[#808080] uppercase tracking-wide'>Rate</p>
                            <p className='text-lg font-bold text-[#515DEF]'>{attendanceRate}%</p>
                        </div>
                        <div className='rounded-xl border border-[#E8ECF4] bg-[#FAFBFD] px-4 py-2 text-center min-w-[100px]'>
                            <p className='text-xs text-[#808080] uppercase tracking-wide'>Total Days</p>
                            <p className='text-lg font-bold text-[#0C1E5B]'>{ATTENDANCE_RECORDS.length}</p>
                        </div>
                    </div>
                </div>

                <div className='p-6'>
                    <div className='relative overflow-x-auto rounded-xl border border-[#EEF0F6]'>
                        <table className='w-full text-sm text-left rtl:text-right'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                                <tr>
                                    <th className='px-4 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Date</th>
                                    <th className='px-4 py-3.5 text-[#0C1E5B] font-medium uppercase'>Day</th>
                                    <th className='px-4 py-3.5 text-[#0C1E5B] font-medium uppercase'>Check In</th>
                                    <th className='px-4 py-3.5 text-[#0C1E5B] font-medium uppercase'>Check Out</th>
                                    <th className='px-4 py-3.5 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                    <th className='px-4 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ATTENDANCE_RECORDS.map((record) => (
                                    <tr
                                        key={record.date}
                                        className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#FAFBFD] transition-colors'
                                    >
                                        <td className='px-4 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{record.date}</td>
                                        <td className='px-4 py-4'>{record.day}</td>
                                        <td className='px-4 py-4'>{record.checkIn}</td>
                                        <td className='px-4 py-4'>{record.checkOut}</td>
                                        <td className='px-4 py-4'>
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${attendanceBadgeColor[record.status]}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className='px-4 py-4 rounded-e-lg'>{record.remarks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </section>
    )
}

export default ViewTeacher
