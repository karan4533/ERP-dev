import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import mo_user from '../../assets/images/no-profile.png'
import { getEmployeeById } from '../EmployeeDatabase/employeeDatabaseData'
import { canUseEmployeeDirectoryApi, getEmployeeDetailFromDirectory } from '../../services/employeeDirectoryApi'

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

const ViewEmployeePage = ({ routeBase }) => {
    const { id } = useParams()
    const navigate = useNavigate()
    const api = canUseEmployeeDirectoryApi()
    const [employee, setEmployee] = useState(() => (api ? null : getEmployeeById(id)))
    const [loading, setLoading] = useState(api)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!api) {
            setEmployee(getEmployeeById(id))
            setLoading(false)
            setError('')
            return undefined
        }
        let active = true
        setLoading(true)
        getEmployeeDetailFromDirectory(id)
            .then((detail) => {
                if (!active) return
                setEmployee(detail)
                setError(detail ? '' : 'Employee not found.')
            })
            .catch((caught) => {
                if (!active) return
                setEmployee(null)
                setError(caught?.message || 'Employee could not be loaded.')
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => {
            active = false
        }
    }, [api, id])

    if (loading) {
        return (
            <section className='space-y-6'>
                <button type='button' onClick={() => navigate(routeBase)} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Loading employee…</div>
            </section>
        )
    }

    if (!employee) {
        return (
            <section className='space-y-6'>
                <button type='button' onClick={() => navigate(routeBase)} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    {error || 'Employee not found.'}
                </div>
            </section>
        )
    }

    const displayName = [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(' ')
    const address = employee.address || {}
    const contact = employee.contact || {}
    const professionalInfo = employee.professionalInfo || {}
    const employmentInfo = employee.employmentInfo || {}
    const account = employee.account || {}
    const documents = employee.documents || {}

    return (
        <section className='space-y-6'>
            <button type='button' onClick={() => navigate(routeBase)} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
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
                    <div className='lg:col-span-3'><Field label='Street / full address' value={address.address} /></div>
                    <Field label='Country' value={address.country} />
                    <Field label='State' value={address.state} />
                    <Field label='City' value={address.city} />
                    <Field label='Zip code' value={address.zipCode} />
                    <Field label='Mobile number' value={contact.mobileNumber} />
                    <Field label='Alternative number' value={contact.alternativeNumber} />
                    <Field label='Email' value={contact.email} />
                </div>
            </Section>

            <Section title='Professional information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Qualification' value={professionalInfo.qualification} />
                    <Field label='Subject' value={professionalInfo.subject} />
                    <Field label='Years of experience' value={professionalInfo.yearsOfExperience} />
                    <Field label='Previous school' value={professionalInfo.previousSchool} />
                    <Field label='Joining date' value={professionalInfo.joiningDate} />
                </div>
            </Section>

            <Section title='Employment information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Employee type' value={employmentInfo.employeeType} />
                    <Field label='Salary' value={employmentInfo.salary} />
                    <Field label='Work shift' value={employmentInfo.workShift} />
                    <Field label='Assigned class' value={employmentInfo.assignedClass} />
                    <Field label='Assigned subjects' value={employmentInfo.assignedSubjects} />
                </div>
            </Section>

            <Section title='Account'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Username' value={account.username} />
                    <Field label='Login note' value={account.loginNote || account.password} />
                </div>
            </Section>

            <Section title='Documents'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='ID proof' value={documents.idProof} />
                    <Field label='Qualification certificate' value={documents.qualificationCertificate} />
                    <Field label='Experience certificate' value={documents.experienceCertificate} />
                </div>
            </Section>
        </section>
    )
}

export default ViewEmployeePage
