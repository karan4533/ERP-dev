import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import noProfile from '../../../../assets/images/no-profile.png'
import { STUDENTS_LIST } from '../../StudentsList/studentsListData'
import {
    getStudentTransferById,
    updateTransferStatus,
    statusBadgeColor,
} from './studentTransferData'

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

const ViewStudentTransfer = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [record, setRecord] = useState(() => getStudentTransferById(id))
    const student = STUDENTS_LIST.find((item) => item.id === record?.studentId)

    const handleStatusUpdate = (status) => {
        updateTransferStatus(id, status)
        setRecord(getStudentTransferById(id))
    }

    if (!record) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate('/teacher/student-evaluation/student-transfer')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Student transfer record not found.
                </div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/teacher/student-evaluation/student-transfer')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                {record.status === 'Pending' && (
                    <div className='flex gap-2'>
                        <button
                            type='button'
                            onClick={() => handleStatusUpdate('Approved')}
                            className='bg-[#4CAF50] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-opacity cursor-pointer'
                        >
                            Approve
                        </button>
                        <button
                            type='button'
                            onClick={() => handleStatusUpdate('Rejected')}
                            className='bg-[#F44336] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-opacity cursor-pointer'
                        >
                            Reject
                        </button>
                    </div>
                )}
            </div>

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
                            {record.transferRequestId} · {record.admissionNumber}
                        </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[record.status]}`}>
                        {record.status}
                    </span>
                </div>
            </div>

            <Section title='Transfer request details'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Transfer Request ID' value={record.transferRequestId} />
                    <Field label='Admission Number' value={record.admissionNumber} />
                    <Field label='Student Name' value={record.studentName} />
                    <Field label='Class' value={record.className} />
                    <Field label='Section' value={record.section} />
                    <Field label='Transfer Type' value={record.transferType} />
                    <Field label='Transfer To' value={record.transferTo} />
                    <Field label='Request Date' value={record.requestDate} />
                    <Field label='Status' value={record.status} />
                    <div className='lg:col-span-3'>
                        <Field label='Reason' value={record.reason} />
                    </div>
                </div>
            </Section>
        </section>
    )
}

export default ViewStudentTransfer
