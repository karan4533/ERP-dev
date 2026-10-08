import React from 'react'
import {
    DEPARTMENTS,
    PRIORITIES,
    SEVERITIES,
    CATEGORIES,
    OBSERVATION_STATUSES,
    AUDIT_REFERENCES,
    RESPONSIBLE_PERSONS,
} from '../observationsData'

const inputClass =
    'text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-2 w-full focus:border-[#515DEF] outline-none'

const ObservationForm = ({ form, onChange, readOnly = false }) => {
    const update = (field, value) => onChange({ ...form, [field]: value })

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
                    ['Observation ID', form.observationId],
                    ['Audit Reference', form.auditReference],
                    ['Department', form.department],
                    ['Location', form.location],
                    ['Category', form.category],
                    ['Priority', form.priority],
                    ['Severity', form.severity],
                    ['Responsible Department', form.responsibleDepartment],
                    ['Responsible Person', form.responsiblePerson],
                    ['Due Date', form.dueDate],
                    ['Status', form.status],
                    ['Evidence', form.evidence || '—'],
                ].map(([label, value]) => (
                    <div key={label} className='flex flex-col gap-y-1'>
                        <span className='text-sm font-medium text-[#808080]'>{label}</span>
                        <span className='text-sm text-[#1E1E1E]'>{value || '—'}</span>
                    </div>
                ))}
                <div className='sm:col-span-2 lg:col-span-3 flex flex-col gap-y-1'>
                    <span className='text-sm font-medium text-[#808080]'>Observation Title</span>
                    <span className='text-sm text-[#1E1E1E]'>{form.title}</span>
                </div>
                <div className='sm:col-span-2 lg:col-span-3 flex flex-col gap-y-1'>
                    <span className='text-sm font-medium text-[#808080]'>Description</span>
                    <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap'>{form.description}</span>
                </div>
            </div>
        )
    }

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Field label='Audit Reference'>
                <select value={form.auditReference} onChange={(e) => update('auditReference', e.target.value)} className={inputClass}>
                    <option value=''>Select audit</option>
                    {AUDIT_REFERENCES.map((ref) => (
                        <option key={ref} value={ref}>{ref}</option>
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
            <Field label='Location'>
                <input type='text' value={form.location} onChange={(e) => update('location', e.target.value)} placeholder='Building, floor, area...' className={inputClass} />
            </Field>
            <Field label='Category'>
                <select value={form.category} onChange={(e) => update('category', e.target.value)} className={inputClass}>
                    <option value=''>Select category</option>
                    {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
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
            <Field label='Severity'>
                <select value={form.severity} onChange={(e) => update('severity', e.target.value)} className={inputClass}>
                    {SEVERITIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </Field>
            <Field label='Responsible Department'>
                <select value={form.responsibleDepartment} onChange={(e) => update('responsibleDepartment', e.target.value)} className={inputClass}>
                    <option value=''>Select department</option>
                    {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </Field>
            <Field label='Responsible Person'>
                <select value={form.responsiblePerson} onChange={(e) => update('responsiblePerson', e.target.value)} className={inputClass}>
                    <option value=''>Select person</option>
                    {RESPONSIBLE_PERSONS.map((person) => (
                        <option key={person} value={person}>{person}</option>
                    ))}
                </select>
            </Field>
            <Field label='Due Date'>
                <input type='date' value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} className={inputClass} />
            </Field>
            <Field label='Status'>
                <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputClass}>
                    {OBSERVATION_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </Field>
            <Field label='Evidence'>
                <input type='text' value={form.evidence} onChange={(e) => update('evidence', e.target.value)} placeholder='File name or evidence reference' className={inputClass} />
            </Field>
            <div className='sm:col-span-2 lg:col-span-3'>
                <Field label='Observation Title'>
                    <input type='text' value={form.title} onChange={(e) => update('title', e.target.value)} placeholder='Brief title for the observation' className={inputClass} />
                </Field>
            </div>
            <div className='sm:col-span-2 lg:col-span-3'>
                <Field label='Description'>
                    <textarea
                        value={form.description}
                        onChange={(e) => update('description', e.target.value)}
                        placeholder='Describe the non-compliance or finding in detail...'
                        className={`${inputClass} min-h-[120px] resize-y`}
                    />
                </Field>
            </div>
        </div>
    )
}

export default ObservationForm
