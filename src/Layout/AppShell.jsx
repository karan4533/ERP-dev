import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import CommonBreadcrumb from '../Common/CommonBreadcrumb/CommonBreadcrumb'
import CommonHeader from '../Common/CommonHeader/CommonHeader'
import CommonSidebar from '../Common/CommonSidebar/CommonSidebar'
import RightInfoDrawer from '../Common/CommonHeader/Components/RightInfoDrawer'
import SkipLink from '../Common/ui/SkipLink'
import { getPortalLayout } from './layoutRegistry'
import {
    getInitialSidebarState,
    shouldCloseSidebarOnEscape,
    shouldShowMobileBackdrop,
} from './shellState'

const getViewportWidth = () => (typeof window === 'undefined' ? 1024 : window.innerWidth)

const AppShell = ({ roleKey, children, showBreadcrumb }) => {
    const location = useLocation()
    const portalMeta = getPortalLayout(roleKey)
    const menuButtonRef = useRef(null)
    const [sidebarHidden, setSidebarHidden] = useState(
        () => getInitialSidebarState(getViewportWidth()).sidebarHidden,
    )
    const [rightDrawerOpen, setRightDrawerOpen] = useState(false)

    const toggleSidebar = () => setSidebarHidden((current) => !current)
    const toggleRightDrawer = () => setRightDrawerOpen((current) => !current)

    const mobileBackdropVisible = shouldShowMobileBackdrop(getViewportWidth(), sidebarHidden)

    const closeMobileNavigation = (restoreFocus = false) => {
        setSidebarHidden(true)
        if (restoreFocus) {
            window.requestAnimationFrame(() => menuButtonRef.current?.focus())
        }
    }

    useEffect(() => {
        const handleResize = () => {
            const width = getViewportWidth()
            setSidebarHidden(getInitialSidebarState(width).sidebarHidden)
            if (width < 1280) {
                setRightDrawerOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (shouldCloseSidebarOnEscape(event.key, getViewportWidth(), sidebarHidden)) {
                closeMobileNavigation(true)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [sidebarHidden])

    useEffect(() => {
        if (!mobileBackdropVisible) return undefined

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [mobileBackdropVisible])

    useEffect(() => {
        if (getViewportWidth() < 1024) setSidebarHidden(true)
    }, [location.pathname])

    const renderBreadcrumb = showBreadcrumb ?? portalMeta.showBreadcrumb

    return (
        <div className='min-h-screen bg-[var(--erp-canvas)] text-[var(--erp-ink)]'>
            <SkipLink targetId='main-content' />
            <CommonSidebar
                portalMeta={portalMeta}
                toggleSidebar={toggleSidebar}
                sidebarHidden={sidebarHidden}
            />
            <CommonHeader
                portalMeta={portalMeta}
                toggleSidebar={toggleSidebar}
                sidebarHidden={sidebarHidden}
                menuButtonRef={menuButtonRef}
                rightDrawerOpen={rightDrawerOpen}
                toggleRightDrawer={toggleRightDrawer}
            />

            <RightInfoDrawer
                open={rightDrawerOpen}
                onClose={() => setRightDrawerOpen(false)}
            />

            {mobileBackdropVisible && (
                <button
                    type='button'
                    aria-label='Close navigation'
                    className='fixed inset-0 z-100 cursor-default bg-[#172033]/55 backdrop-blur-[1px] lg:hidden'
                    onClick={() => closeMobileNavigation(true)}
                />
            )}

            <main
                id='main-content'
                tabIndex={-1}
                className={`min-h-screen bg-[var(--erp-canvas)] pt-[4.75rem] transition-[margin] duration-200 motion-reduce:transition-none ${
                    sidebarHidden ? 'lg:ml-[90px]' : 'lg:ml-[280px]'
                } ${rightDrawerOpen ? 'lg:mr-[300px]' : ''}`}
            >
                <div className='mx-auto w-full max-w-[var(--erp-content-max)] px-3 pb-8 pt-4 sm:px-5 lg:px-7'>
                    {renderBreadcrumb && <CommonBreadcrumb />}
                    {children}
                </div>
            </main>
        </div>
    )
}

export default AppShell
