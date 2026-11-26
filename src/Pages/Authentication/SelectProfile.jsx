import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Legacy SelectProfile component.
 * Role selection cards before authentication have been retired.
 * The system now uses a single centralized authentication interface with automatic role identification.
 */
const SelectProfile = () => {
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        navigate('/signin', { replace: true, state: location.state })
    }, [navigate, location.state])

    return null
}

export default SelectProfile
