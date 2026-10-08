import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import mo_user from '../../../assets/images/no-profile.png'

const MOCK_PARENT = {
    profileImage: null,
    parentId: 'PAR-1001',
    parentName: 'Rajesh Sharma',
    gender: 'Male',
    relation: 'Father',
    occupation: 'Software Engineer',
    yearlyIncome: '₹12,00,000',
    address: {
        address: '42, Green Park Extension, Near Metro Station',
        country: 'India',
        state: 'Delhi',
        city: 'New Delhi',
        zipCode: '110016',
    },
    contact: {
        mobileNumber: '+91 98123 45678',
        alternativeNumber: '+91 98123 45679',
        email: 'rajesh.sharma@example.com',
    },
    student: {
        name: 'Arjun Sharma',
        admissionNumber: 'ADM-2024-1042',
        class: 'Class 10',
        section: 'Section A',
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

const ViewParent = () => {
    const navigate = useNavigate()
    const parent = MOCK_PARENT
    const addr = parent.address
    const contact = parent.contact
    const student = parent.student

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/front-office/parent-management')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                    <img
                        src={parent.profileImage || mo_user}
                        alt=''
                        className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100'
                    />
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{parent.parentName}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            <span className='font-medium text-[#1E1E1E]'>Parent ID: {parent.parentId}</span>
                            {' · '}
                            <span className='text-[#808080]'>{parent.relation}</span>
                        </p>
                    </div>
                </div>
            </div>

            <Section title='Personal information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Parent name' value={parent.parentName} />
                    <Field label='Gender' value={parent.gender} />
                    <Field label='Relation to student' value={parent.relation} />
                    <Field label='Occupation' value={parent.occupation} />
                    <Field label='Yearly income' value={parent.yearlyIncome} />
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

            <Section title='Linked student'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Student name' value={student.name} />
                    <Field label='Admission number' value={student.admissionNumber} />
                    <Field label='Class' value={student.class} />
                    <Field label='Section' value={student.section} />
                </div>
            </Section>
        </section>
    )
}

export default ViewParent
