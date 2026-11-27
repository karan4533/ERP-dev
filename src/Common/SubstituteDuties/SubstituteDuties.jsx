import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
    canUseSubstituteDutiesApi,
    createSubstituteDutyApi,
    getSubstituteDutyOptionsApi,
    listSubstituteDutiesApi,
    revokeSubstituteDutyApi,
} from '../../services/substituteDutiesApi'

const inputClass = 'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
const labelClass = 'text-sm font-medium text-[#808080]'

const EMPTY_FORM = {
    teacherUserId: '',
    classId: '',
    sectionId: '',
    date: '',
    period: '',
    startTime: '',
    endTime: '',
    note: '',
}

const statusBadge = (duty) => {
    if (duty.status === 'revoked') return 'bg-[#FF000033] text-[#FF0000]'
    if (duty.validNow) return 'bg-[#4CAF5033] text-[#4CAF50]'
    return 'bg-[#2196F333] text-[#2196F3]'
}

const statusLabel = (duty) => {
    if (duty.status === 'revoked') return 'Revoked'
    return duty.validNow ? 'Active now' : 'Scheduled'
}

/**
 * Principal / Director / Admin: assign, list and revoke substitute duty.
 * The server enforces who may assign and where a duty grants attendance access.
 */
const SubstituteDuties = () => {
    const api = canUseSubstituteDutiesApi()
    const [options, setOptions] = useState(null)
    const [duties, setDuties] = useState([])
    const [form, setForm] = useState(EMPTY_FORM)
    const [includeRevoked, setIncludeRevoked] = useState(false)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [revoking, setRevoking] = useState(null)
    const [revokeReason, setRevokeReason] = useState('')

    const loadDuties = useCallback(() => {
        if (!api) return Promise.resolve()
        setLoading(true)
        return listSubstituteDutiesApi({ includeRevoked })
            .then((rows) => setDuties(rows))
            .catch((err) => setError(err.message || 'Could not load substitute duties'))
            .finally(() => setLoading(false))
    }, [api, includeRevoked])

    useEffect(() => {
        if (!api) return undefined
        let cancelled = false
        getSubstituteDutyOptionsApi()
            .then((data) => {
                if (!cancelled) {
                    setOptions(data)
                    setForm((current) => ({ ...current, date: current.date || data.today || '' }))
                }
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || 'Could not load teachers and classes')
            })
        return () => {
            cancelled = true
        }
    }, [api])

    useEffect(() => {
        loadDuties()
    }, [loadDuties])

    const sections = useMemo(() => {
        const cls = (options?.classes || []).find((item) => item.classId === form.classId)
        return cls ? cls.sections : []
    }, [options, form.classId])

    const update = (key, value) => {
        setForm((current) => ({ ...current, [key]: value, ...(key === 'classId' ? { sectionId: '' } : {}) }))
        setMessage('')
    }

    const handleAssign = async (event) => {
        event.preventDefault()
        if (saving) return
        const missing = ['teacherUserId', 'classId', 'sectionId', 'date', 'period', 'startTime', 'endTime']
            .filter((key) => !String(form[key] || '').trim())
        if (missing.length) {
            setError('Choose the teacher, class, section, date, period and time window.')
            return
        }
        setSaving(true)
        setError('')
        setMessage('')
        try {
            const created = await createSubstituteDutyApi({ ...form, note: form.note || undefined })
            setMessage(`Assigned ${created.period} on ${created.date} to ${created.teacherName || created.teacherEmail}.`)
            setForm((current) => ({ ...EMPTY_FORM, date: current.date }))
            await loadDuties()
        } catch (err) {
            setError(err.message || 'Could not assign substitute duty')
        } finally {
            setSaving(false)
        }
    }

    const handleRevoke = async (duty) => {
        setError('')
        setMessage('')
        try {
            await revokeSubstituteDutyApi(duty.id, revokeReason.trim())
            setMessage(`Revoked ${duty.period} on ${duty.date} for ${duty.teacherName || duty.teacherEmail}.`)
            setRevoking(null)
            setRevokeReason('')
            await loadDuties()
        } catch (err) {
            setError(err.message || 'Could not revoke substitute duty')
        }
    }

    if (!api) {
        return (
            <section className='bg-white rounded-2xl shadow-md p-6'>
                <p className='text-sm text-[#667085]'>Substitute duty needs a signed-in server session.</p>
            </section>
        )
    }

    return (
        <section className='flex flex-col gap-y-8'>
            <form onSubmit={handleAssign} className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-medium text-black'>Assign substitute duty</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    The teacher can load and mark this section&apos;s attendance only on this date, during this period.
                </p>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='sd-teacher' className={labelClass}>Teacher</label>
                        <select id='sd-teacher' value={form.teacherUserId} onChange={(e) => update('teacherUserId', e.target.value)} className={inputClass}>
                            <option value=''>Select teacher</option>
                            {(options?.teachers || []).map((t) => (
                                <option key={t.userId} value={t.userId}>{t.name && t.name !== t.email ? `${t.name} (${t.email})` : t.email}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='sd-class' className={labelClass}>Class</label>
                        <select id='sd-class' value={form.classId} onChange={(e) => update('classId', e.target.value)} className={inputClass}>
                            <option value=''>Select class</option>
                            {(options?.classes || []).map((c) => (
                                <option key={c.classId} value={c.classId}>{c.className}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='sd-section' className={labelClass}>Section</label>
                        <select id='sd-section' value={form.sectionId} onChange={(e) => update('sectionId', e.target.value)} className={inputClass} disabled={!form.classId}>
                            <option value=''>Select section</option>
                            {sections.map((s) => (
                                <option key={s.sectionId} value={s.sectionId}>Section {s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='sd-date' className={labelClass}>Date</label>
                        <input id='sd-date' type='date' min={options?.today || undefined} value={form.date} onChange={(e) => update('date', e.target.value)} className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='sd-period' className={labelClass}>Period</label>
                        <input id='sd-period' type='text' maxLength={20} placeholder='e.g. P3' value={form.period} onChange={(e) => update('period', e.target.value)} className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='sd-start' className={labelClass}>Starts</label>
                        <input id='sd-start' type='time' value={form.startTime} onChange={(e) => update('startTime', e.target.value)} className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='sd-end' className={labelClass}>Ends</label>
                        <input id='sd-end' type='time' value={form.endTime} onChange={(e) => update('endTime', e.target.value)} className={inputClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor='sd-note' className={labelClass}>Note (optional)</label>
                        <input id='sd-note' type='text' maxLength={500} value={form.note} onChange={(e) => update('note', e.target.value)} className={inputClass} />
                    </div>
                </div>
                {error && <p className='text-sm text-[#B42318] mt-4'>{error}</p>}
                {message && <p className='text-sm text-[#027A48] mt-4'>{message}</p>}
                <div className='flex justify-end mt-6'>
                    <button type='submit' disabled={saving} className='bg-[#515DEF] text-white text-sm px-6 py-2 rounded-md hover:opacity-90 cursor-pointer disabled:opacity-60'>
                        {saving ? 'Assigning…' : 'Assign duty'}
                    </button>
                </div>
            </form>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center flex-wrap gap-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Substitute duties</h2>
                    <label className='flex items-center gap-x-2 text-sm text-[#667085]'>
                        <input type='checkbox' checked={includeRevoked} onChange={(e) => setIncludeRevoked(e.target.checked)} />
                        Show revoked
                    </label>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap'>
                            <tr>
                                {['Date', 'Period', 'Time', 'Class', 'Teacher', 'Status', 'Assigned by', ''].map((label) => (
                                    <th key={label} className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>{label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>Loading…</td></tr>
                            )}
                            {!loading && duties.length === 0 && (
                                <tr><td colSpan={8} className='px-2 py-8 text-center text-[#667085]'>No substitute duties.</td></tr>
                            )}
                            {!loading && duties.map((duty) => (
                                <tr key={duty.id} className='border-b border-[#f2f4f7] text-[#667085] align-top'>
                                    <td className='px-2 py-3 text-[#1E1E1E]'>{duty.date}</td>
                                    <td className='px-2 py-3'>{duty.period}</td>
                                    <td className='px-2 py-3 whitespace-nowrap'>{duty.startTime}–{duty.endTime}</td>
                                    <td className='px-2 py-3'>{duty.className}-{duty.section}</td>
                                    <td className='px-2 py-3'>{duty.teacherName || duty.teacherEmail}</td>
                                    <td className='px-2 py-3'>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadge(duty)}`}>{statusLabel(duty)}</span>
                                        {duty.status === 'revoked' && (
                                            <p className='text-xs mt-1'>by {duty.revokedBy}{duty.revokeReason ? ` — ${duty.revokeReason}` : ''}</p>
                                        )}
                                    </td>
                                    <td className='px-2 py-3'>{duty.assignedBy}</td>
                                    <td className='px-2 py-3'>
                                        {duty.status === 'active' && revoking !== duty.id && (
                                            <button type='button' onClick={() => { setRevoking(duty.id); setRevokeReason('') }} className='text-[#B42318] text-sm border border-[#B42318] rounded-md px-3 py-1 cursor-pointer'>
                                                Revoke
                                            </button>
                                        )}
                                        {revoking === duty.id && (
                                            <div className='flex flex-col gap-y-2 min-w-48'>
                                                <input type='text' maxLength={500} placeholder='Reason (optional)' value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} className={inputClass} />
                                                <div className='flex gap-x-2'>
                                                    <button type='button' onClick={() => handleRevoke(duty)} className='bg-[#B42318] text-white text-sm rounded-md px-3 py-1 cursor-pointer'>Confirm</button>
                                                    <button type='button' onClick={() => setRevoking(null)} className='text-sm border border-[#D9D9D9] rounded-md px-3 py-1 cursor-pointer'>Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

export default SubstituteDuties
