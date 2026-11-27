import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
    listAssignedAuditObservationsApi,
    submitAuditCorrectiveActionApi,
} from '../../services/auditRecipientApi'
import { fileDownloadUrl } from '../../services/filesApi'
import AuditEvidenceInput from './AuditEvidenceInput'

const inputClass = 'text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-2 w-full bg-white'
const CLOSED = ['Resolved', 'Closed']

const emptyAction = () => ({ actionTaken: '', rootCause: '', preventiveAction: '', completionDate: '', evidence: [] })

const EvidenceLinks = ({ files }) => (
    <span className='flex flex-wrap gap-2'>
        {(files || []).map((file) => (
            <a key={file.fileId} href={fileDownloadUrl(file.downloadPath)} target='_blank' rel='noreferrer' className='text-[#515DEF] underline'>
                {file.name}
            </a>
        ))}
    </span>
)

const CorrectiveActionForm = ({ observation, onSubmitted }) => {
    const [draft, setDraft] = useState(emptyAction)
    const [saving, setSaving] = useState(false)
    const observationKey = observation.observationId || observation.id
    const set = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }))

    const submit = async (event) => {
        event.preventDefault()
        if (!draft.actionTaken.trim()) {
            toast.error('Describe the action taken.')
            return
        }
        setSaving(true)
        try {
            const saved = await submitAuditCorrectiveActionApi(observation.stream, observationKey, {
                ...draft,
                evidence: draft.evidence.map((file) => ({ fileId: file.fileId })),
            })
            toast.success(`Corrective action for ${observationKey} submitted.`)
            setDraft(emptyAction())
            onSubmitted(saved)
        } catch (err) {
            toast.error(err?.message || 'Could not submit the corrective action.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={submit} className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-3'>
            <label className='md:col-span-2 flex flex-col gap-1 text-sm text-[#808080]'>
                Action taken *
                <textarea value={draft.actionTaken} onChange={(e) => set('actionTaken', e.target.value)} className={`${inputClass} min-h-[80px]`} required />
            </label>
            <label className='flex flex-col gap-1 text-sm text-[#808080]'>
                Root cause
                <textarea value={draft.rootCause} onChange={(e) => set('rootCause', e.target.value)} className={inputClass} />
            </label>
            <label className='flex flex-col gap-1 text-sm text-[#808080]'>
                Preventive action
                <textarea value={draft.preventiveAction} onChange={(e) => set('preventiveAction', e.target.value)} className={inputClass} />
            </label>
            <label className='flex flex-col gap-1 text-sm text-[#808080]'>
                Completion date
                <input type='date' value={draft.completionDate} onChange={(e) => set('completionDate', e.target.value)} className={inputClass} />
            </label>
            <div className='flex flex-col gap-1 text-sm text-[#808080]'>
                Evidence (PDF, PNG, JPG, Word, Excel)
                <AuditEvidenceInput
                    stream={observation.stream}
                    kind='atr'
                    resourceId={observationKey}
                    onUploaded={(asset) => asset && setDraft((prev) => ({ ...prev, evidence: [...prev.evidence, asset] }))}
                    className={inputClass}
                />
                {draft.evidence.length ? (
                    <span className='text-xs'>
                        Attached: <EvidenceLinks files={draft.evidence} />{' '}
                        <button type='button' onClick={() => set('evidence', [])} className='text-[#FF0000] underline cursor-pointer'>Clear</button>
                    </span>
                ) : null}
            </div>
            <div className='md:col-span-2 flex justify-end'>
                <button type='submit' disabled={saving} className='bg-[#515DEF] text-white text-sm px-6 py-2 rounded-md cursor-pointer disabled:opacity-50'>
                    {saving ? 'Submitting…' : 'Submit corrective action'}
                </button>
            </div>
        </form>
    )
}

/**
 * Department-head inbox for audit observations assigned to the signed-in role.
 * Data comes only from GET /campus-audit/assigned/observations (server-scoped to the role).
 */
const AssignedAuditObservations = () => {
    const [rows, setRows] = useState([])
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState('')
    const [openId, setOpenId] = useState('')

    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let active = true
        listAssignedAuditObservationsApi()
            .then((data) => {
                if (!active) return
                setRows(Array.isArray(data) ? data : [])
                setError('')
                setStatus('loaded')
            })
            .catch((err) => {
                if (!active) return
                setError(err?.message || 'Could not load assigned observations.')
                setStatus('failed')
            })
        return () => {
            active = false
        }
    }, [reloadKey])

    const load = () => {
        setStatus('loading')
        setReloadKey((key) => key + 1)
    }

    const replaceRow = (saved) => {
        setRows((prev) => prev.map((row) => (row.id === saved.id && row.stream === saved.stream ? saved : row)))
        setOpenId('')
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Audit observations for my department</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Observations raised by the Process or Quality auditor and assigned to your department. Submit the corrective action (ATR) with evidence before the due date.
                </p>
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                {status === 'loading' ? <p className='text-sm text-[#667085]'>Loading assigned observations…</p> : null}
                {status === 'failed' ? (
                    <p className='text-sm text-[#FF0000]'>
                        {error}{' '}
                        <button type='button' onClick={load} className='underline cursor-pointer'>Retry</button>
                    </p>
                ) : null}
                {status === 'loaded' && rows.length === 0 ? (
                    <p className='text-sm text-[#667085]'>No audit observations are assigned to your department.</p>
                ) : null}
                <ul className='space-y-4'>
                    {rows.map((row) => {
                        const key = `${row.stream}:${row.id}`
                        const response = row.departmentResponse
                        const history = row.correctiveAction?.responseHistory || row.responseHistory || []
                        const canRespond = !CLOSED.includes(row.status)
                        return (
                            <li key={key} className='border border-[#EDEEF5] rounded-xl p-4'>
                                <div className='flex flex-wrap justify-between gap-2'>
                                    <div>
                                        <p className='text-sm font-semibold text-[#1E1E1E]'>
                                            {row.referenceNumber || row.observationId} · {row.title || row.category}
                                        </p>
                                        <p className='text-xs text-[#667085]'>
                                            {row.stream === 'quality' ? 'Quality' : 'Process'} audit {row.auditReference || '—'} · Priority {row.priority || '—'} · Due {row.dueDate || '—'}
                                        </p>
                                    </div>
                                    <span className='text-xs font-semibold px-2 py-1 rounded-lg bg-[#515DEF33] text-[#515DEF] h-fit'>
                                        {row.status || 'Open'}{row.correctiveAction?.status ? ` · ATR ${row.correctiveAction.status}` : ''}
                                    </span>
                                </div>
                                {row.description ? <p className='text-sm text-[#1E1E1E] mt-2 whitespace-pre-wrap'>{row.description}</p> : null}
                                {response ? (
                                    <div className='mt-3 text-sm text-[#667085] space-y-1'>
                                        <p><strong>Action taken:</strong> {response.actionTaken}</p>
                                        {response.rootCause ? <p><strong>Root cause:</strong> {response.rootCause}</p> : null}
                                        {response.preventiveAction ? <p><strong>Preventive action:</strong> {response.preventiveAction}</p> : null}
                                        {response.evidence?.length ? <p><strong>Evidence:</strong> <EvidenceLinks files={response.evidence} /></p> : null}
                                        <p className='text-xs'>Submitted by {response.submittedByEmail} on {String(response.submittedAt || '').slice(0, 10)}</p>
                                    </div>
                                ) : null}
                                {history.length ? (
                                    <ul className='mt-2 text-xs text-[#808080] list-disc pl-5'>
                                        {history.map((entry) => (
                                            <li key={`${entry.at}-${entry.action}`}>{String(entry.at || '').slice(0, 16).replace('T', ' ')} — {entry.action} ({entry.byEmail})</li>
                                        ))}
                                    </ul>
                                ) : null}
                                {canRespond ? (
                                    openId === key ? (
                                        <CorrectiveActionForm observation={row} onSubmitted={replaceRow} />
                                    ) : (
                                        <button type='button' onClick={() => setOpenId(key)} className='mt-3 text-sm text-[#515DEF] underline cursor-pointer'>
                                            {response ? 'Update corrective action' : 'Submit corrective action'}
                                        </button>
                                    )
                                ) : null}
                            </li>
                        )
                    })}
                </ul>
            </div>
        </section>
    )
}

export default AssignedAuditObservations
