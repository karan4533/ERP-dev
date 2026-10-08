import React, { useMemo } from 'react'
import {
    DEPARTMENTS,
    PRIORITIES,
    ESCALATION_STATUSES,
    ESCALATED_TO_OPTIONS,
} from '../escalationsData'
import { getOpenObservations } from '../../../Observations/observationsData'

const inputClass =
    'text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-2 w-full focus:border-[#515DEF] outline-none'

const EscalationForm = ({ form, onChange, readOnly = false }) => {
    const openObservations = useMemo(() => getOpenObservations(), [])

    const update = (field, value) => onChange({ ...form, [field]: value })

    const handleObservationChange = (observationId) => {
        const selected = openObservations.find((item) => item.observationId === observationId)
        onChange({
            ...form,
            observationId,
            observationTitle: selected?.title ?? '',
            department: selected?.department ?? form.department,
            priority: selected?.priority ?? form.priority,
        })
    }

    const Field = ({ label, children }) => (
        <div className='flex flex-col gap-y-2'>
            <label className='text-sm font-medium text-[#808080]'>{label}</label>
            {children}
        </div>
    )

    if (readOnly) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                {[
                    ['Escalation ID', form.escalationId],
                    ['Observation', `${form.observationId} — ${form.observationTitle}`],
                    ['Department', form.department],
                    ['Escalated To', form.escalatedTo],
                    ['Priority', form.priority],
                    ['Escalation Date', form.escalationDate],
                    ['Expected Resolution', form.expectedResolution],
                    ['Status', form.status],
                ].map(([label, value]) => (
                    <div key={label} className='flex flex-col gap-y-1'>
                        <span className='text-sm font-medium text-[#808080]'>{label}</span>
                        <span className='text-sm text-[#1E1E1E]'>{value || '—'}</span>
                    </div>
                ))}
                <div className='sm:col-span-2 lg:col-span-3 flex flex-col gap-y-1'>
                    <span className='text-sm font-medium text-[#808080]'>Reason</span>
                    <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap'>{form.reason}</span>
                </div>
            </div>
        )
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Field label='Observation'>
                <select
                    value={form.observationId}
                    onChange={(e) => handleObservationChange(e.target.value)}
                    className={inputClass}
                >
                    <option value=''>Select unresolved observation</option>
                    {openObservations.map((obs) => (
                        <option key={obs.observationId} value={obs.observationId}>
                            {obs.observationId} — {obs.title}
                        </option>
                    ))}
                </select>
            </Field>
            <Field label='Department'>
                <select value={form.department} onChange={(e) => update('department', e.target.value)} className={inputClass}>
                    <option value=''>Select department</option>
                    {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </Field>
            <Field label='Escalated To'>
                <select value={form.escalatedTo} onChange={(e) => update('escalatedTo', e.target.value)} className={inputClass}>
                    <option value=''>Select recipient</option>
                    {ESCALATED_TO_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </Field>
            <Field label='Priority'>
                <select value={form.priority} onChange={(e) => update('priority', e.target.value)} className={inputClass}>
                    {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
            </Field>
            <Field label='Escalation Date'>
                <input type='date' value={form.escalationDate} onChange={(e) => update('escalationDate', e.target.value)} className={inputClass} />
            </Field>
            <Field label='Expected Resolution'>
                <input type='date' value={form.expectedResolution} onChange={(e) => update('expectedResolution', e.target.value)} className={inputClass} />
            </Field>
            <Field label='Status'>
                <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputClass}>
                    {ESCALATION_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </Field>
            <div className='sm:col-span-2 lg:col-span-3'>
                <Field label='Reason'>
                    <textarea
                        value={form.reason}
                        onChange={(e) => update('reason', e.target.value)}
                        placeholder='Explain why this observation is being escalated...'
                        className={`${inputClass} min-h-[120px] resize-y`}
                    />
                </Field>
            </div>
        </div>
    )
}

export default EscalationForm
