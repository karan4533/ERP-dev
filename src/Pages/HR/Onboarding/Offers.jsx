import React, { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { formatInr } from '../domain/payrollCalculations'
import { calculateCTC } from '../domain/payrollCalculations'
import { PAYROLL_CONFIG } from '../domain/payrollConfig'
import {
    blankChecklist,
    canMutate,
    getCandidates,
    getEmployees,
    getJobs,
    getOffers,
    nextId,
    pushNotification,
    queueCommunication,
    saveCandidates,
    saveEmployees,
    saveOffers,
    saveOnboarding,
} from '../domain/hrStore'
import { getOnboarding } from '../domain/hrStore'
import { createStaff } from '../../../services/hrApi'
import { ROLES } from '../../../constants/roles'
import { Badge, FormField, KeyFields, Modal, PageIntro, PrimaryButton, Select, TableWrap, formatFormDate, inputClass, printHtml, td, th, useHrTick } from '../components/HrUi'
import { buildOfferLetterHtml } from './offerLetterFormat'

const inferPortalRole = (record = {}) => {
    const text = `${record.designation || ''} ${record.position || ''} ${record.department || ''}`.toLowerCase()
    if (text.includes('driver')) return ROLES.DRIVER
    if (text.includes('librarian')) return ROLES.LIBRARIAN
    if (/\bhr\b/.test(text) || text.includes('human resource')) return ROLES.HR
    if (text.includes('account')) return ROLES.ACCOUNT_HEAD
    if (text.includes('coord')) return ROLES.COORDINATOR
    if (text.includes('principal')) return ROLES.PRINCIPAL
    if (text.includes('transport')) return ROLES.TRANSPORT_MANAGER
    if (text.includes('gate') || text.includes('security')) return ROLES.GATEKEEPER
    return ROLES.TEACHER
}

const empty = () => ({
    candidateId: '',
    kind: 'Offer',
    position: '',
    department: '',
    designation: '',
    joiningDate: '',
    employmentType: 'Full Time',
    grossSalary: '',
    probation: '6 months',
    reportingManager: '',
    offerDate: formatFormDate(new Date()),
    validityDate: '',
    terms: '',
    status: 'Draft',
})

/** Map only fields that exist on the candidate (and its linked job opening). */
const offerDefaultsFromCandidate = (candidate, jobs = []) => {
    if (!candidate) {
        return {
            position: '',
            department: '',
            designation: '',
            grossSalary: '',
            employmentType: 'Full Time',
            reportingManager: '',
        }
    }
    const job = jobs.find((item) => item.id === candidate.jobId) || null
    return {
        position: candidate.position || job?.position || '',
        department: job?.department || '',
        designation: job?.designation || candidate.position || '',
        grossSalary: candidate.expectedSalary != null && candidate.expectedSalary !== ''
            ? String(candidate.expectedSalary)
            : '',
        employmentType: job?.employmentType || 'Full Time',
        reportingManager: job?.hiringManager || '',
    }
}

const nextStatusOptions = (current) => {
    if (current === 'Draft') return ['Draft', 'Issued', 'Rejected', 'Expired']
    if (current === 'Issued') return ['Issued', 'Accepted', 'Rejected', 'Expired']
    if (current === 'Accepted') return ['Accepted']
    return [current]
}

/** Create staff login + employee + onboarding when an Offer is marked Accepted. */
const acceptOfferSideEffects = async (record, candidate) => {
    if (!candidate?.email) {
        throw new Error('Candidate email is required to create a staff login and send the temporary password.')
    }
    const employees = getEmployees()
    let employeeId = record.employeeId
    let temporaryPassword = ''
    let loginEmail = candidate.email
    let createdEmployee = false

    const existing = employeeId ? employees.find((item) => item.id === employeeId) : employees.find((item) => (item.email || '').toLowerCase() === candidate.email.toLowerCase())
    if (existing) {
        employeeId = existing.id
    } else {
        employeeId = employeeId || nextId('EMP-QMIS', employees)
        const draft = {
            id: employeeId,
            name: candidate.name,
            gender: candidate.gender,
            dateOfBirth: candidate.dateOfBirth,
            contact: candidate.mobile,
            email: candidate.email,
            address: candidate.address,
            department: record.department || 'Academic',
            designation: record.designation || candidate.position,
            joiningDate: record.joiningDate,
            status: 'Probation',
            reportingManager: record.reportingManager,
            role: inferPortalRole(record),
            qualification: candidate.qualification,
            experience: candidate.experience,
            emergencyContact: '',
            employmentType: record.employmentType || 'Full Time',
            category: 'Academics',
            grossSalary: Number(record.grossSalary) || 0,
            otherAllowance: 0,
            specialDeduction: 0,
            otherEmployerBenefits: 0,
        }
        const created = await createStaff(draft)
        temporaryPassword = created.temporaryPassword || ''
        loginEmail = created.loginEmail || created.email || candidate.email
        const { temporaryPassword: _tp, mustChangePassword: _mcp, loginEmail: _le, ...row } = created
        saveEmployees([row, ...getEmployees().filter((item) => item.id !== row.id)])
        employeeId = row.id
        createdEmployee = true
        queueCommunication({
            channel: 'Email',
            subject: `QMIS login credentials — ${loginEmail}`,
            audience: loginEmail,
            body: temporaryPassword
                ? `Dear ${candidate.name},\n\nYour QMIS ERP login is ready.\nEmail: ${loginEmail}\nTemporary password: ${temporaryPassword}\n\nYou must change this password on first login.\n\n— HR`
                : `Dear ${candidate.name},\n\nYour staff profile was created. Ask HR for the temporary password if you did not receive one.\nEmail: ${loginEmail}`,
            note: 'Queued locally — live SMTP is not connected in this campus demo. HR also sees the password once in the success toast.',
        })
    }

    saveOffers(getOffers().map((row) => (row.id === record.id ? { ...record, employeeId, status: 'Accepted' } : row)))
    if (!getOnboarding().some((item) => item.employeeId === employeeId)) {
        saveOnboarding([{
            id: nextId('ONB-2026', getOnboarding()),
            employeeId,
            joiningDate: record.joiningDate,
            overallStatus: 'In Progress',
            checklist: blankChecklist().map((item, index) => (index === 0 ? { ...item, status: 'Completed' } : item)),
        }, ...getOnboarding()])
    }
    saveCandidates(getCandidates().map((item) => (
        item.id === candidate.id
            ? { ...item, status: 'Selected', employeeId }
            : item
    )))
    pushNotification({
        type: 'Onboarding',
        title: 'Joining Due',
        message: temporaryPassword
            ? `${candidate.name} accepted. Login ${loginEmail}. Temp password issued (change on first login). Continue Joiners → Appointment.`
            : `${candidate.name} accepted. Employee ${employeeId}. Continue Joiners → Appointment. Reset password from Employee Profile if needed.`,
        relatedDate: record.joiningDate,
    })
    return { employeeId, createdEmployee, temporaryPassword, loginEmail }
}

const Offers = () => {
    const appointment = useLocation().pathname.includes('appointment')
    const tick = useHrTick()
    const rows = useMemo(() => getOffers().filter((row) => appointment ? row.kind === 'Appointment' : row.kind === 'Offer'), [tick, appointment])
    const candidates = useMemo(() => getCandidates(), [tick])
    const jobs = useMemo(() => getJobs(), [tick])
    const [form, setForm] = useState(null)
    const [statusOnly, setStatusOnly] = useState(false)
    const [statusFrom, setStatusFrom] = useState('')

    const selectedCandidate = useMemo(
        () => candidates.find((item) => item.id === form?.candidateId) || null,
        [candidates, form?.candidateId],
    )
    const selectedJob = useMemo(
        () => jobs.find((item) => item.id === selectedCandidate?.jobId) || null,
        [jobs, selectedCandidate],
    )

    const contentLocked = Boolean(form?.id && !canMutate(form) && !statusOnly)

    const openNew = () => {
        const first = candidates[0] || null
        setStatusOnly(false)
        setStatusFrom('')
        setForm({
            ...empty(),
            kind: appointment ? 'Appointment' : 'Offer',
            candidateId: first?.id || '',
            ...offerDefaultsFromCandidate(first, jobs),
        })
    }

    const openEdit = (row) => {
        setStatusOnly(false)
        setStatusFrom(row.status || 'Draft')
        setForm({ ...row })
    }

    const openStatus = (row) => {
        setStatusOnly(true)
        setStatusFrom(row.status || 'Issued')
        setForm({ ...row })
    }

    const applyCandidate = (candidateId) => {
        if (contentLocked || statusOnly) return
        const candidate = candidates.find((item) => item.id === candidateId) || null
        setForm((current) => ({
            ...current,
            candidateId,
            ...offerDefaultsFromCandidate(candidate, jobs),
        }))
    }

    const preview = (record) => {
        const candidate = candidates.find((item) => item.id === record.candidateId)
        if (!candidate) {
            toast.error('Candidate details not found for this letter. Check Recruitment → Candidates.')
            return
        }
        printHtml(
            `${record.kind || 'Offer'} Letter — ${candidate.name}`,
            buildOfferLetterHtml(record, candidate),
        )
    }

    const save = async (event) => {
        event.preventDefault()
        const candidate = candidates.find((item) => item.id === form.candidateId)
        if (!form.candidateId) return toast.error('Select a candidate.')

        // Status-only update (Issued → Accepted / Rejected / Expired)
        if (statusOnly && form.id) {
            const previous = getOffers().find((row) => row.id === form.id)
            if (!previous) return toast.error('Offer not found.')
            if (previous.status === 'Accepted') {
                toast.info('Already accepted. Continue in Joiners / Appointment Letters.')
                setForm(null)
                setStatusOnly(false)
                return
            }
            const nextStatus = form.status
            if (nextStatus === 'Accepted' && !appointment) {
                try {
                    const record = { ...previous, status: 'Accepted' }
                    const { employeeId, temporaryPassword, loginEmail } = await acceptOfferSideEffects(record, candidate)
                    toast.success(
                        temporaryPassword
                            ? `Offer accepted. Login: ${loginEmail} · Temp password: ${temporaryPassword} (change on first login). Queued to email demo. Next: Joiners → Appointment → Principal allocation.`
                            : `Offer accepted. Employee ${employeeId}. Next: Joiners → Appointment. Use Employee Profile → Reset password if login password is unknown.`,
                        { autoClose: 12000 },
                    )
                } catch (error) {
                    toast.error(error?.message || 'Could not create staff login for this offer.')
                    return
                }
            } else {
                saveOffers(getOffers().map((row) => (row.id === form.id ? { ...row, status: nextStatus } : row)))
                if (nextStatus === 'Rejected' || nextStatus === 'Expired') {
                    pushNotification({
                        type: 'Recruitment',
                        title: `Offer ${nextStatus}`,
                        message: `Offer for ${candidate?.name || 'candidate'} marked ${nextStatus}.`,
                        relatedDate: previous.joiningDate,
                    })
                }
                toast.success(`Status updated to ${nextStatus}.`)
            }
            setForm(null)
            setStatusOnly(false)
            return
        }

        const gross = Number(form.grossSalary)
        if (!form.joiningDate || !(gross > 0)) return toast.error('Joining date and gross salary are required.')
        if (form.id && !canMutate(form) && !statusOnly) {
            return toast.error('Letter details are locked after Issue. Use Update status to mark Accepted.')
        }

        const ctc = calculateCTC({
            grossSalary: gross,
            otherAllowance: 0,
            employerContribution: gross * (PAYROLL_CONFIG.employerPfPercentage / 100),
            otherBenefits: 0,
        })
        const record = {
            ...form,
            kind: appointment ? 'Appointment' : 'Offer',
            position: candidate?.position || form.position,
            grossSalary: gross,
            ctc: ctc.annualCtc,
            id: form.id || nextId('OFR-2026', getOffers()),
        }
        saveOffers(form.id ? getOffers().map((row) => (row.id === form.id ? record : row)) : [record, ...getOffers()])

        if (record.status === 'Issued') {
            queueCommunication({ channel: 'Email', subject: `${record.kind} letter — ${candidate?.name}`, audience: candidate?.email })
            pushNotification({
                type: 'Recruitment',
                title: `${record.kind} Issued`,
                message: `${record.kind} issued to ${candidate?.name}. When they accept, open Update status → Accepted.`,
                relatedDate: record.joiningDate,
            })
            toast.success(`${record.kind} issued. Share Preview / Print with the candidate. When they accept, click Update status → Accepted.`)
        } else if (record.status === 'Accepted' && !appointment) {
            try {
                const { employeeId, temporaryPassword, loginEmail } = await acceptOfferSideEffects(record, candidate)
                toast.success(
                    temporaryPassword
                        ? `Offer accepted. Login: ${loginEmail} · Temp password: ${temporaryPassword}. Next: Joiners → Appointment.`
                        : `Offer accepted. Employee ${employeeId}. Reset password from Employee Profile if needed.`,
                    { autoClose: 12000 },
                )
            } catch (error) {
                toast.error(error?.message || 'Offer saved but staff login failed. Open Employee Profile → Reset password.')
            }
        } else {
            toast.success(`${record.kind} saved as ${record.status}.`)
        }
        setForm(null)
        setStatusOnly(false)
    }

    return (
        <section>
            <PageIntro text='Flow: Recruitment Candidate → Add Offer (Draft) → Issue + Preview/Print → Update status to Accepted → Employee + Joiners checklist → Appointment letter → Principal allocates class/timetable. Issued letters lock salary/dates; use Update status for Accepted.'>
                <p className='text-sm text-[#344054] mt-2'>
                    After Accept, continue in{' '}
                    <Link className='text-[#515DEF] underline' to='/hr/onboarding/joiners'>Joiners</Link>
                    {' · '}
                    <Link className='text-[#515DEF] underline' to='/hr/onboarding/appointment'>Appointment Letters</Link>
                    {' · '}
                    <Link className='text-[#515DEF] underline' to='/hr/employee-management/employees'>Employees</Link>
                </p>
            </PageIntro>
            <TableWrap title={appointment ? 'Appointment Letters' : 'Offer Letters'} action={<PrimaryButton onClick={openNew}>Add {appointment ? 'Appointment' : 'Offer'}</PrimaryButton>}>
                <table className='w-full text-left'>
                    <thead className='bg-[#EDEEF5]'>
                        <tr>{['ID', 'Candidate', 'Position', 'Joining', 'Gross', 'Status', ''].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const editable = canMutate(row)
                            const canUpdateStatus = row.status === 'Issued' || row.status === 'Draft'
                            return (
                                <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                    <td className={td}>{row.id}</td>
                                    <td className={td}>{candidates.find((item) => item.id === row.candidateId)?.name}</td>
                                    <td className={td}>{row.position}</td>
                                    <td className={td}>{row.joiningDate}</td>
                                    <td className={td}>{formatInr(row.grossSalary)}</td>
                                    <td className={td}><Badge value={row.status} /></td>
                                    <td className={td}>
                                        <button type='button' className='text-[#515DEF] mr-2' onClick={() => preview(row)}>Preview / Print</button>
                                        {editable && (
                                            <button type='button' className='text-[#515DEF] mr-2' onClick={() => openEdit(row)}>Edit</button>
                                        )}
                                        {canUpdateStatus && (
                                            <button type='button' className='text-[#515DEF] mr-2' onClick={() => openStatus(row)}>Update status</button>
                                        )}
                                        {row.status === 'Accepted' && !appointment && (
                                            <span className='text-xs text-[#027A48]'>→ Joiners / Appointment</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </TableWrap>
            {form && (
                <Modal title={statusOnly ? `Update status — ${form.id}` : (form.kind || 'Offer')} onClose={() => { setForm(null); setStatusOnly(false); setStatusFrom('') }}>
                    <form onSubmit={save} className='grid gap-3'>
                        {statusOnly ? (
                            <>
                                <p className='text-sm text-[#667085]'>
                                    Candidate: <strong>{selectedCandidate?.name || form.candidateId}</strong>
                                    {' · '}Position: <strong>{form.position}</strong>
                                    {' · '}Joining: <strong>{form.joiningDate}</strong>
                                </p>
                                <p className='text-sm text-[#344054] rounded-lg bg-[#EFF4FF] border border-[#C7D7FE] p-3'>
                                    When the candidate accepts the printed offer, set status to <strong>Accepted</strong>.
                                    That creates the <strong>Employee</strong> record and a <strong>Joiners</strong> checklist automatically.
                                </p>
                                <Select
                                    label='Status'
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    options={nextStatusOptions(statusFrom || 'Issued')}
                                    allLabel={null}
                                />
                                <PrimaryButton type='submit'>Save status</PrimaryButton>
                            </>
                        ) : (
                            <>
                                <FormField label='Candidate' hint={!candidates.length ? 'No candidates — add under Recruitment → Candidates first.' : 'Auto-fills from that candidate and their job opening.'}>
                                    <select
                                        className={inputClass}
                                        value={form.candidateId || ''}
                                        disabled={Boolean(form.id)}
                                        onChange={(e) => applyCandidate(e.target.value)}
                                    >
                                        <option value='' disabled>
                                            {candidates.length ? 'Select candidate…' : 'No candidates available'}
                                        </option>
                                        {candidates.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} · {item.position} ({item.status})
                                            </option>
                                        ))}
                                    </select>
                                </FormField>

                                {selectedCandidate && (
                                    <div className='rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-sm text-[#344054] grid sm:grid-cols-2 gap-2'>
                                        <p><span className='text-[#667085]'>Name:</span> {selectedCandidate.name}</p>
                                        <p><span className='text-[#667085]'>Mobile:</span> {selectedCandidate.mobile || '—'}</p>
                                        <p><span className='text-[#667085]'>Email:</span> {selectedCandidate.email || '—'}</p>
                                        <p><span className='text-[#667085]'>Position:</span> {selectedCandidate.position || '—'}</p>
                                        <p><span className='text-[#667085]'>Expected salary:</span> {selectedCandidate.expectedSalary != null ? formatInr(selectedCandidate.expectedSalary) : '—'}</p>
                                        <p><span className='text-[#667085]'>Job opening:</span> {selectedJob ? `${selectedJob.id} · ${selectedJob.department}` : (selectedCandidate.jobId || '—')}</p>
                                    </div>
                                )}

                                <KeyFields
                                    keys={['department', 'designation', 'joiningDate', 'grossSalary', 'probation', 'reportingManager', 'offerDate', 'validityDate', 'terms']}
                                    form={form}
                                    setForm={setForm}
                                />
                                <Select
                                    label='Status'
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    options={nextStatusOptions(statusFrom || form.status || 'Draft')}
                                    allLabel={null}
                                />
                                <p className='text-xs text-[#667085]'>
                                    Tip: save as <strong>Draft</strong> while preparing, then <strong>Issued</strong> when you print and share.
                                    After the candidate accepts, use <strong>Update status → Accepted</strong> on the list.
                                </p>
                                <PrimaryButton type='submit'>Save</PrimaryButton>
                            </>
                        )}
                    </form>
                </Modal>
            )}
        </section>
    )
}

export default Offers
