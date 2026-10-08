import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import pdf_icon from '../../../../assets/images/pdf-icon.png'
import { getQuestionBankById } from './questionBanksData'

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

const ViewQuestionBank = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getQuestionBankById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/teacher/student-evaluation/questions-banks')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Question bank record not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h1 className='text-2xl font-semibold text-black'>{record.paperTitle}</h1>
                        <p className='text-sm text-[#667085] mt-2'>
                            <span className='font-medium text-[#1E1E1E]'>{record.documentId}</span>
                            {' · '}
                            <span>{record.subject}</span>
                            {' · '}
                            <span>{record.classSection ?? `${record.className} - ${record.section}`}</span>
                            {' · '}
                            <span>{record.examType}</span>
                        </p>
                    </div>

                    <Section title='Questions Banks Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Subject' value={record.subject} />
                            <Field label='Class' value={record.className} />
                            <Field label='Section' value={record.section} />
                            <Field label='Paper Title' value={record.paperTitle} />
                            <Field label='Description' value={record.description} />
                            <Field label='Exam Type' value={record.examType} />
                            <Field label='Upload Date' value={record.uploadDate} />
                            <Field label='Document ID' value={record.documentId} />
                            <div className='flex flex-col gap-y-1'>
                                <span className='text-base font-medium text-[#808080]'>File Name</span>
                                {record.fileName && record.fileName !== '—' ? (
                                    <span className='flex items-center gap-2'>
                                        <img src={pdf_icon} alt='file' className='w-6 h-6' />
                                        <span className='text-sm text-[#515DEF]'>{record.fileName}</span>
                                        <button type='button' className='text-[#515DEF] hover:opacity-80 cursor-pointer' title='Download'>
                                            <Download size={16} />
                                        </button>
                                    </span>
                                ) : (
                                    <span className='text-sm text-[#1E1E1E]'>—</span>
                                )}
                            </div>
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewQuestionBank
