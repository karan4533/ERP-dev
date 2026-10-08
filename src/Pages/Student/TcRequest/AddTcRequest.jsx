import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import { createTcRequest } from '../../../Common/TcRequest/tcRequestData'

const inputClass =
    'text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full bg-white'

const AddTcRequest = () => {
    const navigate = useNavigate()
    const { activeStudent, routePrefix, isParentPortal } = useActiveStudent()
    const [reason, setReason] = useState('')
    const [transferTo, setTransferTo] = useState('')
    const [lastDateOfAttendance, setLastDateOfAttendance] = useState('')

    const handleSubmit = (event) => {
        event.preventDefault()
        const created = createTcRequest({
            studentId: activeStudent.id,
            studentName: activeStudent.name,
            classSection: activeStudent.classSection,
            admissionNumber: activeStudent.admissionNumber,
            reason,
            transferTo,
            lastDateOfAttendance,
            requestedBy: isParentPortal ? 'Parent' : 'Student',
        })
        navigate(`${routePrefix}/tc-request/view/${created.id}`)
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(`${routePrefix}/tc-request`)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-2xl font-semibold text-black'>Request Transfer Certificate</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Your request will be sent to PRM (Front Office). After Super Admin approval, the TC will be available in your portal.
                </p>
            </div>

            <form onSubmit={handleSubmit} className='bg-white rounded-2xl shadow-md p-4 space-y-6'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Student Name</label>
                        <input type='text' readOnly value={activeStudent.name} className={`${inputClass} bg-[#F9FAFB]`} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Class / Section</label>
                        <input type='text' readOnly value={activeStudent.classSection} className={`${inputClass} bg-[#F9FAFB]`} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Admission Number</label>
                        <input type='text' readOnly value={activeStudent.admissionNumber} className={`${inputClass} bg-[#F9FAFB]`} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Requested By</label>
                        <input type='text' readOnly value={isParentPortal ? 'Parent' : 'Student'} className={`${inputClass} bg-[#F9FAFB]`} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Sent To</label>
                        <input type='text' readOnly value='PRM (Front Office)' className={`${inputClass} bg-[#F9FAFB]`} />
                    </div>
                    <div className='flex flex-col gap-y-2 lg:col-span-1'>
                        <label htmlFor='last-date' className='text-base font-medium text-[#808080]'>Last Date of Attendance</label>
                        <input
                            id='last-date'
                            type='text'
                            required
                            value={lastDateOfAttendance}
                            onChange={(e) => setLastDateOfAttendance(e.target.value)}
                            placeholder='DD-MM-YYYY'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2 lg:col-span-3'>
                        <label htmlFor='transfer-to' className='text-base font-medium text-[#808080]'>Transfer To (School Name)</label>
                        <input
                            id='transfer-to'
                            type='text'
                            required
                            value={transferTo}
                            onChange={(e) => setTransferTo(e.target.value)}
                            placeholder='Name and location of destination school'
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2 lg:col-span-3'>
                        <label htmlFor='reason' className='text-base font-medium text-[#808080]'>Reason for TC</label>
                        <textarea
                            id='reason'
                            required
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder='Brief reason for requesting Transfer Certificate'
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className='flex sm:justify-end justify-center gap-x-4'>
                    <button
                        type='button'
                        onClick={() => navigate(`${routePrefix}/tc-request`)}
                        className='bg-white text-[#515DEF] text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'
                    >
                        Cancel
                    </button>
                    <button
                        type='submit'
                        className='bg-[#515DEF] text-white text-sm px-8 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                    >
                        Submit to PRM
                    </button>
                </div>
            </form>
        </section>
    )
}

export default AddTcRequest
