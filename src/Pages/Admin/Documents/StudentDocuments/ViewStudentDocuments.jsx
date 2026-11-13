import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import StudentDocumentFields from './Components/StudentDocumentFields'
import {
    getStudentDocumentRecordById,
    recordStatusBadgeColor,
    recordToDocumentSlots,
} from './studentDocumentsData'

const readOnlyClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F9FAFB] cursor-not-allowed'

const ReadOnlyField = ({ label, value }) => (
    <div className='flex flex-col gap-y-2'>
        <label className='text-base font-medium text-[#1E1E1E]'>{label}</label>
        <input type='text' readOnly value={value || '—'} className={readOnlyClass} />
    </div>
)

const ViewStudentDocuments = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [record, setRecord] = useState(null)
    const [documentSlots, setDocumentSlots] = useState([])
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        const found = getStudentDocumentRecordById(id)
        if (!found) {
            setNotFound(true)
            return
        }

        setRecord(found)
        setDocumentSlots(recordToDocumentSlots(found))
    }, [id])

    if (notFound) {
        return (
            <section className='space-y-4'>
                <p className='text-[#667085]'>Student document record not found.</p>
                <NavLink
                    to='/admin/documents/student-documents'
                    className='text-[#515DEF] hover:underline text-sm font-medium'
                >
                    Back to list
                </NavLink>
            </section>
        )
    }

    if (!record) return null

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Student Document Details</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    View submitted documents for{' '}
                    <span className='font-medium text-[#1E1E1E]'>{record.studentName}</span>.
                </p>

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <ReadOnlyField label='Admission Number:' value={record.admissionNumber} />
                    <ReadOnlyField label='Student Name:' value={record.studentName} />
                    <ReadOnlyField label='Class:' value={record.className} />
                    <ReadOnlyField label='Section:' value={record.section} />
                    <ReadOnlyField label='Submitted Date:' value={record.submittedDate} />
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Status:</label>
                        <div className='py-3'>
                            <span
                                className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                                    recordStatusBadgeColor[record.status]
                                }`}
                            >
                                {record.status}
                            </span>
                        </div>
                    </div>
                    <div className='col-span-3 flex flex-col gap-y-2'>
                        <h2 className='text-xl font-semibold text-black'>Documents</h2>
                        <StudentDocumentFields slots={documentSlots} readOnly />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6 flex-wrap'>
                <button
                    type='button'
                    onClick={() => navigate('/admin/documents/student-documents')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Back
                </button>
                <NavLink
                    to={`/admin/documents/edit-student-documents/${record.id}`}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Edit
                </NavLink>
            </div>
        </section>
    )
}

export default ViewStudentDocuments
