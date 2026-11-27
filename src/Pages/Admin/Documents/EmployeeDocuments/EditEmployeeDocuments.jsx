import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Calendar } from 'lucide-react'
import DynamicDocumentFields from './Components/DynamicDocumentFields'
import {
    formatPlanDate,
    parsePlanDateString,
    RECORD_STATUS_OPTIONS,
    recordToDocumentSlots,
    saveEmployeeDocumentsViaApi,
    updateEmployeeDocumentRecord,
} from './employeeDocumentsData'
import { canUseDocumentsApi } from '../../../../services/documentsApi'
import useDocumentRecords from '../useDocumentRecords'
import { ADMIN_EMPLOYEE_DOCUMENT_PATHS } from '../documentRoutePaths'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'
const lockedClass =
    'text-sm font-normal text-[#667085] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F9FAFB] cursor-not-allowed'

const EditEmployeeDocumentsForm = ({ record, paths = ADMIN_EMPLOYEE_DOCUMENT_PATHS }) => {
    const navigate = useNavigate()
    // With the server, which employee the folder belongs to cannot be changed.
    const apiMode = canUseDocumentsApi()
    const [employeeId, setEmployeeId] = useState(record.employeeId)
    const [employeeName, setEmployeeName] = useState(record.employeeName)
    const [submittedDate, setSubmittedDate] = useState(() => parsePlanDateString(record.submittedDate))
    const [status, setStatus] = useState(record.status)
    const [documentSlots, setDocumentSlots] = useState(() => recordToDocumentSlots(record))
    const [saving, setSaving] = useState(false)

    const isValid = () => {
        if (!employeeId.trim() || !employeeName.trim()) return false
        return documentSlots.some((slot) => slot.label.trim() && slot.fileName.trim())
    }

    const handleSave = async () => {
        if (!isValid() || saving) return

        if (apiMode) {
            setSaving(true)
            try {
                await saveEmployeeDocumentsViaApi({
                    employeeId: record.employeeId,
                    submittedDate: formatPlanDate(submittedDate),
                    status,
                    documentSlots,
                })
            } catch (error) {
                toast.error(
                    error?.status === 403
                        ? 'You do not have permission to change employee documents.'
                        : error?.message || 'The documents could not be saved. Please try again.',
                )
                setSaving(false)
                return
            }
            setSaving(false)
            toast.success('Employee documents updated.')
            navigate(paths.list)
            return
        }

        updateEmployeeDocumentRecord(record.id, {
            employeeId,
            employeeName,
            submittedDate: formatPlanDate(submittedDate),
            status,
            documentSlots: documentSlots.filter(
                (slot) => slot.label.trim() && slot.fileName.trim()
            ),
        })

        navigate(paths.list)
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
                            readOnly={apiMode}
                            className={apiMode ? lockedClass : inputClass}
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
                            readOnly={apiMode}
                            className={apiMode ? lockedClass : inputClass}
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
                    onClick={() => navigate(paths.list)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSave}
                    disabled={!isValid() || saving}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

const EditEmployeeDocuments = ({ paths = ADMIN_EMPLOYEE_DOCUMENT_PATHS } = {}) => {
    const { id } = useParams()
    const { records, status, error } = useDocumentRecords('employees')
    const record = records.find((item) => String(item.id) === String(id))

    if (status === 'loading') return <p className='text-[#667085]'>Loading employee documents…</p>
    if (status === 'error') return <p className='text-[#667085]'>{error}</p>
    if (!record) {
        return (
            <section className='space-y-4'>
                <p className='text-[#667085]'>Employee document record not found.</p>
                <NavLink
                    to={paths.list}
                    className='text-[#515DEF] hover:underline text-sm font-medium'
                >
                    Back to list
                </NavLink>
            </section>
        )
    }
    return <EditEmployeeDocumentsForm key={record.id} record={record} paths={paths} />
}

export default EditEmployeeDocuments
