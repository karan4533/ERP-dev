import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ConfirmAction, DataTable } from '../../../Common/ui'
import { formatInr } from '../domain/payrollCalculations'
import { applyRevision, canMutate, employeeName, getEmployees, getPerformance, getPayrollBundle, nextId, savePerformance, savePayrollBundle } from '../domain/hrStore'
import { Badge, Modal, PageIntro, PrimaryButton, TableWrap, inputClass } from '../components/HrUi'
import { useHrTick } from '../components/hrUiState'

const RATINGS = ['Above Average', 'Average', 'Below Average']

const Performance = () => {
    const path = useLocation().pathname
    const mode = path.includes('increment') ? 'increment' : path.includes('bsc') ? 'bsc' : path.includes('comparison') ? 'comparison' : 'review'
    const tick = useHrTick()
    const reviews = useMemo(() => {
        void tick
        return getPerformance()
    }, [tick])
    const revisions = useMemo(() => {
        void tick
        return getPayrollBundle().revisions || []
    }, [tick])
    const employees = useMemo(() => {
        void tick
        return getEmployees()
    }, [tick])
    const [form, setForm] = useState(null)
    const [pendingRevision, setPendingRevision] = useState(null)

    const saveReview = (event) => {
        event.preventDefault()
        if (!form.employeeId) return toast.error('Employee is required.')
        const record = { ...form, id: form.id || nextId('PRF-2026', reviews), bsc: Number(form.bsc), audit: Number(form.audit), score: Number(form.score), status: form.status || 'Pending' }
        savePerformance(form.id ? getPerformance().map((item) => item.id === form.id ? record : item) : [record, ...getPerformance()])
        toast.success('Performance review saved.')
        setForm(null)
    }

    const commitRevision = (submittedForm) => {
        const currentGross = Number(submittedForm.currentGross)
        const percent = Number(submittedForm.revisionPercent)
        const revisedGross = Math.round(currentGross * (1 + percent / 100))
        const record = { ...submittedForm, id: submittedForm.id || nextId('REV-2026', revisions), currentGross, revisionPercent: percent, revisedGross, promotion: submittedForm.promotion === true || submittedForm.promotion === 'Yes' }
        const next = submittedForm.id ? revisions.map((item) => item.id === submittedForm.id ? record : item) : [record, ...revisions]
        savePayrollBundle({ ...getPayrollBundle(), revisions: next })
        applyRevision(record)
        toast.success(record.status === 'Applied' ? 'Revision applied to current salary.' : 'Revision saved.')
        setPendingRevision(null)
        setForm(null)
    }

    const saveRevision = (event) => {
        event.preventDefault()
        if (!form) return
        const percent = Number(form.revisionPercent)
        if (!form.employeeId || !(percent >= 0)) return toast.error('Employee and revision percent are required.')
        if (form.id && !canMutate(getPayrollBundle().revisions.find((item) => item.id === form.id))) return toast.error('Applied revisions are locked.')
        if (form.status === 'Applied') {
            setPendingRevision({ ...form, revisionPercent: percent })
            return
        }
        commitRevision({ ...form, revisionPercent: percent })
    }

    const reviewColumns = [
        { key: 'employeeId', label: 'Employee', required: true, render: (row) => <span className='block'><span className='block font-medium text-[#1E1E1E]'>{employeeName(row.employeeId)}</span><span className='block text-xs text-[#667085]'>{row.reviewer || 'Reviewer pending'}</span></span> },
        { key: 'period', label: 'Period' },
        { key: 'bsc', label: 'BSC' },
        { key: 'audit', label: 'Audit' },
        { key: 'score', label: 'Score' },
        { key: 'rating', label: 'Rating', render: (row) => <Badge value={row.rating} /> },
        { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    ]
    const revisionColumns = [
        { key: 'employeeId', label: 'Employee', required: true, render: (row) => employeeName(row.employeeId) },
        { key: 'effectiveDate', label: 'Effective' },
        { key: 'currentGross', label: 'Current', render: (row) => formatInr(row.currentGross) },
        { key: 'revisedGross', label: 'Revised', render: (row) => formatInr(row.revisedGross) },
        { key: 'revisionPercent', label: '%' },
        { key: 'promotion', label: 'Promotion', render: (row) => row.promotion ? 'Yes' : 'No' },
        { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    ]

    return (
        <section>
            <PageIntro text='Ratings stay on Above Average, Average, and Below Average. Applied increments update the employee gross and keep history.' />
            {mode !== 'increment' && (
                <TableWrap title={mode === 'bsc' ? 'BSC / Audit Score' : mode === 'comparison' ? 'Performance Comparison' : 'Performance Review'} action={mode === 'review' && <PrimaryButton onClick={() => setForm({ employeeId: employees[0].id, period: '2025–26', reviewer: '', goals: '', bsc: 70, audit: 70, score: 3, strengths: '', improvement: '', remarks: '', rating: 'Average', status: 'Pending' })}>Add Review</PrimaryButton>}>
                    <DataTable caption='Employee performance review register' rows={reviews} columns={reviewColumns} rowKey='id' emptyTitle='No performance reviews found' emptyDescription='Create a review when an employee enters the appraisal cycle.' />
                    {mode === 'comparison' && <p className='text-sm text-[#667085] mt-3'>Above average: {reviews.filter((row) => row.rating === 'Above Average').length} · Average: {reviews.filter((row) => row.rating === 'Average').length} · Below average: {reviews.filter((row) => row.rating === 'Below Average').length}</p>}
                </TableWrap>
            )}
            {mode === 'increment' && (
                <TableWrap title='Increment / Promotion / Revision' action={<PrimaryButton onClick={() => setForm({ employeeId: employees[0].id, effectiveDate: '2026-04-01', currentDesignation: employees[0].designation, newDesignation: employees[0].designation, currentGross: employees[0].grossSalary, revisionPercent: 5, promotion: 'No', incrementType: 'Annual Increment', reason: '', approvedBy: 'Director Academics', status: 'Draft' })}>Add Revision</PrimaryButton>}>
                    <DataTable caption='Salary revision and promotion register' rows={revisions} columns={revisionColumns} rowKey='id' emptyTitle='No salary revisions found' emptyDescription='Create a draft revision to begin the approval workflow.' renderActions={(row) => canMutate(row) ? <button type='button' className='min-h-9 rounded-md border border-[#515DEF] px-3 text-xs font-semibold text-[#515DEF] hover:bg-[#F1F2FF]' onClick={() => setForm({ ...row, promotion: row.promotion ? 'Yes' : 'No' })}>Edit</button> : null} />
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
            <ConfirmAction
                open={Boolean(pendingRevision)}
                onClose={() => setPendingRevision(null)}
                onConfirm={() => pendingRevision && commitRevision(pendingRevision)}
                title='Apply salary revision?'
                description='This updates the employee’s current designation and gross salary in the HR demo records.'
                confirmLabel='Apply revision'
            >
                <p><strong>{pendingRevision ? employeeName(pendingRevision.employeeId) : ''}</strong> will move from {formatInr(pendingRevision?.currentGross || 0)} to {formatInr(Math.round(Number(pendingRevision?.currentGross || 0) * (1 + Number(pendingRevision?.revisionPercent || 0) / 100)))}. Production must require authorized approval and write an immutable payroll audit event.</p>
            </ConfirmAction>
        </section>
    )
}

export default Performance
