import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import mo_user from '../../../../assets/images/no-profile.png'
import { ROUTE_BASE, getEmployeeById } from './employeeDatabaseData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value || '—'}</span>
    </div>
)

const ViewEmployee = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const employee = getEmployeeById(id)

    if (!employee) {
        return (
            <section className='space-y-6'>
                <button type='button' onClick={() => navigate(ROUTE_BASE)} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Employee not found.</div>
            </section>
        )
    }

    const displayName = [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(' ')

    return (
        <section className='space-y-6'>
            <button type='button' onClick={() => navigate(ROUTE_BASE)} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                    <img src={employee.profileImage || mo_user} alt='' className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100' />
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{employee.name}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            <span className='font-medium text-[#1E1E1E]'>Employee ID: {employee.employeeId}</span>
                            {' · '}
                            <span className='text-[#808080]'>Department: {employee.department}</span>
                            {' · '}
                            <span className='text-[#808080]'>Role: {employee.role}</span>
                        </p>
                    </div>
                </div>
            </div>

            <Section title='Personal information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Name' value={displayName} />
                    <Field label='Employee ID' value={employee.employeeId} />
                    <Field label='Department' value={employee.department} />
                    <Field label='Role' value={employee.role} />
                    <Field label='Gender' value={employee.gender} />
                    <Field label='Date of birth' value={employee.dateOfBirth} />
                    <Field label='Blood group' value={employee.bloodGroup} />
                    <Field label='Height' value={employee.height} />
                    <Field label='Weight' value={employee.weight} />
                    <Field label='Medical history' value={employee.medicalHistory} />
                    <div className='lg:col-span-3'><Field label='Street / full address' value={employee.address.address} /></div>
                    <Field label='Country' value={employee.address.country} />
                    <Field label='State' value={employee.address.state} />
                    <Field label='City' value={employee.address.city} />
                    <Field label='Zip code' value={employee.address.zipCode} />
                    <Field label='Mobile number' value={employee.contact.mobileNumber} />
                    <Field label='Alternative number' value={employee.contact.alternativeNumber} />
                    <Field label='Email' value={employee.contact.email} />
                </div>
            </Section>

            <Section title='Professional information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Qualification' value={employee.professionalInfo.qualification} />
                    <Field label='Subject' value={employee.professionalInfo.subject} />
                    <Field label='Years of experience' value={employee.professionalInfo.yearsOfExperience} />
                    <Field label='Previous school' value={employee.professionalInfo.previousSchool} />
                    <Field label='Joining date' value={employee.professionalInfo.joiningDate} />
                </div>
            </Section>

            <Section title='Employment information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Employee type' value={employee.employmentInfo.employeeType} />
                    <Field label='Salary' value={employee.employmentInfo.salary} />
                    <Field label='Work shift' value={employee.employmentInfo.workShift} />
                    <Field label='Assigned class' value={employee.employmentInfo.assignedClass} />
                    <Field label='Assigned subjects' value={employee.employmentInfo.assignedSubjects} />
                </div>
            </Section>

            <Section title='Account'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Username' value={employee.account.username} />
                    <Field label='Password' value={employee.account.password} />
                </div>
            </Section>

            <Section title='Documents'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='ID proof' value={employee.documents.idProof} />
                    <Field label='Qualification certificate' value={employee.documents.qualificationCertificate} />
                    <Field label='Experience certificate' value={employee.documents.experienceCertificate} />
                </div>
            </Section>
        </section>
    )
}

export default ViewEmployee
