import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { MAX_STARS } from '../starRatingsData'

const StarRatingInput = ({ value = 0, onChange, maxStars = MAX_STARS }) => {
    const [hoverRating, setHoverRating] = useState(0)
    const displayRating = hoverRating || value

    return (
        <div className='flex items-center gap-1'>
            {Array.from({ length: maxStars }, (_, index) => {
                const starValue = index + 1
                const isFilled = starValue <= displayRating

                return (
                    <button
                        key={index}
                        type='button'
                        onClick={() => onChange(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className='cursor-pointer transition-transform hover:scale-110'
                        aria-label={`Rate ${starValue} out of ${maxStars}`}
                    >
                        <Star
                            size={24}
                            className={isFilled ? 'fill-[#FFC107] text-[#FFC107]' : 'fill-none text-[#D9D9D9]'}
                        />
                    </button>
                )
            })}
            {value > 0 && (
                <span className='text-sm text-[#667085] ml-2'>{value} / {maxStars}</span>
            )}
        </div>
    )
}

export default StarRatingInput
