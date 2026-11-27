import React, { useMemo, useState } from 'react'
import { nextCollectionId, useOpsCollection } from '../../../Common/OpsCollections/useOpsCollection'

const STORAGE_KEY = 'schoolerp-fileroom-register-v1'
const MEDIA = ['Physical', 'Digital', 'Both']
const STATUSES = ['In File Room', 'Issued', 'Archived', 'Disposed']
const SENSITIVITY = ['Standard', 'Confidential', 'MD Approval Required']

const emptyForm = () => ({
    title: '',
    category: '',
    ownerDepartment: '',
    location: '',
    mediaType: 'Physical',
    status: 'In File Room',
    sensitivity: 'Standard',
    accessApprover: '',
    retentionNote: '',
})

/** Non-Academics §4.15 / §10 — file register with confidentiality at entry. */
const FileRegister = () => {
    const { rows, status, error, upsert, setError } = useOpsCollection(STORAGE_KEY)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [q, setQ] = useState('')

    const visible = useMemo(() => {
        const needle = q.trim().toLowerCase()
        if (!needle) return rows
        return rows.filter((row) =>
            [row.id, row.title, row.category, row.ownerDepartment, row.location, row.accessApprover]
                .join(' ')
                .toLowerCase()
                .includes(needle),
        )
    }, [rows, q])

    const onChange = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

    const onSubmit = async (event) => {
        event.preventDefault()
        if (!form.title.trim() || !form.ownerDepartment.trim()) {
            setError('Title and owner department are required.')
            return
        }
        if (!form.accessApprover.trim()) {
            setError('Set the access approver when the file is entered (Non-Academics confidentiality rule).')
            return
        }
        setSaving(true)
        const ok = await upsert({
            id: nextCollectionId(rows, 'FRG'),
            ...form,
            title: form.title.trim(),
            ownerDepartment: form.ownerDepartment.trim(),
            accessApprover: form.accessApprover.trim(),
            createdAt: new Date().toISOString(),
        })
        setSaving(false)
        if (ok) setForm(emptyForm())
    }

    return (
        <section className='space-y-4'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>File Register</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Physical and digital file custody: category, owner department, location, status, and
                    confidentiality approver set at first entry.
                </p>
            </div>
            {error ? <p className='text-sm text-[#B42318] bg-[#FEF3F2] rounded-lg px-3 py-2'>{error}</p> : null}

            <form onSubmit={onSubmit} className='bg-white rounded-2xl shadow-md p-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
                <label className='text-sm text-[#667085] md:col-span-2'>
                    Title *
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.title} onChange={onChange('title')} required />
                </label>
                <label className='text-sm text-[#667085]'>
                    Category
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.category} onChange={onChange('category')} placeholder='TC / Staff / Legal / Academic' />
                </label>
                <label className='text-sm text-[#667085]'>
                    Owner department *
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.ownerDepartment} onChange={onChange('ownerDepartment')} required />
                </label>
                <label className='text-sm text-[#667085]'>
                    Location
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.location} onChange={onChange('location')} placeholder='Cabinet / shelf / digital path' />
                </label>
                <label className='text-sm text-[#667085]'>
                    Media
                    <select className='mt-1 w-full border rounded-lg px-3 py-2' value={form.mediaType} onChange={onChange('mediaType')}>
                        {MEDIA.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                </label>
                <label className='text-sm text-[#667085]'>
                    Sensitivity
                    <select className='mt-1 w-full border rounded-lg px-3 py-2' value={form.sensitivity} onChange={onChange('sensitivity')}>
                        {SENSITIVITY.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                </label>
                <label className='text-sm text-[#667085]'>
                    Access approver *
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.accessApprover} onChange={onChange('accessApprover')} placeholder='e.g. Academic Head / Admin Head / MD' required />
                </label>
                <label className='text-sm text-[#667085] md:col-span-2'>
                    Retention note
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.retentionNote} onChange={onChange('retentionNote')} />
                </label>
                <div className='md:col-span-2'>
                    <button type='submit' disabled={saving} className='bg-[#515DEF] text-white rounded-lg px-4 py-2 text-sm disabled:opacity-60'>
                        {saving ? 'Saving…' : 'Add file entry'}
                    </button>
                </div>
            </form>

            <div className='flex gap-3 items-center'>
                <input
                    className='border rounded-lg px-3 py-2 text-sm w-full max-w-md'
                    placeholder='Search register…'
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
                <span className='text-xs text-[#98A2B3]'>{status === 'loading' ? 'Loading…' : `${visible.length} file(s)`}</span>
            </div>

            <div className='bg-white rounded-2xl shadow-md overflow-x-auto'>
                <table className='min-w-full text-sm'>
                    <thead className='bg-[#F9FAFB] text-[#667085] text-left'>
                        <tr>
                            <th className='px-3 py-2'>ID</th>
                            <th className='px-3 py-2'>Title</th>
                            <th className='px-3 py-2'>Owner</th>
                            <th className='px-3 py-2'>Location</th>
                            <th className='px-3 py-2'>Sensitivity</th>
                            <th className='px-3 py-2'>Approver</th>
                            <th className='px-3 py-2'>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr><td colSpan={7} className='px-3 py-6 text-[#98A2B3]'>No register rows yet.</td></tr>
                        ) : visible.map((row) => (
                            <tr key={row.id} className='border-t'>
                                <td className='px-3 py-2 font-medium'>{row.id}</td>
                                <td className='px-3 py-2'>{row.title}</td>
                                <td className='px-3 py-2'>{row.ownerDepartment}</td>
                                <td className='px-3 py-2'>{row.location || '—'}</td>
                                <td className='px-3 py-2'>{row.sensitivity}</td>
                                <td className='px-3 py-2'>{row.accessApprover}</td>
                                <td className='px-3 py-2'>
                                    <select
                                        className='border rounded-md px-2 py-1'
                                        value={row.status || 'In File Room'}
                                        onChange={(e) => upsert({ ...row, status: e.target.value })}
                                    >
                                        {STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default FileRegister
