import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'
import { getStudentFullProfileById } from './studentFullProfileData'
import { ensureEnrolledStudentDetailFromApi } from '../../../Common/StudentDatabase/enrolledStudentsData'
import { isApiStudentsEnabled } from '../../../services/apiClient'

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

const ViewStudentFullDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [a, setA] = useState(() => getStudentFullProfileById(id))
    const [loading, setLoading] = useState(isApiStudentsEnabled())
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        if (!isApiStudentsEnabled()) {
            setA(getStudentFullProfileById(id))
            setLoading(false)
            return undefined
        }
        setLoading(true)
        setError('')
        ensureEnrolledStudentDetailFromApi(id)
            .then(() => {
                if (!cancelled) setA(getStudentFullProfileById(id))
            })
            .catch((err) => {
                if (!cancelled) {
                    setA(null)
                    setError(err.message || 'Could not load student.')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [id])

    if (loading) {
        return (
            <section className='space-y-6'>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Loading student…
                </div>
            </section>
        )
    }

    if (error || !a) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/coordinator/user-management/students-list')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    {error || 'Student record not found, or outside your grade band.'}
                </div>
            </section>
        )
    }

    const addr = a.address || {}
    const contact = a.contact || {}
    const transport = a.transport || {}
    const parent = a.parent || {}
    const parentAddr = parent.address || {}
    const parentContact = parent.contact || {}

    const displayName = [a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ') || 'Student'

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate(`/coordinator/user-management/students-list/view/${id}`)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to student profile
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                    <img
                        src={a.profileImage || mo_user}
                        alt=''
                        className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100'
                    />
                    <div className='flex-1'>
                        <h1 className='text-2xl font-semibold text-black'>{displayName}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            <span className='font-medium text-[#1E1E1E]'>
                                Admission No: {a.admissionNumber}
                            </span>
                            {' · '}
                            <span>Roll No: {a.rollNumber}</span>
                        </p>
                    </div>
                </div>
            </div>

            <Section title='Admission details'>
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

            <Section title='Student information'>
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

            <Section title='Address'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-3'>
                        <Field label='Address' value={addr.address} />
                    </div>
                    <Field label='Country' value={addr.country} />
                    <Field label='State' value={addr.state} />
                    <Field label='City' value={addr.city} />
                    <Field label='Zip code' value={addr.zipCode} />
                </div>
            </Section>

            <Section title='Contact'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Mobile number' value={contact.mobileNumber} />
                    <Field label='Alternative number' value={contact.alternativeNumber} />
                    <Field label='Email' value={contact.email} />
                </div>
            </Section>

            <Section title='Transport'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Mode of transport' value={transport.modeOfTransport} />
                    <Field label='Route' value={transport.routeList} />
                    <Field label='Bus stop' value={transport.busStop} />
                </div>
            </Section>

            <Section title='Parent information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Father name' value={parent.fatherName} />
                    <Field label='Mother name' value={parent.motherName} />
                    <Field label='Father occupation' value={parent.fatherOccupation} />
                    <Field label='Mother occupation' value={parent.motherOccupation} />
                    <Field label='Father yearly income' value={parent.fatherYearlyIncome} />
                    <Field label='Mother yearly income' value={parent.motherYearlyIncome} />
                    <Field label='Siblings' value={parent.siblings} />
                    <div className='lg:col-span-3'>
                        <Field label='Parent address' value={parentAddr.address} />
                    </div>
                    <Field label='Parent country' value={parentAddr.country} />
                    <Field label='Parent state' value={parentAddr.state} />
                    <Field label='Parent city' value={parentAddr.city} />
                    <Field label='Parent zip' value={parentAddr.zipCode} />
                    <Field label='Parent mobile' value={parentContact.mobileNumber} />
                    <Field label='Parent alt mobile' value={parentContact.alternativeNumber} />
                    <Field label='Parent email' value={parentContact.email} />
                </div>
            </Section>
        </section>
    )
}

export default ViewStudentFullDetails
