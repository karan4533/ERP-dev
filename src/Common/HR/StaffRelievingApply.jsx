import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { apiRequest, getAccessToken, isApiAuthEnabled } from '../../services/apiClient'

const EXIT_TYPES = ['Resignation', 'Retirement', 'Relocation', 'Other']

const listMine = () => apiRequest('/hr/relieving/mine')
const apply = (body) => apiRequest('/hr/relieving', { method: 'POST', body })

/**
 * Employee-facing relieving / resignation application for the signed-in staff member's own record.
 * The server links it to the employee record and HR reviews it in Exit Formalities.
 */
export default function StaffRelievingApply({
    title = 'Apply for Relieving',
    description = 'Submit a relieving / resignation request. HR reviews clearance and exit formalities.',
}) {
    const apiReady = isApiAuthEnabled() && Boolean(getAccessToken())
    const [rows, setRows] = useState([])
    const [loadState, setLoadState] = useState(apiReady ? 'loading' : 'unavailable')
    const [loadError, setLoadError] = useState('')
    const [lastWorkingDate, setLastWorkingDate] = useState('')
    const [exitType, setExitType] = useState('Resignation')
    const [reason, setReason] = useState('')
    const [saving, setSaving] = useState(false)

    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        if (!apiReady) return undefined
        let active = true
        listMine()
            .then((data) => {
                if (!active) return
                setRows(data || [])
                setLoadState('loaded')
                setLoadError('')
            })
            .catch((error) => {
                if (!active) return
                setLoadState('failed')
                setLoadError(error?.message || 'Your applications could not be loaded.')
            })
        return () => {
            active = false
        }
    }, [apiReady, reloadKey])

    const refresh = () => {
        setLoadState('loading')
        setReloadKey((value) => value + 1)
    }

    const submit = async (event) => {
        event.preventDefault()
        if (saving || !apiReady) return
        if (!lastWorkingDate) {
            toast.error('Last working date is required.')
            return
        }
        if (!reason.trim()) {
            toast.error('Reason is required.')
            return
        }
        setSaving(true)
        try {
            const saved = await apply({ lastWorkingDate, exitType, reason: reason.trim() })
            setReason('')
            setLastWorkingDate('')
            toast.success(`Relieving application ${saved?.id || ''} submitted to HR.`)
            refresh()
        } catch (error) {
            toast.error(error?.message || 'The application could not be submitted.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-xl font-semibold text-black'>{title}</h1>
                <p className='text-sm text-[#667085] mt-1'>{description}</p>
                {!apiReady ? (
                    <p className='text-sm text-[#B42318] mt-4'>Sign in to submit a relieving application.</p>
                ) : (
                    <form onSubmit={submit} className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-4'>
                        <label className='text-sm text-[#808080] flex flex-col gap-1'>
                            Last working date
                            <input type='date' value={lastWorkingDate} onChange={(event) => setLastWorkingDate(event.target.value)} className='border rounded-md px-2 py-2 text-sm' required />
                        </label>
                        <label className='text-sm text-[#808080] flex flex-col gap-1'>
                            Exit type
                            <select value={exitType} onChange={(event) => setExitType(event.target.value)} className='border rounded-md px-2 py-2 text-sm'>
                                {EXIT_TYPES.map((type) => <option key={type}>{type}</option>)}
                            </select>
                        </label>
                        <label className='text-sm text-[#808080] flex flex-col gap-1 md:col-span-2'>
                            Reason
                            <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} className='border rounded-md px-2 py-2 text-sm min-h-[80px]' required />
                        </label>
                        <button type='submit' disabled={saving} className='bg-[#515DEF] text-white rounded-md text-sm px-4 py-2 cursor-pointer disabled:opacity-50 md:col-span-2'>
                            {saving ? 'Submitting…' : 'Submit relieving application'}
                        </button>
                    </form>
                )}
            </div>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <h2 className='text-lg font-medium mb-3'>My applications</h2>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            {['ID', 'Type', 'Last working', 'Status', 'Reason'].map((label) => (
                                <th key={label} className='px-2 py-3 text-left text-[#0C1E5B]'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loadState === 'loading' && (
                            <tr><td colSpan={5} className='px-2 py-6 text-center text-[#667085]'>Loading your applications…</td></tr>
                        )}
                        {loadState === 'failed' && (
                            <tr><td colSpan={5} className='px-2 py-6 text-center text-[#B42318]'>{loadError}</td></tr>
                        )}
                        {loadState === 'loaded' && rows.length === 0 && (
                            <tr><td colSpan={5} className='px-2 py-6 text-center text-[#667085]'>No relieving applications yet.</td></tr>
                        )}
                        {loadState === 'loaded' && rows.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.id}</td>
                                <td className='px-2 py-3'>{row.exitType}</td>
                                <td className='px-2 py-3'>{row.lastWorkingDate}</td>
                                <td className='px-2 py-3'>{row.status}</td>
                                <td className='px-2 py-3'>{row.reason}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
