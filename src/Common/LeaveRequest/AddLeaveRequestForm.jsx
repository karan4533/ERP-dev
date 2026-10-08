import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { calculateTotalDays, createLeaveRequest, LEAVE_REQUESTS_UPDATED_EVENT, LEAVE_TYPES } from './leaveRequestData'
import { getLeaveApproverConfig, getLeaveRoutes, getSubmitterProfile, resolveRoleKey } from './leaveRequestConfigs'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'
const readOnlyInputClass = `${inputClass} bg-[#F9FAFB] cursor-not-allowed`

export default function AddLeaveRequestForm({ roleKey: roleKeyProp }) {
    const navigate = useNavigate()
    const { role: authRole, name } = useAuth()
    const roleKey = resolveRoleKey(authRole || roleKeyProp)
    const routes = getLeaveRoutes(roleKey)
    const approverConfig = getLeaveApproverConfig(roleKey)
    const submitterProfile = getSubmitterProfile(roleKey, { name })
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [leaveType, setLeaveType] = useState('')
    const [reason, setReason] = useState('')
    const [fromTime, setFromTime] = useState('09:00')
    const [toTime, setToTime] = useState('10:00')

    const totalDays = useMemo(() => calculateTotalDays(fromDate, toDate), [fromDate, toDate])

    const handleSubmit = () => {
        if (!leaveType) {
            toast.error('Please select a leave type.')
            return
        }
        if (!reason.trim()) {
            toast.error('Please provide a reason for leave.')
            return
        }
        if (!fromDate || !toDate) {
            toast.error('Please select valid from and to dates.')
            return
        }
        if (leaveType === 'Permission') {
            const [fromHour, fromMinute] = fromTime.split(':').map(Number)
            const [toHour, toMinute] = toTime.split(':').map(Number)
            const minutes = (toHour * 60 + toMinute) - (fromHour * 60 + fromMinute)
            if (minutes <= 0 || minutes > 120) {
                toast.error('Permission cannot exceed 2 hours.')
                return
            }
        }

        createLeaveRequest(
            {
                employeeId: submitterProfile.employeeId,
                requestedBy: submitterProfile.requestedBy,
                role: submitterProfile.role,
                department: submitterProfile.department,
                leaveType,
                fromDate,
                toDate,
                totalDays,
                reason: reason.trim(),
            },
            roleKey,
        )

        toast.success(`Leave request submitted to ${approverConfig.requestedToLabel}.`)
        navigate(routes.myList)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Apply Leave Request</h2>
                <p className='text-sm text-[#667085] mt-2'>{approverConfig.submitHint}</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Requested To:</label>
                        <input
                            type='text'
                            readOnly
                            disabled
                            value={approverConfig.requestedToLabel}
                            className={readOnlyInputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Leave Type:</label>
                        <select value={leaveType} onChange={(event) => setLeaveType(event.target.value)} className={inputClass}>
                            <option value=''>Select Leave Type</option>
                            {LEAVE_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>From Date:</label>
                        <div className='relative'>
                            <DatePicker selected={fromDate} onChange={(date) => setFromDate(date || new Date())} dateFormat='dd/MM/yyyy' isClearable className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>To Date:</label>
                        <div className='relative'>
                            <DatePicker selected={toDate} onChange={(date) => setToDate(date || new Date())} dateFormat='dd/MM/yyyy' isClearable className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Total Days:</label>
                        <input type='text' readOnly value={totalDays || ''} placeholder='Auto-calculated' className={readOnlyInputClass} />
                    </div>
                    {leaveType === 'Permission' && (
                        <>
                            <div className='flex flex-col gap-y-2'>
                                <label className='text-base font-medium text-[#1E1E1E]'>From Time:</label>
                                <input type='time' value={fromTime} onChange={(event) => setFromTime(event.target.value)} className={inputClass} />
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <label className='text-base font-medium text-[#1E1E1E]'>To Time:</label>
                                <input type='time' value={toTime} onChange={(event) => setToTime(event.target.value)} className={inputClass} />
                            </div>
                        </>
                    )}
                    <div className='flex flex-col gap-y-2 lg:col-span-3'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Reason:</label>
                        <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className={inputClass} placeholder='Describe the reason for leave...' />
                    </div>
                </div>
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button type='button' onClick={() => navigate(routes.myList)} className='bg-white text-[#515DEF] text-sm px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'>Discard Changes</button>
                <button type='button' onClick={handleSubmit} className='bg-[#515DEF] text-white text-sm px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>Submit Request</button>
            </div>
        </section>
    )
}
