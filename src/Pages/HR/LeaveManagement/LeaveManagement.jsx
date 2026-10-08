import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { EMPLOYEE_CATEGORIES } from '../domain/hrStatus'
import { employeeName, getEmployees, getLeaveBundle, nextId, pushNotification, saveLeaveBundle } from '../domain/hrStore'
import { Badge, Modal, PageIntro, PrimaryButton, Select, TableWrap, inputClass, td, th, useHrTick } from '../components/HrUi'

const LeaveManagement = () => {
    const policiesMode = useLocation().pathname.includes('policies')
    const tick = useHrTick()
    const bundle = useMemo(() => getLeaveBundle(), [tick])
    const employees = useMemo(() => getEmployees(), [tick])
    const [status, setStatus] = useState('')
    const [form, setForm] = useState(null)
    const requests = bundle.requests.filter((item) => !status || item.status === status)

    const decide = (request, next) => {
        const requestsNext = getLeaveBundle().requests.map((item) => item.id === request.id ? { ...item, status: next, approvedBy: next === 'Approved' ? 'Reporting Manager' : item.approvedBy } : item)
        saveLeaveBundle({ ...getLeaveBundle(), requests: requestsNext })
        if (next === 'Pending') pushNotification({ type: 'Leave', title: 'Leave Approval Pending', message: `${employeeName(request.employeeId)} requested ${request.leaveType}.`, relatedDate: request.fromDate })
        toast.success(`Leave ${next.toLowerCase()}.`)
    }

    const savePolicy = (event) => {
        event.preventDefault()
        if (!form.name || !(Number(form.entitlement) >= 0)) return toast.error('Policy name and entitlement are required.')
        const policies = [{ ...form, id: nextId('POL', bundle.policies), entitlement: Number(form.entitlement), maxConsecutive: Number(form.maxConsecutive) || 1, carryForward: form.carryForward === true || form.carryForward === 'true', paid: true, approvalRequired: true, active: true }, ...getLeaveBundle().policies]
        saveLeaveBundle({ ...getLeaveBundle(), policies })
        toast.success('Leave policy saved.')
        setForm(null)
    }

    const saveRequest = (event) => {
        event.preventDefault()
        if (!form.employeeId || !form.fromDate) return toast.error('Employee and dates are required.')
        const requestsNext = [{ id: nextId('LVE', bundle.requests), ...form, days: Number(form.days) || 1, status: 'Pending', approvedBy: '' }, ...getLeaveBundle().requests]
        saveLeaveBundle({ ...getLeaveBundle(), requests: requestsNext })
        pushNotification({ type: 'Leave', title: 'Leave Approval Pending', message: `${employeeName(form.employeeId)} submitted ${form.leaveType}.`, relatedDate: form.fromDate })
        toast.success('Leave request submitted for manager approval.')
        setForm(null)
    }

    return (
        <section>
            <PageIntro text='Leave requests move from employee submission to manager decision and stay visible to HR for attendance and payroll.'>
                {!policiesMode && <Select label='Status' value={status} onChange={(e) => setStatus(e.target.value)} options={['Pending', 'Approved', 'Rejected']} />}
            </PageIntro>
            {policiesMode ? (
                <TableWrap title='Leave Policies' action={<PrimaryButton onClick={() => setForm({ name: '', category: 'Academics', leaveType: 'Casual Leave', entitlement: 12, maxConsecutive: 3, carryForward: false })}>Add Policy</PrimaryButton>}>
                    <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Policy', 'Category', 'Type', 'Year entitlement', 'Term 1 / 2 / 3', 'Used', 'Balance', 'Carry Forward', 'Max Days'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                        <tbody>{bundle.policies.map((row) => {
                            const term = Math.floor(Number(row.entitlement || 0) / 3)
                            const used = bundle.requests.filter((item) => item.leaveType === row.leaveType && item.status === 'Approved').reduce((sum, item) => sum + (Number(item.days) || 0), 0)
                            return <tr key={row.id} className='border-b border-[#f2f4f7]'><td className={td}>{row.name}</td><td className={td}>{row.category}</td><td className={td}>{row.leaveType}</td><td className={td}>{row.entitlement}</td><td className={td}>{term} / {term} / {Number(row.entitlement) - (term * 2)}</td><td className={td}>{used}</td><td className={td}>{Math.max(0, Number(row.entitlement) - used)}</td><td className={td}>{row.carryForward ? 'Yes' : 'No'}</td><td className={td}>{row.maxConsecutive}</td></tr>
                        })}</tbody>
                    </table>
                </TableWrap>
            ) : (
                <TableWrap title='Leave Requests' action={<PrimaryButton onClick={() => employees[0] && setForm({ employeeId: employees[0].id, leaveType: 'Casual Leave', fromDate: '2026-09-28', toDate: '2026-09-28', days: 1, reason: '' })}>Add Request</PrimaryButton>}>
                    <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Employee', 'Type', 'Dates', 'Reason', 'Status', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                        <tbody>{requests.map((row) => <tr key={row.id} className='border-b border-[#f2f4f7]'><td className={td}>{employeeName(row.employeeId)}</td><td className={td}>{row.leaveType}</td><td className={td}>{row.fromDate} – {row.toDate}</td><td className={td}>{row.reason}</td><td className={td}><Badge value={row.status} /></td><td className={td}>{row.status === 'Pending' && <><button type='button' className='text-[#4CAF50] mr-2' onClick={() => decide(row, 'Approved')}>Approve</button><button type='button' className='text-red-500' onClick={() => decide(row, 'Rejected')}>Reject</button></>}</td></tr>)}</tbody>
                    </table>
                </TableWrap>
            )}
            {form && <Modal title={policiesMode ? 'Leave policy' : 'Leave request'} onClose={() => setForm(null)}>
                <form onSubmit={policiesMode ? savePolicy : saveRequest} className='grid gap-3'>
                    {policiesMode ? <>
                        <input className={inputClass} placeholder='Policy name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{[...new Set(['Academics', 'Admin', 'Support / Operations', ...EMPLOYEE_CATEGORIES])].map((item) => <option key={item}>{item}</option>)}</select>
                        <input className={inputClass} placeholder='Leave type' value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} />
                        <input className={inputClass} type='number' placeholder='Entitlement' value={form.entitlement} onChange={(e) => setForm({ ...form, entitlement: e.target.value })} />
                    </> : <>
                        <select className={inputClass} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                        <input className={inputClass} value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} />
                        <input className={inputClass} value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />
                        <input className={inputClass} value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} />
                        <input className={inputClass} placeholder='Reason' value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                    </>}
                    <PrimaryButton type='submit'>Save</PrimaryButton>
                </form>
            </Modal>}
        </section>
    )
}

export default LeaveManagement
