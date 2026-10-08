import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import mo_user from '../../../../assets/images/no-profile.png'

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

const ViewEmployeeDetails = ({ listPath, idLabel, employee, roleTitle }) => {
    const navigate = useNavigate()
    const addr = employee.address
    const contact = employee.contact
    const prof = employee.professionalInfo
    const emp = employee.employmentInfo

    const displayName = [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(' ')

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate(listPath)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                    <img
                        src={employee.profileImage || mo_user}
                        alt=''
                        className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100'
                    />
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{displayName}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            <span className='font-medium text-[#1E1E1E]'>{idLabel}: {employee.employeeId}</span>
                            {' · '}
                            <span className='text-[#808080]'>{roleTitle}</span>
                        </p>
                    </div>
                </div>
            </div>

            <Section title='Personal information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='First name' value={employee.firstName} />
                    <Field label='Middle name' value={employee.middleName} />
                    <Field label='Last name' value={employee.lastName} />
                    <Field label='Gender' value={employee.gender} />
                    <Field label='Date of birth' value={employee.dateOfBirth} />
                    <Field label='Blood group' value={employee.bloodGroup} />
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
                    {emp.assignedArea && <Field label='Assigned area' value={emp.assignedArea} />}
                    {emp.reportingTo && <Field label='Reporting to' value={emp.reportingTo} />}
                </div>
            </Section>
        </section>
    )
}

export default ViewEmployeeDetails
