import React from 'react'
import {
    DEPARTMENTS,
    PRIORITIES,
    SEVERITIES,
    OBSERVATION_STATUSES,
} from '../observationsData'
import {
    getAuditSchedules,
    hydrateFromApi as hydrateSchedulesFromApi,
    SCHEDULE_STORAGE_KEY,
} from '../../AuditManagement/AuditSchedule/auditScheduleData'
import useAuditObservationOptions from '../../../../Common/auditDomain/useAuditObservationOptions'
import AuditEvidenceInput from '../../../../Common/auditDomain/AuditEvidenceInput'
import { AUDIT_RECIPIENTS, recipientDisplay, recipientFields } from '../../../../Common/auditDomain/auditRecipients'
import { fileDownloadUrl } from '../../../../services/filesApi'

const inputClass =
    'text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-2 w-full focus:border-[#515DEF] outline-none'

const Field = ({ label, children }) => (
    <div className='flex flex-col gap-y-2'>
        <label className='text-sm font-medium text-[#808080]'>{label}</label>
        {children}
    </div>
)

const AttachmentView = ({ form }) => {
    const file = form.evidenceFile
    if (file?.fileId) {
        return (
            <a href={fileDownloadUrl(file.downloadPath)} target='_blank' rel='noreferrer' className='text-sm text-[#515DEF] underline'>
                {file.name}
            </a>
        )
    }
    return <span className='text-sm text-[#1E1E1E]'>{form.evidence || '—'}</span>
}

const ObservationForm = ({ form, onChange, readOnly = false }) => {
    const update = (field, value) => onChange({ ...form, [field]: value })
    const { status, error, componentOptions, referenceOptions } = useAuditObservationOptions({
        stream: 'QUALITY',
        scheduleKey: SCHEDULE_STORAGE_KEY,
        getSchedules: getAuditSchedules,
        hydrateSchedules: hydrateSchedulesFromApi,
        auditReference: form.auditReference || '',
    })

    if (readOnly) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                {[
                    ['Observation ID', form.observationId],
                    ['Reference Number', form.referenceNumber || form.observationId],
                    ['Audit Reference', form.auditReference],
                    ['Department', form.department || '—'],
                    ['Component', form.category],
                    ['Grade', form.grade || '—'],
                    ['Section', form.section || '—'],
                    ['Subject', form.subject || '—'],
                    ['Rating', form.rating || '—'],
                    ['Priority', form.priority],
                    ['Severity', form.severity],
                    ['Recipient', recipientDisplay(form)],
                    ['Responsible Department', form.recipientDepartment || form.responsibleDepartment],
                    ['Due Date', form.dueDate],
                    ['Status', form.status],
                ].map(([label, value]) => (
                    <div key={label} className='flex flex-col gap-y-1'>
                        <span className='text-sm font-medium text-[#808080]'>{label}</span>
                        <span className='text-sm text-[#1E1E1E]'>{value || '—'}</span>
                    </div>
                ))}
                <div className='flex flex-col gap-y-1'>
                    <span className='text-sm font-medium text-[#808080]'>Attachment</span>
                    <AttachmentView form={form} />
                </div>
                <div className='sm:col-span-2 lg:col-span-3 flex flex-col gap-y-1'>
                    <span className='text-sm font-medium text-[#808080]'>Description</span>
                    <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap'>{form.description}</span>
                </div>
            </div>
        )
    }

    const selectedOption = componentOptions.find((option) =>
        form.componentId ? option.componentId === form.componentId : option.value === form.category)
    const selectedComponentKey = selectedOption ? `${selectedOption.componentId}|${selectedOption.value}` : form.category || ''
    const componentMissing = Boolean(form.category) && !selectedOption

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {status === 'loading' ? (
                <p className='sm:col-span-2 lg:col-span-3 text-sm text-[#667085]'>Loading saved components and schedules…</p>
            ) : null}
            {status === 'failed' ? (
                <p className='sm:col-span-2 lg:col-span-3 text-sm text-[#FF0000]'>
                    Could not load components / schedules: {error} Refresh to try again.
                </p>
            ) : null}
            <Field label='Reference Number'>
                <input
                    type='text'
                    value={form.referenceNumber || ''}
                    onChange={(e) => update('referenceNumber', e.target.value)}
                    placeholder='Leave blank to use the observation ID'
                    className={inputClass}
                />
            </Field>
            <Field label='Audit Reference'>
                <select value={form.auditReference || ''} onChange={(e) => update('auditReference', e.target.value)} className={inputClass} disabled={status === 'loading'}>
                    <option value=''>Select audit / schedule</option>
                    {referenceOptions.map((ref) => (
                        <option key={ref.value} value={ref.value}>{ref.label}</option>
                    ))}
                </select>
            </Field>
            <Field label='Department'>
                <select value={form.department || ''} onChange={(e) => update('department', e.target.value)} className={inputClass}>
                    <option value=''>Select department</option>
                    <option value='Academics'>Academics</option>
                    {DEPARTMENTS.filter((dept) => dept !== 'Academics').map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </Field>
            <Field label='Component'>
                <select
                    value={selectedComponentKey}
                    onChange={(e) => {
                        const option = componentOptions.find((item) => `${item.componentId}|${item.value}` === e.target.value)
                        onChange({ ...form, category: option?.value || '', componentId: option?.componentId || '' })
                    }}
                    className={inputClass}
                    disabled={status === 'loading'}
                >
                    <option value=''>{componentOptions.length ? 'Select component' : 'No saved components for this schedule'}</option>
                    {componentMissing ? <option value={selectedComponentKey}>{form.category} (not linked to this schedule)</option> : null}
                    {componentOptions.map((option) => (
                        <option key={`${option.componentId}|${option.value}`} value={`${option.componentId}|${option.value}`}>{option.label}</option>
                    ))}
                </select>
            </Field>
            <Field label='Grade'>
                <input type='text' value={form.grade ?? ''} onChange={(e) => update('grade', e.target.value)} placeholder='Leave blank if not applicable' className={inputClass} />
            </Field>
            <Field label='Section'>
                <input type='text' value={form.section ?? ''} onChange={(e) => update('section', e.target.value)} placeholder='Leave blank if not applicable' className={inputClass} />
            </Field>
            <Field label='Subject'>
                <input type='text' value={form.subject ?? ''} onChange={(e) => update('subject', e.target.value)} placeholder='Leave blank if not applicable' className={inputClass} />
            </Field>
            <Field label='Rating (1-5)'>
                <select value={form.rating || ''} onChange={(e) => update('rating', e.target.value)} className={inputClass}>
                    <option value=''>Select rating</option>
                    {['1', '2', '3', '4', '5'].map((score) => <option key={score}>{score}</option>)}
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
            <Field label='Recipient department (escalate to)'>
                <select
                    value={form.recipientRole || ''}
                    onChange={(e) => {
                        const fields = recipientFields(e.target.value)
                        onChange({ ...form, ...fields, assignTo: fields.recipient })
                    }}
                    className={inputClass}
                >
                    <option value=''>{form.recipient && !form.recipientRole ? `${form.recipient} (legacy — pick a department)` : 'Select recipient department'}</option>
                    {AUDIT_RECIPIENTS.map((item) => (
                        <option key={item.role} value={item.role}>{item.department} — {item.label}</option>
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
            <Field label='Attachment (PDF, PNG, JPG, Word, Excel)'>
                <AuditEvidenceInput
                    stream='quality'
                    resourceId={form.observationId || null}
                    value={form.evidenceFile}
                    onUploaded={(asset) => onChange({
                        ...form,
                        evidenceFile: asset,
                        evidence: asset?.name || '',
                        attachmentName: asset?.name || '',
                    })}
                    className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#515DEF] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white`}
                />
            </Field>
            <div className='sm:col-span-2 lg:col-span-3'>
                <Field label='Description (used as observation detail)'>
                    <textarea
                        value={form.description}
                        onChange={(e) => update('description', e.target.value)}
                        placeholder='Describe the non-compliance or finding in detail...'
                        className={`${inputClass} min-h-[120px] resize-y`}
                        required
                    />
                </Field>
            </div>
        </div>
    )
}

export default ObservationForm
