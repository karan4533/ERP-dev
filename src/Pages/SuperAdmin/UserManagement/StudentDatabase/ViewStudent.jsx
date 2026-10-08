import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import mo_user from '../../../../assets/images/no-profile.png'
import { ROUTE_BASE, getStudentById } from './studentDatabaseData'

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

const ViewStudent = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const student = getStudentById(id)

    if (!student) {
        return (
            <section className='space-y-6'>
                <button type='button' onClick={() => navigate(ROUTE_BASE)} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>Student not found.</div>
            </section>
        )
    }

    const displayName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ')

    return (
        <section className='space-y-6'>
            <button type='button' onClick={() => navigate(ROUTE_BASE)} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                    <img src={student.profileImage || mo_user} alt='' className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100' />
                    <div className='flex-1'>
                        <h1 className='text-2xl font-semibold text-black'>{displayName}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            <span className='font-medium text-[#1E1E1E]'>Admission No: {student.admissionNumber}</span>
                        </p>
                    </div>
                </div>
            </div>

            <Section title='Admission details'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Admission date' value={student.admissionDate} />
                    <Field label='Class' value={student.class} />
                    <Field label='Class section' value={student.classSection} />
                    <Field label='Registration fees' value={student.registrationFees} />
                    <Field label='Batch year' value={student.batchYear} />
                    <Field label='Batch end year' value={student.batchEndYear} />
                    <Field label='Fees timeline' value={student.feesTimeline} />
                    <Field label='Status' value={student.status} />
                    <Field label='Student ID' value={student.studentId} />
                </div>
            </Section>

            <Section title='Student information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='First name' value={student.firstName} />
                    <Field label='Middle name' value={student.middleName} />
                    <Field label='Last name' value={student.lastName} />
                    <Field label='Gender' value={student.gender} />
                    <Field label='Religion' value={student.religion} />
                    <Field label='Caste' value={student.caste} />
                    <Field label='Date of birth' value={student.dateOfBirth} />
                    <Field label='Blood group' value={student.bloodGroup} />
                    <Field label='Height' value={student.height} />
                    <Field label='Weight' value={student.weight} />
                    <div className='lg:col-span-3'><Field label='Medical history' value={student.medicalHistory} /></div>
                    <div className='lg:col-span-3'><Field label='Previous school' value={student.previousSchool} /></div>
                </div>
            </Section>

            <Section title='Student address'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-3'><Field label='Street / full address' value={student.address.address} /></div>
                    <Field label='Country' value={student.address.country} />
                    <Field label='State' value={student.address.state} />
                    <Field label='City' value={student.address.city} />
                    <Field label='Zip code' value={student.address.zipCode} />
                </div>
            </Section>

            <Section title='Student contact'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Mobile number' value={student.contact.mobileNumber} />
                    <Field label='Alternative number' value={student.contact.alternativeNumber} />
                    <Field label='Email' value={student.contact.email} />
                </div>
            </Section>

            <Section title='Transport'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Route list' value={student.transport.routeList} />
                    <Field label='Bus stop' value={student.transport.busStop} />
                </div>
            </Section>

            <Section title='Parent / guardian'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Father name' value={student.parent.fatherName} />
                    <Field label='Mother name' value={student.parent.motherName} />
                    <Field label='Father occupation' value={student.parent.fatherOccupation} />
                    <Field label='Mother occupation' value={student.parent.motherOccupation} />
                    <Field label='Father yearly income' value={student.parent.fatherYearlyIncome} />
                    <Field label='Mother yearly income' value={student.parent.motherYearlyIncome} />
                    <Field label='Siblings' value={student.parent.siblings} />
                </div>
            </Section>
        </section>
    )
}

export default ViewStudent
