import React, { useMemo, useState } from 'react'
import { nextCollectionId, useOpsCollection } from '../../../Common/OpsCollections/useOpsCollection'

const STORAGE_KEY = 'schoolerp-pro-gov-cases-v1'
const STATUS_OPTIONS = ['Draft', 'Submitted', 'In Progress', 'Awaiting Authority', 'Closed', 'Renewal Due']

const emptyForm = () => ({
    subject: '',
    authority: '',
    department: '',
    submissionDate: '',
    deadline: '',
    status: 'Draft',
    documentsNote: '',
    nextAction: '',
    notes: '',
})

/**
 * Non-Academics §9.2 — PRO government liaison case tracking.
 * Broad case record (subject, authority, dates, status, docs note, next action).
 */
const GovernmentCases = () => {
    const { rows, status, error, upsert, setError } = useOpsCollection(STORAGE_KEY)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [filter, setFilter] = useState('All')

    const visible = useMemo(() => {
        if (filter === 'All') return rows
        return rows.filter((row) => String(row.status || '') === filter)
    }, [rows, filter])

    const onChange = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

    const onSubmit = async (event) => {
        event.preventDefault()
        if (!form.subject.trim() || !form.authority.trim()) {
            setError('Subject and authority are required.')
            return
        }
        setSaving(true)
        const row = {
            id: nextCollectionId(rows, 'PGC'),
            ...form,
            subject: form.subject.trim(),
            authority: form.authority.trim(),
            department: form.department.trim(),
            createdAt: new Date().toISOString(),
        }
        const ok = await upsert(row)
        setSaving(false)
        if (ok) setForm(emptyForm())
    }

    const setStatus = async (row, nextStatus) => {
        await upsert({ ...row, status: nextStatus, updatedAt: new Date().toISOString() })
    }

    return (
        <section className='space-y-4'>
            <div>
                <h1 className='text-2xl font-semibold text-black'>Government Liaison Cases</h1>
                <p className='text-sm text-[#667085] mt-1'>
                    Track school and government correspondence, permits, affiliations, and inspections.
                    Reminder dates use the deadline field; JD/MD can view campus cases via ops read access.
                </p>
            </div>

            {error ? (
                <p className='text-sm text-[#B42318] bg-[#FEF3F2] rounded-lg px-3 py-2'>{error}</p>
            ) : null}

            <form onSubmit={onSubmit} className='bg-white rounded-2xl shadow-md p-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
                <label className='text-sm text-[#667085]'>
                    Subject *
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.subject} onChange={onChange('subject')} required />
                </label>
                <label className='text-sm text-[#667085]'>
                    Authority *
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.authority} onChange={onChange('authority')} required />
                </label>
                <label className='text-sm text-[#667085]'>
                    School department
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.department} onChange={onChange('department')} />
                </label>
                <label className='text-sm text-[#667085]'>
                    Status
                    <select className='mt-1 w-full border rounded-lg px-3 py-2' value={form.status} onChange={onChange('status')}>
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </label>
                <label className='text-sm text-[#667085]'>
                    Submission date
                    <input type='date' className='mt-1 w-full border rounded-lg px-3 py-2' value={form.submissionDate} onChange={onChange('submissionDate')} />
                </label>
                <label className='text-sm text-[#667085]'>
                    Deadline / renewal
                    <input type='date' className='mt-1 w-full border rounded-lg px-3 py-2' value={form.deadline} onChange={onChange('deadline')} />
                </label>
                <label className='text-sm text-[#667085] md:col-span-2'>
                    Documents (note / File Room reference)
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.documentsNote} onChange={onChange('documentsNote')} placeholder='e.g. File Room FRG-1002 / challan pending Finance' />
                </label>
                <label className='text-sm text-[#667085] md:col-span-2'>
                    Next action
                    <input className='mt-1 w-full border rounded-lg px-3 py-2' value={form.nextAction} onChange={onChange('nextAction')} />
                </label>
                <label className='text-sm text-[#667085] md:col-span-2'>
                    Notes
                    <textarea className='mt-1 w-full border rounded-lg px-3 py-2' rows={2} value={form.notes} onChange={onChange('notes')} />
                </label>
                <div className='md:col-span-2'>
                    <button type='submit' disabled={saving} className='bg-[#515DEF] text-white rounded-lg px-4 py-2 text-sm disabled:opacity-60'>
                        {saving ? 'Saving…' : 'Add case'}
                    </button>
                </div>
            </form>

            <div className='flex items-center gap-3'>
                <label className='text-sm text-[#667085]'>
                    Filter
                    <select className='ml-2 border rounded-lg px-2 py-1' value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value='All'>All</option>
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </label>
                <span className='text-xs text-[#98A2B3]'>{status === 'loading' ? 'Loading…' : `${visible.length} case(s)`}</span>
            </div>

            <div className='bg-white rounded-2xl shadow-md overflow-x-auto'>
                <table className='min-w-full text-sm'>
                    <thead className='bg-[#F9FAFB] text-[#667085] text-left'>
                        <tr>
                            <th className='px-3 py-2'>ID</th>
                            <th className='px-3 py-2'>Subject</th>
                            <th className='px-3 py-2'>Authority</th>
                            <th className='px-3 py-2'>Deadline</th>
                            <th className='px-3 py-2'>Status</th>
                            <th className='px-3 py-2'>Next action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan={6} className='px-3 py-6 text-[#98A2B3]'>No government cases yet. Add the first case above.</td>
                            </tr>
                        ) : visible.map((row) => (
                            <tr key={row.id} className='border-t'>
                                <td className='px-3 py-2 font-medium'>{row.id}</td>
                                <td className='px-3 py-2'>{row.subject}</td>
                                <td className='px-3 py-2'>{row.authority}</td>
                                <td className='px-3 py-2'>{row.deadline || '—'}</td>
                                <td className='px-3 py-2'>
                                    <select
                                        className='border rounded-md px-2 py-1'
                                        value={row.status || 'Draft'}
                                        onChange={(e) => setStatus(row, e.target.value)}
                                    >
                                        {STATUS_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className='px-3 py-2'>{row.nextAction || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default GovernmentCases
