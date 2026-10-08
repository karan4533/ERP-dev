import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import pdf_icon from '../../../assets/images/pdf-icon.png'
import UnitTestForm from './Components/UnitTestForm'
import { formatTestDate, getUnitTestById, ROUTE_BASE } from './unitTestsData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>
            {value || '—'}
        </span>
    </div>
)

const ViewUnitTest = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getUnitTestById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate(ROUTE_BASE)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Unit test record not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h1 className='text-2xl font-semibold text-black'>{record.entryId}</h1>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>{record.title}</span>
                            {' · '}
                            <span>{record.subject}</span>
                            {' · '}
                            <span>Class {record.className}-{record.section}</span>
                            {' · '}
                            <span>{formatTestDate(record.testDate)}</span>
                        </p>
                    </div>

                    <Section title='Unit Test Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Entry ID' value={record.entryId} />
                            <Field label='Subject' value={record.subject} />
                            <Field label='Class' value={record.className} />
                            <Field label='Section' value={record.section} />
                            <Field label='Title' value={record.title} />
                            <Field label='Test Date' value={formatTestDate(record.testDate)} />
                            <Field label='Total Marks' value={record.totalMarks} />
                            <Field label='Duration (minutes)' value={record.duration} />
                            <div className='flex flex-col gap-y-1'>
                                <span className='text-base font-medium text-[#808080]'>Question Paper</span>
                                <span className='flex items-center gap-x-2 text-sm text-[#515DEF]'>
                                    <img src={pdf_icon} alt='file-icon' className='w-6 h-6' />
                                    {record.fileName}
                                </span>
                            </div>
                            <div className='lg:col-span-3'>
                                <Field label='Description' value={record.description} />
                            </div>
                        </div>
                    </Section>

                    <Section title='Details'>
                        <UnitTestForm record={record} readOnly />
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewUnitTest
