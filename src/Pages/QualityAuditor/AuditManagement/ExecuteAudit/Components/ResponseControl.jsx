import React from 'react'
import { Star } from 'lucide-react'
import { parseRating, QUALITY_RATING_MAX } from '../executeAuditData'

const ResponseControl = ({ parameter, value, onChange }) => {
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
