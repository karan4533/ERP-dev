import React from 'react'
import { getInitials } from '../communicationData'

const UserAvatar = ({ name, color = '#515DEF', size = 'md', src }) => {
    const sizeClass =
        size === 'sm' ? 'h-9 w-9 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={`${sizeClass} shrink-0 rounded-full object-cover`}
            />
        )
    }

    return (
        <div
            className={`${sizeClass} shrink-0 rounded-full flex items-center justify-center font-semibold text-white`}
            style={{ backgroundColor: color }}
            aria-hidden
        >
            {getInitials(name)}
        </div>
    )
}

export default UserAvatar
