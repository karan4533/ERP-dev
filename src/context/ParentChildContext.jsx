import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { ROLES, useAuth } from './AuthContext'
import { isApiAuthEnabled } from '../services/apiClient'
import { listMyChildrenApi } from '../services/parentsApi'
import { getParentByEmail } from '../Pages/Parent/parentData'
import {
    getMappedStudentsForParent,
    getStudentProfileById,
    isStudentMappedToParent,
} from '../Pages/Parent/parentStudentMappingData'

const STORAGE_PREFIX = 'schoolerp_parent_active_child'

const ParentChildContext = createContext(null)

const readStoredChildId = (parentId) => {
    try {
        return sessionStorage.getItem(`${STORAGE_PREFIX}_${parentId}`)
    } catch {
        return null
    }
}

const writeStoredChildId = (parentId, studentId) => {
    try {
        if (studentId) {
            sessionStorage.setItem(`${STORAGE_PREFIX}_${parentId}`, studentId)
        } else {
            sessionStorage.removeItem(`${STORAGE_PREFIX}_${parentId}`)
        }
    } catch {
        /* ignore */
    }
}

export const ParentChildProvider = ({ children }) => {
    const { role, email, name } = useAuth()
    const apiParent = isApiAuthEnabled() && role === ROLES.PARENT

    const localParentAccount = useMemo(() => {
        if (apiParent || role !== ROLES.PARENT || !email) return null
        return getParentByEmail(email)
    }, [apiParent, role, email])

    const parentAccount = useMemo(() => {
        if (role !== ROLES.PARENT || !email) return null
        if (apiParent) {
            return {
                id: email,
                email,
                name: name || email.split('@')[0] || 'Parent',
                source: 'api',
            }
        }
        return localParentAccount
    }, [apiParent, role, email, name, localParentAccount])

    const [activeStudentId, setActiveStudentId] = useState(null)
    const [apiChildren, setApiChildren] = useState([])
    const [initialized, setInitialized] = useState(false)
    const [loadError, setLoadError] = useState(null)

    const localMappedChildren = useMemo(
        () => (localParentAccount ? getMappedStudentsForParent(localParentAccount.id) : []),
        [localParentAccount],
    )

    const mappedChildren = apiParent ? apiChildren : localMappedChildren

    useEffect(() => {
        let cancelled = false

        if (role !== ROLES.PARENT) {
            setActiveStudentId(null)
            setApiChildren([])
            setLoadError(null)
            setInitialized(true)
            return undefined
        }

        if (apiParent) {
            setInitialized(false)
            setLoadError(null)
            listMyChildrenApi()
                .then((rows) => {
                    if (cancelled) return
                    setApiChildren(rows)
                    const parentKey = email
                    const storedId = readStoredChildId(parentKey)
                    const ids = new Set(rows.map((row) => String(row.id)))
                    if (storedId && ids.has(String(storedId))) {
                        setActiveStudentId(String(storedId))
                    } else if (rows.length === 1) {
                        setActiveStudentId(String(rows[0].id))
                        writeStoredChildId(parentKey, rows[0].id)
                    } else {
                        setActiveStudentId(null)
                    }
                    setInitialized(true)
                })
                .catch((error) => {
                    if (cancelled) return
                    console.error(error)
                    setApiChildren([])
                    setActiveStudentId(null)
                    setLoadError(error?.message || 'Could not load children from API.')
                    setInitialized(true)
                })
            return () => {
                cancelled = true
            }
        }

        if (!localParentAccount) {
            setActiveStudentId(null)
            setInitialized(true)
            return undefined
        }

        const storedId = readStoredChildId(localParentAccount.id)
        if (storedId && isStudentMappedToParent(localParentAccount.id, storedId)) {
            setActiveStudentId(storedId)
        } else if (localMappedChildren.length === 1) {
            setActiveStudentId(localMappedChildren[0].id)
            writeStoredChildId(localParentAccount.id, localMappedChildren[0].id)
        } else {
            setActiveStudentId(null)
        }
        setInitialized(true)
        return undefined
    }, [role, apiParent, email, localParentAccount, localMappedChildren])

    const selectChild = useCallback(
        (studentId) => {
            if (!parentAccount) return false
            const allowed = mappedChildren.some((child) => String(child.id) === String(studentId))
            if (!allowed) return false

            setActiveStudentId(String(studentId))
            writeStoredChildId(parentAccount.id, studentId)
            return true
        },
        [parentAccount, mappedChildren],
    )

    const clearActiveChild = useCallback(() => {
        if (!parentAccount) return
        setActiveStudentId(null)
        writeStoredChildId(parentAccount.id, null)
    }, [parentAccount])

    const activeStudent = useMemo(() => {
        if (!activeStudentId) return null
        const fromApi = mappedChildren.find((child) => String(child.id) === String(activeStudentId))
        if (fromApi) return fromApi
        return getStudentProfileById(activeStudentId)
    }, [activeStudentId, mappedChildren])

    const value = useMemo(
        () => ({
            parentAccount,
            mappedChildren,
            activeStudentId,
            activeStudent,
            selectChild,
            clearActiveChild,
            initialized,
            loadError,
            hasMultipleChildren: mappedChildren.length > 1,
        }),
        [
            parentAccount,
            mappedChildren,
            activeStudentId,
            activeStudent,
            selectChild,
            clearActiveChild,
            initialized,
            loadError,
        ],
    )

    return (
        <ParentChildContext.Provider value={value}>
            {children}
        </ParentChildContext.Provider>
    )
}

export const useParentChild = () => {
    const context = useContext(ParentChildContext)
    if (!context) {
        throw new Error('useParentChild must be used within ParentChildProvider')
    }
    return context
}

export const useOptionalParentChild = () => useContext(ParentChildContext)
