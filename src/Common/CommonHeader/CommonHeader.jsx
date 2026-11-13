import React, { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Pin, Search } from 'lucide-react'
import { singleTitleMapping } from './Components/TitleMappings'
import { getNavigationForPath, getNavigationLabelForPath } from '../navigation/navigationRegistry'
import { isNavigationDestinationActive } from '../navigation/navigationHelpers'
import {
    getNavigationPreferences,
    togglePinModule,
    subscribeNavigationChange,
    getModuleKey,
} from '../navigation/navigationCustomizationData'
import { useAuth } from '../../context/AuthContext'
import UserDropdown from './Components/UserDropdown'
import UserNotifications from './Components/UserNotifications'
import GlobalSearchModal from './Components/GlobalSearchModal'

const CommonHeader = ({
    sidebarHidden,
    portalMeta,
    rightDrawerOpen,
    toggleRightDrawer,
}) => {
    const location = useLocation()
    const { role, email: authEmail } = useAuth()
    const activeRole = portalMeta?.role || role

    const sidebarLinks = useMemo(
        () => getNavigationForPath(location.pathname, activeRole),
        [activeRole, location.pathname]
    )

    const pageTitle =
        getNavigationLabelForPath(location.pathname, activeRole) ||
        singleTitleMapping[location.pathname] ||
        'Overview'

    const [searchModalOpen, setSearchModalOpen] = useState(false)
    const [navPrefs, setNavPrefs] = useState(() => getNavigationPreferences(activeRole, authEmail, sidebarLinks))

    // Find current active navigation item
    const currentModule = useMemo(() => {
        for (const item of sidebarLinks) {
            if (item.to && isNavigationDestinationActive(item.to, location.pathname)) {
                return item
            }
            if (item.subLinks?.length) {
                const subMatch = item.subLinks.find((sub) =>
                    isNavigationDestinationActive(sub.to, location.pathname)
                )
                if (subMatch) return item
            }
        }
        return sidebarLinks[0] ?? null
    }, [sidebarLinks, location.pathname])

    const currentModuleKey = currentModule ? getModuleKey(currentModule) : null
    const isPinned = Boolean(currentModuleKey && navPrefs.pinnedIds.includes(currentModuleKey))

    // Subscribe to navigation updates
    useEffect(() => {
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
        return subscribeNavigationChange(() => {
            setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
        })
    }, [activeRole, authEmail, sidebarLinks])

    const handleTogglePin = () => {
        if (!currentModuleKey) return
        togglePinModule(activeRole, authEmail, currentModuleKey, sidebarLinks)
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
    }

    // Global keyboard listener for "/" or "Ctrl+K" to launch search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
                e.preventDefault()
                setSearchModalOpen(true)
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                setSearchModalOpen(true)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <>
            <header
                className={`fixed right-0 top-0 z-200 border-b border-slate-200 bg-white/95 backdrop-blur-md transition-[left,right] duration-200 motion-reduce:transition-none ${
                    sidebarHidden ? 'left-0 lg:left-[90px]' : 'left-0 lg:left-[280px]'
                } ${rightDrawerOpen ? 'lg:right-[300px]' : 'right-0'}`}
            >
                <div className='mx-auto flex h-[4.75rem] w-full max-w-[var(--erp-content-max)] items-center justify-between gap-3 px-3 sm:px-5 lg:px-6'>
                    {/* Left: Pin Button + Breadcrumb */}
                    <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
                        <button
                            type='button'
                            onClick={handleTogglePin}
                            aria-label={isPinned ? 'Unpin module from top navigation' : 'Pin module to top navigation'}
                            title={isPinned ? `Unpin "${currentModule?.title || 'page'}" from top navigation` : `Pin "${currentModule?.title || 'page'}" to top of navigation`}
                            className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                                isPinned
                                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200'
                                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                        >
                            <Pin size={16} className={`transition-transform ${isPinned ? 'fill-blue-600 rotate-45' : ''}`} />
                        </button>

                        <nav aria-label='Breadcrumbs' className='min-w-0'>
                            <div className='flex items-center gap-1.5 text-xs text-slate-400'>
                                <span className='truncate hover:text-slate-600 font-medium'>
                                    {portalMeta?.shortLabel || 'Dashboards'}
                                </span>
                                <span className='text-slate-300'>/</span>
                                <span className='truncate font-semibold text-slate-800'>
                                    {pageTitle}
                                </span>
                            </div>
                        </nav>
                    </div>

                    {/* Center: Global Search Input Pill */}
                    <div className='hidden md:flex items-center flex-1 max-w-xs mx-4'>
                        <button
                            type='button'
                            onClick={() => setSearchModalOpen(true)}
                            className='w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400 hover:border-slate-300 hover:bg-slate-100/70 transition-colors shadow-2xs group cursor-pointer'
                        >
                            <div className='flex items-center gap-2 text-slate-500'>
                                <Search size={14} className='group-hover:text-blue-600 transition-colors' />
                                <span className='text-slate-500 font-medium'>Search students, enquiries...</span>
                            </div>
                            <kbd className='hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 text-slate-400 shadow-2xs'>
                                /
                            </kbd>
                        </button>
                    </div>

                    {/* Right: Notifications Popover + User Dropdown */}
                    <div className='flex items-center gap-2 sm:gap-3'>
                        <UserNotifications />
                        <div className='hidden sm:block h-5 w-px bg-slate-200' />
                        <UserDropdown />
                    </div>
                </div>
            </header>

            {/* Global Quick Search Modal */}
            <GlobalSearchModal
                isOpen={searchModalOpen}
                onClose={() => setSearchModalOpen(false)}
            />
        </>
    )
}

export default CommonHeader
