import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { EMPLOYEE_CATEGORIES, DEPARTMENTS, EMPLOYEE_STATUSES } from '../domain/hrStatus'
import { PAYROLL_MONTHS, PAYROLL_YEARS, PAYROLL_CONFIG } from '../domain/payrollConfig'
import { formatInr } from '../domain/payrollCalculations'
import { buildPayslipModel, payslipHtml } from './payslipFormat'
import { downloadHtml, openPrintDocument } from '../../../Common/printDocument'
import { ADVANCE_ACTORS } from '../domain/hrSeed'
import { advanceNext, canMutate, employeeName, getAdvances, getEmployees, getPayrollBundle, getReferrals, nextId, payrollSummary, pushNotification, queueCommunication, referralAmountFor, salaryRows, saveAdvances, savePayrollBundle, saveReferrals, upsertPayslip } from '../domain/hrStore'
import { Badge, Modal, PageIntro, PrimaryButton } from '../components/HrUi'
import { useHrTick } from '../components/hrUiState'
import FinancialActionFlow from '../../../Common/Finance/FinancialActionFlow'
import { ConfirmAction, DataTable, IntegrationNotice } from '../../../Common/ui'

const SalaryStatement = () => {
    const tick = useHrTick()
    const [month, setMonth] = useState('June')
    const [year, setYear] = useState(2026)
    const [category, setCategory] = useState('')
    const [department, setDepartment] = useState('')
    const [status, setStatus] = useState('')
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState('statement')
    const [paymentCandidate, setPaymentCandidate] = useState(null)
    const rows = useMemo(() => {
        void tick
        return salaryRows(month, year, { category, department, status, search })
    }, [tick, month, year, category, department, status, search])
    const summary = useMemo(() => {
        void tick
        return payrollSummary(month, year)
    }, [tick, month, year])

    const recordDemoPayment = (row) => {
        const bundle = getPayrollBundle()
        const months = bundle.months.some((item) => item.employeeId === row.employeeId && item.month === month && Number(item.year) === Number(year))
            ? bundle.months.map((item) => item.employeeId === row.employeeId && item.month === month && Number(item.year) === Number(year) ? { ...item, paymentStatus: 'Paid', bankRef: `LOCAL-DEMO-${row.employeeId}`, paymentDate: new Date().toISOString().slice(0, 10), paymentMode: 'Demo record' } : item)
            : [...bundle.months, { employeeId: row.employeeId, month, year, workingDays: row.workingDays, lates: row.lates, permission: row.permission, casualLeave: row.casualLeave, otherLeave: row.otherLeave, absent: row.absent, notPunched: row.notPunched, paymentStatus: 'Paid', bankRef: `LOCAL-DEMO-${row.employeeId}`, paymentDate: new Date().toISOString().slice(0, 10), paymentMode: 'Demo record' }]
        savePayrollBundle({ ...bundle, months })
        setPaymentCandidate(null)
        toast.success('Demo payment record saved locally. No bank transaction was initiated.')
    }

    const summaryColumns = [
        { key: 'category', label: 'Category', required: true, render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{row.category}</span> },
        { key: 'count', label: 'Employees' },
        { key: 'grossSalary', label: 'Gross', render: (row) => formatInr(row.grossSalary) },
        { key: 'deductions', label: 'Deductions', render: (row) => formatInr(row.deductions) },
        { key: 'netSalary', label: 'Net', render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{formatInr(row.netSalary)}</span> },
        { key: 'pfEmployer', label: 'Employer PF', render: (row) => formatInr(row.pfEmployer) },
        { key: 'esiEmployer', label: 'Employer ESI', render: (row) => formatInr(row.esiEmployer) },
        { key: 'employerContribution', label: 'Employer contribution', render: (row) => formatInr(row.employerContribution) },
        { key: 'totalCost', label: 'Total cost', render: (row) => formatInr(row.totalCost) },
    ]

    const statementColumns = [
        { key: 'employeeName', label: 'Employee', required: true, render: (row) => <><span className='font-semibold text-[var(--erp-ink)]'>{row.employeeName}</span><span className='block text-xs text-[var(--erp-muted)]'>{row.employeeId}</span></> },
        { key: 'category', label: 'Category' },
        { key: 'workingDays', label: 'Days' },
        { key: 'lopDays', label: 'LOP' },
        { key: 'permissionCount', label: 'Permission' },
        { key: 'grossSalary', label: 'Gross', render: (row) => formatInr(row.grossSalary) },
        { key: 'basicSalary', label: 'Basic', render: (row) => formatInr(row.basicSalary) },
        { key: 'pfEmployee', label: 'PF', render: (row) => formatInr(row.pfEmployee) },
        { key: 'esiEmployee', label: 'ESI', render: (row) => formatInr(row.esiEmployee) },
        { key: 'advance', label: 'Advance', render: (row) => formatInr(row.advance) },
        { key: 'extraDeduction', label: 'Extra deduction', render: (row) => formatInr(row.extraDeduction) },
        { key: 'disciplinaryDeduction', label: 'Disciplinary', render: (row) => <><span>{formatInr(row.disciplinaryDeduction)}</span>{(row.disciplinaryLines || []).map((line) => <span key={line.id || line.actionType} className='block text-xs text-[var(--erp-muted)]'>{line.actionType} · {line.days} day{line.days === 1 ? '' : 's'} · {formatInr(line.amount)}</span>)}</> },
        { key: 'netSalary', label: 'Net', render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{formatInr(row.netSalary)}</span> },
        { key: 'paymentStatus', label: 'Payment', render: (row) => <><Badge value={row.paymentStatus} />{row.bankRef ? <span className='mt-1 block text-xs text-[var(--erp-muted)]'>{row.bankRef}</span> : null}</> },
    ]

    return (
        <section className='space-y-4'>
            <PageIntro text='One salary statement for every category. PF, ESI, and basic salary use the shared payroll configuration. Statutory filing is not included.'>
                <div className='grid md:grid-cols-3 lg:grid-cols-6 gap-3'>
                    <select className='border rounded-md px-2 py-2 text-sm' value={month} onChange={(e) => setMonth(e.target.value)}>{PAYROLL_MONTHS.map((item) => <option key={item}>{item}</option>)}</select>
                    <select className='border rounded-md px-2 py-2 text-sm' value={year} onChange={(e) => setYear(Number(e.target.value))}>{PAYROLL_YEARS.map((item) => <option key={item}>{item}</option>)}</select>
                    <select className='border rounded-md px-2 py-2 text-sm' value={category} onChange={(e) => setCategory(e.target.value)}><option value=''>All categories</option>{EMPLOYEE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
                    <select className='border rounded-md px-2 py-2 text-sm' value={department} onChange={(e) => setDepartment(e.target.value)}><option value=''>All departments</option>{DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}</select>
                    <select className='border rounded-md px-2 py-2 text-sm' value={status} onChange={(e) => setStatus(e.target.value)}><option value=''>All statuses</option>{EMPLOYEE_STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
                    <input className='border rounded-md px-2 py-2 text-sm' placeholder='Search' value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </PageIntro>
            <IntegrationNotice
                state='disconnected'
                title='Payment integration disconnected'
                description='No bank or payment API is connected. Recording a demo payment updates only this browser-stored payroll ledger and never initiates a transfer.'
            />
            <FinancialActionFlow current='Review' completed={['Calculate']} title='Payroll lifecycle' />
            <div className='flex gap-2'>
                <button type='button' className={`px-3 py-2 rounded-md text-sm cursor-pointer ${tab === 'statement' ? 'bg-[#515DEF] text-white' : 'bg-white border'}`} onClick={() => setTab('statement')}>Statement</button>
                <button type='button' className={`px-3 py-2 rounded-md text-sm cursor-pointer ${tab === 'summary' ? 'bg-[#515DEF] text-white' : 'bg-white border'}`} onClick={() => setTab('summary')}>Payroll Summary</button>
            </div>
            {tab === 'summary' ? (
                <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white'>
                    <DataTable caption={`${month} ${year} payroll summary`} rows={[...summary.lines, summary.totals]} columns={summaryColumns} rowKey='category' />
                </div>
            ) : (
                <div className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white'>
                    <DataTable
                        caption={`${month} ${year} salary statement`}
                        rows={rows}
                        columns={statementColumns}
                        rowKey='employeeId'
                        emptyTitle='No payroll records match these filters'
                        emptyDescription='Change category, department, status or search to review other employees.'
                        renderActions={(row) => row.paymentStatus !== 'Paid' ? <button type='button' className='min-h-9 rounded-md border border-[var(--erp-indigo)] px-3 text-sm font-semibold text-[var(--erp-indigo)]' onClick={() => setPaymentCandidate(row)}>Record demo payment</button> : undefined}
                    />
                    <p className='border-t border-[var(--erp-line)] px-4 py-3 text-xs text-[var(--erp-slate)]'>Basic is {PAYROLL_CONFIG.basicSalaryPercentage}% of payable gross. Permission already reduces pay through the late/permission day rule. Extra deduction is the special deduction. Approved disciplinary actions use the daily rate (gross ÷ working days): Warning 0 days, Memo 1 day, Suspended 2 days. The same amount is deducted in net salary.</p>
                </div>
            )}
            <ConfirmAction
                open={Boolean(paymentCandidate)}
                onClose={() => setPaymentCandidate(null)}
                onConfirm={() => paymentCandidate && recordDemoPayment(paymentCandidate)}
                title='Record demo payment?'
                description='This changes the browser-stored payroll status only. It does not contact a bank or transfer funds.'
                confirmLabel='Record demo payment'
            >
                {paymentCandidate && (
                    <p>
                        Record {formatInr(paymentCandidate.netSalary)} for <strong>{paymentCandidate.employeeName}</strong> as paid in the local demo ledger?
                    </p>
                )}
            </ConfirmAction>
        </section>
    )
}

const Payslip = () => {
    const tick = useHrTick()
    const [month, setMonth] = useState('June')
    const [year, setYear] = useState(2026)
    const slips = useMemo(() => {
        void tick
        return salaryRows(month, year).map((row) => ({ ...row, month, year }))
    }, [tick, month, year])
    const [active, setActive] = useState(slips[0]?.employeeId)
    const slip = slips.find((item) => item.employeeId === active) || slips[0]
    const employee = slip ? getEmployees().find((item) => item.id === slip.employeeId) : null
    const model = slip ? buildPayslipModel(slip, employee) : null
    const html = model ? payslipHtml(model) : ''
    return (
        <section>
            <PageIntro text='Payslip figures are the same calculation as the salary statement for the selected month.'>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                    <select className='min-w-0 w-full border rounded-md px-2 py-2 text-sm' value={month} onChange={(e) => setMonth(e.target.value)}>{PAYROLL_MONTHS.map((item) => <option key={item}>{item}</option>)}</select>
                    <select className='min-w-0 w-full border rounded-md px-2 py-2 text-sm' value={year} onChange={(e) => setYear(Number(e.target.value))}>{PAYROLL_YEARS.map((item) => <option key={item}>{item}</option>)}</select>
                    <select className='min-w-0 w-full border rounded-md px-2 py-2 text-sm' value={active || ''} onChange={(e) => setActive(e.target.value)}>{slips.map((item) => <option key={item.employeeId} value={item.employeeId}>{item.employeeName}</option>)}</select>
                </div>
            </PageIntro>
            {model && <div className='bg-white rounded-2xl shadow-md p-4 mt-4 text-sm'>
                <p className='text-center text-xs text-[#667085]'>{model.school.contactLine}</p>
                <h2 className='text-center text-xl font-semibold mt-3'>{model.school.name}</h2>
                <p className='text-center'>{model.school.affiliation}</p>
                <p className='text-center'>{model.school.addressLine}</p>
                <h3 className='text-center font-semibold my-4'>PAY SLIP FOR THE MONTH OF {model.monthLabel.toUpperCase()}</h3>
                <div className='grid sm:grid-cols-2 gap-2 border border-[#1E1E1E] p-3'>
                    <p>Employee Name: {model.employeeName}</p><p>Employee Code: {model.employeeCode}</p>
                    <p>Designation: {model.designation}</p><p>Monthly days {model.monthlyDays}</p>
                    <p>PAN No. {model.pan}</p><p>No. of days worked {model.daysWorked}</p>
                    <p>EPF - UAN NO. {model.uan}</p><p>Bank A/C. No. {model.bankAccount}</p>
                    <p>ESI Insurance No. {model.esiNumber}</p><p>DOJ: {model.doj}</p>
                </div>
                <div className='grid md:grid-cols-2 gap-4 mt-4'>
                    <table className='w-full border-collapse'><thead><tr><th className='border px-2 py-2 text-left' colSpan={2}>Earnings</th></tr><tr><th className='border px-2 py-2 text-left'>Particulars</th><th className='border px-2 py-2 text-left'>Amount</th></tr></thead><tbody>{model.earnings.map((line) => <tr key={line.particular}><td className='border px-2 py-2'>{line.particular}</td><td className='border px-2 py-2'>{model.formatAmount(line.amount)}</td></tr>)}</tbody></table>
                    <table className='w-full border-collapse'><thead><tr><th className='border px-2 py-2 text-left' colSpan={2}>Deductions</th></tr><tr><th className='border px-2 py-2 text-left'>Particulars</th><th className='border px-2 py-2 text-left'>Amount</th></tr></thead><tbody>{model.deductions.map((line) => <tr key={line.particular}><td className='border px-2 py-2'>{line.particular}{line.detail ? <div className='text-xs text-[#667085]'>{line.detail}</div> : null}</td><td className='border px-2 py-2'>{model.formatAmount(line.amount)}</td></tr>)}</tbody></table>
                </div>
                <div className='grid sm:grid-cols-2 gap-2 mt-3 font-medium'>
                    <p>Gross Earnings {model.formatAmount(model.grossEarnings)}</p>
                    <p>Total Deductions {model.formatAmount(model.totalDeductions)}</p>
                    <p className='sm:col-span-2'>Net Amount {model.formatAmount(model.netAmount)}</p>
                </div>
                <div className='grid sm:grid-cols-3 gap-4 mt-10 text-sm'>
                    <p>Manager - HR</p><p>Manager - Finance</p><p>Employee&apos;s Signature</p>
                </div>
                <div className='flex flex-wrap gap-2 mt-4'>
                    <PrimaryButton onClick={() => { upsertPayslip(slip, month, year); openPrintDocument({ title: `Payslip ${model.monthLabel}`, body: html }) }}>Print Payslip</PrimaryButton>
                    <PrimaryButton onClick={() => { upsertPayslip(slip, month, year); downloadHtml(`payslip-${slip.employeeId}-${month}-${year}.html`, `<!doctype html><html><head><meta charset="utf-8"><title>Payslip</title></head><body>${html}</body></html>`) }}>Export Payslip</PrimaryButton>
                    <PrimaryButton onClick={() => { queueCommunication({ channel: 'Email', subject: `Payslip ${slip.month}`, audience: slip.employeeName }); toast.success('Payslip queued as DEMO_SENT.') }}>Send demo email</PrimaryButton>
                </div>
            </div>}
        </section>
    )
}

const SalaryAdvance = () => {
    const tick = useHrTick()
    const rows = useMemo(() => {
        void tick
        return getAdvances().filter((row) => row?.id)
    }, [tick])
    const employees = useMemo(() => {
        void tick
        return getEmployees().filter((row) => row?.id)
    }, [tick])
    const [form, setForm] = useState(null)
    const [advanceCandidate, setAdvanceCandidate] = useState(null)
    const move = (row) => {
        if (!row || (!canMutate(row) && row.status !== 'SUBMITTED')) return
        const next = advanceNext(row.status === 'DRAFT' ? 'DRAFT' : row.status)
        const actor = ADVANCE_ACTORS[row.status] || 'Employee'
        const updated = { ...row, status: row.status === 'DRAFT' ? 'SUBMITTED' : next, chain: [...(row.chain || []), { actor, decision: 'Recommended', at: '24-09-2026', comments: 'Demo step' }] }
        if (updated.status === 'APPROVED') updated.outstanding = Number(row.amount) || 0
        saveAdvances(getAdvances().filter(Boolean).map((item) => item.id === row.id ? updated : item))
        pushNotification({ type: 'Payroll', title: 'Salary Advance Pending', message: `${row.id} is at ${updated.status}.`, relatedDate: row.requestedDate })
        toast.success(`${row.id} moved to ${updated.status}.`)
        setAdvanceCandidate(null)
    }
    const save = (event) => {
        event.preventDefault()
        if (!form) return
        const amount = Number(form.amount)
        const months = Number(form.months)
        if (!(amount > 0) || !(months > 0)) return toast.error('Amount and repayment months must be greater than zero.')
        const employee = employees.find((item) => item.id === form.employeeId)
        const record = { id: nextId('ADV-2026', rows), employeeId: form.employeeId, amount, reason: form.reason, requestedDate: form.requestedDate, months, existingLoan: false, existingAmount: 0, outstanding: 0, emi: Math.round(amount / months), currentDeduction: Math.round(amount / months), disciplinary: 'None', remarks: form.remarks, status: 'SUBMITTED', chain: [] }
        if (!employee) return
        saveAdvances([record, ...getAdvances()])
        toast.success('Advance submitted to HR.')
        setForm(null)
    }
    const columns = [
        { key: 'id', label: 'No', required: true },
        { key: 'employeeId', label: 'Employee', required: true, render: (row) => employeeName(row.employeeId) },
        { key: 'amount', label: 'Amount', render: (row) => formatInr(row.amount) },
        { key: 'emi', label: 'EMI', render: (row) => formatInr(row.emi) },
        { key: 'outstanding', label: 'Outstanding', render: (row) => formatInr(row.outstanding) },
        { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    ]
    return (
        <section>
            <PageIntro text='Approval labels stand in for Finance, JD Admin, Director, and MD. Approved advances deduct on the salary statement.' />
            <div className='bg-white rounded-2xl shadow-md p-4 mt-4'>
                <PrimaryButton onClick={() => employees[0] && setForm({ employeeId: employees[0].id, amount: '', months: 6, reason: '', requestedDate: '2026-09-24', remarks: '' })}>New request</PrimaryButton>
                <div className='mt-4 overflow-hidden rounded-xl border border-[var(--erp-line)]'><DataTable caption='Salary advance register' rows={rows} columns={columns} rowKey='id' emptyTitle='No salary advances found' emptyDescription='Submit an advance request to begin the governed review chain.' renderActions={(row) => !['APPROVED', 'REJECTED', 'CLOSED'].includes(row.status) ? <button type='button' className='min-h-9 rounded-md border border-[#515DEF] px-3 text-xs font-semibold text-[#515DEF]' onClick={() => setAdvanceCandidate(row)}>Advance step</button> : null} /></div>
            </div>
            {form && <Modal title='Salary advance' onClose={() => setForm(null)}>
                <form onSubmit={save} className='grid gap-3'>
                    <select className='border rounded-md px-2 py-2' value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatInr(item.grossSalary)}</option>)}</select>
                    <input className='border rounded-md px-2 py-2' placeholder='Amount' value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                    <input className='border rounded-md px-2 py-2' placeholder='Months' value={form.months} onChange={(e) => setForm({ ...form, months: e.target.value })} />
                    <input className='border rounded-md px-2 py-2' placeholder='Reason' value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                    <PrimaryButton type='submit'>Submit</PrimaryButton>
                </form>
            </Modal>}
            <ConfirmAction open={Boolean(advanceCandidate)} onClose={() => setAdvanceCandidate(null)} onConfirm={() => advanceCandidate && move(advanceCandidate)} title='Advance salary request?' description='This appends the next browser-stored review step and may eventually affect payroll deductions.' confirmLabel='Advance workflow'>
                <p><strong>{advanceCandidate?.id}</strong> · {advanceCandidate ? employeeName(advanceCandidate.employeeId) : ''} · {formatInr(advanceCandidate?.amount || 0)}. Production must validate the authenticated reviewer and persist comments and timestamps.</p>
            </ConfirmAction>
        </section>
    )
}

const CtcView = () => {
    const tick = useHrTick()
    const rows = useMemo(() => {
        void tick
        return salaryRows('June', 2026)
    }, [tick])
    const columns = [
        { key: 'employeeName', label: 'Employee', required: true },
        { key: 'grossSalary', label: 'Gross', render: (row) => formatInr(row.grossSalary) },
        { key: 'employeeDeductions', label: 'Employee deductions', render: (row) => formatInr(row.pfEmployee + row.esiEmployee) },
        { key: 'pfEmployer', label: 'Employer PF', render: (row) => formatInr(row.pfEmployer) },
        { key: 'esiEmployer', label: 'Employer ESI', render: (row) => formatInr(row.esiEmployer) },
        { key: 'annualGross', label: 'Annual gross', render: (row) => formatInr(row.annualGross) },
        { key: 'annualCtc', label: 'Annual CTC', required: true, render: (row) => <span className='font-semibold'>{formatInr(row.annualCtc)}</span> },
    ]
    return (
        <section>
            <PageIntro text='CTC is derived from gross, employer PF, employer ESI, and other employer benefits.' />
            <div className='bg-white rounded-2xl shadow-md mt-4 overflow-hidden'><DataTable caption='CTC register' rows={rows} columns={columns} rowKey='employeeId' emptyTitle='No CTC records found' emptyDescription='CTC appears when active employee payroll data is available.' /></div>
        </section>
    )
}

const nextReferralStatus = (status) => ({ Pending: 'Eligible', Eligible: 'Approved', Approved: 'Paid' }[status] || status)

const ReferralBonus = () => {
    const tick = useHrTick()
    const rows = useMemo(() => {
        void tick
        return getReferrals().filter((row) => row?.id)
    }, [tick])
    const employees = useMemo(() => {
        void tick
        return getEmployees().filter((row) => row?.id)
    }, [tick])
    const [form, setForm] = useState(null)
    const [referralCandidate, setReferralCandidate] = useState(null)
    const save = (event) => {
        event.preventDefault()
        if (!form?.referrerId) return toast.error('Referring employee is required.')
        const gross = Number(form.grossSalary) || 0
        const record = { id: nextId('REF-2026', rows), referrerId: form.referrerId, candidateId: '', position: form.position, department: form.department || '', joiningDate: form.joiningDate, grossSalary: gross, referralDate: '2026-09-24', eligibilityDate: form.joiningDate, percent: PAYROLL_CONFIG.referralBonusPercentage, amount: referralAmountFor(gross), status: gross > 0 ? 'Eligible' : 'Pending', remarks: form.remarks }
        saveReferrals([record, ...getReferrals()])
        toast.success('Referral saved.')
        setForm(null)
    }
    const setStatus = (row) => {
        const status = nextReferralStatus(row.status)
        saveReferrals(getReferrals().map((item) => item.id === row.id ? { ...item, status } : item))
        toast.success(`${row.id} moved to ${status}.`)
        setReferralCandidate(null)
    }
    const columns = [
        { key: 'id', label: 'ID', required: true },
        { key: 'referrerId', label: 'Referrer', required: true, render: (row) => employeeName(row.referrerId) },
        { key: 'position', label: 'Position' },
        { key: 'grossSalary', label: 'Gross', render: (row) => formatInr(row.grossSalary) },
        { key: 'amount', label: 'Amount', render: (row) => formatInr(row.amount) },
        { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    ]
    return (
        <section>
            <PageIntro text={`Referral bonus uses ${PAYROLL_CONFIG.referralBonusPercentage}% of the joined candidate gross salary.`} />
            <div className='bg-white rounded-2xl shadow-md p-4 mt-4'>
                <PrimaryButton onClick={() => employees[0] && setForm({ referrerId: employees[0].id, position: '', department: employees[0].department || 'Academic', joiningDate: '', grossSalary: '', remarks: '' })}>Add referral</PrimaryButton>
                <div className='mt-4 overflow-hidden rounded-xl border border-[var(--erp-line)]'><DataTable caption='Referral bonus register' rows={rows} columns={columns} rowKey='id' emptyTitle='No referrals found' emptyDescription='Add a referral to track eligibility and bonus approval.' renderActions={(row) => row.status !== 'Paid' ? <button type='button' className='min-h-9 rounded-md border border-[#515DEF] px-3 text-xs font-semibold text-[#515DEF]' onClick={() => setReferralCandidate(row)}>Move to {nextReferralStatus(row.status)}</button> : null} /></div>
            </div>
            {form && <Modal title='Referral' onClose={() => setForm(null)}><form onSubmit={save} className='grid gap-3'>
                <select className='border rounded-md px-2 py-2' value={form.referrerId} onChange={(e) => setForm({ ...form, referrerId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <input className='border rounded-md px-2 py-2' placeholder='Position' value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                <input className='border rounded-md px-2 py-2' placeholder='Gross salary' value={form.grossSalary} onChange={(e) => setForm({ ...form, grossSalary: e.target.value })} />
                <input className='border rounded-md px-2 py-2' placeholder='Joining date' value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
                <PrimaryButton type='submit'>Save</PrimaryButton>
            </form></Modal>}
            <ConfirmAction open={Boolean(referralCandidate)} onClose={() => setReferralCandidate(null)} onConfirm={() => referralCandidate && setStatus(referralCandidate)} title={`Move referral to ${nextReferralStatus(referralCandidate?.status)}?`} description='This changes the browser-stored referral bonus workflow status.' confirmLabel='Update status'>
                <p><strong>{referralCandidate?.id}</strong> · {formatInr(referralCandidate?.amount || 0)}. Payment status in production must only follow authorized approval and a verified payroll or bank reference.</p>
            </ConfirmAction>
        </section>
    )
}

const CLAIM_KEY = 'school-erp-hr-claims-v1'

const CLAIM_TYPES = [
    'Travel & Conveyance',
    'Food & Event Refreshment',
    'Teaching Aid & Materials',
    'Relocation & Transfer Allowance',
    'Medical & First Aid',
    'Workshop & Certification Fee',
]

const ClaimCompensation = () => {
    const [rows, setRows] = useState(() => {
        try {
            const stored = localStorage.getItem(CLAIM_KEY)
            if (stored) return JSON.parse(stored)
        } catch { /* ignore */ }
        return [
            {
                id: 'CLM-1001',
                employee: 'Priya Sharma',
                claimType: 'Travel & Conveyance',
                amount: 3200,
                expenseDate: '2026-10-15',
                purpose: 'Inter-school science exhibition transport and tolls for 12 students',
                billAttachment: 'Fuel_Toll_Receipts_Oct15.pdf',
                status: 'HR Verified',
                stage: 'Pending Finance Disbursement',
            },
            {
                id: 'CLM-1002',
                employee: 'Ravi Kumar',
                claimType: 'Teaching Aid & Materials',
                amount: 1450,
                expenseDate: '2026-10-20',
                purpose: 'Robotics sensor components purchased locally for Class 10 project',
                billAttachment: 'Electronics_Inv_9921.jpg',
                status: 'HOD Endorsed',
                stage: 'Pending HR Verification',
            },
        ]
    })

    const [form, setForm] = useState({
        employee: 'Mr. Anil Kumar',
        claimType: 'Teaching Aid & Materials',
        amount: '',
        expenseDate: new Date().toISOString().slice(0, 10),
        purpose: '',
        billAttachment: '',
    })

    const [claimCandidate, setClaimCandidate] = useState(null)

    const save = (event) => {
        event.preventDefault()
        const amount = Number(form.amount)
        if (!form.employee.trim() || !(amount > 0) || !form.purpose.trim()) {
            return toast.error('Employee, positive amount, and purpose are required.')
        }

        const next = [
            {
                id: `CLM-${1000 + rows.length + 1}`,
                ...form,
                amount,
                status: 'Submitted',
                stage: 'Pending HOD Endorsement',
                submittedAt: new Date().toISOString().slice(0, 10),
            },
            ...rows,
        ]
        localStorage.setItem(CLAIM_KEY, JSON.stringify(next))
        setRows(next)
        setForm({
            employee: 'Mr. Anil Kumar',
            claimType: 'Teaching Aid & Materials',
            amount: '',
            expenseDate: new Date().toISOString().slice(0, 10),
            purpose: '',
            billAttachment: '',
        })
        toast.success('Compensation claim submitted. Route: HOD -> HR -> Finance.')
    }

    const advanceClaim = (id) => {
        const next = rows.map((row) => {
            if (row.id !== id) return row
            if (row.status === 'Submitted') {
                return { ...row, status: 'HOD Endorsed', stage: 'Pending HR Verification' }
            }
            if (row.status === 'HOD Endorsed') {
                return { ...row, status: 'HR Verified', stage: 'Pending Finance Disbursement' }
            }
            if (row.status === 'HR Verified') {
                return { ...row, status: 'Finance Disbursed', stage: 'Disbursed to Bank Account' }
            }
            return row
        })
        localStorage.setItem(CLAIM_KEY, JSON.stringify(next))
        setRows(next)
        toast.success(`Claim ${id} advanced to next workflow stage.`)
        setClaimCandidate(null)
    }

    const columns = [
        { key: 'id', label: 'Claim ID', required: true },
        { key: 'employee', label: 'Employee', required: true },
        { key: 'claimType', label: 'Claim Category' },
        { key: 'expenseDate', label: 'Incurred Date' },
        { key: 'amount', label: 'Amount', render: (row) => formatInr(row.amount) },
        {
            key: 'purpose',
            label: 'Purpose / Bill',
            render: (row) => (
                <div>
                    <p className='text-xs font-medium text-[var(--erp-ink)]'>{row.purpose}</p>
                    {row.billAttachment && (
                        <p className='text-[11px] text-[var(--erp-indigo)] font-semibold mt-0.5'>
                            📎 {row.billAttachment}
                        </p>
                    )}
                </div>
            ),
        },
        { key: 'status', label: 'Workflow State', render: (row) => <Badge value={row.status} /> },
    ]

    return (
        <section className='space-y-4'>
            <PageIntro text='Staff Expense & Compensation Claims Workflow. Multi-tier approval governance: Employee Submission -> HOD Endorsement -> HR Verification -> Finance Disbursement.' />

            <form onSubmit={save} className='bg-white rounded-2xl shadow-md p-5 space-y-4'>
                <h3 className='text-base font-bold text-[var(--erp-ink)]'>Submit New Compensation Claim</h3>
                <div className='grid md:grid-cols-3 gap-4'>
                    <div>
                        <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Staff Member *</label>
                        <input
                            className='w-full border rounded-md px-3 py-2 text-sm'
                            value={form.employee}
                            onChange={(e) => setForm({ ...form, employee: e.target.value })}
                            placeholder='Employee Name'
                            required
                        />
                    </div>
                    <div>
                        <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Expense Category *</label>
                        <select
                            className='w-full border rounded-md px-3 py-2 text-sm bg-white'
                            value={form.claimType}
                            onChange={(e) => setForm({ ...form, claimType: e.target.value })}
                        >
                            {CLAIM_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Incurred Date *</label>
                        <input
                            type='date'
                            className='w-full border rounded-md px-3 py-2 text-sm'
                            value={form.expenseDate}
                            onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Claim Amount (₹) *</label>
                        <input
                            type='number'
                            min='1'
                            className='w-full border rounded-md px-3 py-2 text-sm'
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            placeholder='e.g. 2500'
                            required
                        />
                    </div>
                    <div>
                        <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Bill / Receipt File Reference</label>
                        <input
                            className='w-full border rounded-md px-3 py-2 text-sm'
                            value={form.billAttachment}
                            onChange={(e) => setForm({ ...form, billAttachment: e.target.value })}
                            placeholder='e.g. Fuel_Bill_Oct2026.pdf'
                        />
                    </div>
                    <div className='md:col-span-3'>
                        <label className='block text-xs font-semibold text-[var(--erp-slate)] mb-1'>Incurred Purpose & Justification *</label>
                        <textarea
                            rows={2}
                            className='w-full border rounded-md px-3 py-2 text-sm'
                            value={form.purpose}
                            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                            placeholder='Explain academic/school purpose, event, destination, or materials purchased...'
                            required
                        />
                    </div>
                </div>
                <div className='flex justify-end'>
                    <button type='submit' className='bg-[#515DEF] text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-[#434dbd] cursor-pointer'>
                        Submit Claim for HOD Approval
                    </button>
                </div>
            </form>

            <div className='bg-white rounded-2xl shadow-md overflow-hidden'>
                <DataTable
                    caption='Claim compensation register'
                    rows={rows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No claims submitted'
                    emptyDescription='Submitted claims appear here for workflow approval.'
                    renderActions={(row) => (
                        row.status !== 'Finance Disbursed' ? (
                            <button
                                type='button'
                                className='min-h-9 rounded-md border border-[#515DEF] px-3 text-xs font-semibold text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                                onClick={() => setClaimCandidate(row)}
                            >
                                {row.status === 'Submitted' ? 'HOD Endorse' : row.status === 'HOD Endorsed' ? 'HR Verify' : 'Disburse'}
                            </button>
                        ) : (
                            <span className='text-xs font-semibold text-emerald-600'>✓ Disbursed</span>
                        )
                    )}
                />
            </div>

            <ConfirmAction
                open={Boolean(claimCandidate)}
                onClose={() => setClaimCandidate(null)}
                onConfirm={() => claimCandidate && advanceClaim(claimCandidate.id)}
                title={
                    claimCandidate?.status === 'Submitted'
                        ? 'Endorse claim as HOD?'
                        : claimCandidate?.status === 'HOD Endorsed'
                        ? 'Verify claim for HR?'
                        : 'Disburse claim via Finance?'
                }
                description='Advance this employee compensation claim along the governance chain.'
                confirmLabel='Confirm Step'
            >
                <p>
                    <strong>{claimCandidate?.id}</strong> · {claimCandidate?.employee} · {formatInr(claimCandidate?.amount || 0)}
                </p>
                <p className='text-xs text-[var(--erp-slate)] mt-1'>
                    Current Stage: {claimCandidate?.stage}
                </p>
            </ConfirmAction>
        </section>
    )
}

const Payroll = () => {
    const path = useLocation().pathname
    if (path.includes('payslip')) return <Payslip />
    if (path.includes('salary-advance')) return <SalaryAdvance />
    if (path.includes('ctc')) return <CtcView />
    if (path.includes('referral')) return <ReferralBonus />
    if (path.includes('claim-compensation')) return <ClaimCompensation />
    return <SalaryStatement />
}

export default Payroll
