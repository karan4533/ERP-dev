import React from 'react'
import { CHECKLIST_RESPONSE_OPTIONS, normalizeResponseType } from '../executeAuditData'

const inputClass =
    'text-sm text-[#1E1E1E] border border-[#E0E0E0] rounded-lg px-3 py-2 w-full max-w-md focus:border-[#515DEF] outline-none'

const ResponseControl = ({ parameter, value, onChange }) => {
    const kind = normalizeResponseType(parameter?.responseType)
    const update = (response) => onChange({ ...value, response })

    if (kind === 'date') {
        return (
            <input
                type='date'
                value={String(value.response || '')}
                onChange={(e) => update(e.target.value)}
                className={inputClass}
                aria-label={`Date for ${parameter.label}`}
            />
        )
    }

    if (kind === 'place') {
        return (
            <input
                type='text'
                value={String(value.response || '')}
                onChange={(e) => update(e.target.value)}
                placeholder='Enter place / location'
                className={inputClass}
                aria-label={`Place for ${parameter.label}`}
            />
        )
    }

    if (kind === 'text') {
        return (
            <textarea
                value={String(value.response || '')}
                onChange={(e) => update(e.target.value)}
                placeholder='Enter remarks'
                className={`${inputClass} min-h-[72px] resize-y`}
                aria-label={`Remarks for ${parameter.label}`}
            />
        )
    }

    return (
        <div className='flex flex-wrap gap-4' role='radiogroup' aria-label={`Response for ${parameter.label}`}>
            {CHECKLIST_RESPONSE_OPTIONS.map((option) => (
                <label key={option} className='inline-flex items-center gap-2 cursor-pointer group'>
                    <input
                        type='radio'
                        name={`${parameter.id}-response`}
                        value={option}
                        checked={value.response === option}
                        onChange={() => update(option)}
                        className='size-4 accent-[#515DEF]'
                    />
                    <span
                        className={`text-sm ${
                            value.response === option
                                ? option === 'Yes'
                                    ? 'text-[#4CAF50] font-semibold'
                                    : option === 'No'
                                      ? 'text-[#FF0000] font-semibold'
                                      : 'text-[#FF9800] font-semibold'
                                : 'text-[#667085] group-hover:text-[#1E1E1E]'
                        }`}
                    >
                        {option}
                    </span>
                </label>
            ))}
        </div>
    )
}

export default ResponseControl
