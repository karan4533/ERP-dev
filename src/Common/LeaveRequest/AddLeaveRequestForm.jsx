import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { calculateTotalDays, createLeaveRequest, LEAVE_REQUESTS_UPDATED_EVENT, LEAVE_TYPES } from './leaveRequestData'
import { getLeaveApproverConfig, getLeaveRoutes, getSubmitterProfile, resolveRoleKey } from './leaveRequestConfigs'
import IntegrationNotice from '../ui/IntegrationNotice'
import PageHeader from '../ui/PageHeader'
import Surface from '../ui/Surface'
import WorkflowContextBar from '../ui/WorkflowContextBar'

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
        <section className='space-y-5'>
            <PageHeader title='Apply for leave' description={approverConfig.submitHint} />
            <IntegrationNotice state='demo' title='Local leave submission' description='This request is stored in this browser. Leave balances, document evidence and staff notifications are not connected.' />
            <WorkflowContextBar owner={approverConfig.requestedToLabel} due={fromDate && toDate ? `${fromDate.toLocaleDateString('en-GB')} to ${toDate.toLocaleDateString('en-GB')}` : 'Select dates'} nextAction='Complete and submit the request' />
            <Surface title='Request information' description='Dates and leave type determine the request sent to the decision owner.' contentClassName='p-4 sm:p-5'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='leave-request-owner' className='text-base font-medium text-[#1E1E1E]'>Requested To:</label>
                        <input
                            id='leave-request-owner'
                            type='text'
                            readOnly
                            disabled
                            value={approverConfig.requestedToLabel}
                            className={readOnlyInputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='leave-request-type' className='text-base font-medium text-[#1E1E1E]'>Leave Type:</label>
                        <select id='leave-request-type' value={leaveType} onChange={(event) => setLeaveType(event.target.value)} className={inputClass}>
                            <option value=''>Select Leave Type</option>
                            {LEAVE_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='leave-request-from' className='text-base font-medium text-[#1E1E1E]'>From Date:</label>
                        <div className='relative'>
                            <DatePicker id='leave-request-from' selected={fromDate} onChange={(date) => setFromDate(date || new Date())} dateFormat='dd/MM/yyyy' isClearable className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='leave-request-to' className='text-base font-medium text-[#1E1E1E]'>To Date:</label>
                        <div className='relative'>
                            <DatePicker id='leave-request-to' selected={toDate} onChange={(date) => setToDate(date || new Date())} dateFormat='dd/MM/yyyy' isClearable className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='leave-request-days' className='text-base font-medium text-[#1E1E1E]'>Total Days:</label>
                        <input id='leave-request-days' type='text' readOnly value={totalDays || ''} placeholder='Auto-calculated' className={readOnlyInputClass} />
                    </div>
                    {leaveType === 'Permission' && (
                        <>
                            <div className='flex flex-col gap-y-2'>
                                <label htmlFor='leave-request-from-time' className='text-base font-medium text-[#1E1E1E]'>From Time:</label>
                                <input id='leave-request-from-time' type='time' value={fromTime} onChange={(event) => setFromTime(event.target.value)} className={inputClass} />
                            </div>
                            <div className='flex flex-col gap-y-2'>
                                <label htmlFor='leave-request-to-time' className='text-base font-medium text-[#1E1E1E]'>To Time:</label>
                                <input id='leave-request-to-time' type='time' value={toTime} onChange={(event) => setToTime(event.target.value)} className={inputClass} />
                            </div>
                        </>
                    )}
                    <div className='flex flex-col gap-y-2 lg:col-span-3'>
                        <label htmlFor='leave-request-reason' className='text-base font-medium text-[#1E1E1E]'>Reason:</label>
                        <textarea id='leave-request-reason' rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className={inputClass} placeholder='Describe the reason for leave...' />
                    </div>
                </div>
            </Surface>

            <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
                <button type='button' onClick={() => navigate(routes.myList)} className='bg-white text-[#515DEF] text-sm px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-all duration-200 cursor-pointer md:w-auto w-full'>Cancel</button>
                <button type='button' onClick={handleSubmit} className='bg-[#515DEF] text-white text-sm px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>Submit Request</button>
            </div>
        </section>
    )
}
