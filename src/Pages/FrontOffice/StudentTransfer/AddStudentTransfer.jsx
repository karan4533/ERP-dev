import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { toast } from 'react-toastify'
import { addStudentTransfer } from './studentTransferData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const formatRequestedOn = (value) => {
    if (!value) return ''
    return value.toLocaleDateString('en-GB').replace(/\//g, '-')
}

const AddStudentTransfer = () => {
    const navigate = useNavigate()
    const [studentName, setStudentName] = useState('')
    const [transferType, setTransferType] = useState('Inward')
    const [transferTo, setTransferTo] = useState('')
    const [className, setClassName] = useState('')
    const [reason, setReason] = useState('')
    const [requestedOn, setRequestedOn] = useState(new Date())
    const [mdApprovalStatus, setMdApprovalStatus] = useState('Pending')
    const [errors, setErrors] = useState({})
    const [saving, setSaving] = useState(false)

    const validate = () => {
        const next = {}
        if (!studentName.trim()) next.studentName = 'Name is required.'
        if (!transferType) next.transferType = 'Transfer type is required.'
        if (!transferTo.trim()) next.transferTo = 'Transfer to is required.'
        if (!className.trim()) next.className = 'Class is required.'
        if (!reason.trim()) next.reason = 'Reason is required.'
        if (!requestedOn) next.requestedOn = 'Requested on date is required.'
        return next
    }

    const handleSave = async () => {
        const nextErrors = validate()
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0) return

        setSaving(true)
        try {
            const result = await addStudentTransfer({
                studentName: studentName.trim(),
                transferType,
                transferTo: transferTo.trim(),
                className: className.trim(),
                reason: reason.trim(),
                requestedOn: formatRequestedOn(requestedOn),
                mdApprovalStatus,
                status: 'In Progress',
            })
            if (!result.success) {
                toast.error(result.message || 'Could not save transfer.')
                return
            }
            toast.success('Student transfer saved successfully.')
            navigate('/front-office/student-transfer')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Student Transfer Information</h2>

                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Name:</label>
                        <input
                            type='text'
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className={inputClass}
                        />
                        {errors.studentName ? <p className='text-xs text-[#B42318]'>{errors.studentName}</p> : null}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Transfer Type:</label>
                        <select
                            value={transferType}
                            onChange={(e) => setTransferType(e.target.value)}
                            className={inputClass}
                        >
                            <option value='Inward'>Inward</option>
                            <option value='Outward'>Outward</option>
                        </select>
                        {errors.transferType ? <p className='text-xs text-[#B42318]'>{errors.transferType}</p> : null}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Transfer To:</label>
                        <input
                            type='text'
                            value={transferTo}
                            onChange={(e) => setTransferTo(e.target.value)}
                            className={inputClass}
                        />
                        {errors.transferTo ? <p className='text-xs text-[#B42318]'>{errors.transferTo}</p> : null}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Class:</label>
                        <input
                            type='text'
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            placeholder='e.g. Grade 5 / 5-A'
                            className={inputClass}
                        />
                        {errors.className ? <p className='text-xs text-[#B42318]'>{errors.className}</p> : null}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Reason:</label>
                        <input
                            type='text'
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className={inputClass}
                        />
                        {errors.reason ? <p className='text-xs text-[#B42318]'>{errors.reason}</p> : null}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Requested On:</label>
                        <div className='relative'>
                            <DatePicker
                                selected={requestedOn}
                                onChange={setRequestedOn}
                                dateFormat='dd/MM/yyyy'
                                isClearable
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                        {errors.requestedOn ? <p className='text-xs text-[#B42318]'>{errors.requestedOn}</p> : null}
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>MD Approval Status:</label>
                        <select
                            value={mdApprovalStatus}
                            onChange={(e) => setMdApprovalStatus(e.target.value)}
                            className={inputClass}
                        >
                            <option value='Pending'>Pending</option>
                            <option value='Approved'>Approved</option>
                            <option value='Rejected'>Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/front-office/student-transfer')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    disabled={saving}
                    onClick={handleSave}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </section>
    )
}

export default AddStudentTransfer
