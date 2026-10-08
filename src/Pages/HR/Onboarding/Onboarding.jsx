import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ACADEMIC_CRITERIA, ADMIN_CRITERIA } from '../domain/hrSeed'
import { completionOf, employeeName, getEmployees, getObservations, getOnboarding, getShadow, nextId, saveObservations, saveOnboarding, saveShadow } from '../domain/hrStore'
import { Badge, Modal, PageIntro, PrimaryButton, TableWrap, inputClass, td, th, useHrTick } from '../components/HrUi'

const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Blocked']

const scoreAverage = (reviewer) => {
    const values = Object.values(reviewer.scores || {})
    if (!values.length) return 0
    return Math.round((values.reduce((sum, value) => sum + Number(value), 0) / values.length) * 10) / 10
}

const Onboarding = () => {
    const path = useLocation().pathname
    const mode = path.includes('observations') ? 'observations' : path.includes('shadow') ? 'shadow' : path.includes('joiners') ? 'joiners' : 'checklist'
    const tick = useHrTick()
    const records = useMemo(() => getOnboarding(), [tick])
    const observations = useMemo(() => getObservations(), [tick])
    const shadows = useMemo(() => getShadow(), [tick])
    const employees = useMemo(() => getEmployees(), [tick])
    const [selected, setSelected] = useState(records[0]?.id)
    const [form, setForm] = useState(null)
    const current = records.find((item) => item.id === selected) || records[0]

    const updateItem = (label, status) => {
        const checklist = current.checklist.map((item) => (item.label === label ? { ...item, status } : item))
        const done = checklist.filter((item) => item.status === 'Completed').length
        const overallStatus = done === checklist.length ? 'Completed' : checklist.some((item) => item.status === 'Blocked') ? 'Blocked' : 'In Progress'
        saveOnboarding(getOnboarding().map((item) => (item.id === current.id ? { ...item, checklist, overallStatus } : item)))
    }

    const saveObservation = (event) => {
        event.preventDefault()
        const criteria = form.template === 'Admin' ? ADMIN_CRITERIA : ACADEMIC_CRITERIA
        const reviewerCount = form.template === 'Admin' ? 2 : 4
        const reviewers = Array.from({ length: reviewerCount }, (_, index) => ({
            name: form[`reviewer${index}`] || `Reviewer ${index + 1}`,
            scores: Object.fromEntries(criteria.map((criterion) => [criterion, Number(form[`${criterion}-${index}`] || 2)])),
            comments: form[`comment${index}`] || '',
        }))
        const record = { id: form.id || nextId('OBS-2026', observations), employeeId: form.employeeId, template: form.template, reviewDate: form.reviewDate, status: form.status, reviewers, appreciation: form.appreciation, improvement: form.improvement, remarks: form.remarks }
        saveObservations(form.id ? getObservations().map((item) => (item.id === form.id ? record : item)) : [record, ...getObservations()])
        toast.success('Observation saved.')
        setForm(null)
    }

    const saveShadow = (event) => {
        event.preventDefault()
        if (!form.employeeId || !form.mentorId) return toast.error('New recruit and mentor are required.')
        const record = { ...form, id: form.id || nextId('SHD-2026', shadows), schoolEthos: Number(form.schoolEthos), adaptability: Number(form.adaptability), acceptance: Number(form.acceptance) }
        saveShadow(form.id ? getShadow().map((item) => (item.id === form.id ? record : item)) : [record, ...getShadow()])
        toast.success('Shadow mentor record saved.')
        setForm(null)
    }

    return (
        <section>
            <PageIntro text='Onboarding, joiner details, observations, and shadow mentoring share the same employee.' />
            {mode === 'checklist' && current && (
                <div className='bg-white rounded-2xl shadow-md p-4 mt-6'>
                    <div className='flex flex-wrap gap-2 mb-4'>{records.map((item) => <button key={item.id} type='button' className={`text-sm px-3 py-1 rounded-md cursor-pointer ${current.id === item.id ? 'bg-[#515DEF] text-white' : 'border border-[#515DEF] text-[#515DEF]'}`} onClick={() => setSelected(item.id)}>{employeeName(item.employeeId)} · {completionOf(item)}%</button>)}</div>
                    <p className='text-sm mb-3'><Badge value={current.overallStatus} /> Joining {current.joiningDate}</p>
                    <div className='space-y-2'>{current.checklist.map((item) => (
                        <div key={item.label} className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f2f4f7] py-2'>
                            <span className='text-sm'>{item.label}</span>
                            <select className='text-sm border border-[#D9D9D9] rounded-md px-2 py-1' value={item.status} onChange={(e) => updateItem(item.label, e.target.value)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
                        </div>
                    ))}</div>
                </div>
            )}
            {mode === 'joiners' && (
                <TableWrap title='New Joiner Details'>
                    <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Employee', 'DOB', 'Contact', 'Qualification', 'Emergency'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                        <tbody>{records.map((item) => {
                            const employee = employees.find((row) => row.id === item.employeeId)
                            if (!employee) return null
                            return <tr key={item.id} className='border-b border-[#f2f4f7]'><td className={td}>{employee.name}<div className='text-xs'>{employee.designation}</div></td><td className={td}>{employee.dateOfBirth}</td><td className={td}>{employee.contact}<div className='text-xs'>{employee.email}</div></td><td className={td}>{employee.qualification}</td><td className={td}>{employee.emergencyContact || '—'}</td></tr>
                        })}</tbody>
                    </table>
                </TableWrap>
            )}
            {mode === 'observations' && (
                <>
                    <TableWrap title='New Joinee Observation' action={<PrimaryButton onClick={() => setForm({ template: 'Admin', employeeId: employees[0].id, reviewDate: '2026-09-24', status: 'In Progress', appreciation: '', improvement: '', remarks: '' })}>Add Observation</PrimaryButton>}>
                        <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Employee', 'Template', 'Reviewers', 'Average', 'Status'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                            <tbody>{observations.map((item) => {
                                const avg = item.reviewers.reduce((sum, reviewer) => sum + scoreAverage(reviewer), 0) / item.reviewers.length
                                return <tr key={item.id} className='border-b border-[#f2f4f7]'><td className={td}>{employeeName(item.employeeId)}</td><td className={td}>{item.template}</td><td className={td}>{item.reviewers.map((reviewer) => `${reviewer.name} (${scoreAverage(reviewer)})`).join(', ')}</td><td className={td}>{avg.toFixed(1)}</td><td className={td}><Badge value={item.status} /></td></tr>
                            })}</tbody>
                        </table>
                    </TableWrap>
                    {form && <Modal title={`${form.template} observation`} onClose={() => setForm(null)} wide>
                        <form onSubmit={saveObservation} className='grid gap-3'>
                            <select className={inputClass} value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })}><option>Admin</option><option>Academics</option></select>
                            <select className={inputClass} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                            <input className={inputClass} value={form.reviewDate} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} />
                            {(form.template === 'Admin' ? ADMIN_CRITERIA : ACADEMIC_CRITERIA).slice(0, 3).map((criterion) => <p key={criterion} className='text-xs text-[#667085]'>{criterion} uses 1–3 in reviewer columns after save. Default score is 2.</p>)}
                            {Array.from({ length: form.template === 'Admin' ? 2 : 4 }, (_, index) => <input key={index} className={inputClass} placeholder={`Reviewer ${index + 1}`} value={form[`reviewer${index}`] || ''} onChange={(e) => setForm({ ...form, [`reviewer${index}`]: e.target.value })} />)}
                            <input className={inputClass} placeholder='Appreciation' value={form.appreciation} onChange={(e) => setForm({ ...form, appreciation: e.target.value })} />
                            <input className={inputClass} placeholder='Area of improvement' value={form.improvement} onChange={(e) => setForm({ ...form, improvement: e.target.value })} />
                            <input className={inputClass} placeholder='Overall remarks' value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                            <PrimaryButton type='submit'>Save</PrimaryButton>
                        </form>
                    </Modal>}
                </>
            )}
            {mode === 'shadow' && (
                <>
                    <TableWrap title='Shadow Mentor' action={<PrimaryButton onClick={() => setForm({ employeeId: employees[0].id, mentorId: employees[1].id, startDate: '2026-09-24', endDate: '2026-10-08', duration: '15 days', schoolEthos: 2, adaptability: 2, acceptance: 2, menteeResponse: '', practicalDifficulties: '', bestQualities: '', generalComments: '', mentorRemarks: '', reviewerRemarks: '', status: 'In Progress' })}>Add Record</PrimaryButton>}>
                        <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Recruit', 'Mentor', 'Duration', 'Ethos', 'Status'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                            <tbody>{shadows.map((item) => <tr key={item.id} className='border-b border-[#f2f4f7]'><td className={td}>{employeeName(item.employeeId)}</td><td className={td}>{employeeName(item.mentorId)}</td><td className={td}>{item.startDate} – {item.endDate}</td><td className={td}>{item.schoolEthos}/3</td><td className={td}><Badge value={item.status} /></td></tr>)}</tbody>
                        </table>
                    </TableWrap>
                    {form && <Modal title='Shadow mentor' onClose={() => setForm(null)} wide>
                        <form onSubmit={saveShadow} className='grid md:grid-cols-2 gap-3'>
                            <select className={inputClass} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                            <select className={inputClass} value={form.mentorId} onChange={(e) => setForm({ ...form, mentorId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                            {['startDate', 'endDate', 'duration', 'menteeResponse', 'practicalDifficulties', 'bestQualities', 'generalComments', 'mentorRemarks', 'reviewerRemarks'].map((key) => <input key={key} className={inputClass} placeholder={key} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
                            {['schoolEthos', 'adaptability', 'acceptance'].map((key) => <select key={key} className={inputClass} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>{[1, 2, 3].map((n) => <option key={n} value={n}>{key} {n}</option>)}</select>)}
                            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>In Progress</option><option>Completed</option><option>Closed</option></select>
                            <p className='md:col-span-2 text-xs text-[#667085]'>Principal, Director Academics, JD Admin, and JD Audit can record a remark. Closing the record makes that remark visible on this HR screen.</p>
                            {['Principal', 'Director Academics', 'JD Admin', 'JD Audit'].map((role) => <input key={role} className={inputClass} placeholder={`${role} remark`} value={form.reviewerComments?.[role] || ''} onChange={(e) => setForm({ ...form, reviewerComments: { ...(form.reviewerComments || {}), [role]: e.target.value } })} />)}
                            <PrimaryButton type='submit'>Save</PrimaryButton>
                        </form>
                    </Modal>}
                </>
            )}
        </section>
    )
}

export default Onboarding
