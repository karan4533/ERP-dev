import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarCheck } from 'lucide-react'
import mo_user from '../../../../assets/images/no-profile.png'

const MOCK_COORDINATOR = {
    profileImage: null,
    coordinatorId: 'COO-1001',
    userId: 'USR-200101',
    firstName: 'Sandy',
    middleName: 'K.',
    lastName: 'Selva',
    gender: 'Male',
    dateOfBirth: '20-12-1996',
    bloodGroup: 'B+',
    height: '175 cm',
    weight: '72 kg',
    medicalHistory: 'No chronic conditions reported.',
    address: {
        address: '12, Anna Nagar, Main Road',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Pudukkottai',
        zipCode: '622001',
    },
    contact: {
        mobileNumber: '+91 99440 76993',
        alternativeNumber: '+91 98765 43210',
        email: 'san@gmail.com',
    },
    professionalInfo: {
        qualification: 'B.Sc., B.Ed.',
        designation: 'Senior Co-ordinator',
        department: 'Academic Co-ordination',
        yearsOfExperience: '8 Years',
        previousOrganization: 'St. Joseph Higher Secondary School, Pudukkottai',
        joiningDate: '2017-06-15',
    },
    employmentInfo: {
        employeeType: 'Full-time',
        salary: '₹52,000 / month',
        workShift: 'Morning (8:00 AM – 4:00 PM)',
        assignedCampus: 'Main Campus',
        managedDepartments: 'Science, Mathematics',
        reportingTo: 'Director',
    },
    account: {
        username: 'sandy.selva',
        password: 'Coordinator@123',
    },
    documents: {
        idProof: 'Aadhaar Card',
        qualificationCertificate: 'B.Sc. & B.Ed. Certificates',
        experienceCertificate: 'Experience Letter – St. Joseph School',
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
    { date: '03-03-2026', day: 'Monday', checkIn: '07:50 AM', checkOut: '04:05 PM', status: 'Present', remarks: 'Coordinated Class 9 & 10 science faculty meeting' },
    { date: '04-03-2026', day: 'Tuesday', checkIn: '07:55 AM', checkOut: '04:00 PM', status: 'Present', remarks: 'Reviewed mid-term exam schedules for Science dept.' },
    { date: '05-03-2026', day: 'Wednesday', checkIn: '—', checkOut: '—', status: 'Leave', remarks: 'Casual leave — personal work, approved by Director' },
    { date: '06-03-2026', day: 'Thursday', checkIn: '08:15 AM', checkOut: '04:10 PM', status: 'Present', remarks: 'Late due to inter-department briefing session' },
    { date: '07-03-2026', day: 'Friday', checkIn: '07:48 AM', checkOut: '01:30 PM', status: 'Half Day', remarks: 'District education office visit for curriculum update' },
    { date: '10-03-2026', day: 'Monday', checkIn: '07:52 AM', checkOut: '04:00 PM', status: 'Present', remarks: 'Supervised annual day event preparations' },
    { date: '11-03-2026', day: 'Tuesday', checkIn: '—', checkOut: '—', status: 'Absent', remarks: 'Absent without prior leave application' },
]

const attendanceBadgeColor = {
    Present: 'bg-[#4CAF5033] text-[#4CAF50]',
    Absent: 'bg-[#FF000033] text-[#FF0000]',
    Leave: 'bg-[#FF980033] text-[#FF9800]',
    'Half Day': 'bg-[#2196F333] text-[#2196F3]',
}

const ViewCoordinator = () => {

    const navigate = useNavigate()
    const coordinator = MOCK_COORDINATOR
    const addr = coordinator.address
    const contact = coordinator.contact
    const prof = coordinator.professionalInfo
    const emp = coordinator.employmentInfo
    const acct = coordinator.account
    const docs = coordinator.documents

    const displayName = [coordinator.firstName, coordinator.middleName, coordinator.lastName].join(' ')
    const presentDays = ATTENDANCE_RECORDS.filter((r) => r.status === 'Present').length
    const attendanceRate = Math.round((presentDays / ATTENDANCE_RECORDS.length) * 100)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/principal/employees-management/coordinators')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                    <img
                        src={coordinator.profileImage || mo_user}
                        alt=''
                        className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100'
                    />
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{displayName}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            <span className='font-medium text-[#1E1E1E]'>
                                Co-ordinator ID: {coordinator.coordinatorId}
                            </span>
                            {' · '}
                            <span className='text-[#808080]'>User ID: {coordinator.userId}</span>
                        </p>
                    </div>
                </div>
            </div>

            <Section title='Personal information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='First name' value={coordinator.firstName} />
                    <Field label='Middle name' value={coordinator.middleName} />
                    <Field label='Last name' value={coordinator.lastName} />
                    <Field label='Gender' value={coordinator.gender} />
                    <Field label='Date of birth' value={coordinator.dateOfBirth} />
                    <Field label='Blood group' value={coordinator.bloodGroup} />
                    <Field label='Height' value={coordinator.height} />
                    <Field label='Weight' value={coordinator.weight} />
                    <Field label='Medical history' value={coordinator.medicalHistory} />
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
                    <Field label='Designation' value={prof.designation} />
                    <Field label='Department' value={prof.department} />
                    <Field label='Years of experience' value={prof.yearsOfExperience} />
                    <Field label='Previous organization' value={prof.previousOrganization} />
                    <Field label='Joining date' value={prof.joiningDate} />
                </div>
            </Section>

            <Section title='Employment information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Employee type' value={emp.employeeType} />
                    <Field label='Salary' value={emp.salary} />
                    <Field label='Work shift' value={emp.workShift} />
                    <Field label='Assigned campus' value={emp.assignedCampus} />
                    <Field label='Managed departments' value={emp.managedDepartments} />
                    <Field label='Reporting to' value={emp.reportingTo} />
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

export default ViewCoordinator
