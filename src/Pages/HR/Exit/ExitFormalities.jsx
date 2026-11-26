import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { ConfirmAction, DataTable } from '../../../Common/ui'
import { employeeName, getEmployees, getExits, nextId, pushNotification, saveExits } from '../domain/hrStore'
import { Badge, Modal, PageIntro, PrimaryButton, TableWrap, inputClass } from '../components/HrUi'
import { useHrTick } from '../components/hrUiState'

const FLAGS = ['noticeServed', 'handover', 'assets', 'documents', 'finance', 'departmentClearance', 'hrClearance', 'exitInterview']

const ExitFormalities = () => {
    const tick = useHrTick()
    const rows = useMemo(() => { void tick; return getExits().filter((row) => row?.employeeId) }, [tick])
    const employees = useMemo(() => { void tick; return getEmployees().filter((row) => row?.id) }, [tick])
    const [form, setForm] = useState(null)
    const [open, setOpen] = useState(rows[0]?.id)
    const [pendingAction, setPendingAction] = useState(null)
    const [interviewCandidate, setInterviewCandidate] = useState(null)

    const toggle = (row, key) => {
        const next = { ...row, [key]: !row[key] }
        const done = FLAGS.every((flag) => next[flag])
        next.status = done ? 'Completed' : FLAGS.some((flag) => next[flag]) ? 'In Progress' : 'Initiated'
        if (!done && next.finance === false) next.status = next.status === 'Initiated' ? 'Initiated' : 'Pending Clearance'
        saveExits(getExits().filter(Boolean).map((item) => item.id === row?.id ? next : item))
        setPendingAction(null)
    }

    const closeInterview = (row) => {
        saveExits(getExits().map((item) => item.id === row.id ? { ...item, exitInterview: true, exitInterviewClosedBy: 'HR' } : item))
        toast.success('Exit interview closed by HR.')
        setPendingAction(null)
    }

    const current = rows.find((item) => item?.id === open) || rows[0] || null
    const columns = [
        { key: 'employeeId', label: 'Employee', required: true, render: (row) => employeeName(row.employeeId) },
        { key: 'lastWorkingDate', label: 'Last working' },
        { key: 'exitType', label: 'Type' },
        { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    ]

    return (
        <section>
            <PageIntro text='Clearance steps are department, assets, finance, and HR. Completing every step marks the exit completed.' />
            <TableWrap title='Exit Formalities' action={<PrimaryButton onClick={() => employees[0] && setForm({ employeeId: employees[0].id, lastWorkingDate: '', exitType: 'Resignation', reason: '' })}>Initiate exit</PrimaryButton>}>
                <DataTable caption='Employee exit register' rows={rows} columns={columns} rowKey='id' emptyTitle='No exit records found' emptyDescription='Initiate an exit to begin notice, handover and clearance tracking.' renderActions={(row) => <button type='button' className='min-h-9 rounded-md border border-[#515DEF] px-3 text-xs font-semibold text-[#515DEF]' onClick={() => setOpen(row.id)}>Clearance</button>} />
            </TableWrap>
            {current && <div className='bg-white rounded-2xl shadow-md p-4 mt-4'>
                <h3 className='font-medium mb-3'>{employeeName(current.employeeId)} timeline</h3>
                <ul className='text-sm space-y-2 mb-4'><li>Initiated · last working {current.lastWorkingDate}</li><li>Reason · {current.reason}</li><li>Status · {current.status}</li><li>Exit interview · {current.exitInterviewResponse ? 'Response received' : 'Waiting for employee response'}</li></ul>
                {!current.exitInterviewResponse && (
                    <div className='mb-3'>
                        <button
                            type='button'
                            onClick={() => setInterviewCandidate(current)}
                            className='inline-flex items-center rounded-lg bg-[#515DEF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#434dbd] cursor-pointer'
                        >
                            Conduct Exit Interview Questionnaire
                        </button>
                    </div>
                )}
                {current.exitInterviewResponse && <div className='text-sm mb-4 space-y-1'>{Object.entries(current.exitInterviewResponse).map(([question, answer]) => <p key={question}><span className='text-[#667085]'>{question}:</span> {answer}</p>)}{!current.exitInterview && <button type='button' className='text-[#515DEF]' onClick={() => setPendingAction({ type: 'interview', row: current })}>Close exit interview</button>}</div>}
                <div className='grid sm:grid-cols-2 gap-2'>{FLAGS.map((flag) => <label key={flag} className='text-sm flex gap-2 items-center'><input type='checkbox' checked={!!current[flag]} disabled={current.status === 'Completed'} onChange={() => setPendingAction({ type: 'clearance', row: current, key: flag })} />{flag.replace(/([A-Z])/g, ' $1')}</label>)}</div>
            </div>}
            {form && <ExitForm form={form} employees={employees} rows={rows} setForm={setForm} />}
            {interviewCandidate && (
                <ExitInterviewModal
                    row={interviewCandidate}
                    onClose={() => setInterviewCandidate(null)}
                    onSave={(answers) => {
                        saveExits(
                            getExits().map((item) =>
                                item.id === interviewCandidate.id
                                    ? {
                                          ...item,
                                          exitInterviewResponse: answers,
                                          exitInterview: true,
                                          exitInterviewClosedBy: 'HR Specialist',
                                          status: 'In Progress',
                                      }
                                    : item
                            )
                        )
                        toast.success('Exit interview questionnaire recorded successfully.')
                        setInterviewCandidate(null)
                    }}
                />
            )}
            <ConfirmAction open={Boolean(pendingAction)} onClose={() => setPendingAction(null)} onConfirm={() => { if (!pendingAction) return; if (pendingAction.type === 'interview') closeInterview(pendingAction.row); else toggle(pendingAction.row, pendingAction.key) }} title={pendingAction?.type === 'interview' ? 'Close exit interview?' : `${pendingAction?.row?.[pendingAction?.key] ? 'Reopen' : 'Complete'} clearance step?`} description='This changes the employee exit timeline and overall clearance status.' confirmLabel={pendingAction?.type === 'interview' ? 'Close interview' : 'Update clearance'}>
                <p><strong>{pendingAction ? employeeName(pendingAction.row.employeeId) : ''}</strong>{pendingAction?.key ? ` · ${pendingAction.key.replace(/([A-Z])/g, ' $1')}` : ''}. Production must record the responsible department, authenticated actor, evidence and timestamp.</p>
            </ConfirmAction>
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


const ExitInterviewModal = ({ row, onClose, onSave }) => {
    const [responses, setResponses] = useState({
        primaryReason: 'Career Growth / Higher Role',
        managementSupport: '4',
        workEnvironment: '4',
        resourceAdequacy: '5',
        recommendQMIS: 'Yes',
        itClearance: true,
        libraryClearance: true,
        labClearance: true,
        idCardSurrendered: true,
        feedback: '',
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave({
            'Primary Reason for Leaving': responses.primaryReason,
            'Management Support (1-5)': `${responses.managementSupport} / 5`,
            'Workplace Culture (1-5)': `${responses.workEnvironment} / 5`,
            'Resource Adequacy (1-5)': `${responses.resourceAdequacy} / 5`,
            'Willingness to Recommend QMIS': responses.recommendQMIS,
            'IT Hardware & Credentials Handed Over': responses.itClearance ? 'Verified & Completed' : 'Pending',
            'Library Clearance': responses.libraryClearance ? 'Verified & Completed' : 'Pending',
            'Lab / Equipment Clearance': responses.labClearance ? 'Verified & Completed' : 'Pending',
            'ID Card & Gate Pass Surrendered': responses.idCardSurrendered ? 'Surrendered' : 'Pending',
            'Constructive Feedback': responses.feedback.trim() || 'No additional remarks',
        })
    }

    return (
        <Modal title={`Exit Interview Questionnaire — ${employeeName(row.employeeId)}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className='space-y-4 max-h-[75vh] overflow-y-auto px-1'>
                <div className='grid gap-1'>
                    <label className='text-xs font-semibold text-[var(--erp-slate)]'>Primary Reason for Separation *</label>
                    <select
                        className={inputClass}
                        value={responses.primaryReason}
                        onChange={(e) => setResponses({ ...responses, primaryReason: e.target.value })}
                    >
                        <option>Career Growth / Higher Role</option>
                        <option>Higher Studies / Research</option>
                        <option>Relocation / Family Relocation</option>
                        <option>Better Compensation Package</option>
                        <option>Health / Personal Reasons</option>
                        <option>Retirement</option>
                    </select>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                    <div className='grid gap-1'>
                        <label className='text-xs font-semibold text-[var(--erp-slate)]'>Management Support</label>
                        <select
                            className={inputClass}
                            value={responses.managementSupport}
                            onChange={(e) => setResponses({ ...responses, managementSupport: e.target.value })}
                        >
                            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                        </select>
                    </div>
                    <div className='grid gap-1'>
                        <label className='text-xs font-semibold text-[var(--erp-slate)]'>Workplace Culture</label>
                        <select
                            className={inputClass}
                            value={responses.workEnvironment}
                            onChange={(e) => setResponses({ ...responses, workEnvironment: e.target.value })}
                        >
                            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                        </select>
                    </div>
                    <div className='grid gap-1'>
                        <label className='text-xs font-semibold text-[var(--erp-slate)]'>Resource Adequacy</label>
                        <select
                            className={inputClass}
                            value={responses.resourceAdequacy}
                            onChange={(e) => setResponses({ ...responses, resourceAdequacy: e.target.value })}
                        >
                            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                        </select>
                    </div>
                </div>

                <div className='grid gap-1'>
                    <label className='text-xs font-semibold text-[var(--erp-slate)]'>Would you recommend QMIS as a great place to work?</label>
                    <select
                        className={inputClass}
                        value={responses.recommendQMIS}
                        onChange={(e) => setResponses({ ...responses, recommendQMIS: e.target.value })}
                    >
                        <option>Yes, definitely</option>
                        <option>Maybe / Neutral</option>
                        <option>No</option>
                    </select>
                </div>

                <div className='border-t border-[var(--erp-line)] pt-3'>
                    <p className='text-xs font-bold text-[var(--erp-ink)] mb-2'>Departmental Handover Verification Checklist:</p>
                    <div className='grid sm:grid-cols-2 gap-2 text-xs'>
                        <label className='flex items-center gap-2'>
                            <input
                                type='checkbox'
                                checked={responses.itClearance}
                                onChange={(e) => setResponses({ ...responses, itClearance: e.target.checked })}
                            />
                            IT Hardware & Passwords
                        </label>
                        <label className='flex items-center gap-2'>
                            <input
                                type='checkbox'
                                checked={responses.libraryClearance}
                                onChange={(e) => setResponses({ ...responses, libraryClearance: e.target.checked })}
                            />
                            Library Books & Journal Cards
                        </label>
                        <label className='flex items-center gap-2'>
                            <input
                                type='checkbox'
                                checked={responses.labClearance}
                                onChange={(e) => setResponses({ ...responses, labClearance: e.target.checked })}
                            />
                            Science / Computer Lab Clearance
                        </label>
                        <label className='flex items-center gap-2'>
                            <input
                                type='checkbox'
                                checked={responses.idCardSurrendered}
                                onChange={(e) => setResponses({ ...responses, idCardSurrendered: e.target.checked })}
                            />
                            ID Badge & Vehicle Pass Surrendered
                        </label>
                    </div>
                </div>

                <div className='grid gap-1'>
                    <label className='text-xs font-semibold text-[var(--erp-slate)]'>Closing Remarks & Constructive Suggestions</label>
                    <textarea
                        rows={3}
                        className={inputClass}
                        value={responses.feedback}
                        onChange={(e) => setResponses({ ...responses, feedback: e.target.value })}
                        placeholder='Any reflections, handover notes, or parting advice for the institution...'
                    />
                </div>

                <div className='flex justify-end gap-2 pt-2'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='px-3 py-1.5 text-xs rounded border border-[var(--erp-line)]'
                    >
                        Cancel
                    </button>
                    <PrimaryButton type='submit'>Save Exit Interview</PrimaryButton>
                </div>
            </form>
        </Modal>
    )
}
