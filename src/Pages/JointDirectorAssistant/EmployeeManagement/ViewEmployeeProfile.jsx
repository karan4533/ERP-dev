import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
    Briefcase,
    ClipboardList,
    GraduationCap,
    KeyRound,
    FileText,
    CalendarCheck,
    User,
    UtensilsCrossed,
    ShoppingCart,
    Monitor,
    Bus,
    Sparkles,
} from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import {
    EMPLOYEE_PROFILES,
    attendanceBadgeColor,
    taskStatusBadgeColor,
} from './employeeData'

const ROLE_ICONS = {
    'canteen-manager': UtensilsCrossed,
    'store-manager': ShoppingCart,
    'it-team-manager': Monitor,
    'transport-manager': Bus,
    'housekeeping-manager': Sparkles,
}

const ModernSection = ({ title, icon: Icon, children }) => (
    <div className='bg-white rounded-2xl shadow-sm border border-[#EEF0F6] overflow-hidden'>
        <div className='flex items-center gap-3 px-6 py-4 border-b border-[#EEF0F6] bg-linear-to-r from-[#F8F9FF] to-white'>
            <div className='p-2.5 rounded-xl bg-[#515DEF]/10'>
                <Icon className='w-5 h-5 text-[#515DEF]' />
            </div>
            <h2 className='text-lg font-semibold text-[#0C1E5B]'>{title}</h2>
        </div>
        <div className='p-6'>{children}</div>
    </div>
)

const InfoCard = ({ label, value }) => (
    <div className='rounded-xl border border-[#E8ECF4] bg-[#FAFBFD] px-4 py-3.5 hover:border-[#515DEF]/25 transition-colors'>
        <span className='text-xs font-medium uppercase tracking-wide text-[#808080]'>{label}</span>
        <p className='text-sm font-medium text-[#1E1E1E] mt-1 whitespace-pre-wrap wrap-break-word'>{value}</p>
    </div>
)

const ViewEmployeeProfile = () => {
    const { roleKey } = useParams()
    const profile = EMPLOYEE_PROFILES[roleKey]

    if (!profile) {
        return <Navigate to="/joint-director-assistant/employee-management/canteen-manager" replace />
    }

    const { employee, roleTitle, profileLabel, attendanceRecords, recentTasks } = profile
    const HeaderIcon = ROLE_ICONS[roleKey] ?? Briefcase
    const addr = employee.address
    const contact = employee.contact
    const prof = employee.professionalInfo
    const emp = employee.employmentInfo
    const acct = employee.account
    const docs = employee.documents

    const displayName = [employee.firstName, employee.middleName, employee.lastName].join(' ')
    const presentDays = attendanceRecords.filter((r) => r.status === 'Present').length
    const attendanceRate = Math.round((presentDays / attendanceRecords.length) * 100)

    return (
        <section className='space-y-6'>
            <div className='relative overflow-hidden rounded-2xl shadow-md bg-linear-to-br from-[#515DEF] via-[#6366F1] to-[#7C3AED] p-6 sm:p-8'>
                <div className='absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3' />
                <div className='absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4' />
                <div className='relative flex flex-col sm:flex-row sm:items-center gap-6'>
                    <div className='relative shrink-0'>
                        <img
                            src={employee.profileImage || mo_user}
                            alt=''
                            className='w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg'
                        />
                        <div className='absolute -bottom-2 -right-2 p-2 rounded-xl bg-white shadow-md'>
                            <HeaderIcon className='w-5 h-5 text-[#515DEF]' />
                        </div>
                    </div>
                    <div className='flex-1 min-w-0'>
                        <p className='text-white/70 text-sm font-medium uppercase tracking-wider'>{profileLabel}</p>
                        <h1 className='text-2xl sm:text-3xl font-bold text-white mt-1'>{displayName}</h1>
                        <p className='text-white/80 text-sm mt-2'>
                            Employee ID: <span className='font-semibold text-white'>{employee.employeeId}</span>
                            {' · '}
                            User ID: {employee.userId}
                        </p>
                        <div className='flex flex-wrap gap-2 mt-4'>
                            <span className='px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-sm'>
                                {prof.designation}
                            </span>
                            <span className='px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-sm'>
                                {prof.yearsOfExperience} Experience
                            </span>
                            <span className='px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-sm'>
                                {emp.assignedCampus}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <ModernSection title='Personal information' icon={User}>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <InfoCard label='First name' value={employee.firstName} />
                    <InfoCard label='Middle name' value={employee.middleName} />
                    <InfoCard label='Last name' value={employee.lastName} />
                    <InfoCard label='Gender' value={employee.gender} />
                    <InfoCard label='Date of birth' value={employee.dateOfBirth} />
                    <InfoCard label='Blood group' value={employee.bloodGroup} />
                    <InfoCard label='Height' value={employee.height} />
                    <InfoCard label='Weight' value={employee.weight} />
                    <InfoCard label='Medical history' value={employee.medicalHistory} />
                    <div className='sm:col-span-2 lg:col-span-3'>
                        <InfoCard label='Street / full address' value={addr.address} />
                    </div>
                    <InfoCard label='Country' value={addr.country} />
                    <InfoCard label='State' value={addr.state} />
                    <InfoCard label='City' value={addr.city} />
                    <InfoCard label='Zip code' value={addr.zipCode} />
                    <InfoCard label='Mobile number' value={contact.mobileNumber} />
                    <InfoCard label='Alternative number' value={contact.alternativeNumber} />
                    <InfoCard label='Email' value={contact.email} />
                </div>
            </ModernSection>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <ModernSection title='Professional information' icon={GraduationCap}>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <InfoCard label='Qualification' value={prof.qualification} />
                        <InfoCard label='Designation' value={prof.designation} />
                        <InfoCard label='School name' value={prof.schoolName} />
                        <InfoCard label='Years of experience' value={prof.yearsOfExperience} />
                        <InfoCard label='Previous organization' value={prof.previousOrganization} />
                        <InfoCard label='Joining date' value={prof.joiningDate} />
                    </div>
                </ModernSection>

                <ModernSection title='Employment information' icon={Briefcase}>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <InfoCard label='Employee type' value={emp.employeeType} />
                        <InfoCard label='Salary' value={emp.salary} />
                        <InfoCard label='Work shift' value={emp.workShift} />
                        <InfoCard label='Assigned campus / area' value={emp.assignedCampus} />
                        <InfoCard label='Managed staff' value={emp.managedStaff} />
                        <InfoCard label='Reporting to' value={emp.reportingTo} />
                    </div>
                </ModernSection>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <ModernSection title='Account' icon={KeyRound}>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <InfoCard label='Username' value={acct.username} />
                        <InfoCard label='Password' value={acct.password} />
                    </div>
                </ModernSection>

                <ModernSection title='Documents' icon={FileText}>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <InfoCard label='ID proof' value={docs.idProof} />
                        <InfoCard label='Qualification certificate' value={docs.qualificationCertificate} />
                        <InfoCard label='Experience certificate' value={docs.experienceCertificate} />
                    </div>
                </ModernSection>
            </div>

            <div className='bg-white rounded-2xl shadow-sm border border-[#EEF0F6] overflow-hidden'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-[#EEF0F6] bg-linear-to-r from-[#F8F9FF] to-white'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2.5 rounded-xl bg-[#515DEF]/10'>
                            <CalendarCheck className='w-5 h-5 text-[#515DEF]' />
                        </div>
                        <div>
                            <h2 className='text-lg font-semibold text-[#0C1E5B]'>Attendance Record</h2>
                            <p className='text-sm text-[#808080]'>Recent attendance history for {roleTitle}</p>
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
                            <p className='text-lg font-bold text-[#0C1E5B]'>{attendanceRecords.length}</p>
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
                                {attendanceRecords.map((record) => (
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

            <div className='bg-white rounded-2xl shadow-sm border border-[#EEF0F6] overflow-hidden'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-[#EEF0F6] bg-linear-to-r from-[#F8F9FF] to-white'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2.5 rounded-xl bg-[#515DEF]/10'>
                            <ClipboardList className='w-5 h-5 text-[#515DEF]' />
                        </div>
                        <div>
                            <h2 className='text-lg font-semibold text-[#0C1E5B]'>Recent Tasks</h2>
                            <p className='text-sm text-[#808080]'>Latest tasks assigned to {roleTitle}</p>
                        </div>
                    </div>
                    <div className='rounded-xl border border-[#E8ECF4] bg-[#FAFBFD] px-4 py-2 text-center min-w-[100px]'>
                        <p className='text-xs text-[#808080] uppercase tracking-wide'>Active</p>
                        <p className='text-lg font-bold text-[#515DEF]'>{recentTasks.length}</p>
                    </div>
                </div>

                <div className='p-6'>
                    <div className='relative overflow-x-auto rounded-xl border border-[#EEF0F6]'>
                        <table className='w-full text-sm text-left rtl:text-right'>
                            <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                                <tr>
                                    <th className='px-4 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Task ID</th>
                                    <th className='px-4 py-3.5 text-[#0C1E5B] font-medium uppercase'>Title</th>
                                    <th className='px-4 py-3.5 text-[#0C1E5B] font-medium uppercase'>Assigned Date</th>
                                    <th className='px-4 py-3.5 text-[#0C1E5B] font-medium uppercase'>Due Date</th>
                                    <th className='px-4 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTasks.map((task) => (
                                    <tr
                                        key={task.taskId}
                                        className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#FAFBFD] transition-colors'
                                    >
                                        <td className='px-4 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{task.taskId}</td>
                                        <td className='px-4 py-4 max-w-[280px]'>{task.title}</td>
                                        <td className='px-4 py-4'>{task.assignedDate}</td>
                                        <td className='px-4 py-4'>{task.dueDate}</td>
                                        <td className='px-4 py-4 rounded-e-lg'>
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${taskStatusBadgeColor[task.status]}`}>
                                                {task.status}
                                            </span>
                                        </td>
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

export default ViewEmployeeProfile
