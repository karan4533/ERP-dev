import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
    ASSIGNMENT_STATUSES,
    getAssignments,
    hydrateAssignments,
    saveAssignments,
} from './auditAssignmentData'

const emptyDraft = {
    title: '',
    owner: '',
    auditorRole: 'processauditor',
    dueDate: '',
    status: 'Assigned',
    evidence: '',
}

const AssignAudits = ({ mode = 'assign' }) => {
    const [rows, setRows] = useState([])
    const [draft, setDraft] = useState(emptyDraft)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const refresh = async () => {
        setLoading(true)
        setError('')
        try {
            await hydrateAssignments()
            setRows(getAssignments())
        } catch (err) {
            setError(err?.message || 'Assignments could not be loaded.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
    }, [])

    const create = () => {
        if (!draft.title.trim() || !draft.owner.trim() || !draft.dueDate) {
            toast.error('Title, owner, and due date are required.')
            return
        }
        const next = [{
            id: `AAS-${Date.now()}`,
            ...draft,
            title: draft.title.trim(),
            owner: draft.owner.trim(),
            createdAt: new Date().toISOString(),
        }, ...getAssignments()]
        saveAssignments(next)
        setRows(next)
        setDraft(emptyDraft)
        toast.success('Assignment saved.')
    }

    const updateStatus = (id, status) => {
        const next = getAssignments().map((row) => (row.id === id ? { ...row, status } : row))
        saveAssignments(next)
        setRows(next)
    }

    const reassign = (id, owner) => {
        const next = getAssignments().map((row) => (row.id === id ? { ...row, owner } : row))
        saveAssignments(next)
        setRows(next)
    }

    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-6 space-y-3'>
                <h2 className='text-xl font-semibold text-black'>
                    {mode === 'history' ? 'Assignment history' : mode === 'workload' ? 'Workload' : mode === 'reassign' ? 'Reassign audit' : 'Assign audits'}
                </h2>
                <p className='text-sm text-[#667085]'>Assignments are stored for this campus and stay after refresh and a new login.</p>
                {loading && <p className='text-sm text-[#667085]'>Loading assignments…</p>}
                {error && <p className='text-sm text-red-600'>{error}</p>}
                {!loading && rows.length === 0 && <p className='text-sm text-[#667085]'>No assignments yet.</p>}
                {rows.map((row) => (
                    <article key={row.id} className='border border-[#EDEEF5] rounded-xl p-3 text-sm space-y-2'>
                        <p className='font-medium text-[#1E1E1E]'>{row.title}</p>
                        <p className='text-[#667085]'>Owner: {row.owner} · Due: {row.dueDate} · Role: {row.auditorRole}</p>
                        {row.evidence && <p className='text-[#667085]'>Evidence: {row.evidence}</p>}
                        {mode === 'reassign' ? (
                            <input
                                className='border border-[#D9D9D9] rounded-md px-2 py-1 w-full'
                                defaultValue={row.owner}
                                aria-label={`Owner for ${row.title}`}
                                onBlur={(event) => reassign(row.id, event.target.value.trim() || row.owner)}
                            />
                        ) : (
                            <select
                                value={row.status || 'Assigned'}
                                aria-label={`Status for ${row.title}`}
                                onChange={(event) => updateStatus(row.id, event.target.value)}
                                className='border border-[#D9D9D9] rounded-md px-2 py-1'
                            >
                                {ASSIGNMENT_STATUSES.map((status) => <option key={status}>{status}</option>)}
                            </select>
                        )}
                    </article>
                ))}
            </div>
            {mode === 'assign' && (
                <form
                    className='bg-white rounded-2xl shadow-md p-6 grid gap-3 md:grid-cols-2'
                    onSubmit={(event) => { event.preventDefault(); create() }}
                >
                    <input className='border border-[#D9D9D9] rounded-md px-3 py-2' placeholder='Audit title' value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                    <input className='border border-[#D9D9D9] rounded-md px-3 py-2' placeholder='Responsible owner' value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} />
                    <input type='date' className='border border-[#D9D9D9] rounded-md px-3 py-2' value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} />
                    <select className='border border-[#D9D9D9] rounded-md px-3 py-2' value={draft.auditorRole} onChange={(event) => setDraft({ ...draft, auditorRole: event.target.value })}>
                        <option value='processauditor'>Process auditor</option>
                        <option value='qualityauditor'>Quality auditor</option>
                    </select>
                    <label className='md:col-span-2 flex flex-col gap-1 text-sm text-[#667085]'>
                        Resolution evidence (optional)
                        <input
                            type='file'
                            accept='image/png,image/jpeg,image/*,.png,.jpg,.jpeg,.pdf,application/pdf'
                            className='border border-[#D9D9D9] rounded-md px-3 py-2'
                            onChange={(event) => {
                                const file = event.target.files?.[0]
                                setDraft({ ...draft, evidence: file?.name || '' })
                            }}
                        />
                        {draft.evidence ? <span className='text-xs'>Selected: {draft.evidence}</span> : null}
                    </label>
                    <button type='submit' className='bg-[#515DEF] text-white rounded-md px-4 py-2 md:col-span-2 cursor-pointer'>Save assignment</button>
                </form>
            )}
        </section>
    )
}

export default AssignAudits
