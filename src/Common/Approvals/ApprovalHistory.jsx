import { useEffect, useState } from 'react'
import { getApprovalApi } from '../../services/approvalsApi'
import { approverLabel, describeEvent } from './approvalStep'

// Server times are UTC; a value without an offset must not be read as local time.
const formatWhen = (value) => {
    const text = String(value || '')
    const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(text) ? text : `${text}Z`)
    return Number.isNaN(date.getTime()) ? String(value || '') : date.toLocaleString()
}

/** Submission and decision history of one approval request, read from the server. */
export default function ApprovalHistory({ approvalId }) {
    const [state, setState] = useState({ loading: true, detail: null, error: '' })

    useEffect(() => {
        if (!approvalId) return undefined
        let cancelled = false
        getApprovalApi(approvalId)
            .then((detail) => {
                if (!cancelled) setState({ loading: false, detail, error: '' })
            })
            .catch((error) => {
                if (!cancelled) setState({ loading: false, detail: null, error: error?.message || 'History could not be loaded.' })
            })
        return () => {
            cancelled = true
        }
    }, [approvalId])

    if (!approvalId) return <p className='text-sm text-[#667085]'>Not submitted for approval yet.</p>
    if (state.loading) return <p className='text-sm text-[#667085]'>Loading approval history…</p>
    if (state.error) return <p className='text-sm text-[#B42318]'>{state.error}</p>

    const { detail } = state
    const chain = Array.isArray(detail?.chain) ? detail.chain : []
    return (
        <div className='space-y-3'>
            <p className='text-sm text-[#475467]'>
                Route: {chain.map(approverLabel).join(' → ') || '—'}
                {detail?.status === 'pending' && detail?.awaitingRole ? ` · now with the ${approverLabel(detail.awaitingRole)}` : ''}
                {detail?.status === 'approved' ? ' · fully approved' : ''}
                {detail?.status === 'denied' ? ' · rejected' : ''}
            </p>
            {detail?.awaitingEligibleApprover ? (
                <p className='text-sm text-[#9A3412]'>No one can currently decide this step; an administrator has been alerted.</p>
            ) : null}
            <ol className='space-y-1 text-sm text-[#1E1E1E] list-decimal pl-5'>
                {(detail?.events || []).map((event, index) => (
                    <li key={`${event.at}-${index}`}>
                        <span className='text-[#667085]'>{formatWhen(event.at)}</span> — {describeEvent(event)}
                    </li>
                ))}
            </ol>
        </div>
    )
}
