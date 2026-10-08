import { useState } from 'react'
import { toast } from 'react-toastify'
import { ensureSeed, saveJson } from '../demoDomain/storage'
import { logActivity } from '../demoDomain/activityLog'

const KEY = 'schoolerp-audit-rework-v1'

export default function AuditReviewPanel({ recordId, kind, stream, originalSummary = 'Original submission remains on the audit record.' }) {
    const [reason, setReason] = useState('')
    const [rework, setRework] = useState('')
    const [history, setHistory] = useState(() => ensureSeed(KEY, []).filter((item) => item.recordId === recordId && item.kind === kind && item.stream === stream))

    const persist = (entry) => {
        const all = ensureSeed(KEY, [])
        const next = [entry, ...all]
        saveJson(KEY, next)
        setHistory(next.filter((item) => item.recordId === recordId && item.kind === kind && item.stream === stream))
    }

    const latest = history[0]
    const waitingForRework = latest?.status === 'DECLINED'
    const accepted = latest?.status === 'ACCEPTED'

    const decide = (decision) => {
        if (decision === 'DECLINE' && !reason.trim()) {
            toast.error('Decline reason is required.')
            return
        }
        const entry = {
            id: `${stream}-${kind}-${recordId}-${Date.now()}`,
            recordId,
            kind,
            stream,
            decision,
            status: decision === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED',
            reworkRequired: decision === 'DECLINE',
            reason: reason.trim(),
            reviewedBy: stream === 'QUALITY' ? 'Quality Auditor' : 'Process Auditor',
            reviewedAt: new Date().toISOString(),
            originalSummary,
        }
        persist(entry)
        logActivity({ action: decision === 'ACCEPT' ? 'APPROVE' : 'REJECT', module: `${stream} ${kind}`, recordId, reason: entry.reason })
        setReason('')
        toast.success(decision === 'ACCEPT' ? `${kind} accepted.` : `${kind} declined. The previous response is kept and rework is required.`)
    }

    const resubmit = () => {
        if (!rework.trim()) {
            toast.error('Enter the reworked response.')
            return
        }
        persist({
            id: `${stream}-${kind}-${recordId}-rework-${Date.now()}`,
            recordId,
            kind,
            stream,
            status: 'RESUBMITTED',
            reworkRequired: false,
            response: rework.trim(),
            reviewedBy: latest?.reviewedBy || '',
            reviewedAt: new Date().toISOString(),
            originalSummary,
        })
        setRework('')
        toast.success('Rework resubmitted. The declined response is still in the history.')
    }

    return (
        <div className='bg-white rounded-2xl shadow-md p-4 space-y-3'>
            <h3 className='text-base font-semibold'>{kind} review · {stream === 'QUALITY' ? 'Quality' : 'Process'}</h3>
            <p className='text-sm text-[#667085]'>Original submission: {originalSummary}</p>
            {!accepted && !waitingForRework && (
                <>
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} placeholder='Decline reason' className='w-full border border-[#D9D9D9] rounded-md px-2 py-2 text-sm' />
                    <div className='flex gap-2'>
                        <button type='button' onClick={() => decide('ACCEPT')} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer'>Accept</button>
                        <button type='button' onClick={() => decide('DECLINE')} className='border border-[#FF5722] text-[#FF5722] text-sm px-4 py-2 rounded-md cursor-pointer'>Decline</button>
                    </div>
                </>
            )}
            {waitingForRework && (
                <div className='space-y-2'>
                    <p className='text-sm text-[#B54708]'>Rework required. Add a new response. The declined submission stays in history.</p>
                    <textarea value={rework} onChange={(event) => setRework(event.target.value)} rows={3} placeholder='Reworked response' className='w-full border border-[#D9D9D9] rounded-md px-2 py-2 text-sm' />
                    <button type='button' onClick={resubmit} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer'>Resubmit</button>
                </div>
            )}
            {history.length > 0 && (
                <ol className='text-sm text-[#667085] space-y-2'>
                    {[...history].reverse().map((item) => (
                        <li key={item.id} className='border border-[#EDEEF5] rounded-md px-3 py-2'>
                            <span className='font-medium text-[#1E1E1E]'>{item.status}</span>
                            {item.reviewedBy ? ` · ${item.reviewedBy}` : ''}
                            {item.reviewedAt ? ` · ${item.reviewedAt}` : ''}
                            {item.reason ? ` · ${item.reason}` : ''}
                            {item.response ? ` · ${item.response}` : ''}
                            {item.reworkRequired ? ' · Rework required' : ''}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    )
}
