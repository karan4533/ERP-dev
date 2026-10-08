import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import noProfile from '../../../../assets/images/no-profile.png'
import { getMarksEntryById, STUDENTS_LIST } from './enterMarksData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value ?? '—'}</span>
    </div>
)

const ViewEnterMarks = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const record = getMarksEntryById(id)
    const student = STUDENTS_LIST.find((item) => item.id === record?.studentId)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/teacher/marks-results/enter-marks')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Marks entry record not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                            <img
                                src={student?.profile || noProfile}
                                alt=''
                                className='w-20 h-20 rounded-full object-cover ring-2 ring-indigo-100'
                            />
                            <div className='flex-1'>
                                <h1 className='text-2xl font-semibold text-black'>{record.studentName}</h1>
                                <p className='text-sm text-[#667085] mt-1'>
                                    {record.entryId} · {record.admissionNumber} · {record.subject}
                                </p>
                            </div>
                            <span className='px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#515DEF33] text-[#515DEF]'>
                                Grade {record.grade}
                            </span>
                        </div>
                    </div>

                    <Section title='Enter Marks Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Roll Number' value={record.rollNumber} />
                            <Field label='Subject' value={record.subject} />
                            <Field label='Class' value={record.className} />
                            <Field label='Section' value={record.section} />
                            <Field label='Exam Name' value={record.examName} />
                            <Field label='Student Name' value={record.studentName} />
                            <Field label='Total Marks' value={record.totalMarks} />
                            <Field label='Obtained Marks' value={record.obtainedMarks} />
                            <Field label='Grade' value={record.grade} />
                            <div className='lg:col-span-3'>
                                <Field label='Remarks' value={record.remarks} />
                            </div>
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewEnterMarks
