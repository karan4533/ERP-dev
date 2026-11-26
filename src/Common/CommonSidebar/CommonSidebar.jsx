import React, { useState, useEffect, useRef, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
    ChevronLeft,
    ChevronDown,
    Search,
    X,
    Pin,
    PinOff,
    GripVertical,
    SlidersHorizontal,
    Plus,
    Pencil,
    Trash2,
    RotateCcw,
    Check,
    FolderPlus,
    ArrowUp,
    ArrowDown
} from 'lucide-react'
import { PORTAL_LOGO, PORTAL_LOGO_ICON, PORTAL_LOGO_ALT } from '../../constants/portalLogo'
import {
    filterNavigationItems,
    isNavigationDestinationActive,
} from '../navigation/navigationHelpers'
import { getNavigationForPath } from '../navigation/navigationRegistry'
import {
    getNavigationPreferences,
    togglePinModule,
    moveOrReorderModule,
    createCustomGroup,
    renameCustomGroup,
    deleteCustomGroup,
    resetNavigationPreferences,
    subscribeNavigationChange,
    getModuleKey,
} from '../navigation/navigationCustomizationData'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'

const CommonSidebar = ({ sidebarHidden, toggleSidebar, portalMeta }) => {
    const { role, name: authName, email: authEmail } = useAuth()
    const activeRole = portalMeta?.role || role
    const roleLabel = getProfileLabel(activeRole)
    const displayName = authName || (roleLabel ?? 'Staff User')

    const location = useLocation()
    const flyoutRef = useRef(null)

    // Base navigation links for authoritative role & path
    const sidebarLinks = useMemo(
        () => getNavigationForPath(location.pathname, activeRole),
        [activeRole, location.pathname]
    )

    // Navigation preferences (pinned items, customized groups & module order)
    const [navPrefs, setNavPrefs] = useState(() =>
        getNavigationPreferences(activeRole, authEmail, sidebarLinks)
    )

    // Customization Mode States
    const [isCustomizing, setIsCustomizing] = useState(false)
    const [editingGroupId, setEditingGroupId] = useState(null)
    const [editGroupName, setEditGroupName] = useState('')
    const [isAddingGroup, setIsAddingGroup] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')

    // Drag and Drop state
    const [draggedModule, setDraggedModule] = useState(null) // { moduleId, sourceGroupId }
    const [dragOverGroup, setDragOverGroup] = useState(null)

    // Menu dropdown states
    const [openMenus, setOpenMenus] = useState({})
    const [manuallyOpened, setManuallyOpened] = useState(null)
    const [navigationQuery, setNavigationQuery] = useState('')

    // Subscribe to external navigation preference changes (e.g. from CommonHeader Pin button)
    useEffect(() => {
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
        return subscribeNavigationChange(() => {
            setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
        })
    }, [activeRole, authEmail, sidebarLinks])

    // Quick lookup map of modules by key
    const moduleMap = useMemo(() => {
        const map = new Map()
        sidebarLinks.forEach((item) => {
            map.set(getModuleKey(item), item)
        })
        return map
    }, [sidebarLinks])

    // Pinned modules
    const pinnedModules = useMemo(() => {
        return navPrefs.pinnedIds
            .map((id) => moduleMap.get(id))
            .filter(Boolean)
    }, [navPrefs.pinnedIds, moduleMap])

    // Filter modules based on search query
    const filteredSidebarLinks = useMemo(() => {
        return filterNavigationItems(sidebarLinks, navigationQuery)
    }, [navigationQuery, sidebarLinks])

    const filteredModuleKeys = useMemo(() => {
        return new Set(filteredSidebarLinks.map(getModuleKey))
    }, [filteredSidebarLinks])

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            toggleSidebar()
        }
    }

    const toggleSubMenu = (id) => {
        setOpenMenus((prev) => ({
            ...prev,
            [id]: !prev[id],
        }))

        if (sidebarHidden) {
            setManuallyOpened((prev) => (prev === id ? null : id))
        }
    }

    // Auto open menus containing active child link
    useEffect(() => {
        const newOpenMenus = {}
        sidebarLinks.forEach((link) => {
            if (link.subLinks) {
                const isActive = link.subLinks.some(
                    (sub) =>
                        location.pathname === sub.to ||
                        location.pathname.startsWith(`${sub.to}/`)
                )
                if (isActive) {
                    newOpenMenus[link.id] = true
                }
            }
        })
        setOpenMenus(newOpenMenus)
    }, [location.pathname, sidebarLinks])

    useEffect(() => {
        if (!sidebarHidden) {
            setManuallyOpened(null)
        }
    }, [sidebarHidden])

    // Close flyout when clicking outside (collapsed sidebar mode)
    useEffect(() => {
        if (!sidebarHidden) return

        const handleClickOutside = (e) => {
            if (flyoutRef.current && !flyoutRef.current.contains(e.target)) {
                setOpenMenus({})
                setManuallyOpened(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [sidebarHidden])

    // ==========================================
    // CUSTOMIZATION HANDLERS
    // ==========================================
    const handleTogglePin = (e, moduleId) => {
        e.stopPropagation()
        e.preventDefault()
        togglePinModule(activeRole, authEmail, moduleId, sidebarLinks)
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
    }

    const handleCreateGroup = (e) => {
        e.preventDefault()
        if (!newGroupName.trim()) return
        createCustomGroup(activeRole, authEmail, newGroupName.trim(), sidebarLinks)
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
        setNewGroupName('')
        setIsAddingGroup(false)
    }

    const handleStartRenameGroup = (groupId, currentLabel) => {
        setEditingGroupId(groupId)
        setEditGroupName(currentLabel)
    }

    const handleSaveRenameGroup = (groupId) => {
        if (editGroupName.trim()) {
            renameCustomGroup(activeRole, authEmail, groupId, editGroupName.trim(), sidebarLinks)
            setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
        }
        setEditingGroupId(null)
        setEditGroupName('')
    }

    const handleDeleteGroup = (groupId) => {
        deleteCustomGroup(activeRole, authEmail, groupId, sidebarLinks)
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
    }

    const handleResetNavigation = () => {
        if (window.confirm('Reset navigation layout to default? All pinned modules and custom groups will be restored.')) {
            resetNavigationPreferences(activeRole, authEmail, sidebarLinks)
            setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
            setIsCustomizing(false)
        }
    }

    // Drag and Drop Handlers
    const handleDragStart = (e, moduleId, sourceGroupId) => {
        setDraggedModule({ moduleId, sourceGroupId })
        e.dataTransfer.setData('text/plain', JSON.stringify({ moduleId, sourceGroupId }))
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e, groupId) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (dragOverGroup !== groupId) {
            setDragOverGroup(groupId)
        }
    }

    const handleDrop = (e, targetGroupId, targetIndex = 0) => {
        e.preventDefault()
        setDragOverGroup(null)
        if (!draggedModule) return

        moveOrReorderModule(
            activeRole,
            authEmail,
            {
                sourceGroupId: draggedModule.sourceGroupId,
                targetGroupId,
                moduleId: draggedModule.moduleId,
                targetIndex,
            },
            sidebarLinks
        )
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
        setDraggedModule(null)
    }

    // Accessible Move Up / Down
    const handleMoveItem = (groupId, itemIndex, direction) => {
        const targetIndex = itemIndex + direction
        const group = navPrefs.groups.find((g) => g.id === groupId)
        if (!group) return
        const moduleId = group.moduleIds[itemIndex]
        if (!moduleId) return

        moveOrReorderModule(
            activeRole,
            authEmail,
            {
                sourceGroupId: groupId,
                targetGroupId: groupId,
                moduleId,
                targetIndex,
            },
            sidebarLinks
        )
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
    }

    // Accessible Move to Different Group
    const handleMoveToGroup = (sourceGroupId, targetGroupId, moduleId) => {
        moveOrReorderModule(
            activeRole,
            authEmail,
            {
                sourceGroupId,
                targetGroupId,
                moduleId,
                targetIndex: 0,
            },
            sidebarLinks
        )
        setNavPrefs(getNavigationPreferences(activeRole, authEmail, sidebarLinks))
    }

    return (
        <aside
            id='portal-navigation'
            aria-label={`${portalMeta?.shortLabel || 'Portal'} navigation`}
            className={`bg-[#172033] flex flex-col h-full transition-all duration-200 motion-reduce:transition-none fixed top-0 left-0 z-300 font-inter overflow-visible ${
                sidebarHidden
                    ? 'w-[280px] -translate-x-full lg:translate-x-0 lg:w-[90px] shadow-none'
                    : 'w-[280px] translate-x-0 shadow-[var(--erp-shadow-overlay)] lg:shadow-none'
            }`}
        >
            {/* Toggle Button - outside scrollable area */}
            <div className='hidden lg:flex justify-end relative z-50 px-2 pt-2'>
                <button
                    type='button'
                    onClick={toggleSidebar}
                    aria-label={sidebarHidden ? 'Expand navigation' : 'Collapse navigation'}
                    aria-expanded={!sidebarHidden}
                    className={`text-[#3F46C7] cursor-pointer flex items-center justify-center size-8 bg-white rounded-full p-1 border border-slate-200 relative translate-x-1/2 shadow-xs transition-transform ${
                        sidebarHidden ? 'rotate-180' : ''
                    }`}
                >
                    <ChevronLeft size={16} aria-hidden='true' />
                </button>
            </div>

            {/* User Profile Header */}
            <div className={`px-4 pt-3 pb-3 border-b border-white/10 ${sidebarHidden ? 'flex justify-center' : 'flex items-center gap-3'}`}>
                <NavLink to='/my-profile' className='relative shrink-0' title={displayName}>
                    <img
                        src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
                        alt={displayName}
                        className='size-9 rounded-full object-cover ring-2 ring-white/20'
                    />
                    <span className='absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-[#172033]' />
                </NavLink>
                {!sidebarHidden && (
                    <div className='min-w-0 flex-1'>
                        <NavLink to='/my-profile' className='truncate text-sm font-semibold text-white hover:text-blue-300 transition-colors block'>
                            {displayName}
                        </NavLink>
                        <p className='truncate text-[11px] text-white/50'>
                            {portalMeta?.shortLabel || roleLabel}
                        </p>
                    </div>
                )}
            </div>

            {/* Scrollable Links Container */}
            <div className={`flex-1 px-3 py-3 flex flex-col gap-y-3 ${sidebarHidden ? 'overflow-visible' : 'overflow-y-auto sidebar-scroll-hide'}`}>
                {/* Search Bar & Customization Toggle */}
                {!sidebarHidden && (
                    <div className='space-y-2 shrink-0'>
                        <div className='flex items-center gap-1.5'>
                            <div className='relative flex-1'>
                                <Search aria-hidden='true' size={14} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40' />
                                <input
                                    type='search'
                                    aria-label='Search navigation'
                                    value={navigationQuery}
                                    onChange={(e) => setNavigationQuery(e.target.value)}
                                    placeholder='Filter modules...'
                                    className='h-8.5 w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8.5 pr-8 text-xs text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none'
                                />
                                {navigationQuery && (
                                    <button
                                        type='button'
                                        aria-label='Clear search'
                                        onClick={() => setNavigationQuery('')}
                                        className='absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded text-white/50 hover:text-white cursor-pointer'
                                    >
                                        <X aria-hidden='true' size={13} />
                                    </button>
                                )}
                            </div>

                            {/* Customize Navigation Mode Button */}
                            <button
                                type='button'
                                onClick={() => setIsCustomizing((prev) => !prev)}
                                aria-label={isCustomizing ? 'Done customizing' : 'Customize navigation'}
                                title={isCustomizing ? 'Finish customizing' : 'Customize navigation bar (reorder, groups, pin)'}
                                className={`inline-flex items-center justify-center size-8.5 rounded-lg border transition-all cursor-pointer ${
                                    isCustomizing
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                                        : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <SlidersHorizontal size={14} />
                            </button>
                        </div>

                        {/* Customization Toolbar Active Banner */}
                        {isCustomizing && (
                            <div className='bg-blue-950/60 border border-blue-500/30 rounded-xl p-2.5 text-xs text-blue-200 space-y-2 animate-fadeIn'>
                                <div className='flex items-center justify-between'>
                                    <span className='font-semibold text-white flex items-center gap-1.5'>
                                        <SlidersHorizontal size={12} className='text-blue-400' />
                                        Customizing Menu
                                    </span>
                                    <button
                                        type='button'
                                        onClick={() => setIsCustomizing(false)}
                                        className='text-[11px] font-bold text-blue-300 hover:text-white underline cursor-pointer'
                                    >
                                        Done
                                    </button>
                                </div>
                                <p className='text-[10px] text-blue-300/80 leading-relaxed'>
                                    Drag modules to reorder or move across groups. Pin frequently used tools to the top.
                                </p>
                                <div className='flex items-center gap-2 pt-1'>
                                    <button
                                        type='button'
                                        onClick={() => setIsAddingGroup(true)}
                                        className='flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors cursor-pointer shadow-xs'
                                    >
                                        <FolderPlus size={12} />
                                        <span>+ New Group</span>
                                    </button>
                                    <button
                                        type='button'
                                        onClick={handleResetNavigation}
                                        title='Reset to default layout'
                                        className='inline-flex items-center gap-1 px-2 py-1 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] transition-colors cursor-pointer'
                                    >
                                        <RotateCcw size={11} />
                                        <span>Reset</span>
                                    </button>
                                </div>

                                {/* New Group Input Form */}
                                {isAddingGroup && (
                                    <form onSubmit={handleCreateGroup} className='flex items-center gap-1.5 pt-1'>
                                        <input
                                            type='text'
                                            autoFocus
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            placeholder='Group name...'
                                            className='h-7 flex-1 rounded bg-white/10 border border-white/20 px-2 text-[11px] text-white placeholder:text-white/40 outline-none'
                                        />
                                        <button
                                            type='submit'
                                            className='size-7 rounded bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 cursor-pointer'
                                        >
                                            <Check size={12} />
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => setIsAddingGroup(false)}
                                            className='size-7 rounded bg-white/10 text-white/60 flex items-center justify-center hover:text-white cursor-pointer'
                                        >
                                            <X size={12} />
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 1. PINNED MODULES SECTION (TOP OF NAVIGATION) */}
                {pinnedModules.length > 0 && (!navigationQuery || pinnedModules.some((p) => filteredModuleKeys.has(getModuleKey(p)))) && (
                    <div className='pb-2 border-b border-white/10'>
                        {!sidebarHidden && (
                            <div className='flex items-center justify-between px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-amber-400/90'>
                                <span className='flex items-center gap-1.5'>
                                    <Pin size={12} className='fill-amber-400 rotate-45' />
                                    Pinned ({pinnedModules.length})
                                </span>
                            </div>
                        )}
                        <ul className='flex flex-col gap-y-1'>
                            {pinnedModules
                                .filter((item) => !navigationQuery || filteredModuleKeys.has(getModuleKey(item)))
                                .map((item) => {
                                    const key = getModuleKey(item)
                                    const hasSubLinks = item.subLinks && item.subLinks.length > 0
                                    const isActive = item.to
                                        ? isNavigationDestinationActive(item.to, location.pathname)
                                        : item.subLinks?.some((s) => isNavigationDestinationActive(s.to, location.pathname))

                                    return (
                                        <li key={`pinned-${key}`} className='relative group'>
                                            <NavLink
                                                to={item.to || (item.subLinks?.[0]?.to ?? '#')}
                                                onClick={handleLinkClick}
                                                className={`flex w-full items-center gap-x-2.5 min-h-9 px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                                                    isActive
                                                        ? 'text-slate-900 bg-white shadow-xs font-semibold'
                                                        : 'text-amber-100/80 hover:bg-white/10 hover:text-white'
                                                } ${sidebarHidden ? 'justify-center px-2' : 'justify-start'}`}
                                            >
                                                <item.icon width={17} height={17} className='shrink-0 text-amber-400' />
                                                {!sidebarHidden && (
                                                    <>
                                                        <span className='flex-1 truncate text-left'>{item.title}</span>
                                                        <button
                                                            type='button'
                                                            onClick={(e) => handleTogglePin(e, key)}
                                                            title='Unpin module'
                                                            aria-label='Unpin module'
                                                            className='opacity-0 group-hover:opacity-100 size-5 rounded hover:bg-white/20 flex items-center justify-center text-amber-400 transition-opacity cursor-pointer'
                                                        >
                                                            <PinOff size={12} />
                                                        </button>
                                                    </>
                                                )}
                                            </NavLink>

                                            {/* Tooltip for collapsed sidebar */}
                                            {sidebarHidden && (
                                                <div className='absolute left-full top-1/2 -translate-y-1/2 pl-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50'>
                                                    <div className='bg-[#172033] text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-white/10 flex items-center gap-1.5'>
                                                        <Pin size={10} className='fill-amber-400 rotate-45' />
                                                        <span>{item.title}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    )
                                })}
                        </ul>
                    </div>
                )}

                {/* 2. CUSTOMIZED MODULE GROUPS AND LINKS */}
                <ul className='flex flex-col gap-y-2' ref={flyoutRef}>
                    {navPrefs.groups.map((group) => {
                        const groupItems = (group.moduleIds || [])
                            .map((id) => moduleMap.get(id))
                            .filter(Boolean)
                            .filter((item) => !navigationQuery || filteredModuleKeys.has(getModuleKey(item)))

                        // Don't render empty groups unless in customize mode or custom group
                        if (groupItems.length === 0 && !isCustomizing && !group.isCustom) {
                            return null
                        }

                        const isOver = dragOverGroup === group.id

                        return (
                            <li
                                key={group.id}
                                onDragOver={(e) => handleDragOver(e, group.id)}
                                onDrop={(e) => handleDrop(e, group.id, groupItems.length)}
                                className={`rounded-xl transition-colors ${
                                    isOver && isCustomizing ? 'bg-blue-900/30 ring-1 ring-blue-400/50 p-1' : ''
                                }`}
                            >
                                {/* Group Header */}
                                {!sidebarHidden && (
                                    <div className='flex items-center justify-between px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-white/40'>
                                        {editingGroupId === group.id ? (
                                            <div className='flex items-center gap-1.5 w-full'>
                                                <input
                                                    type='text'
                                                    autoFocus
                                                    value={editGroupName}
                                                    onChange={(e) => setEditGroupName(e.target.value)}
                                                    className='h-6 flex-1 rounded bg-white/10 border border-white/20 px-2 text-[11px] text-white outline-none normal-case font-normal'
                                                />
                                                <button
                                                    type='button'
                                                    onClick={() => handleSaveRenameGroup(group.id)}
                                                    className='size-6 rounded bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 cursor-pointer'
                                                >
                                                    <Check size={11} />
                                                </button>
                                                <button
                                                    type='button'
                                                    onClick={() => setEditingGroupId(null)}
                                                    className='size-6 rounded bg-white/10 text-white/60 flex items-center justify-center hover:text-white cursor-pointer'
                                                >
                                                    <X size={11} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className='truncate'>{group.label}</span>
                                                {isCustomizing && (
                                                    <div className='flex items-center gap-1'>
                                                        <button
                                                            type='button'
                                                            onClick={() => handleStartRenameGroup(group.id, group.label)}
                                                            title='Rename group'
                                                            className='p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer'
                                                        >
                                                            <Pencil size={11} />
                                                        </button>
                                                        {group.isCustom && (
                                                            <button
                                                                type='button'
                                                                onClick={() => handleDeleteGroup(group.id)}
                                                                title='Delete group'
                                                                className='p-1 rounded hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer'
                                                            >
                                                                <Trash2 size={11} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Group Modules List */}
                                <ul className='flex flex-col gap-y-1 mt-0.5'>
                                    {groupItems.map((item, itemIndex) => {
                                        const key = getModuleKey(item)
                                        const hasSubLinks = item.subLinks && item.subLinks.length > 0
                                        const isOpen = Boolean(openMenus[item.id])
                                        const isChildActive =
                                            hasSubLinks &&
                                            item.subLinks.some((sub) =>
                                                isNavigationDestinationActive(sub.to, location.pathname)
                                            )
                                        const isPinned = navPrefs.pinnedIds.includes(key)

                                        const commonClasses = (active) =>
                                            `flex w-full items-center gap-x-2.5 min-h-9.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all group cursor-pointer ${
                                                active
                                                    ? 'text-slate-900 bg-white shadow-xs font-semibold'
                                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                            } ${sidebarHidden ? 'justify-center px-2' : 'justify-start'}`

                                        return (
                                            <li
                                                key={item.id}
                                                draggable={isCustomizing}
                                                onDragStart={(e) => handleDragStart(e, key, group.id)}
                                                className={`relative group rounded-xl transition-all ${
                                                    isCustomizing ? 'hover:ring-1 hover:ring-white/20' : ''
                                                }`}
                                            >
                                                {/* In Customizing Mode: Drag Handle + Move Controls */}
                                                {!sidebarHidden && isCustomizing && (
                                                    <div className='flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2 py-1.5 rounded-xl border border-white/10 text-white/80'>
                                                        <div
                                                            className='cursor-grab active:cursor-grabbing text-white/40 hover:text-white p-0.5'
                                                            title='Drag to reorder or move across groups'
                                                        >
                                                            <GripVertical size={14} />
                                                        </div>

                                                        <item.icon width={16} height={16} className='shrink-0 text-white/70' />
                                                        <span className='flex-1 truncate text-xs font-medium text-white'>
                                                            {item.title}
                                                        </span>

                                                        {/* Reorder Up/Down Arrows */}
                                                        <div className='flex items-center gap-0.5'>
                                                            <button
                                                                type='button'
                                                                disabled={itemIndex === 0}
                                                                onClick={() => handleMoveItem(group.id, itemIndex, -1)}
                                                                title='Move up'
                                                                className='p-1 rounded text-white/40 hover:text-white disabled:opacity-20 cursor-pointer'
                                                            >
                                                                <ArrowUp size={11} />
                                                            </button>
                                                            <button
                                                                type='button'
                                                                disabled={itemIndex === groupItems.length - 1}
                                                                onClick={() => handleMoveItem(group.id, itemIndex, 1)}
                                                                title='Move down'
                                                                className='p-1 rounded text-white/40 hover:text-white disabled:opacity-20 cursor-pointer'
                                                            >
                                                                <ArrowDown size={11} />
                                                            </button>
                                                        </div>

                                                        {/* Pin Toggle */}
                                                        <button
                                                            type='button'
                                                            onClick={(e) => handleTogglePin(e, key)}
                                                            title={isPinned ? 'Unpin module' : 'Pin module to top'}
                                                            className={`p-1 rounded cursor-pointer transition-colors ${
                                                                isPinned
                                                                    ? 'text-amber-400 bg-amber-400/20'
                                                                    : 'text-white/40 hover:text-white'
                                                            }`}
                                                        >
                                                            <Pin size={12} className={isPinned ? 'fill-amber-400 rotate-45' : ''} />
                                                        </button>

                                                        {/* Move to another group selector */}
                                                        {navPrefs.groups.length > 1 && (
                                                            <select
                                                                aria-label='Move to group'
                                                                value={group.id}
                                                                onChange={(e) =>
                                                                    handleMoveToGroup(group.id, e.target.value, key)
                                                                }
                                                                className='bg-[#172033] border border-white/20 rounded text-[10px] text-white/70 px-1 py-0.5 outline-none cursor-pointer max-w-[70px] truncate'
                                                            >
                                                                {navPrefs.groups.map((targetG) => (
                                                                    <option key={targetG.id} value={targetG.id}>
                                                                        {targetG.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Normal Navigation Mode */}
                                                {(!isCustomizing || sidebarHidden) && (
                                                    <>
                                                        {hasSubLinks ? (
                                                            <button
                                                                type='button'
                                                                aria-expanded={isOpen}
                                                                aria-controls={`sidebar-group-${item.id}`}
                                                                onClick={() => toggleSubMenu(item.id)}
                                                                className={commonClasses(isChildActive)}
                                                            >
                                                                <item.icon width={18} height={18} aria-hidden='true' className='shrink-0' />
                                                                {!sidebarHidden && (
                                                                    <>
                                                                        <span className='flex-1 truncate text-left'>{item.title}</span>
                                                                        {/* Inline Pin on Hover */}
                                                                        <button
                                                                            type='button'
                                                                            onClick={(e) => handleTogglePin(e, key)}
                                                                            title={isPinned ? 'Unpin module' : 'Pin module to top'}
                                                                            className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/20 transition-opacity cursor-pointer mr-1 ${
                                                                                isPinned ? 'opacity-100 text-amber-400' : 'text-white/40 hover:text-white'
                                                                            }`}
                                                                        >
                                                                            <Pin size={12} className={isPinned ? 'fill-amber-400 rotate-45' : ''} />
                                                                        </button>
                                                                        <ChevronDown
                                                                            size={15}
                                                                            className={`transition-transform duration-200 shrink-0 ${
                                                                                isOpen ? 'rotate-180' : ''
                                                                            }`}
                                                                        />
                                                                    </>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <NavLink
                                                                to={item.to}
                                                                onClick={handleLinkClick}
                                                                className={({ isActive }) => commonClasses(isActive)}
                                                            >
                                                                <item.icon width={18} height={18} aria-hidden='true' className='shrink-0' />
                                                                {!sidebarHidden && (
                                                                    <>
                                                                        <span className='flex-1 truncate text-left'>{item.title}</span>
                                                                        {/* Inline Pin on Hover */}
                                                                        <button
                                                                            type='button'
                                                                            onClick={(e) => handleTogglePin(e, key)}
                                                                            title={isPinned ? 'Unpin module' : 'Pin module to top'}
                                                                            className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/20 transition-opacity cursor-pointer ${
                                                                                isPinned ? 'opacity-100 text-amber-400' : 'text-white/40 hover:text-white'
                                                                            }`}
                                                                        >
                                                                            <Pin size={12} className={isPinned ? 'fill-amber-400 rotate-45' : ''} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </NavLink>
                                                        )}

                                                        {/* Hover tooltip when sidebar is collapsed */}
                                                        {sidebarHidden && manuallyOpened !== item.id && (
                                                            <div className='absolute left-full top-1/2 -translate-y-1/2 pl-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50'>
                                                                <div className='bg-[#172033] text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-white/10'>
                                                                    {item.title}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Expanded sidebar: inline dropdown */}
                                                        {hasSubLinks && isOpen && !sidebarHidden && (
                                                            <ul id={`sidebar-group-${item.id}`} className='mt-1 flex flex-col gap-y-0.5 pl-3'>
                                                                {item.subLinks.map((sub, index) => (
                                                                    <li key={sub.to || index}>
                                                                        <NavLink
                                                                            to={sub.to}
                                                                            onClick={handleLinkClick}
                                                                            className={({ isActive }) =>
                                                                                `flex min-h-8.5 items-center gap-x-2.5 rounded-lg px-2.5 py-1.5 pl-6 text-xs transition-colors ${
                                                                                    isActive
                                                                                        ? 'bg-white/15 text-white font-semibold'
                                                                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                                                                }`
                                                                            }
                                                                        >
                                                                            <sub.icon size={16} className='shrink-0' />
                                                                            <span className='truncate'>{sub.title}</span>
                                                                        </NavLink>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}

                                                        {/* Collapsed sidebar: flyout popup to the right */}
                                                        {hasSubLinks && sidebarHidden && manuallyOpened === item.id && (
                                                            <ul
                                                                id={`sidebar-group-${item.id}`}
                                                                className='fixed left-[98px] w-56 bg-[#172033] rounded-xl shadow-2xl py-2 px-2 flex flex-col gap-y-1 z-50 border border-white/15'
                                                            >
                                                                <li className='px-3 py-1.5 text-xs font-semibold text-white/50 border-b border-white/10 mb-1'>
                                                                    {item.title}
                                                                </li>
                                                                {item.subLinks.map((sub, index) => (
                                                                    <li key={sub.to || index}>
                                                                        <NavLink
                                                                            to={sub.to}
                                                                            onClick={() => {
                                                                                setOpenMenus({})
                                                                                setManuallyOpened(null)
                                                                            }}
                                                                            className={({ isActive }) =>
                                                                                `flex min-h-8.5 items-center gap-x-2.5 py-1.5 px-3 text-xs rounded-lg transition-colors whitespace-nowrap ${
                                                                                    isActive
                                                                                        ? 'bg-white text-slate-900 font-semibold'
                                                                                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                                                                                }`
                                                                            }
                                                                        >
                                                                            <sub.icon size={15} />
                                                                            <span>{sub.title}</span>
                                                                        </NavLink>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            </li>
                        )
                    })}

                    {filteredSidebarLinks.length === 0 && !sidebarHidden && (
                        <li className='rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/60 text-center'>
                            No pages match “{navigationQuery.trim()}”.
                        </li>
                    )}
                </ul>
            </div>

            {/* School Brand Logo at Bottom */}
            <div className={`p-3 border-t border-white/10 shrink-0 ${sidebarHidden ? 'flex justify-center' : 'flex items-center gap-2'}`}>
                <img
                    src={sidebarHidden ? PORTAL_LOGO_ICON : PORTAL_LOGO}
                    alt={PORTAL_LOGO_ALT}
                    className={`h-7 object-contain ${sidebarHidden ? 'w-7' : 'max-w-[140px]'}`}
                />
            </div>
        </aside>
    )
}

export default CommonSidebar
