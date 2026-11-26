import { groupNavigationItems } from './navigationHelpers.js'

const STORAGE_PREFIX = 'schoolerp_nav_customization_'
const EVENT_NAME = 'schoolerp_navigation_customized'

const getStorageKey = (role, email = '') => {
    const safeRole = String(role || 'default').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    const safeEmail = String(email || '').trim().toLowerCase().replace(/[^a-z0-9_@-]/g, '_')
    return `${STORAGE_PREFIX}${safeRole}${safeEmail ? `_${safeEmail}` : ''}`
}

/**
 * Normalizes an item ID to a consistent string.
 */
export const getModuleKey = (item) => String(item?.id ?? item?.to ?? item?.title ?? '')

/**
 * Builds the default navigation preferences based on the role's native sidebar links.
 */
export const buildDefaultPreferences = (baseLinks = []) => {
    const grouped = groupNavigationItems(baseLinks)
    const groups = grouped.map((g) => ({
        id: g.key,
        label: g.label,
        isCustom: false,
        moduleIds: g.items.map(getModuleKey),
    }))

    return {
        pinnedIds: [],
        groups,
    }
}

/**
 * Loads preferences from localStorage and reconciles them with current RBAC-permitted links.
 * Any new permitted items are added to their default group.
 * Any revoked/removed items are safely excluded.
 */
export const getNavigationPreferences = (role, email, baseLinks = []) => {
    const key = getStorageKey(role, email)
    const itemMap = new Map(baseLinks.map((item) => [getModuleKey(item), item]))
    const defaultPrefs = buildDefaultPreferences(baseLinks)

    let storedPrefs = null
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem(key)
            if (raw) storedPrefs = JSON.parse(raw)
        }
    } catch {
        storedPrefs = null
    }

    if (!storedPrefs || !Array.isArray(storedPrefs.groups)) {
        return defaultPrefs
    }

    // Safety check: ensure stored groups actually belong to this role's items
    const allStoredIds = storedPrefs.groups.flatMap((g) => g.moduleIds || [])
    const matchingCount = allStoredIds.filter((id) => itemMap.has(String(id))).length
    if (allStoredIds.length > 0 && matchingCount === 0) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key)
            }
        } catch {
            /* ignore */
        }
        return defaultPrefs
    }

    // Filter pinned items: keep only valid currently permitted items
    const validPinned = (storedPrefs.pinnedIds || []).filter((id) => itemMap.has(String(id)))

    // Reconcile groups
    const assignedIds = new Set()
    const reconciledGroups = storedPrefs.groups.map((group) => {
        const validModuleIds = (group.moduleIds || []).filter((id) => {
            const sid = String(id)
            if (itemMap.has(sid) && !assignedIds.has(sid)) {
                assignedIds.add(sid)
                return true
            }
            return false
        })

        return {
            id: group.id || `custom-group-${Date.now()}`,
            label: group.label || 'Group',
            isCustom: Boolean(group.isCustom),
            moduleIds: validModuleIds,
        }
    })

    // Check for any permitted items that aren't assigned to any group yet
    const unassignedItems = baseLinks.filter((item) => !assignedIds.has(getModuleKey(item)))
    if (unassignedItems.length > 0) {
        // Group the unassigned items into their default categories
        const unassignedGroups = groupNavigationItems(unassignedItems)
        unassignedGroups.forEach((ug) => {
            const existingGroup = reconciledGroups.find((g) => g.id === ug.key)
            if (existingGroup) {
                ug.items.forEach((item) => {
                    const id = getModuleKey(item)
                    if (!existingGroup.moduleIds.includes(id)) {
                        existingGroup.moduleIds.push(id)
                    }
                })
            } else {
                reconciledGroups.push({
                    id: ug.key,
                    label: ug.label,
                    isCustom: false,
                    moduleIds: ug.items.map(getModuleKey),
                })
            }
        })
    }

    // Filter out empty system groups if they have no items, but keep custom groups
    const finalGroups = reconciledGroups.filter((g) => g.isCustom || g.moduleIds.length > 0)

    return {
        pinnedIds: validPinned,
        groups: finalGroups.length > 0 ? finalGroups : defaultPrefs.groups,
    }
}

/**
 * Saves preferences to localStorage and broadcasts an update event.
 */
export const saveNavigationPreferences = (role, email, preferences) => {
    const key = getStorageKey(role, email)
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, JSON.stringify(preferences))
            window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { role, email } }))
        }
    } catch {
        /* ignore storage error */
    }
}

/**
 * Toggles a module's pinned state.
 */
export const togglePinModule = (role, email, moduleId, baseLinks = []) => {
    const current = getNavigationPreferences(role, email, baseLinks)
    const targetId = String(moduleId)
    const exists = current.pinnedIds.includes(targetId)

    const updated = {
        ...current,
        pinnedIds: exists
            ? current.pinnedIds.filter((id) => id !== targetId)
            : [...current.pinnedIds, targetId],
    }

    saveNavigationPreferences(role, email, updated)
    return !exists
}

/**
 * Reorders a module within a group or moves it between groups.
 */
export const moveOrReorderModule = (
    role,
    email,
    { sourceGroupId, targetGroupId, moduleId, targetIndex = 0 },
    baseLinks = []
) => {
    const current = getNavigationPreferences(role, email, baseLinks)
    const mid = String(moduleId)

    // Locate source group containing the module if not accurately provided
    const realSourceGroupId = current.groups.find((g) => g.id === sourceGroupId && g.moduleIds.includes(mid))
        ? sourceGroupId
        : current.groups.find((g) => g.moduleIds.includes(mid))?.id || sourceGroupId

    const nextGroups = current.groups.map((group) => {
        // If moving out of source group
        if (group.id === realSourceGroupId && realSourceGroupId !== targetGroupId) {
            return {
                ...group,
                moduleIds: group.moduleIds.filter((id) => id !== mid),
            }
        }

        // If inserting into target group
        if (group.id === targetGroupId) {
            const filtered = group.moduleIds.filter((id) => id !== mid)
            const insertAt = Math.max(0, Math.min(targetIndex, filtered.length))
            const updated = [...filtered]
            updated.splice(insertAt, 0, mid)
            return {
                ...group,
                moduleIds: updated,
            }
        }

        return group
    })

    const updated = {
        ...current,
        groups: nextGroups,
    }

    saveNavigationPreferences(role, email, updated)
    return updated
}

/**
 * Creates a new custom navigation group.
 */
export const createCustomGroup = (role, email, groupLabel, baseLinks = []) => {
    const label = String(groupLabel || '').trim()
    if (!label) return null

    const current = getNavigationPreferences(role, email, baseLinks)
    const newId = `custom-group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newGroup = {
        id: newId,
        label,
        isCustom: true,
        moduleIds: [],
    }

    const updated = {
        ...current,
        groups: [...current.groups, newGroup],
    }

    saveNavigationPreferences(role, email, updated)
    return newGroup
}

/**
 * Renames an existing navigation group.
 */
export const renameCustomGroup = (role, email, groupId, newLabel, baseLinks = []) => {
    const label = String(newLabel || '').trim()
    if (!label) return false

    const current = getNavigationPreferences(role, email, baseLinks)
    const updated = {
        ...current,
        groups: current.groups.map((g) => (g.id === groupId ? { ...g, label } : g)),
    }

    saveNavigationPreferences(role, email, updated)
    return true
}

/**
 * Deletes a custom navigation group, reassigning its modules to the first available group or 'department'.
 */
export const deleteCustomGroup = (role, email, groupId, baseLinks = []) => {
    const current = getNavigationPreferences(role, email, baseLinks)
    const groupToDelete = current.groups.find((g) => g.id === groupId)
    if (!groupToDelete) return false

    const remainingGroups = current.groups.filter((g) => g.id !== groupId)
    if (remainingGroups.length === 0) return false

    // Reassign orphaned modules to the first group
    const orphanIds = groupToDelete.moduleIds || []
    if (orphanIds.length > 0) {
        remainingGroups[0] = {
            ...remainingGroups[0],
            moduleIds: [...remainingGroups[0].moduleIds, ...orphanIds],
        }
    }

    const updated = {
        ...current,
        groups: remainingGroups,
    }

    saveNavigationPreferences(role, email, updated)
    return true
}

/**
 * Resets preferences to factory defaults for the user.
 */
export const resetNavigationPreferences = (role, email, baseLinks = []) => {
    const key = getStorageKey(role, email)
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key)
            window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { role, email } }))
        }
    } catch {
        /* ignore */
    }
    return buildDefaultPreferences(baseLinks)
}

/**
 * Listens for navigation customization events.
 */
export const subscribeNavigationChange = (callback) => {
    if (typeof window === 'undefined') return () => {}
    const handler = (e) => callback?.(e.detail)
    window.addEventListener(EVENT_NAME, handler)
    window.addEventListener('schoolerp_rbac_permissions_updated', handler)
    return () => {
        window.removeEventListener(EVENT_NAME, handler)
        window.removeEventListener('schoolerp_rbac_permissions_updated', handler)
    }
}
