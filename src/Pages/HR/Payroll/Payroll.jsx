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
import { Badge, Modal, PageIntro, PrimaryButton, td, th, useHrTick } from '../components/HrUi'

const moneyKeys = ['grossSalary', 'payableGross', 'basicSalary', 'lopDeduction', 'advance', 'pfEmployee', 'esiEmployee', 'netSalary']

const SalaryStatement = () => {
    const tick = useHrTick()
    const [month, setMonth] = useState('June')
    const [year, setYear] = useState(2026)
    const [category, setCategory] = useState('')
    const [department, setDepartment] = useState('')
    const [status, setStatus] = useState('')
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState('statement')
    const rows = useMemo(() => salaryRows(month, year, { category, department, status, search }), [tick, month, year, category, department, status, search])
    const summary = useMemo(() => payrollSummary(month, year), [tick, month, year])

    const markPaid = (row) => {
        const bundle = getPayrollBundle()
        const months = bundle.months.some((item) => item.employeeId === row.employeeId && item.month === month && Number(item.year) === Number(year))
            ? bundle.months.map((item) => item.employeeId === row.employeeId && item.month === month ? { ...item, paymentStatus: 'Paid', bankRef: `NEFT-DEMO-${row.employeeId}`, paymentDate: '30-06-2026', paymentMode: 'Bank Transfer' } : item)
            : [...bundle.months, { employeeId: row.employeeId, month, year, workingDays: row.workingDays, lates: row.lates, permission: row.permission, casualLeave: row.casualLeave, otherLeave: row.otherLeave, absent: row.absent, notPunched: row.notPunched, paymentStatus: 'Paid', bankRef: `NEFT-DEMO-${row.employeeId}`, paymentDate: '30-06-2026', paymentMode: 'Bank Transfer' }]
        savePayrollBundle({ ...bundle, months })
        toast.success('Marked paid with a demo bank reference. No bank API was called.')
    }

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
            <div className='flex gap-2'>
                <button type='button' className={`px-3 py-2 rounded-md text-sm cursor-pointer ${tab === 'statement' ? 'bg-[#515DEF] text-white' : 'bg-white border'}`} onClick={() => setTab('statement')}>Statement</button>
                <button type='button' className={`px-3 py-2 rounded-md text-sm cursor-pointer ${tab === 'summary' ? 'bg-[#515DEF] text-white' : 'bg-white border'}`} onClick={() => setTab('summary')}>Payroll Summary</button>
            </div>
            {tab === 'summary' ? (
                <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                    <table className='w-full text-left text-sm'><thead className='bg-[#EDEEF5]'><tr>{['Category', 'Count', 'Gross', 'Deductions', 'Net', 'PF Employer', 'ESI Employer', 'Employer Cost', 'Total Cost'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                        <tbody>{[...summary.lines, summary.totals].map((line) => <tr key={line.category} className='border-b'><td className={td}>{line.category}</td><td className={td}>{line.count}</td><td className={td}>{formatInr(line.grossSalary)}</td><td className={td}>{formatInr(line.deductions)}</td><td className={td}>{formatInr(line.netSalary)}</td><td className={td}>{formatInr(line.pfEmployer)}</td><td className={td}>{formatInr(line.esiEmployer)}</td><td className={td}>{formatInr(line.employerContribution)}</td><td className={td}>{formatInr(line.totalCost)}</td></tr>)}</tbody>
                    </table>
                </div>
            ) : (
                <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                    <table className='w-full text-left text-sm min-w-[1600px]'><thead className='bg-[#EDEEF5]'><tr>{['Employee', 'Category', 'Days', 'LOP', 'Permission', 'Gross', 'Basic', 'PF', 'ESI', 'Advance', 'Extra Deduction', 'Disciplinary', 'Net', 'Payment', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                        <tbody>{rows.map((row) => <tr key={row.employeeId} className='border-b'><td className={td}>{row.employeeName}<div className='text-xs'>{row.employeeId}</div></td><td className={td}>{row.category}</td><td className={td}>{row.workingDays}</td><td className={td}>{row.lopDays}</td><td className={td}>{row.permissionCount}</td>{moneyKeys.filter((key) => ['grossSalary', 'basicSalary', 'pfEmployee', 'esiEmployee', 'advance'].includes(key)).map((key) => <td key={key} className={td}>{formatInr(row[key])}</td>)}<td className={td}>{formatInr(row.extraDeduction)}</td><td className={td}>{formatInr(row.disciplinaryDeduction)}{(row.disciplinaryLines || []).map((line) => <div key={line.id || line.actionType} className='text-xs'>{line.actionType} — {line.days} day{line.days === 1 ? '' : 's'} · Daily Rate: {formatInr(line.dailyRate)} · Deduction: {formatInr(line.amount)}</div>)}</td><td className={td}>{formatInr(row.netSalary)}</td><td className={td}><Badge value={row.paymentStatus} /><div className='text-xs'>{row.bankRef}</div></td><td className={td}>{row.paymentStatus !== 'Paid' && <button type='button' className='text-[#515DEF]' onClick={() => markPaid(row)}>Mark as Paid</button>}</td></tr>)}</tbody>
                    </table>
                    <p className='text-xs text-[#667085] mt-3'>Basic is {PAYROLL_CONFIG.basicSalaryPercentage}% of payable gross. Permission is the permission count for the month and already reduces pay through the late/permission day rule. Extra deduction is the special deduction. Approved disciplinary actions use the daily rate (gross ÷ working days): Warning 0 days, Memo 1 day, Suspended 2 days. The same amount is deducted in net salary.</p>
                </div>
            )}
        </section>
    )
}

const Payslip = () => {
    const tick = useHrTick()
    const [month, setMonth] = useState('June')
    const [year, setYear] = useState(2026)
    const slips = useMemo(() => salaryRows(month, year).map((row) => ({ ...row, month, year })), [tick, month, year])
    const [active, setActive] = useState(slips[0]?.employeeId)
    const slip = slips.find((item) => item.employeeId === active) || slips[0]
    const employee = slip ? getEmployees().find((item) => item.id === slip.employeeId) : null
    const model = slip ? buildPayslipModel(slip, employee) : null
    const html = model ? payslipHtml(model) : ''
    return (
        <section>
            <PageIntro text='Payslip figures are the same calculation as the salary statement for the selected month.'>
                <div className='flex gap-2'>
                    <select className='border rounded-md px-2 py-2 text-sm' value={month} onChange={(e) => setMonth(e.target.value)}>{PAYROLL_MONTHS.map((item) => <option key={item}>{item}</option>)}</select>
                    <select className='border rounded-md px-2 py-2 text-sm' value={year} onChange={(e) => setYear(Number(e.target.value))}>{PAYROLL_YEARS.map((item) => <option key={item}>{item}</option>)}</select>
                    <select className='border rounded-md px-2 py-2 text-sm' value={active || ''} onChange={(e) => setActive(e.target.value)}>{slips.map((item) => <option key={item.employeeId} value={item.employeeId}>{item.employeeName}</option>)}</select>
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
    const rows = useMemo(() => getAdvances().filter((row) => row?.id), [tick])
    const employees = useMemo(() => getEmployees().filter((row) => row?.id), [tick])
    const [form, setForm] = useState(null)
    const move = (row) => {
        if (!row || (!canMutate(row) && row.status !== 'SUBMITTED')) return
        const next = advanceNext(row.status === 'DRAFT' ? 'DRAFT' : row.status)
        const actor = ADVANCE_ACTORS[row.status] || 'Employee'
        const updated = { ...row, status: row.status === 'DRAFT' ? 'SUBMITTED' : next, chain: [...(row.chain || []), { actor, decision: 'Recommended', at: '24-09-2026', comments: 'Demo step' }] }
        if (updated.status === 'APPROVED') updated.outstanding = Number(row.amount) || 0
        saveAdvances(getAdvances().filter(Boolean).map((item) => item.id === row.id ? updated : item))
        pushNotification({ type: 'Payroll', title: 'Salary Advance Pending', message: `${row.id} is at ${updated.status}.`, relatedDate: row.requestedDate })
        toast.success(`${row.id} moved to ${updated.status}.`)
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
    return (
        <section>
            <PageIntro text='Approval labels stand in for Finance, JD Admin, Director, and MD. Approved advances deduct on the salary statement.' />
            <div className='bg-white rounded-2xl shadow-md p-4 mt-4 overflow-x-auto'>
                <PrimaryButton onClick={() => employees[0] && setForm({ employeeId: employees[0].id, amount: '', months: 6, reason: '', requestedDate: '2026-09-24', remarks: '' })}>New request</PrimaryButton>
                <table className='w-full text-left mt-4'><thead className='bg-[#EDEEF5]'><tr>{['No', 'Employee', 'Amount', 'EMI', 'Outstanding', 'Status', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{rows.map((row) => <tr key={row.id} className='border-b'><td className={td}>{row.id}</td><td className={td}>{employeeName(row?.employeeId)}</td><td className={td}>{formatInr(row?.amount)}</td><td className={td}>{formatInr(row.emi)}</td><td className={td}>{formatInr(row.outstanding)}</td><td className={td}><Badge value={row.status} /></td><td className={td}>{row.status !== 'APPROVED' && row.status !== 'REJECTED' && row.status !== 'CLOSED' && <button type='button' className='text-[#515DEF]' onClick={() => move(row)}>Advance step</button>}</td></tr>)}</tbody>
                </table>
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
        </section>
    )
}

const CtcView = () => {
    const tick = useHrTick()
    const rows = useMemo(() => salaryRows('June', 2026), [tick])
    return (
        <section>
            <PageIntro text='CTC is derived from gross, employer PF, employer ESI, and other employer benefits.' />
            <div className='bg-white rounded-2xl shadow-md p-4 mt-4 overflow-x-auto'>
                <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['Employee', 'Gross', 'Employee deductions', 'Employer PF', 'Employer ESI', 'Annual gross', 'Annual CTC'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{rows.map((row) => <tr key={row.employeeId} className='border-b'><td className={td}>{row.employeeName}</td><td className={td}>{formatInr(row.grossSalary)}</td><td className={td}>{formatInr(row.pfEmployee + row.esiEmployee)}</td><td className={td}>{formatInr(row.pfEmployer)}</td><td className={td}>{formatInr(row.esiEmployer)}</td><td className={td}>{formatInr(row.annualGross)}</td><td className={td}>{formatInr(row.annualCtc)}</td></tr>)}</tbody>
                </table>
            </div>
        </section>
    )
}

const ReferralBonus = () => {
    const tick = useHrTick()
    const rows = useMemo(() => getReferrals().filter((row) => row?.id), [tick])
    const employees = useMemo(() => getEmployees().filter((row) => row?.id), [tick])
    const [form, setForm] = useState(null)
    const save = (event) => {
        event.preventDefault()
        if (!form?.referrerId) return toast.error('Referring employee is required.')
        const gross = Number(form.grossSalary) || 0
        const record = { id: nextId('REF-2026', rows), referrerId: form.referrerId, candidateId: '', position: form.position, department: form.department || '', joiningDate: form.joiningDate, grossSalary: gross, referralDate: '2026-09-24', eligibilityDate: form.joiningDate, percent: PAYROLL_CONFIG.referralBonusPercentage, amount: referralAmountFor(gross), status: gross > 0 ? 'Eligible' : 'Pending', remarks: form.remarks }
        saveReferrals([record, ...getReferrals()])
        toast.success('Referral saved.')
        setForm(null)
    }
    const setStatus = (row, status) => saveReferrals(getReferrals().map((item) => item.id === row.id ? { ...item, status } : item))
    return (
        <section>
            <PageIntro text={`Referral bonus uses ${PAYROLL_CONFIG.referralBonusPercentage}% of the joined candidate gross salary.`} />
            <div className='bg-white rounded-2xl shadow-md p-4 mt-4 overflow-x-auto'>
                <PrimaryButton onClick={() => employees[0] && setForm({ referrerId: employees[0].id, position: '', department: employees[0].department || 'Academic', joiningDate: '', grossSalary: '', remarks: '' })}>Add referral</PrimaryButton>
                <table className='w-full text-left mt-4'><thead className='bg-[#EDEEF5]'><tr>{['ID', 'Referrer', 'Position', 'Gross', 'Amount', 'Status', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{rows.map((row) => <tr key={row.id} className='border-b'><td className={td}>{row.id}</td><td className={td}>{employeeName(row.referrerId)}</td><td className={td}>{row.position}</td><td className={td}>{formatInr(row.grossSalary)}</td><td className={td}>{formatInr(row.amount)}</td><td className={td}><Badge value={row.status} /></td><td className={td}><button type='button' className='text-[#515DEF]' onClick={() => setStatus(row, row.status === 'Eligible' ? 'Approved' : 'Paid')}>Next</button></td></tr>)}</tbody>
                </table>
            </div>
            {form && <Modal title='Referral' onClose={() => setForm(null)}><form onSubmit={save} className='grid gap-3'>
                <select className='border rounded-md px-2 py-2' value={form.referrerId} onChange={(e) => setForm({ ...form, referrerId: e.target.value })}>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <input className='border rounded-md px-2 py-2' placeholder='Position' value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                <input className='border rounded-md px-2 py-2' placeholder='Gross salary' value={form.grossSalary} onChange={(e) => setForm({ ...form, grossSalary: e.target.value })} />
                <input className='border rounded-md px-2 py-2' placeholder='Joining date' value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
                <PrimaryButton type='submit'>Save</PrimaryButton>
            </form></Modal>}
        </section>
    )
}

const CLAIM_KEY = 'school-erp-hr-claims-v1'

const ClaimCompensation = () => {
    const [rows, setRows] = useState(() => {
        try { return JSON.parse(localStorage.getItem(CLAIM_KEY) || '[]') } catch { return [] }
    })
    const [form, setForm] = useState({ employee: 'Priya Sharma', claimType: 'Medical', amount: '', remarks: '' })
    const save = (event) => {
        event.preventDefault()
        const next = [{ id: `CLM-${rows.length + 1}`, ...form, status: 'Submitted', amount: Number(form.amount) || 0 }, ...rows]
        localStorage.setItem(CLAIM_KEY, JSON.stringify(next))
        setRows(next)
        toast.success('Claim saved for HR review. Official claim format is still pending.')
    }
    const review = (id) => {
        const next = rows.map((row) => row.id === id ? { ...row, status: row.status === 'Submitted' ? 'HR Reviewed' : 'Closed' } : row)
        localStorage.setItem(CLAIM_KEY, JSON.stringify(next))
        setRows(next)
    }
    return (
        <section className='space-y-4'>
            <PageIntro text='Demo claim form. The official compensation format has not been supplied, so these fields are a working placeholder.' />
            <form onSubmit={save} className='bg-white rounded-2xl shadow-md p-4 grid md:grid-cols-4 gap-3'>
                <input className='border rounded-md px-2 py-2' value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} placeholder='Employee' />
                <select className='border rounded-md px-2 py-2' value={form.claimType} onChange={(e) => setForm({ ...form, claimType: e.target.value })}><option>Medical</option><option>Travel</option><option>Other</option></select>
                <input className='border rounded-md px-2 py-2' value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder='Amount' />
                <button className='bg-[#515DEF] text-white rounded-md text-sm cursor-pointer'>Submit claim</button>
            </form>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm text-left'><thead className='bg-[#EDEEF5]'><tr>{['Claim', 'Employee', 'Type', 'Amount', 'Status', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{rows.map((row) => <tr key={row.id} className='border-b'><td className={td}>{row.id}</td><td className={td}>{row.employee}</td><td className={td}>{row.claimType}</td><td className={td}>{formatInr(row.amount)}</td><td className={td}><Badge value={row.status} /></td><td className={td}><button type='button' className='text-[#515DEF]' onClick={() => review(row.id)}>Review</button></td></tr>)}</tbody>
                </table>
            </div>
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
