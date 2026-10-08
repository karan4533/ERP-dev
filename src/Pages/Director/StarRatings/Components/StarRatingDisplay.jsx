import React from 'react'
import { Star } from 'lucide-react'
import { MAX_STARS } from '../starRatingsData'

const StarRatingDisplay = ({ rating, maxStars = MAX_STARS, size = 16 }) => {
    const clampedRating = Math.min(Math.max(Number(rating) || 0, 0), maxStars)

    return (
        <div className='flex items-center gap-0.5'>
            {Array.from({ length: maxStars }, (_, index) => {
                const isFilled = index < clampedRating
                return (
                    <Star
                        key={index}
                        size={size}
                        className={isFilled ? 'fill-[#FFC107] text-[#FFC107]' : 'fill-none text-[#D9D9D9]'}
                    />
                )
            })}
            <span className='text-xs text-[#808080] ml-1'>({clampedRating}/{maxStars})</span>
        </div>
    )
}

export default StarRatingDisplay
