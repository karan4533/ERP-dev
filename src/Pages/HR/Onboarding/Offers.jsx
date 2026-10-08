import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { formatInr } from '../domain/payrollCalculations'
import { calculateCTC } from '../domain/payrollCalculations'
import { PAYROLL_CONFIG } from '../domain/payrollConfig'
import { blankChecklist, canMutate, getCandidates, getEmployees, getOffers, nextId, pushNotification, queueCommunication, saveEmployees, saveOffers, saveOnboarding } from '../domain/hrStore'
import { getOnboarding } from '../domain/hrStore'
import { Badge, Modal, PageIntro, PrimaryButton, TableWrap, inputClass, printHtml, td, th, useHrTick } from '../components/HrUi'

const empty = { candidateId: '', kind: 'Offer', position: '', department: '', designation: '', joiningDate: '', employmentType: 'Full Time', grossSalary: '', probation: '6 months', reportingManager: '', offerDate: '2026-09-24', validityDate: '', terms: '', status: 'Draft' }

const letterHtml = (record, candidate) => `
<h1>${record.kind} Letter</h1>
<p>Candidate: ${candidate?.name || ''}</p>
<p>Position: ${record.position}, ${record.department}</p>
<p>Designation: ${record.designation}</p>
<p>Joining date: ${record.joiningDate}</p>
<p>Gross salary: ${formatInr(record.grossSalary)} · Probation: ${record.probation}</p>
<p>Reporting manager: ${record.reportingManager}</p>
<p>${record.terms}</p>
<p>Status: ${record.status}. This is a browser demo letter, not a signed document.</p>`

const Offers = () => {
    const appointment = useLocation().pathname.includes('appointment')
    const tick = useHrTick()
    const rows = useMemo(() => getOffers().filter((row) => appointment ? row.kind === 'Appointment' : row.kind === 'Offer'), [tick, appointment])
    const candidates = useMemo(() => getCandidates(), [tick])
    const [form, setForm] = useState(null)

    const preview = (record) => printHtml(record.kind, letterHtml(record, candidates.find((item) => item.id === record.candidateId)))

    const save = (event) => {
        event.preventDefault()
        const gross = Number(form.grossSalary)
        if (!form.candidateId || !form.joiningDate || !(gross > 0)) return toast.error('Candidate, joining date, and gross salary are required.')
        if (form.id && !canMutate(form)) return toast.error('Issued or accepted letters are locked.')
        const candidate = candidates.find((item) => item.id === form.candidateId)
        const ctc = calculateCTC({ grossSalary: gross, otherAllowance: 0, employerContribution: gross * (PAYROLL_CONFIG.employerPfPercentage / 100), otherBenefits: 0 })
        const record = { ...form, kind: appointment ? 'Appointment' : 'Offer', position: candidate?.position || form.position, grossSalary: gross, ctc: ctc.annualCtc, id: form.id || nextId('OFR-2026', getOffers()) }
        saveOffers(form.id ? getOffers().map((row) => (row.id === form.id ? record : row)) : [record, ...getOffers()])
        if (record.status === 'Issued') {
            queueCommunication({ channel: 'Email', subject: `${record.kind} letter — ${candidate?.name}`, audience: candidate?.email })
            pushNotification({ type: 'Recruitment', title: `${record.kind} Issued`, message: `${record.kind} issued to ${candidate?.name}.`, relatedDate: record.joiningDate })
        }
        if (record.status === 'Accepted' && !appointment) {
            const employees = getEmployees()
            const employeeId = record.employeeId || nextId('EMP-2026', employees)
            if (!employees.some((item) => item.id === employeeId)) {
                saveEmployees([{ id: employeeId, name: candidate.name, gender: candidate.gender, dateOfBirth: candidate.dateOfBirth, contact: candidate.mobile, email: candidate.email, address: candidate.address, department: record.department || 'Academic', designation: record.designation, joiningDate: record.joiningDate, status: 'Probation', reportingManager: record.reportingManager, role: 'Staff', qualification: candidate.qualification, experience: candidate.experience, emergencyContact: '', employmentType: record.employmentType, category: 'Academics', grossSalary: gross, otherAllowance: 0, specialDeduction: 0, otherEmployerBenefits: 0 }, ...employees])
            }
            saveOffers(getOffers().map((row) => (row.id === record.id ? { ...record, employeeId } : row)))
            if (!getOnboarding().some((item) => item.employeeId === employeeId)) {
                saveOnboarding([{ id: nextId('ONB-2026', getOnboarding()), employeeId, joiningDate: record.joiningDate, overallStatus: 'In Progress', checklist: blankChecklist().map((item, index) => index === 0 ? { ...item, status: 'Completed' } : item) }, ...getOnboarding()])
            }
            pushNotification({ type: 'Onboarding', title: 'Joining Due', message: `${candidate.name} accepted the offer. Joining date ${record.joiningDate}.`, relatedDate: record.joiningDate })
        }
        toast.success(`${record.kind} saved.`)
        setForm(null)
    }

    return (
        <section>
            <PageIntro text='Preview, print, or download uses the browser. Delivery is a demo queue, not a live email service.' />
            <TableWrap title={appointment ? 'Appointment Letters' : 'Offer Letters'} action={<PrimaryButton onClick={() => setForm({ ...empty, kind: appointment ? 'Appointment' : 'Offer', candidateId: candidates[0]?.id || '' })}>Add {appointment ? 'Appointment' : 'Offer'}</PrimaryButton>}>
                <table className='w-full text-left'><thead className='bg-[#EDEEF5]'><tr>{['ID', 'Candidate', 'Position', 'Joining', 'Gross', 'Status', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                    <tbody>{rows.map((row) => <tr key={row.id} className='border-b border-[#f2f4f7]'><td className={td}>{row.id}</td><td className={td}>{candidates.find((item) => item.id === row.candidateId)?.name}</td><td className={td}>{row.position}</td><td className={td}>{row.joiningDate}</td><td className={td}>{formatInr(row.grossSalary)}</td><td className={td}><Badge value={row.status} /></td><td className={td}><button type='button' className='text-[#515DEF] mr-2' onClick={() => preview(row)}>Preview / Print</button>{canMutate(row) && <button type='button' className='text-[#515DEF]' onClick={() => setForm(row)}>Edit</button>}</td></tr>)}</tbody>
                </table>
            </TableWrap>
            {form && <Modal title={form.kind || 'Offer'} onClose={() => setForm(null)}>
                <form onSubmit={save} className='grid gap-3'>
                    <select className={inputClass} value={form.candidateId} onChange={(e) => setForm({ ...form, candidateId: e.target.value })}>{candidates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    {['department', 'designation', 'joiningDate', 'grossSalary', 'probation', 'reportingManager', 'offerDate', 'validityDate', 'terms'].map((key) => <input key={key} className={inputClass} placeholder={key} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
                    <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{['Draft', 'Issued', 'Accepted', 'Rejected', 'Expired'].map((status) => <option key={status}>{status}</option>)}</select>
                    <PrimaryButton type='submit'>Save</PrimaryButton>
                </form>
            </Modal>}
        </section>
    )
}

export default Offers
