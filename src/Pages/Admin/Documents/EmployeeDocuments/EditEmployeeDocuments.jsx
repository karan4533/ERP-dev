import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import DynamicDocumentFields from './Components/DynamicDocumentFields'
import {
    formatPlanDate,
    getEmployeeDocumentRecordById,
    parsePlanDateString,
    RECORD_STATUS_OPTIONS,
    recordToDocumentSlots,
    updateEmployeeDocumentRecord,
} from './employeeDocumentsData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const EditEmployeeDocuments = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [employeeId, setEmployeeId] = useState('')
    const [employeeName, setEmployeeName] = useState('')
    const [submittedDate, setSubmittedDate] = useState(null)
    const [status, setStatus] = useState('In Progress')
    const [documentSlots, setDocumentSlots] = useState([])
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        const record = getEmployeeDocumentRecordById(id)
        if (!record) {
            setNotFound(true)
            return
        }

        setEmployeeId(record.employeeId)
        setEmployeeName(record.employeeName)
        setSubmittedDate(parsePlanDateString(record.submittedDate))
        setStatus(record.status)
        setDocumentSlots(recordToDocumentSlots(record))
    }, [id])

    const isValid = () => {
        if (!employeeId.trim() || !employeeName.trim()) return false
        return documentSlots.some((slot) => slot.label.trim() && slot.fileName.trim())
    }

    const handleSave = () => {
        if (!isValid()) return

        updateEmployeeDocumentRecord(id, {
            employeeId,
            employeeName,
            submittedDate: formatPlanDate(submittedDate),
            status,
            documentSlots: documentSlots.filter(
                (slot) => slot.label.trim() && slot.fileName.trim()
            ),
        })

        navigate('/admin/documents/employee-documents')
    }

    if (notFound) {
        return (
            <section className='space-y-4'>
                <p className='text-[#667085]'>Employee document record not found.</p>
                <NavLink
                    to='/admin/documents/employee-documents'
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
                <h2 className='text-xl font-semibold text-black'>Edit Employee Documents</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Update employee details, document labels, and uploads. New labels become table columns.
                </p>

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='employeeId' className='text-base font-medium text-[#1E1E1E]'>
                            Employee ID:
                        </label>
                        <input
                            id='employeeId'
                            type='text'
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='employeeName' className='text-base font-medium text-[#1E1E1E]'>
                            Employee Name:
                        </label>
                        <input
                            id='employeeName'
                            type='text'
                            value={employeeName}
                            onChange={(e) => setEmployeeName(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
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
                    <div className='col-span-1 sm:col-span-2 md:col-span-3 flex flex-col gap-y-2 max-w-md'>
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
                    <div className='col-span-1 sm:col-span-2 md:col-span-3 flex flex-col gap-y-2'>
                        <h2 className='text-xl font-semibold text-black'>
                            Documents Upload —{' '}
                            <span className='text-base text-[#808080] font-normal'>
                                Edit labels and files, or add new document types
                            </span>
                        </h2>
                        <DynamicDocumentFields slots={documentSlots} onChange={setDocumentSlots} />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/admin/documents/employee-documents')}
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

export default EditEmployeeDocuments
