import React, { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ConfirmAction, DataTable } from '../../../Common/ui'
import { formatInr } from '../domain/payrollCalculations'
import { calculateCTC } from '../domain/payrollCalculations'
import { PAYROLL_CONFIG } from '../domain/payrollConfig'
import { blankChecklist, canMutate, getCandidates, getEmployees, getOffers, nextId, pushNotification, queueCommunication, saveEmployees, saveOffers, saveOnboarding } from '../domain/hrStore'
import { getOnboarding } from '../domain/hrStore'
import { Badge, Modal, PageIntro, PrimaryButton, TableWrap, inputClass } from '../components/HrUi'
import { printHtml, useHrTick } from '../components/hrUiState'

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
    const rows = useMemo(() => {
        void tick
        return getOffers().filter((row) => appointment ? row.kind === 'Appointment' : row.kind === 'Offer')
    }, [tick, appointment])
    const candidates = useMemo(() => {
        void tick
        return getCandidates()
    }, [tick])
    const [form, setForm] = useState(null)
    const [pendingSave, setPendingSave] = useState(null)
    const activeForm = form || empty

    const preview = (record) => printHtml(record.kind, letterHtml(record, candidates.find((item) => item.id === record.candidateId)))

    const commitSave = (submittedForm) => {
        const gross = Number(submittedForm.grossSalary)
        const candidate = candidates.find((item) => item.id === submittedForm.candidateId)
        if (!candidate) return toast.error('Select a valid candidate.')
        const ctc = calculateCTC({ grossSalary: gross, otherAllowance: 0, employerContribution: gross * (PAYROLL_CONFIG.employerPfPercentage / 100), otherBenefits: 0 })
        const record = { ...submittedForm, kind: appointment ? 'Appointment' : 'Offer', position: candidate.position || submittedForm.position, grossSalary: gross, ctc: ctc.annualCtc, id: submittedForm.id || nextId('OFR-2026', getOffers()) }
        saveOffers(submittedForm.id ? getOffers().map((row) => (row.id === submittedForm.id ? record : row)) : [record, ...getOffers()])
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
        setPendingSave(null)
        setForm(null)
    }

    const save = (event) => {
        event.preventDefault()
        if (!form) return
        const gross = Number(form.grossSalary)
        if (!form.candidateId || !form.joiningDate || !(gross > 0)) return toast.error('Candidate, joining date, and gross salary are required.')
        if (form.id && !canMutate(form)) return toast.error('Issued or accepted letters are locked.')
        const submittedForm = { ...form, grossSalary: gross }
        if (['Issued', 'Accepted'].includes(form.status)) {
            setPendingSave(submittedForm)
            return
        }
        commitSave(submittedForm)
    }

    const columns = [
        { key: 'id', label: 'ID', required: true },
        { key: 'candidateId', label: 'Candidate', required: true, render: (row) => candidates.find((item) => item.id === row.candidateId)?.name || 'Unknown candidate' },
        { key: 'position', label: 'Position' },
        { key: 'joiningDate', label: 'Joining' },
        { key: 'grossSalary', label: 'Gross', render: (row) => formatInr(row.grossSalary) },
        { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    ]

    return (
        <section>
            <PageIntro text='Preview, print, or download uses the browser. Delivery is a demo queue, not a live email service.' />
            <TableWrap title={appointment ? 'Appointment Letters' : 'Offer Letters'} action={<PrimaryButton onClick={() => setForm({ ...empty, kind: appointment ? 'Appointment' : 'Offer', candidateId: candidates[0]?.id || '' })}>Add {appointment ? 'Appointment' : 'Offer'}</PrimaryButton>}>
                <DataTable
                    caption={appointment ? 'Appointment letter register' : 'Offer letter register'}
                    rows={rows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle={`No ${appointment ? 'appointment' : 'offer'} letters found`}
                    emptyDescription='Create the first letter from an eligible recruitment candidate.'
                    renderActions={(row) => (
                        <>
                            <button type='button' className='min-h-9 rounded-md border border-[#D9D9D9] px-3 text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7]' onClick={() => preview(row)}>Preview</button>
                            {canMutate(row) && <button type='button' className='min-h-9 rounded-md border border-[#515DEF] px-3 text-xs font-semibold text-[#515DEF] hover:bg-[#F1F2FF]' onClick={() => setForm(row)}>Edit</button>}
                        </>
                    )}
                />
            </TableWrap>
            {form && <Modal title={form.kind || 'Offer'} onClose={() => setForm(null)}>
                <form onSubmit={save} className='grid gap-3'>
                    <select className={inputClass} value={activeForm.candidateId} onChange={(e) => setForm({ ...activeForm, candidateId: e.target.value })}>{candidates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    {['department', 'designation', 'joiningDate', 'grossSalary', 'probation', 'reportingManager', 'offerDate', 'validityDate', 'terms'].map((key) => <input key={key} className={inputClass} placeholder={key} value={activeForm[key] || ''} onChange={(e) => setForm({ ...activeForm, [key]: e.target.value })} />)}
                    <select className={inputClass} value={activeForm.status} onChange={(e) => setForm({ ...activeForm, status: e.target.value })}>{['Draft', 'Issued', 'Accepted', 'Rejected', 'Expired'].map((status) => <option key={status}>{status}</option>)}</select>
                    <PrimaryButton type='submit'>Save</PrimaryButton>
                </form>
            </Modal>}
            <ConfirmAction
                open={Boolean(pendingSave)}
                onClose={() => setPendingSave(null)}
                onConfirm={() => pendingSave && commitSave(pendingSave)}
                title={`${pendingSave?.status || 'Save'} ${appointment ? 'appointment' : 'offer'} letter?`}
                description={pendingSave?.status === 'Accepted' && !appointment ? 'Acceptance creates an employee record and onboarding checklist.' : 'Issuing locks this letter and adds a delivery item to the browser demo queue.'}
                confirmLabel={pendingSave?.status === 'Accepted' ? 'Accept and create records' : 'Issue letter'}
            >
                <p>This is a consequential workflow transition. Production must validate permission, persist an audit event, and confirm delivery or downstream record creation through the backend.</p>
            </ConfirmAction>
        </section>
    )
}

export default Offers
