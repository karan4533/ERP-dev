import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { employeeName, getConcessions, getEmployees, nextId, saveConcessions } from '../domain/hrStore'
import { formatInr } from '../domain/payrollCalculations'
import { Badge, Modal, PageIntro, PrimaryButton, TableWrap, inputClass, td, th, useHrTick } from '../components/HrUi'

const ChildConcession = () => {
    const tick = useHrTick()
    const rows = useMemo(() => getConcessions(), [tick])
    const employees = useMemo(() => getEmployees(), [tick])
    const students = useMemo(() => {
        try {
            const parsed = JSON.parse(window.localStorage.getItem('schoolerp-enrolled-students') || '[]')
            return Array.isArray(parsed) ? parsed.slice(0, 12) : []
        } catch {
            return []
        }
    }, [])
    const [form, setForm] = useState(null)
    const save = (event) => {
        event.preventDefault()
        const student = students.find((item) => item.id === form.studentId)
        const record = { id: nextId('CON-2026', rows), employeeId: form.employeeId, studentName: student?.name || form.studentName || 'Staff child', relationship: form.relationship, admissionNumber: student?.admissionNumber || form.admissionNumber || '', className: form.className, academicYear: '2026-27', type: form.type, percent: Number(form.percent) || 0, amount: Number(form.amount) || 0, from: form.from, to: form.to, status: 'Pending', approvedBy: '' }
        saveConcessions([record, ...getConcessions()])
        toast.success('Concession saved against the existing student list.')
        setForm(null)
    }
    return (
        <section>
            <PageIntro text='Students are chosen from the existing student database. This page does not create a second student list.' />
            <TableWrap title='Employee Child Concession' action={<PrimaryButton onClick={() => setForm({ employeeId: employees[0].id, studentId: students[0]?.id, relationship: 'Son', className: 'Class 5', type: 'Staff Child Tuition', percent: 25, amount: 10000, from: '2026-04-01', to: '2027-03-31' })}>Add concession</PrimaryButton>}>
                <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Employee', 'Student', 'Admission', 'Type', 'Amount', 'Status'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{rows.map((row) => <tr key={row.id} className='border-b'><td className={td}>{employeeName(row.employeeId)}</td><td className={td}>{row.studentName}</td><td className={td}>{row.admissionNumber}</td><td className={td}>{row.type} · {row.percent}%</td><td className={td}>{formatInr(row.amount)}</td><td className={td}><Badge value={row.status} /></td></tr>)}</tbody>
                </table>
            </TableWrap>
            {form && <Modal title='Concession' onClose={() => setForm(null)}><form onSubmit={save} className='grid gap-3'>
                <select className={inputClass} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <select className={inputClass} value={form.studentId || ''} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                    <option value=''>No enrolled student selected</option>
                    {students.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.admissionNumber}</option>)}
                </select>
                <input className={inputClass} placeholder='Student name if not enrolled' value={form.studentName || ''} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
                {['relationship', 'className', 'type', 'percent', 'amount', 'from', 'to'].map((key) => <input key={key} className={inputClass} placeholder={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
                <PrimaryButton type='submit'>Save</PrimaryButton>
            </form></Modal>}
        </section>
    )
}

export default ChildConcession
