import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { apiRequest } from '../../../services/apiClient'
import { listOpsCollectionApi, upsertOpsItemApi } from '../../../services/opsApi'

const COLLECTION = 'security-cameras'
const STATUSES = ['Active', 'Offline', 'Under Maintenance', 'Removed']
const statusColor = {
    Active: 'bg-[#ECFDF3] text-[#027A48]',
    Offline: 'bg-[#FEF3F2] text-[#B42318]',
    'Under Maintenance': 'bg-[#FFFAEB] text-[#B54708]',
    Removed: 'bg-[#F2F4F7] text-[#667085]',
}
const emptyForm = { id: '', name: '', location: '', status: 'Active', streamUrl: '', notes: '' }
const inputClass = 'text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

const nextCameraId = (rows) => {
    const max = rows.reduce((acc, row) => {
        const match = String(row.id || '').match(/(\d+)$/)
        return match ? Math.max(acc, Number(match[1])) : acc
    }, 0)
    return `CAM-${String(max + 1).padStart(4, '0')}`
}

/**
 * Register of campus CCTV cameras (where they are and whether they work). The ERP does not play
 * video; the stream link opens in the school's NVR/VMS. Camera passwords are never stored here.
 */
const CameraRegister = ({ canEdit = true }) => {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState(null)
    const [saving, setSaving] = useState(false)
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        let cancelled = false
        listOpsCollectionApi(COLLECTION)
            .then((data) => { if (!cancelled) setRows(Array.isArray(data) ? data : []) })
            .catch((error) => { if (!cancelled) toast.error(error?.message || 'Could not load cameras.') })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    const visible = useMemo(
        () => rows
            .filter((row) => !statusFilter || row.status === statusFilter)
            .sort((a, b) => String(a.location).localeCompare(String(b.location)) || String(a.name).localeCompare(String(b.name))),
        [rows, statusFilter],
    )
    const counts = useMemo(
        () => Object.fromEntries(STATUSES.map((status) => [status, rows.filter((row) => row.status === status).length])),
        [rows],
    )

    const save = async (event) => {
        event.preventDefault()
        const id = form.id || nextCameraId(rows)
        setSaving(true)
        try {
            const body = {
                name: form.name.trim(),
                location: form.location.trim(),
                status: form.status,
                streamUrl: form.streamUrl.trim(),
                notes: form.notes.trim(),
            }
            const saved = await upsertOpsItemApi(COLLECTION, id, body)
            setRows((current) => [...current.filter((row) => row.id !== id), saved])
            setForm(null)
            toast.success('Camera saved.')
        } catch (error) {
            toast.error(error?.message || 'Could not save the camera.')
        } finally {
            setSaving(false)
        }
    }

    const remove = async (row) => {
        if (!window.confirm(`Remove ${row.name} from the register?`)) return
        try {
            await apiRequest(`/ops/${COLLECTION}/items/${encodeURIComponent(row.id)}`, { method: 'DELETE' })
            setRows((current) => current.filter((item) => item.id !== row.id))
            toast.success('Camera removed from the register.')
        } catch (error) {
            toast.error(error?.message || 'Could not remove the camera.')
        }
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-start justify-between gap-4'>
                    <div>
                        <h2 className='text-xl font-semibold text-[#0C1E5B]'>Camera Management</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Register of CCTV cameras and their status. Video is viewed in the school&apos;s recorder (NVR);
                            do not put camera usernames or passwords in the stream link.
                        </p>
                    </div>
                    {canEdit && (
                        <button
                            type='button'
                            onClick={() => setForm({ ...emptyForm })}
                            className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer'
                        >
                            <Plus size={16} /> Add camera
                        </button>
                    )}
                </div>
                <div className='flex flex-wrap gap-2 mt-4'>
                    <button
                        type='button'
                        onClick={() => setStatusFilter('')}
                        className={`text-sm px-3 py-1 rounded-full border cursor-pointer ${!statusFilter ? 'bg-[#515DEF] text-white border-[#515DEF]' : 'border-[#D9D9D9] text-[#667085]'}`}
                    >
                        All ({rows.length})
                    </button>
                    {STATUSES.map((status) => (
                        <button
                            key={status}
                            type='button'
                            onClick={() => setStatusFilter(status)}
                            className={`text-sm px-3 py-1 rounded-full border cursor-pointer ${statusFilter === status ? 'bg-[#515DEF] text-white border-[#515DEF]' : 'border-[#D9D9D9] text-[#667085]'}`}
                        >
                            {status} ({counts[status]})
                        </button>
                    ))}
                </div>
            </div>

            {form && (
                <form onSubmit={save} className='bg-white rounded-2xl shadow-md p-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <h3 className='md:col-span-2 text-base font-semibold text-[#0C1E5B]'>{form.id ? `Edit ${form.id}` : 'New camera'}</h3>
                    <label className='text-sm text-[#1E1E1E] flex flex-col gap-1'>Name *
                        <input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
                    </label>
                    <label className='text-sm text-[#1E1E1E] flex flex-col gap-1'>Location *
                        <input required maxLength={160} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder='e.g. Main gate, Block A corridor' className={inputClass} />
                    </label>
                    <label className='text-sm text-[#1E1E1E] flex flex-col gap-1'>Status
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </label>
                    <label className='text-sm text-[#1E1E1E] flex flex-col gap-1'>Stream link (optional)
                        <input maxLength={300} value={form.streamUrl} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} placeholder='rtsp://10.0.0.5:554/stream1' className={inputClass} />
                    </label>
                    <label className='md:col-span-2 text-sm text-[#1E1E1E] flex flex-col gap-1'>Notes
                        <input maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
                    </label>
                    <div className='md:col-span-2 flex gap-3'>
                        <button type='submit' disabled={saving} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md cursor-pointer disabled:opacity-50'>
                            {saving ? 'Saving…' : 'Save camera'}
                        </button>
                        <button type='button' onClick={() => setForm(null)} className='border border-[#D9D9D9] text-sm px-4 py-2 rounded-md cursor-pointer'>Cancel</button>
                    </div>
                </form>
            )}

            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5] uppercase text-[#0C1E5B]'>
                        <tr>
                            <th className='px-2 py-3'>ID</th>
                            <th className='px-2 py-3'>Name</th>
                            <th className='px-2 py-3'>Location</th>
                            <th className='px-2 py-3'>Status</th>
                            <th className='px-2 py-3'>Stream link</th>
                            <th className='px-2 py-3'>Notes</th>
                            {canEdit && <th className='px-2 py-3'>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {(loading || visible.length === 0) && (
                            <tr>
                                <td colSpan={canEdit ? 7 : 6} className='px-2 py-8 text-center text-[#667085]'>
                                    {loading ? 'Loading cameras…' : 'No cameras registered yet.'}
                                </td>
                            </tr>
                        )}
                        {!loading && visible.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7] text-[#667085]'>
                                <td className='px-2 py-3'>{row.id}</td>
                                <td className='px-2 py-3 text-[#1E1E1E] font-medium'>{row.name}</td>
                                <td className='px-2 py-3'>{row.location}</td>
                                <td className='px-2 py-3'>
                                    <span className={`text-xs font-medium rounded-full px-2 py-1 ${statusColor[row.status] || ''}`}>{row.status}</span>
                                </td>
                                <td className='px-2 py-3 break-all'>{row.streamUrl || '—'}</td>
                                <td className='px-2 py-3'>{row.notes || '—'}</td>
                                {canEdit && (
                                    <td className='px-2 py-3'>
                                        <div className='flex items-center gap-3'>
                                            <button type='button' onClick={() => setForm({ ...emptyForm, ...row })} className='inline-flex items-center gap-1 text-[#515DEF] hover:underline cursor-pointer'>
                                                <Pencil size={14} /> Edit
                                            </button>
                                            <button type='button' onClick={() => remove(row)} className='inline-flex items-center gap-1 text-[#B42318] hover:underline cursor-pointer'>
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default CameraRegister
