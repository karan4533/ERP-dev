import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { DataTable } from '../../../Common/ui'
import { employeeName, getConcessions, getEmployees, nextId, saveConcessions } from '../domain/hrStore'
import { formatInr } from '../domain/payrollCalculations'
import { Badge, Modal, PrimaryButton, PageIntro, TableWrap, inputClass } from '../components/HrUi'
import { useHrTick } from '../components/hrUiState'

const ChildConcession = () => {
    const tick = useHrTick()
    const rows = useMemo(() => { void tick; return getConcessions() }, [tick])
    const employees = useMemo(() => { void tick; return getEmployees() }, [tick])
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
        const percent = Number(form.percent)
        const amount = Number(form.amount)
        if (!form.employeeId || !student) return toast.error('Select an enrolled student and employee.')
        if (!(percent >= 0 && percent <= 100) || !(amount >= 0)) return toast.error('Enter a valid percentage and amount.')
        const record = { id: nextId('CON-2026', rows), employeeId: form.employeeId, studentId: student.id, studentName: student.name, relationship: form.relationship, admissionNumber: student.admissionNumber || '', className: student.className || form.className, academicYear: '2026-27', type: form.type, percent, amount, from: form.from, to: form.to, status: 'Pending', approvedBy: '' }
        saveConcessions([record, ...getConcessions()])
        toast.success('Concession saved against the existing student list.')
        setForm(null)
    }
    const columns = [
        { key: 'employeeId', label: 'Employee', required: true, render: (row) => employeeName(row.employeeId) },
        { key: 'studentName', label: 'Student', required: true },
        { key: 'admissionNumber', label: 'Admission' },
        { key: 'type', label: 'Type', render: (row) => `${row.type} · ${row.percent}%` },
        { key: 'amount', label: 'Amount', render: (row) => formatInr(row.amount) },
        { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    ]
    return (
        <section>
            <PageIntro text={students.length ? 'Students are chosen from the existing student database. This page does not create a second student list.' : 'No enrolled students are available. Complete an admission and enrolment before creating a staff-child concession.'} />
            <TableWrap title='Employee Child Concession' action={students.length ? <PrimaryButton onClick={() => setForm({ employeeId: employees[0]?.id || '', studentId: students[0]?.id || '', relationship: 'Son', className: students[0]?.className || '', type: 'Staff Child Tuition', percent: 25, amount: 10000, from: '2026-04-01', to: '2027-03-31' })}>Add concession</PrimaryButton> : <button type='button' disabled className='rounded-md bg-[#E4E7EC] px-4 py-2 text-sm text-[#667085]'>Add unavailable</button>}>
                <DataTable caption='Employee child concession register' rows={rows} columns={columns} rowKey='id' emptyTitle='No child concessions found' emptyDescription='Eligible concessions appear here after an enrolled student is selected.' />
            </TableWrap>
            {form && <Modal title='Concession' onClose={() => setForm(null)}><form onSubmit={save} className='grid gap-3'>
                <select className={inputClass} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <select className={inputClass} value={form.studentId || ''} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                    <option value=''>No enrolled student selected</option>
                    {students.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.admissionNumber}</option>)}
                </select>
                {['relationship', 'className', 'type', 'percent', 'amount', 'from', 'to'].map((key) => <input key={key} className={inputClass} placeholder={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
                <PrimaryButton type='submit'>Save</PrimaryButton>
            </form></Modal>}
        </section>
    )
}

export default ChildConcession
