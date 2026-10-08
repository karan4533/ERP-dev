import React, { useEffect, useState } from 'react'
import { PORTAL_LOGO, PORTAL_LOGO_ALT } from '../../constants/portalLogo'

const AuthHeader = () => {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 8)
        }

        handleScroll()
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header
            className={`sticky top-0 z-30 w-full px-4 py-4 md:px-6 lg:px-10 transition-colors duration-300 ease-in-out ${
                scrolled ? 'bg-white shadow-sm' : 'bg-transparent'
            }`}
        >
            <img src={PORTAL_LOGO} alt={PORTAL_LOGO_ALT} className="h-14 w-auto object-contain" />
        </header>
    )
}

export default AuthHeader
