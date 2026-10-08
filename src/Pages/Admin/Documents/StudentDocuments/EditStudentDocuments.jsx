import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import StudentDocumentFields from './Components/StudentDocumentFields'
import {
    formatPlanDate,
    getStudentDocumentRecordById,
    parsePlanDateString,
    RECORD_STATUS_OPTIONS,
    recordToDocumentSlots,
    STUDENT_DOCUMENT_TYPES,
    updateStudentDocumentRecord,
} from './studentDocumentsData'
import { getClassSelectOptions } from '../../../../Common/RBAC/academicsCatalogData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const buildInitialSlots = () =>
    STUDENT_DOCUMENT_TYPES.map((type) => ({
        typeId: type.id,
        label: type.label,
        fileName: '',
        status: 'Pending',
    }))

const EditStudentDocuments = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [admissionNumber, setAdmissionNumber] = useState('')
    const [studentName, setStudentName] = useState('')
    const [className, setClassName] = useState('')
    const [submittedDate, setSubmittedDate] = useState(null)
    const [status, setStatus] = useState('In Progress')
    const [documentSlots, setDocumentSlots] = useState(buildInitialSlots)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        const record = getStudentDocumentRecordById(id)
        if (!record) {
            setNotFound(true)
            return
        }

        setAdmissionNumber(record.admissionNumber)
        setStudentName(record.studentName)
        setClassName(record.className)
        setSubmittedDate(parsePlanDateString(record.submittedDate))
        setStatus(record.status)
        setDocumentSlots(recordToDocumentSlots(record))
    }, [id])

    const isValid = () =>
        admissionNumber.trim() &&
        studentName.trim() &&
        className &&
        documentSlots.some((slot) => slot.fileName.trim())

    const handleSave = () => {
        if (!isValid()) return

        updateStudentDocumentRecord(id, {
            admissionNumber,
            studentName,
            className,
            submittedDate: formatPlanDate(submittedDate),
            status,
            documentSlots,
        })

        navigate('/admin/documents/student-documents')
    }

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

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Edit Student Documents</h2>
                <p className='text-sm text-[#667085] mt-1'>Update student details and document uploads.</p>

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='admissionNumber' className='text-base font-medium text-[#1E1E1E]'>
                            Admission Number:
                        </label>
                        <input
                            id='admissionNumber'
                            type='text'
                            value={admissionNumber}
                            onChange={(e) => setAdmissionNumber(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='studentName' className='text-base font-medium text-[#1E1E1E]'>
                            Student Name:
                        </label>
                        <input
                            id='studentName'
                            type='text'
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='className' className='text-base font-medium text-[#1E1E1E]'>
                            Class:
                        </label>
                        <select
                            id='className'
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            className={inputClass}
                        >
                            <option value=''>Select class</option>
                            {getClassSelectOptions().map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='col-span-3 flex gap-6 w-full flex-col sm:flex-row'>
                        <div className='flex flex-col gap-y-2 w-full max-w-md'>
                            <label className='text-base font-medium text-[#1E1E1E]'>Submitted Date:</label>
                            <div className='relative'>
                                <DatePicker
                                    selected={submittedDate}
                                    onChange={(date) => setSubmittedDate(date)}
                                    dateFormat='dd/MM/yyyy'
                                    isClearable
                                    className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                                />
                                <Calendar
                                    size={16}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none'
                                />
                            </div>
                        </div>
                        <div className='flex flex-col gap-y-2 w-full max-w-md'>
                            <label htmlFor='recordStatus' className='text-base font-medium text-[#1E1E1E]'>
                                Status:
                            </label>
                            <select
                                id='recordStatus'
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className={inputClass}
                            >
                                {RECORD_STATUS_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className='col-span-3 flex flex-col gap-y-2'>
                        <h2 className='text-xl font-semibold text-black'>
                            Documents Upload —{' '}
                            <span className='text-base text-[#808080] font-normal'>
                                Upload PDF, JPG, or PNG (max 5 MB)
                            </span>
                        </h2>
                        <StudentDocumentFields slots={documentSlots} onChange={setDocumentSlots} />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/admin/documents/student-documents')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSave}
                    disabled={!isValid()}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default EditStudentDocuments
