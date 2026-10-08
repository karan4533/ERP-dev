import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { employeeName, getEmployees, getExits, nextId, pushNotification, saveExits } from '../domain/hrStore'
import { Badge, Modal, PageIntro, PrimaryButton, TableWrap, inputClass, td, th, useHrTick } from '../components/HrUi'

const FLAGS = ['noticeServed', 'handover', 'assets', 'documents', 'finance', 'departmentClearance', 'hrClearance', 'exitInterview']

const ExitFormalities = () => {
    const tick = useHrTick()
    const rows = useMemo(() => getExits().filter((row) => row?.employeeId), [tick])
    const employees = useMemo(() => getEmployees().filter((row) => row?.id), [tick])
    const [form, setForm] = useState(null)
    const [open, setOpen] = useState(rows[0]?.id)

    const toggle = (row, key) => {
        const next = { ...row, [key]: !row[key] }
        const done = FLAGS.every((flag) => next[flag])
        next.status = done ? 'Completed' : FLAGS.some((flag) => next[flag]) ? 'In Progress' : 'Initiated'
        if (!done && next.finance === false) next.status = next.status === 'Initiated' ? 'Initiated' : 'Pending Clearance'
        saveExits(getExits().filter(Boolean).map((item) => item.id === row?.id ? next : item))
    }

    const current = rows.find((item) => item?.id === open) || rows[0] || null

    return (
        <section>
            <PageIntro text='Clearance steps are department, assets, finance, and HR. Completing every step marks the exit completed.' />
            <TableWrap title='Exit Formalities' action={<PrimaryButton onClick={() => employees[0] && setForm({ employeeId: employees[0].id, lastWorkingDate: '', exitType: 'Resignation', reason: '' })}>Initiate exit</PrimaryButton>}>
                <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Employee', 'Last working', 'Type', 'Status', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{rows.map((row) => row ? <tr key={row.id} className='border-b'><td className={td}>{employeeName(row.employeeId)}</td><td className={td}>{row.lastWorkingDate}</td><td className={td}>{row.exitType}</td><td className={td}><Badge value={row.status} /></td><td className={td}><button type='button' className='text-[#515DEF]' onClick={() => setOpen(row.id)}>Clearance</button></td></tr> : null)}</tbody>
                </table>
            </TableWrap>
            {current && <div className='bg-white rounded-2xl shadow-md p-4 mt-4'>
                <h3 className='font-medium mb-3'>{employeeName(current.employeeId)} timeline</h3>
                <ul className='text-sm space-y-2 mb-4'><li>Initiated · last working {current.lastWorkingDate}</li><li>Reason · {current.reason}</li><li>Status · {current.status}</li><li>Exit interview · {current.exitInterviewResponse ? 'Response received' : 'Waiting for employee response'}</li></ul>
                {current.exitInterviewResponse && <div className='text-sm mb-4 space-y-1'>{Object.entries(current.exitInterviewResponse).map(([question, answer]) => <p key={question}><span className='text-[#667085]'>{question}:</span> {answer}</p>)}<button type='button' className='text-[#515DEF]' onClick={() => { saveExits(getExits().map((item) => item.id === current.id ? { ...item, exitInterview: true, exitInterviewClosedBy: 'HR' } : item)); toast.success('Exit interview closed by HR.') }}>Close exit interview</button></div>}
                <div className='grid sm:grid-cols-2 gap-2'>{FLAGS.map((flag) => <label key={flag} className='text-sm flex gap-2 items-center'><input type='checkbox' checked={!!current[flag]} onChange={() => toggle(current, flag)} />{flag}</label>)}</div>
            </div>}
            {form && <ExitForm form={form} employees={employees} rows={rows} setForm={setForm} />}
        </section>
    )
}

const ExitForm = ({ form, employees, rows, setForm }) => {
    const save = (event) => {
        event.preventDefault()
        if (!form?.lastWorkingDate) return toast.error('Last working date is required.')
        const record = { id: nextId('EXT-2026', rows), employeeId: form.employeeId, lastWorkingDate: form.lastWorkingDate, exitType: form.exitType, reason: form.reason, noticePeriod: '30 days', noticeServed: false, handover: false, assets: false, documents: false, finance: false, departmentClearance: false, hrClearance: false, exitInterview: false, remarks: '', status: 'Initiated' }
        saveExits([record, ...getExits()])
        pushNotification({ type: 'Exit', title: 'Exit Clearance Pending', message: `${employeeName(record.employeeId)} exit initiated.`, relatedDate: record.lastWorkingDate })
        toast.success('Exit initiated.')
        setForm(null)
    }
    return (
        <Modal title='Initiate exit' onClose={() => setForm(null)}>
            <form onSubmit={save} className='grid gap-3'>
                <select className={inputClass} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <input className={inputClass} placeholder='Last working date' value={form.lastWorkingDate} onChange={(e) => setForm({ ...form, lastWorkingDate: e.target.value })} />
                <select className={inputClass} value={form.exitType} onChange={(e) => setForm({ ...form, exitType: e.target.value })}><option>Resignation</option><option>Retirement</option><option>Termination</option></select>
                <input className={inputClass} placeholder='Reason' value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                <PrimaryButton type='submit'>Save</PrimaryButton>
            </form>
        </Modal>
    )
}

export default ExitFormalities
