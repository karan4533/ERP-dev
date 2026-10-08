import React from 'react'
import { AlertTriangle, Save, Send } from 'lucide-react'
import EvidenceUploader from './EvidenceUploader'
import {
    OBSERVATION_PRIORITIES,
    ASSIGN_TO_EMPLOYEES,
    resolveReportTo,
    observationStatusBadgeColor,
} from '../executeAuditData'

const inputClass =
    'text-sm text-[#1E1E1E] border border-[#E0E0E0] rounded-lg px-3 py-2 w-full focus:border-[#515DEF] outline-none'

const readOnlyClass =
    'text-sm text-[#1E1E1E] border border-[#EDEEF5] bg-[#F5F6FA] rounded-lg px-3 py-2 w-full'

const InlineObservationCard = ({ parameter, observation, auditReference, onChange, onSave, onSubmit }) => {
    const update = (field, value) => onChange({ ...observation, [field]: value })

    const handleAssignToChange = (value) => {
        onChange({
            ...observation,
            assignTo: value,
            reportTo: resolveReportTo(value),
        })
    }

    const canSubmit = observation.title?.trim() && observation.assignTo
    const displayStatus = observation.status || (observation.saved ? 'Pending Assignment' : 'Unsaved')
    const statusColor = observationStatusBadgeColor[observation.status] ?? 'bg-[#EDEEF5] text-[#667085]'

    return (
        <div className='mt-3 rounded-xl border border-[#FF000033] bg-gradient-to-r from-[#FF000008] to-[#FF980008] p-4 animate-in fade-in duration-300'>
            <div className='flex flex-wrap items-center justify-between gap-2 mb-4'>
                <div className='flex items-center gap-2'>
                    <AlertTriangle size={16} className='text-[#FF0000]' />
                    <span className='text-sm font-semibold text-[#FF0000]'>Observation Details</span>
                </div>
                {observation.saved && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusColor}`}>
                        {displayStatus}
                    </span>
                )}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3'>
                <div className='sm:col-span-2 lg:col-span-3'>
                    <label className='text-xs font-medium text-[#808080] mb-1 block'>
                        Observation Title <span className='text-[#FF0000]'>*</span>
                    </label>
                    <input
                        type='text'
                        value={observation.title}
                        onChange={(e) => update('title', e.target.value)}
                        placeholder={`e.g. ${parameter.label}`}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className='text-xs font-medium text-[#808080] mb-1 block'>Priority</label>
                    <select value={observation.priority} onChange={(e) => update('priority', e.target.value)} className={inputClass}>
                        {OBSERVATION_PRIORITIES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className='text-xs font-medium text-[#808080] mb-1 block'>
                        Assign To <span className='text-[#FF0000]'>*</span>
                    </label>
                    <select value={observation.assignTo} onChange={(e) => handleAssignToChange(e.target.value)} className={inputClass}>
                        <option value=''>Select employee</option>
                        {ASSIGN_TO_EMPLOYEES.map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className='text-xs font-medium text-[#808080] mb-1 block'>Report To</label>
                    <input
                        type='text'
                        readOnly
                        value={observation.reportTo || (observation.assignTo ? '—' : '')}
                        placeholder={observation.assignTo ? '—' : 'Auto-filled when Assign To is selected'}
                        className={readOnlyClass}
                    />
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3 p-3 rounded-lg bg-white/60 border border-[#EDEEF5]'>
                <div>
                    <label className='text-xs font-medium text-[#808080] mb-1 block'>Observation Number</label>
                    <input
                        type='text'
                        readOnly
                        value={observation.observationNumber}
                        placeholder='Auto-generated on save'
                        className={readOnlyClass}
                    />
                </div>
                <div>
                    <label className='text-xs font-medium text-[#808080] mb-1 block'>Audit Reference</label>
                    <input
                        type='text'
                        readOnly
                        value={observation.auditReference || auditReference}
                        className={readOnlyClass}
                    />
                </div>
                <div>
                    <label className='text-xs font-medium text-[#808080] mb-1 block'>Assigned Date</label>
                    <input
                        type='text'
                        readOnly
                        value={observation.assignedDate}
                        placeholder='Set on submit'
                        className={readOnlyClass}
                    />
                </div>
            </div>

            <div className='mb-3'>
                <label className='text-xs font-medium text-[#808080] mb-1 block'>Description</label>
                <textarea
                    value={observation.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder={`Describe the quality concern for "${parameter.label}"...`}
                    className={`${inputClass} min-h-[72px] resize-y`}
                />
            </div>

            <div className='mb-4'>
                <label className='text-xs font-medium text-[#808080] mb-1 block'>Evidence</label>
                <EvidenceUploader
                    evidence={observation.evidence}
                    onChange={(next) => update('evidence', next)}
                />
            </div>

            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-[#FF000015]'>
                <button
                    type='button'
                    onClick={onSave}
                    className='inline-flex items-center justify-center gap-2 bg-white text-[#515DEF] border border-[#515DEF] text-sm px-5 py-2 rounded-lg hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <Save size={16} />
                    Save Observation
                </button>
                <button
                    type='button'
                    onClick={onSubmit}
                    disabled={!canSubmit || observation.submitted}
                    className='inline-flex items-center justify-center gap-2 bg-[#515DEF] text-white text-sm px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                >
                    <Send size={16} />
                    {observation.submitted ? 'Submitted' : 'Submit Observation'}
                </button>
            </div>
        </div>
    )
}

export default InlineObservationCard
