import React, { useState } from 'react'
import { nextCollectionId, useOpsCollection } from '../../../Common/OpsCollections/useOpsCollection'

const STORAGE_KEY = 'schoolerp-fileroom-issues-v1'
const REGISTER_KEY = 'schoolerp-fileroom-register-v1'
const REQUEST_TYPES = ['Issue', 'Return', 'Access']
const STATUSES = ['Pending Dept Head', 'Pending File Room', 'Pending MD', 'Issued', 'Returned', 'Rejected']

const emptyForm = () => ({
    requestType: 'Issue',
    fileId: '',
    fileTitle: '',
    requester: '',
    requesterDepartment: '',
    reason: '',
    status: 'Pending Dept Head',
})

/** Non-Academics §4.15 / approval chain — file issue/return/access requests. */
const FileRequests = () => {
    const issues = useOpsCollection(STORAGE_KEY)
    const register = useOpsCollection(REGISTER_KEY)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const onChange = (key) => (event) => {
        const value = event.target.value
        setForm((prev) => {
            if (key === 'fileId') {
                const match = register.rows.find((row) => String(row.id) === String(value))
                return {
                    ...prev,
                    fileId: value,
                    fileTitle: match?.title || prev.fileTitle,
                    status:
                        match?.sensitivity === 'MD Approval Required'
                            ? 'Pending MD'
                            : prev.status === 'Pending MD'
                                ? 'Pending Dept Head'
                                : prev.status,
                }
            }
            return { ...prev, [key]: value }
        })
    }

    const onSubmit = async (event) => {
        event.preventDefault()
        if (!form.fileId.trim() || !form.requester.trim() || !form.reason.trim()) {
            issues.setError('File, requester, and reason are required.')
            return
        }
        setSaving(true)
        const ok = await issues.upsert({
            id: nextCollectionId(issues.rows, 'FIS'),
            ...form,
            createdAt: new Date().toISOString(),
        })
        setSaving(false)
        if (ok) setForm(emptyForm())
    }

    const advance = async (row, status) => {
        await issues.upsert({ ...row, status, updatedAt: new Date().toISOString() })
        if (status === 'Issued' || status === 'Returned') {
            const file = register.rows.find((item) => String(item.id) === String(row.fileId))
            if (file) {
                await register.upsert({
                    ...file,
                    status: status === 'Issued' ? 'Issued' : 'In File Room',
                })
            }
        }
    }

    return (
        <section className='space-y-4'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>File Requests</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Issue, return, and access requests. Chain: requester Dept Head → File Room
                    (MD when the register marks the file as MD Approval Required).
                </p>
            </div>
            {issues.error ? <p className='text-sm text-[#B42318] bg-[#FEF3F2] rounded-lg px-3 py-2'>{issues.error}</p> : null}

            <form onSubmit={onSubmit} className='bg-white rounded-2xl shadow-md p-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
                <label className='text-sm text-[#667085]'>
                    Request type
                    <select className='mt-1 w-full border rounded-lg px-3 py-2' value={form.requestType} onChange={onChange('requestType')}>
                        {REQUEST_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                </label>
                <label className='text-sm text-[#667085]'>
                    File from register *
                    <select className='mt-1 w-full border rounded-lg px-3 py-2' value={form.fileId} onChange={onChange('fileId')} required>
                        <option value=''>Select file…</option>
                        {register.rows.map((row) => (
                            <option key={row.id} value={row.id}>{row.id} — {row.title}</option>
                        ))}
                    </select>
                </label>
                <label className='text-sm text-[#667085]'>
                    Requester *
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.requester} onChange={onChange('requester')} required />
                </label>
                <label className='text-sm text-[#667085]'>
                    Requester department
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.requesterDepartment} onChange={onChange('requesterDepartment')} />
                </label>
                <label className='text-sm text-[#667085] md:col-span-2'>
                    Reason *
                    <textarea className='mt-1 w-full border rounded-lg px-3 py-2' rows={2} value={form.reason} onChange={onChange('reason')} required />
                </label>
                <div className='md:col-span-2'>
                    <button type='submit' disabled={saving || !register.rows.length} className='bg-[#515DEF] text-white rounded-lg px-4 py-2 text-sm disabled:opacity-60'>
                        {saving ? 'Saving…' : 'Submit request'}
                    </button>
                    {!register.rows.length ? (
                        <p className='text-xs text-[#B54708] mt-2'>Add at least one File Register entry before requesting issue/return.</p>
                    ) : null}
                </div>
            </form>

            <div className='bg-white rounded-2xl shadow-md overflow-x-auto'>
                <table className='min-w-full text-sm'>
                    <thead className='bg-[#F9FAFB] text-[#667085] text-left'>
                        <tr>
                            <th className='px-3 py-2'>ID</th>
                            <th className='px-3 py-2'>Type</th>
                            <th className='px-3 py-2'>File</th>
                            <th className='px-3 py-2'>Requester</th>
                            <th className='px-3 py-2'>Status</th>
                            <th className='px-3 py-2'>Update</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issues.rows.length === 0 ? (
                            <tr><td colSpan={6} className='px-3 py-6 text-[#98A2B3]'>No file requests yet.</td></tr>
                        ) : issues.rows.map((row) => (
                            <tr key={row.id} className='border-t'>
                                <td className='px-3 py-2 font-medium'>{row.id}</td>
                                <td className='px-3 py-2'>{row.requestType}</td>
                                <td className='px-3 py-2'>{row.fileId} {row.fileTitle ? `— ${row.fileTitle}` : ''}</td>
                                <td className='px-3 py-2'>{row.requester}</td>
                                <td className='px-3 py-2'>{row.status}</td>
                                <td className='px-3 py-2'>
                                    <select
                                        className='border rounded-md px-2 py-1'
                                        value={row.status || 'Pending Dept Head'}
                                        onChange={(e) => advance(row, e.target.value)}
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

export default FileRequests
