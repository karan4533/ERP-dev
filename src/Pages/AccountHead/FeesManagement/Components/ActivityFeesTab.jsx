import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { useFinance } from '../../financeDomain/FinanceContext'
import {
    ACTIVITY_TYPES,
    addActivityFee,
    assignActivityFee,
    getActivityFeeState,
    markActivityPaid,
    recordParticipation,
} from '../activityFees'

const inputClass = 'border border-[#D9D9D9] rounded-md px-2 py-2 text-sm w-full'

const ActivityFeesTab = () => {
    const { students, issueActivityFeeReceipt } = useFinance()
    const [state, setState] = useState(() => getActivityFeeState())
    const [activityType, setActivityType] = useState('Rifle')
    const [participantType, setParticipantType] = useState('Insider')
    const refresh = () => setState(getActivityFeeState())

    const createFee = (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        addActivityFee({
            activityType: data.get('activityType'),
            customName: data.get('customName'),
            insiderAmount: data.get('insiderAmount'),
            outsiderAmount: data.get('outsiderAmount'),
            academicYear: data.get('academicYear'),
            attendanceRequired: data.get('attendanceRequired'),
            concessionApplicable: data.get('concessionApplicable'),
            remarks: data.get('remarks'),
        })
        event.currentTarget.reset()
        setActivityType('Rifle')
        refresh()
    }

    const assign = (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const type = data.get('participantType')
        const student = students.find((item) => item.id === data.get('studentId'))
        assignActivityFee({
            feeId: data.get('feeId'),
            participantType: type,
            studentId: data.get('studentId'),
            participantName: type === 'Outsider' ? data.get('outsiderName') : student?.name,
            concessionMode: data.get('concessionMode'),
            concessionValue: data.get('concessionValue'),
        })
        refresh()
    }

    const collect = (assignment) => {
        const result = issueActivityFeeReceipt({
            studentId: assignment.studentId,
            participantName: assignment.participantName,
            academicYear: state.fees.find((fee) => fee.id === assignment.feeId)?.academicYear || '',
            activityName: assignment.activityName,
            gross: assignment.gross,
            concession: Number(assignment.gross) - Number(assignment.payable),
            payable: assignment.payable,
        })
        if (!result?.success) {
            toast.error('Receipt could not be issued.')
            return
        }
        markActivityPaid(assignment.id, result.receipt.receiptNo)
        refresh()
        toast.success(`Receipt ${result.receipt.receiptNo} issued.`)
    }

    return (
        <div className='space-y-6'>
            <form onSubmit={createFee} className='bg-white rounded-2xl shadow-md p-4 grid md:grid-cols-3 gap-3'>
                <h2 className='md:col-span-3 text-lg font-medium'>Manual activity fee</h2>
                <select name='activityType' value={activityType} onChange={(event) => setActivityType(event.target.value)} className={inputClass}>{ACTIVITY_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
                {activityType === 'Other' && <input name='customName' required placeholder='Activity name' className={inputClass} />}
                <input name='academicYear' required placeholder='Academic year' defaultValue='2026-27' className={inputClass} />
                <input name='insiderAmount' type='number' min='0' required placeholder='Insider amount' className={inputClass} />
                <input name='outsiderAmount' type='number' min='0' required placeholder='Outsider amount' className={inputClass} />
                <select name='attendanceRequired' className={inputClass}><option value='yes'>Attendance required</option><option value='no'>Attendance not required</option></select>
                <select name='concessionApplicable' className={inputClass}><option value='yes'>Concession applicable</option><option value='no'>Concession not applicable</option></select>
                <input name='remarks' placeholder='Remarks' className={inputClass} />
                <button type='submit' className='bg-[#515DEF] text-white rounded-md text-sm cursor-pointer'>Create activity fee</button>
            </form>

            <form onSubmit={assign} className='bg-white rounded-2xl shadow-md p-4 grid md:grid-cols-3 gap-3'>
                <h2 className='md:col-span-3 text-lg font-medium'>Assign participant</h2>
                <select name='feeId' required className={inputClass}>
                    <option value=''>Select fee</option>
                    {state.fees.map((fee) => <option key={fee.id} value={fee.id}>{fee.activityName} · Insider ₹{fee.insiderAmount} · Outsider ₹{fee.outsiderAmount}</option>)}
                </select>
                <select name='participantType' value={participantType} onChange={(event) => setParticipantType(event.target.value)} className={inputClass}>
                    <option>Insider</option>
                    <option>Outsider</option>
                </select>
                {participantType === 'Insider' ? (
                    <select name='studentId' required className={inputClass}>
                        <option value=''>Select student</option>
                        {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                    </select>
                ) : <input name='outsiderName' required placeholder='Outsider name' className={inputClass} />}
                <select name='concessionMode' className={inputClass}>
                    <option>No Concession</option>
                    <option>Percentage</option>
                    <option>Fixed Amount</option>
                </select>
                <input name='concessionValue' type='number' min='0' placeholder='Concession value' className={inputClass} />
                <button type='submit' className='bg-[#515DEF] text-white rounded-md text-sm cursor-pointer'>Assign</button>
            </form>

            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                    <thead className='bg-[#EDEEF5]'><tr>{['Activity', 'Participant', 'Type', 'Gross', 'Payable', 'Attendance', 'Payment', 'Receipt'].map((label) => <th key={label} className='px-2 py-2'>{label}</th>)}</tr></thead>
                    <tbody>
                        {state.assignments.length === 0 && <tr><td className='px-2 py-4 text-[#667085]' colSpan={8}>No activity-fee assignments yet.</td></tr>}
                        {state.assignments.map((item) => (
                            <tr key={item.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-2'>{item.activityName}</td>
                                <td className='px-2 py-2'>{item.participantName}</td>
                                <td className='px-2 py-2'>{item.participantType}</td>
                                <td className='px-2 py-2'>{item.gross}</td>
                                <td className='px-2 py-2'>{item.payable}</td>
                                <td className='px-2 py-2'>
                                    <input defaultValue={item.attendance} placeholder='Present / Absent' className='border rounded px-2 py-1' onBlur={(event) => { recordParticipation(item.id, event.target.value); refresh() }} />
                                </td>
                                <td className='px-2 py-2'>{item.paymentStatus}</td>
                                <td className='px-2 py-2'>
                                    {item.receiptNo || <button type='button' onClick={() => collect(item)} className='text-[#515DEF] cursor-pointer'>Collect</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className='text-xs text-[#667085] mt-3'>Attendance records participation. It does not change the fee amount. Concession uses the same amount-off result as the finance register: percentage or fixed amount.</p>
            </div>
        </div>
    )
}

export default ActivityFeesTab
