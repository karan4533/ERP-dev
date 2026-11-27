import React, { useMemo, useState } from 'react'
import { nextCollectionId, useOpsCollection } from '../../../Common/OpsCollections/useOpsCollection'
import { listOpsCollectionApi } from '../../../services/opsApi'

const STORAGE_KEY = 'schoolerp-cctv-camera-status-v1'
const CHECKS = ['Working', 'Not Working']

/** Non-Academics §4.14 — daily camera status check (working / not working). */
const CameraStatus = () => {
    const { rows, status, error, upsert, setError } = useOpsCollection(STORAGE_KEY)
    const [cameras, setCameras] = useState([])
    const [cameraLoad, setCameraLoad] = useState('loading')
    const [form, setForm] = useState({
        cameraId: '',
        cameraLabel: '',
        checkDate: new Date().toISOString().slice(0, 10),
        result: 'Working',
        notes: '',
        maintenanceTicket: '',
    })
    const [saving, setSaving] = useState(false)

    React.useEffect(() => {
        let cancelled = false
        listOpsCollectionApi('security-cameras')
            .then((data) => {
                if (cancelled) return
                setCameras(Array.isArray(data) ? data : [])
                setCameraLoad('ready')
            })
            .catch((err) => {
                if (cancelled) return
                setCameraLoad('error')
                setError(err?.message || 'Could not load camera register for status checks.')
            })
        return () => { cancelled = true }
    }, [setError])

    const todayRows = useMemo(
        () => rows.filter((row) => String(row.checkDate || '') === form.checkDate),
        [rows, form.checkDate],
    )

    const onCamera = (event) => {
        const cameraId = event.target.value
        const match = cameras.find((row) => String(row.id) === String(cameraId))
        setForm((prev) => ({
            ...prev,
            cameraId,
            cameraLabel: match ? `${match.location || ''} ${match.name || match.cameraName || ''}`.trim() : '',
        }))
    }

    const onSubmit = async (event) => {
        event.preventDefault()
        if (!form.cameraId || !form.checkDate) {
            setError('Camera and check date are required.')
            return
        }
        setSaving(true)
        const ok = await upsert({
            id: nextCollectionId(rows, 'CCS'),
            ...form,
            createdAt: new Date().toISOString(),
        })
        setSaving(false)
        if (ok) {
            setForm((prev) => ({
                ...prev,
                cameraId: '',
                cameraLabel: '',
                result: 'Working',
                notes: '',
                maintenanceTicket: '',
            }))
        }
    }

    return (
        <section className='space-y-4'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>Daily Camera Status</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Record working / not working checks against the camera register. Raise a maintenance
                    note when a camera is not working (ticket ID optional until IT ticket API is linked).
                </p>
            </div>
            {error ? <p className='text-sm text-[#B42318] bg-[#FEF3F2] rounded-lg px-3 py-2'>{error}</p> : null}

            <form onSubmit={onSubmit} className='bg-white rounded-2xl shadow-md p-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
                <label className='text-sm text-[#667085]'>
                    Check date *
                    <input type='date' className='mt-1 w-full border rounded-lg px-3 py-2' value={form.checkDate} onChange={(e) => setForm((p) => ({ ...p, checkDate: e.target.value }))} required />
                </label>
                <label className='text-sm text-[#667085]'>
                    Result *
                    <select className='mt-1 w-full border rounded-lg px-3 py-2' value={form.result} onChange={(e) => setForm((p) => ({ ...p, result: e.target.value }))}>
                        {CHECKS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                </label>
                <label className='text-sm text-[#667085] md:col-span-2'>
                    Camera *
                    <select className='mt-1 w-full border rounded-lg px-3 py-2' value={form.cameraId} onChange={onCamera} required>
                        <option value=''>{cameraLoad === 'loading' ? 'Loading cameras…' : 'Select camera…'}</option>
                        {cameras.map((row) => (
                            <option key={row.id} value={row.id}>
                                {row.id} — {row.location || '—'} ({row.status || '—'})
                            </option>
                        ))}
                    </select>
                </label>
                <label className='text-sm text-[#667085] md:col-span-2'>
                    Notes / maintenance ticket
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder='Optional ticket reference' />
                </label>
                <div className='md:col-span-2'>
                    <button type='submit' disabled={saving || !cameras.length} className='bg-[#515DEF] text-white rounded-lg px-4 py-2 text-sm disabled:opacity-60'>
                        {saving ? 'Saving…' : 'Save daily check'}
                    </button>
                </div>
            </form>

            <div className='bg-white rounded-2xl shadow-md overflow-x-auto'>
                <div className='px-3 py-2 text-sm text-[#667085] border-b'>Checks for {form.checkDate || '—'} ({status === 'loading' ? '…' : todayRows.length})</div>
                <table className='min-w-full text-sm'>
                    <thead className='bg-[#F9FAFB] text-[#667085] text-left'>
                        <tr>
                            <th className='px-3 py-2'>ID</th>
                            <th className='px-3 py-2'>Camera</th>
                            <th className='px-3 py-2'>Result</th>
                            <th className='px-3 py-2'>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {todayRows.length === 0 ? (
                            <tr><td colSpan={4} className='px-3 py-6 text-[#98A2B3]'>No checks for this date yet.</td></tr>
                        ) : todayRows.map((row) => (
                            <tr key={row.id} className='border-t'>
                                <td className='px-3 py-2 font-medium'>{row.id}</td>
                                <td className='px-3 py-2'>{row.cameraId} {row.cameraLabel ? `— ${row.cameraLabel}` : ''}</td>
                                <td className='px-3 py-2'>{row.result}</td>
                                <td className='px-3 py-2'>{row.notes || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default CameraStatus
