import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { formatInr } from '../domain/payrollCalculations'
import { applyRevision, canMutate, employeeName, getEmployees, getPerformance, getPayrollBundle, nextId, savePerformance, savePayrollBundle } from '../domain/hrStore'
import { Badge, Modal, PageIntro, PrimaryButton, TableWrap, inputClass, td, th, useHrTick } from '../components/HrUi'

const RATINGS = ['Above Average', 'Average', 'Below Average']

const Performance = () => {
    const path = useLocation().pathname
    const mode = path.includes('increment') ? 'increment' : path.includes('bsc') ? 'bsc' : path.includes('comparison') ? 'comparison' : 'review'
    const tick = useHrTick()
    const reviews = useMemo(() => getPerformance(), [tick])
    const revisions = useMemo(() => getPayrollBundle().revisions || [], [tick])
    const employees = useMemo(() => getEmployees(), [tick])
    const [form, setForm] = useState(null)

    const saveReview = (event) => {
        event.preventDefault()
        if (!form.employeeId) return toast.error('Employee is required.')
        const record = { ...form, id: form.id || nextId('PRF-2026', reviews), bsc: Number(form.bsc), audit: Number(form.audit), score: Number(form.score), status: form.status || 'Pending' }
        savePerformance(form.id ? getPerformance().map((item) => item.id === form.id ? record : item) : [record, ...getPerformance()])
        toast.success('Performance review saved.')
        setForm(null)
    }

    const saveRevision = (event) => {
        event.preventDefault()
        const currentGross = Number(form.currentGross)
        const percent = Number(form.revisionPercent)
        if (!form.employeeId || !(percent >= 0)) return toast.error('Employee and revision percent are required.')
        const revisedGross = Math.round(currentGross * (1 + percent / 100))
        const record = { ...form, id: form.id || nextId('REV-2026', revisions), currentGross, revisionPercent: percent, revisedGross, promotion: form.promotion === true || form.promotion === 'Yes' }
        if (form.id && !canMutate(getPayrollBundle().revisions.find((item) => item.id === form.id))) return toast.error('Applied revisions are locked.')
        const next = form.id ? revisions.map((item) => item.id === form.id ? record : item) : [record, ...revisions]
        savePayrollBundle({ ...getPayrollBundle(), revisions: next })
        applyRevision(record)
        toast.success(record.status === 'Applied' ? 'Revision applied to current salary.' : 'Revision saved.')
        setForm(null)
    }

    return (
        <section>
            <PageIntro text='Ratings stay on Above Average, Average, and Below Average. Applied increments update the employee gross and keep history.' />
            {mode !== 'increment' && (
                <TableWrap title={mode === 'bsc' ? 'BSC / Audit Score' : mode === 'comparison' ? 'Performance Comparison' : 'Performance Review'} action={mode === 'review' && <PrimaryButton onClick={() => setForm({ employeeId: employees[0].id, period: '2025–26', reviewer: '', goals: '', bsc: 70, audit: 70, score: 3, strengths: '', improvement: '', remarks: '', rating: 'Average', status: 'Pending' })}>Add Review</PrimaryButton>}>
                    <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Employee', 'Period', 'BSC', 'Audit', 'Score', 'Rating', 'Status'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                        <tbody>{reviews.map((row) => <tr key={row.id} className='border-b border-[#f2f4f7]'><td className={td}>{employeeName(row.employeeId)}<div className='text-xs'>{row.reviewer}</div></td><td className={td}>{row.period}</td><td className={td}>{row.bsc}</td><td className={td}>{row.audit}</td><td className={td}>{row.score}</td><td className={td}><Badge value={row.rating} /></td><td className={td}>{row.status}</td></tr>)}</tbody>
                    </table>
                    {mode === 'comparison' && <p className='text-sm text-[#667085] mt-3'>Above average: {reviews.filter((row) => row.rating === 'Above Average').length} · Average: {reviews.filter((row) => row.rating === 'Average').length} · Below average: {reviews.filter((row) => row.rating === 'Below Average').length}</p>}
                </TableWrap>
            )}
            {mode === 'increment' && (
                <TableWrap title='Increment / Promotion / Revision' action={<PrimaryButton onClick={() => setForm({ employeeId: employees[0].id, effectiveDate: '2026-04-01', currentDesignation: employees[0].designation, newDesignation: employees[0].designation, currentGross: employees[0].grossSalary, revisionPercent: 5, promotion: 'No', incrementType: 'Annual Increment', reason: '', approvedBy: 'Director Academics', status: 'Draft' })}>Add Revision</PrimaryButton>}>
                    <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Employee', 'Effective', 'Current', 'Revised', '%', 'Promotion', 'Status', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                        <tbody>{revisions.map((row) => <tr key={row.id} className='border-b border-[#f2f4f7]'><td className={td}>{employeeName(row.employeeId)}</td><td className={td}>{row.effectiveDate}</td><td className={td}>{formatInr(row.currentGross)}</td><td className={td}>{formatInr(row.revisedGross)}</td><td className={td}>{row.revisionPercent}</td><td className={td}>{row.promotion ? 'Yes' : 'No'}</td><td className={td}><Badge value={row.status} /></td><td className={td}>{canMutate(row) && <button type='button' className='text-[#515DEF]' onClick={() => setForm({ ...row, promotion: row.promotion ? 'Yes' : 'No' })}>Edit</button>}</td></tr>)}</tbody>
                    </table>
                </TableWrap>
            )}
            {form && mode !== 'increment' && <Modal title='Review' onClose={() => setForm(null)}>
                <form onSubmit={saveReview} className='grid gap-3'>
                    <select className={inputClass} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    {['period', 'reviewer', 'goals', 'bsc', 'audit', 'score', 'strengths', 'improvement', 'remarks'].map((key) => <input key={key} className={inputClass} placeholder={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
                    <select className={inputClass} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>{RATINGS.map((item) => <option key={item}>{item}</option>)}</select>
                    <PrimaryButton type='submit'>Save</PrimaryButton>
                </form>
            </Modal>}
            {form && mode === 'increment' && <Modal title='Revision' onClose={() => setForm(null)}>
                <form onSubmit={saveRevision} className='grid gap-3'>
                    <select className={inputClass} value={form.employeeId} onChange={(e) => { const employee = employees.find((item) => item.id === e.target.value); setForm({ ...form, employeeId: e.target.value, currentDesignation: employee.designation, currentGross: employee.grossSalary }) }}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    {['effectiveDate', 'newDesignation', 'currentGross', 'revisionPercent', 'incrementType', 'reason', 'approvedBy'].map((key) => <input key={key} className={inputClass} placeholder={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
                    <select className={inputClass} value={form.promotion} onChange={(e) => setForm({ ...form, promotion: e.target.value })}><option>No</option><option>Yes</option></select>
                    <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{['Draft', 'Recommended', 'Approved', 'Rejected', 'Applied'].map((item) => <option key={item}>{item}</option>)}</select>
                    <PrimaryButton type='submit'>Save</PrimaryButton>
                </form>
            </Modal>}
        </section>
    )
}

export default Performance
