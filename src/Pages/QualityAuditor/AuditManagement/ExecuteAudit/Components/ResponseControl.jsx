import React from 'react'
import { Star } from 'lucide-react'
import {
    CHECKLIST_RESPONSE_OPTIONS,
    normalizeResponseType,
    parseRating,
    QUALITY_RATING_MAX,
} from '../executeAuditData'

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

    if (kind === 'yes_no') {
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
                        <span className='text-sm text-[#667085] group-hover:text-[#1E1E1E]'>{option}</span>
                    </label>
                ))}
            </div>
        )
    }

    const rating = parseRating(value.response) ?? 0
    const setRating = (stars) => onChange({ ...value, response: stars })

    return (
        <div
            className='flex flex-wrap items-center gap-3'
            role='radiogroup'
            aria-label={`Quality rating for ${parameter.label}`}
        >
            <div className='flex items-center gap-0.5'>
                {Array.from({ length: QUALITY_RATING_MAX }, (_, index) => {
                    const starValue = index + 1
                    const filled = starValue <= rating

                    return (
                        <button
                            key={starValue}
                            type='button'
                            onClick={() => setRating(starValue)}
                            className='p-0.5 cursor-pointer transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#515DEF]/40 rounded'
                            aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
                            aria-pressed={filled}
                        >
                            <Star
                                size={22}
                                className={filled ? 'text-[#FFC107] fill-[#FFC107]' : 'text-[#D9D9D9]'}
                            />
                        </button>
                    )
                })}
            </div>
            <span className='text-sm font-semibold text-[#1E1E1E]'>
                Rating: {rating ? `${rating} / ${QUALITY_RATING_MAX}` : `— / ${QUALITY_RATING_MAX}`}
            </span>
        </div>
    )
}

export default ResponseControl
