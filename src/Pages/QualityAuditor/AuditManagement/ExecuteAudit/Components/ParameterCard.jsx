import React, { useState } from 'react'
import { ExternalLink, MessageSquare } from 'lucide-react'
import ResponseControl from './ResponseControl'
import EvidenceUploader from './EvidenceUploader'
import InlineObservationCard from './InlineObservationCard'
import { getParameterVisualStatus, isNonCompliant, getRatingLabel, parseRating } from '../executeAuditData'

const STATUS_STYLES = {
    passed: { dot: 'bg-[#4CAF50]', ring: 'ring-[#4CAF5033]', label: 'Passed', emoji: '🟢' },
    critical: { dot: 'bg-[#FF0000]', ring: 'ring-[#FF000033]', label: 'Critical', emoji: '🔴' },
    high: { dot: 'bg-[#FF9800]', ring: 'ring-[#FF980033]', label: 'High', emoji: '🟠' },
    medium: { dot: 'bg-[#FFC107]', ring: 'ring-[#FFC10733]', label: 'Medium', emoji: '🟡' },
    failed: { dot: 'bg-[#FF0000]', ring: 'ring-[#FF000033]', label: 'Failed', emoji: '🔴' },
    error: { dot: 'bg-[#FF9800]', ring: 'ring-[#FF980033]', label: 'Error', emoji: '🟠' },
    partial: { dot: 'bg-[#FFC107]', ring: 'ring-[#FFC10733]', label: 'Partial', emoji: '🟡' },
    pending: { dot: 'bg-[#D9D9D9]', ring: 'ring-[#EDEEF5]', label: 'Pending', emoji: '⚪' },
}

const ParameterCard = ({
    parameter,
    value,
    observation,
    auditReference,
    onChange,
    onObservationChange,
    onSaveObservation,
    onSubmitObservation,
    onOpenSop,
}) => {
    const [showUrlInput, setShowUrlInput] = useState(!!value.evidence?.url)
    const rating = parseRating(value.response)
    const nonCompliant = isNonCompliant(null, value.response)
    const visualStatus = getParameterVisualStatus(parameter, value, observation)
    const styles = STATUS_STYLES[visualStatus] ?? STATUS_STYLES.pending
    const statusLabel = rating ? getRatingLabel(rating) : styles.label

    const update = (field, fieldValue) => onChange({ ...value, [field]: fieldValue })

    return (
        <div
            className={`rounded-xl border p-4 transition-all duration-300 ${
                nonCompliant
                    ? 'border-[#FF000033] bg-[#FF000004] shadow-sm'
                    : visualStatus === 'passed'
                      ? 'border-[#4CAF5033] bg-white'
                      : 'border-[#EDEEF5] bg-white hover:border-[#515DEF]/30'
            }`}
        >
            <div className='flex items-start gap-3'>
                <div className={`size-9 rounded-full ring-4 ${styles.ring} flex items-center justify-center shrink-0 mt-0.5`}>
                    <span className='text-base leading-none' title={styles.label}>{styles.emoji}</span>
                </div>

                <div className='flex-1 min-w-0'>
                    <div className='flex flex-wrap items-start justify-between gap-2 mb-3'>
                        <div>
                            <h4 className={`text-sm font-semibold ${nonCompliant ? 'text-[#FF0000]' : 'text-[#1E1E1E]'}`}>
                                {parameter.label}
                            </h4>
                            <span className='text-[10px] text-[#808080] uppercase tracking-wide'>{statusLabel}</span>
                        </div>
                        <button
                            type='button'
                            onClick={() => onOpenSop(parameter.referenceSop)}
                            className='inline-flex items-center gap-1 text-xs text-[#515DEF] hover:underline cursor-pointer font-medium shrink-0'
                        >
                            {parameter.referenceSop}
                            <ExternalLink size={12} />
                        </button>
                    </div>

                    <div className='mb-3'>
                        <ResponseControl parameter={parameter} value={value} onChange={onChange} />
                    </div>

                    <div className='flex flex-col lg:flex-row lg:items-center gap-3 pt-3 border-t border-[#F2F4F7]'>
                        <div className='flex items-center gap-2 flex-1 min-w-0'>
                            <MessageSquare size={14} className='text-[#808080] shrink-0' />
                            <input
                                type='text'
                                value={value.comments}
                                onChange={(e) => update('comments', e.target.value)}
                                placeholder='Add comment...'
                                className='text-sm text-[#1E1E1E] border-0 bg-[#F5F6FA] rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-[#515DEF]/30'
                            />
                        </div>
                        <EvidenceUploader
                            evidence={value.evidence}
                            onChange={(next) => update('evidence', next)}
                            showUrlInput={showUrlInput}
                            onToggleUrl={() => setShowUrlInput((prev) => !prev)}
                        />
                    </div>

                    {nonCompliant && observation && (
                        <InlineObservationCard
                            parameter={parameter}
                            observation={observation}
                            auditReference={auditReference}
                            onChange={onObservationChange}
                            onSave={onSaveObservation}
                            onSubmit={onSubmitObservation}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default ParameterCard
