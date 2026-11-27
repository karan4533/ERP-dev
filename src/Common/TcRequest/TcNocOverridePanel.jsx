import React, { useState } from 'react'
import { toast } from 'react-toastify'
import {
    TC_NOC_OVERRIDE_REASON_MIN,
    TC_NOC_OVERRIDE_ROLES,
    overrideTcNocViaApi,
} from './tcRequestData'
import { canUseTcApi } from '../../services/tcApi'

/**
 * Admin / Super Admin / MD override for a pending manager NOC (API mode only).
 * The server enforces role, reason length and pending status; this panel only collects the reason.
 */
const TcNocOverridePanel = ({ request, role, onUpdated }) => {
    const [selectedRole, setSelectedRole] = useState('')
    const [reason, setReason] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    if (!request || !TC_NOC_OVERRIDE_ROLES.includes(role) || !canUseTcApi()) return null
    if (request.status !== 'Pending Manager NOCs') return null
    const pending = (request.nocs || []).filter((noc) => noc.status === 'Pending')
    if (!pending.length) return null

    const trimmed = reason.trim()
    const activeRole = selectedRole || pending[0].roleCode
    const target = pending.find((noc) => noc.roleCode === activeRole) || pending[0]

    const handleOverride = async () => {
        if (busy) return
        if (trimmed.length < TC_NOC_OVERRIDE_REASON_MIN) {
            setError(`Enter a reason of at least ${TC_NOC_OVERRIDE_REASON_MIN} characters.`)
            return
        }
        setBusy(true)
        setError('')
        try {
            const updated = await overrideTcNocViaApi(request.id, target.roleCode, trimmed)
            setReason('')
            setSelectedRole('')
            onUpdated?.(updated)
            toast.success(`${target.roleLabel || target.roleCode} NOC overridden.`)
        } catch (err) {
            setError(err?.message || 'The NOC could not be overridden.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className='bg-white rounded-2xl shadow-md p-4'>
            <h2 className='text-xl font-semibold text-black mb-2'>Administrator NOC override</h2>
            <p className='text-sm text-[#667085] mb-4'>
                Use only when a clearing authority cannot record its own NOC (for example, no active user holds the role).
                Your name, role, the time and the reason are recorded in the request history and audit log.
            </p>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='flex flex-col gap-y-2'>
                    <label htmlFor='tc-override-role' className='text-base font-medium text-[#808080]'>Pending NOC</label>
                    <select
                        id='tc-override-role'
                        value={target.roleCode}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        disabled={busy}
                        className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                    >
                        {pending.map((noc) => (
                            <option key={noc.roleCode} value={noc.roleCode}>
                                {noc.roleLabel || noc.roleCode}
                                {noc.clearingUserActive === false ? ' (no active user)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div className='flex flex-col gap-y-2 md:col-span-2'>
                    <label htmlFor='tc-override-reason' className='text-base font-medium text-[#808080]'>Override reason (required)</label>
                    <textarea
                        id='tc-override-reason'
                        rows={3}
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value)
                            if (error) setError('')
                        }}
                        disabled={busy}
                        placeholder='Why is this clearance being overridden?'
                        className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                    />
                </div>
            </div>
            {target.clearingUserActive ? (
                <p className='text-sm text-[#B54708] mt-3'>
                    An active {target.roleLabel || target.roleCode} user exists on this campus. Prefer asking them to record the NOC.
                </p>
            ) : null}
            {error ? <p className='text-sm text-[#B42318] mt-3'>{error}</p> : null}
            <div className='flex sm:justify-end justify-center mt-4'>
                <button
                    type='button'
                    disabled={busy || trimmed.length < TC_NOC_OVERRIDE_REASON_MIN}
                    onClick={handleOverride}
                    className='bg-[#6941C6] text-white text-sm px-8 py-2 rounded-md border border-[#6941C6] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60 disabled:cursor-not-allowed'
                >
                    {busy ? 'Saving…' : `Override ${target.roleLabel || target.roleCode} NOC`}
                </button>
            </div>
        </div>
    )
}

export default TcNocOverridePanel
