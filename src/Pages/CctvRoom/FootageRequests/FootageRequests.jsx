import React, { useState } from 'react'
import { nextCollectionId, useOpsCollection } from '../../../Common/OpsCollections/useOpsCollection'

const STORAGE_KEY = 'schoolerp-cctv-footage-requests-v1'
const STATUSES = [
    'Pending Dept Head',
    'Pending JD',
    'Pending MD',
    'Approved — Clip Pending',
    'Clip Provided',
    'Rejected',
]

const emptyForm = () => ({
    requester: '',
    requesterDepartment: '',
    reason: '',
    area: '',
    dateNeeded: '',
    timeFrom: '',
    timeTo: '',
    sensitive: 'No',
    status: 'Pending Dept Head',
    clipNote: '',
})

/** Non-Academics §4.14 — footage request chain (no embedded video). */
const FootageRequests = () => {
    const { rows, status, error, upsert, setError } = useOpsCollection(STORAGE_KEY)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const onChange = (key) => (event) => {
        const value = event.target.value
        setForm((prev) => {
            if (key === 'sensitive') {
                return {
                    ...prev,
                    sensitive: value,
                    status: value === 'Yes' ? 'Pending MD' : 'Pending Dept Head',
                }
            }
            return { ...prev, [key]: value }
        })
    }

    const onSubmit = async (event) => {
        event.preventDefault()
        if (!form.requester.trim() || !form.reason.trim() || !form.area.trim() || !form.dateNeeded) {
            setError('Requester, reason, area, and date are required.')
            return
        }
        setSaving(true)
        const ok = await upsert({
            id: nextCollectionId(rows, 'CFR'),
            ...form,
            createdAt: new Date().toISOString(),
            accessLog: [{ at: new Date().toISOString(), action: 'request_created' }],
        })
        setSaving(false)
        if (ok) setForm(emptyForm())
    }

    const updateStatus = async (row, nextStatus) => {
        const accessLog = [
            ...(Array.isArray(row.accessLog) ? row.accessLog : []),
            { at: new Date().toISOString(), action: `status:${nextStatus}` },
        ]
        await upsert({ ...row, status: nextStatus, accessLog, updatedAt: new Date().toISOString() })
    }

    return (
        <section className='space-y-4'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>Footage Requests</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Request reason, date, time and area. Approval: Department Head → JD (MD if sensitive).
                    Camera Room records clip provision and an access log. Live video stays on the school NVR.
                </p>
            </div>
            {error ? <p className='text-sm text-[#B42318] bg-[#FEF3F2] rounded-lg px-3 py-2'>{error}</p> : null}

            <form onSubmit={onSubmit} className='bg-white rounded-2xl shadow-md p-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
                <label className='text-sm text-[#667085]'>
                    Requester *
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.requester} onChange={onChange('requester')} required />
                </label>
                <label className='text-sm text-[#667085]'>
                    Department
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.requesterDepartment} onChange={onChange('requesterDepartment')} />
                </label>
                <label className='text-sm text-[#667085] md:col-span-2'>
                    Reason *
                    <textarea className='mt-1 w-full border rounded-lg px-3 py-2' rows={2} value={form.reason} onChange={onChange('reason')} required />
                </label>
                <label className='text-sm text-[#667085]'>
                    Area / camera zone *
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.area} onChange={onChange('area')} required />
                </label>
                <label className='text-sm text-[#667085]'>
                    Date *
                    <input type='date' className='mt-1 w-full border rounded-lg px-3 py-2' value={form.dateNeeded} onChange={onChange('dateNeeded')} required />
                </label>
                <label className='text-sm text-[#667085]'>
                    Time from
                    <input type='time' className='mt-1 w-full border rounded-lg px-3 py-2' value={form.timeFrom} onChange={onChange('timeFrom')} />
                </label>
                <label className='text-sm text-[#667085]'>
                    Time to
                    <input type='time' className='mt-1 w-full border rounded-lg px-3 py-2' value={form.timeTo} onChange={onChange('timeTo')} />
                </label>
                <label className='text-sm text-[#667085]'>
                    Sensitive (MD approval)
                    <select className='mt-1 w-full border rounded-lg px-3 py-2' value={form.sensitive} onChange={onChange('sensitive')}>
                        <option value='No'>No</option>
                        <option value='Yes'>Yes</option>
                    </select>
                </label>
                <div className='md:col-span-2'>
                    <button type='submit' disabled={saving} className='bg-[#515DEF] text-white rounded-lg px-4 py-2 text-sm disabled:opacity-60'>
                        {saving ? 'Saving…' : 'Submit footage request'}
                    </button>
                </div>
            </form>

            <div className='bg-white rounded-2xl shadow-md overflow-x-auto'>
                <table className='min-w-full text-sm'>
                    <thead className='bg-[#F9FAFB] text-[#667085] text-left'>
                        <tr>
                            <th className='px-3 py-2'>ID</th>
                            <th className='px-3 py-2'>Requester</th>
                            <th className='px-3 py-2'>Area</th>
                            <th className='px-3 py-2'>Date</th>
                            <th className='px-3 py-2'>Sensitive</th>
                            <th className='px-3 py-2'>Status</th>
                            <th className='px-3 py-2'>Log entries</th>
                        </tr>
                    </thead>
                    <tbody>
                        {status === 'loading' ? (
                            <tr><td colSpan={7} className='px-3 py-6 text-[#98A2B3]'>Loading…</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={7} className='px-3 py-6 text-[#98A2B3]'>No footage requests yet.</td></tr>
                        ) : rows.map((row) => (
                            <tr key={row.id} className='border-t'>
                                <td className='px-3 py-2 font-medium'>{row.id}</td>
                                <td className='px-3 py-2'>{row.requester}</td>
                                <td className='px-3 py-2'>{row.area}</td>
                                <td className='px-3 py-2'>{row.dateNeeded}</td>
                                <td className='px-3 py-2'>{row.sensitive}</td>
                                <td className='px-3 py-2'>
                                    <select
                                        className='border rounded-md px-2 py-1'
                                        value={row.status || 'Pending Dept Head'}
                                        onChange={(e) => updateStatus(row, e.target.value)}
                                    >
                                        {STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </td>
                                <td className='px-3 py-2'>{Array.isArray(row.accessLog) ? row.accessLog.length : 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default FootageRequests
