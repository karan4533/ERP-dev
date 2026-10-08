import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { DISCIPLINE_ACTORS, DISCIPLINE_FLOW } from '../domain/hrSeed'
import { canMutate, employeeName, getDisciplinary, getEmployees, nextId, pushNotification, saveDisciplinary } from '../domain/hrStore'
import { Badge, Modal, PageIntro, PrimaryButton, TableWrap, inputClass, td, th, useHrTick } from '../components/HrUi'

const Disciplinary = () => {
    const tick = useHrTick()
    const rows = useMemo(() => getDisciplinary().filter((row) => row?.id), [tick])
    const employees = useMemo(() => getEmployees().filter((row) => row?.id), [tick])
    const [form, setForm] = useState(null)
    const [view, setView] = useState(null)

    const advance = (row) => {
        const index = DISCIPLINE_FLOW.indexOf(row.status)
        const status = DISCIPLINE_FLOW[Math.min(index + 1, DISCIPLINE_FLOW.length - 1)]
        const actor = DISCIPLINE_ACTORS[row.status] || 'Employee'
        saveDisciplinary(getDisciplinary().filter(Boolean).map((item) => item.id === row.id ? { ...item, status, acknowledgement: item.acknowledgement, chain: [...(item.chain || []), { actor, decision: status === 'APPROVED' ? 'Approved' : 'Recommended', at: '24-09-2026', comments: '' }] } : item))
        toast.success(`${row.id} is now ${status}.`)
    }

    const acknowledge = (row) => {
        if (row.status !== 'APPROVED') return toast.error('Acknowledgement follows final approval.')
        saveDisciplinary(getDisciplinary().filter(Boolean).map((item) => item.id === row?.id ? { ...item, acknowledgement: 'Acknowledged', chain: [...(item.chain || []), { actor: 'Employee', decision: 'Acknowledged', at: '24-09-2026', comments: row?.explanation || 'Noted' }] } : item))
        toast.success('Employee acknowledgement recorded.')
    }

    return (
        <section>
            <PageIntro text='Approved notices stay on file. Edit and delete stay disabled after approval. This lock is only in the browser.' />
            <TableWrap title='Disciplinary Action' action={<PrimaryButton onClick={() => employees[0] && setForm({ employeeId: employees[0].id, date: '2026-09-24', actionType: 'Warning', incident: '', details: '', remarks: '' })}>New notice</PrimaryButton>}>
                <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Notice', 'Employee', 'Type', 'Incident', 'Status', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{rows.map((row) => {
                        if (!row) return null
                        const showReview = canMutate(row) && row.status !== 'APPROVED'
                        const showAck = row.acknowledgement !== 'Acknowledged'
                        return (
                            <tr key={row.id} className='border-b'>
                                <td className={td}>{row.id}</td>
                                <td className={td}>{employeeName(row.employeeId)}</td>
                                <td className={td}>{row.actionType}</td>
                                <td className={td}>{row.incident}</td>
                                <td className={td}><Badge value={row.status} /></td>
                                <td className={td}>
                                    <button type='button' className='text-[#515DEF] mr-2' onClick={() => setView(row)}>History</button>
                                    {showReview && <button type='button' className='text-[#515DEF] mr-2' onClick={() => advance(row)}>Review</button>}
                                    {showAck && <button type='button' className='text-[#515DEF]' onClick={() => acknowledge(row)}>Acknowledge</button>}
                                </td>
                            </tr>
                        )
                    })}</tbody>
                </table>
            </TableWrap>
            {view && <Modal title={view.id} onClose={() => setView(null)}><ul className='text-sm space-y-2'>{(view.chain || []).map((step, index) => <li key={index}>{step?.at} · {step?.actor} · {step?.decision} {step?.comments}</li>)}{(view.chain || []).length === 0 && <li>No review steps yet.</li>}</ul></Modal>}
            {form && <DisciplineForm form={form} employees={employees} rows={rows} setForm={setForm} />}
        </section>
    )
}

const DisciplineForm = ({ form, employees, rows, setForm }) => {
    const save = (event) => {
        event.preventDefault()
        if (!form?.incident?.trim()) return toast.error('Deviation or incident is required.')
        const record = { id: nextId('DSC-2026', rows), employeeId: form.employeeId, date: form.date, actionType: form.actionType, incident: form.incident, details: form.details, previous: 'None', explanation: '', acknowledgement: 'Pending', remarks: form.remarks, status: 'HR_REVIEW', chain: [] }
        saveDisciplinary([record, ...getDisciplinary()])
        pushNotification({ type: 'Disciplinary', title: 'Disciplinary Review Pending', message: `${record.actionType} for ${employeeName(record.employeeId)}.`, relatedDate: record.date })
        toast.success('Notice sent to the HR review step.')
        setForm(null)
    }
    return (
        <Modal title='Disciplinary notice' onClose={() => setForm(null)}>
            <form onSubmit={save} className='grid gap-3'>
                <select className={inputClass} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <select className={inputClass} value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value })}><option>Warning</option><option>Memo</option><option>Suspended</option></select>
                <input className={inputClass} placeholder='Deviation / incident' value={form.incident} onChange={(e) => setForm({ ...form, incident: e.target.value })} />
                <input className={inputClass} placeholder='Details' value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
                <PrimaryButton type='submit'>Save</PrimaryButton>
            </form>
        </Modal>
    )
}

export default Disciplinary
