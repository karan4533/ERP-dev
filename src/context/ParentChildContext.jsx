import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { ROLES, useAuth } from './AuthContext'
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
    const { role, email } = useAuth()
    const parentAccount = useMemo(() => {
        if (role !== ROLES.PARENT || !email) return null
        return getParentByEmail(email)
    }, [role, email])

    const [activeStudentId, setActiveStudentId] = useState(null)
    const [initialized, setInitialized] = useState(false)

    const mappedChildren = useMemo(
        () => (parentAccount ? getMappedStudentsForParent(parentAccount.id) : []),
        [parentAccount],
    )

    useEffect(() => {
        if (role !== ROLES.PARENT) {
            setActiveStudentId(null)
            setInitialized(true)
            return
        }

        if (!parentAccount) {
            setActiveStudentId(null)
            setInitialized(true)
            return
        }

        const storedId = readStoredChildId(parentAccount.id)
        if (storedId && isStudentMappedToParent(parentAccount.id, storedId)) {
            setActiveStudentId(storedId)
        } else if (mappedChildren.length === 1) {
            setActiveStudentId(mappedChildren[0].id)
            writeStoredChildId(parentAccount.id, mappedChildren[0].id)
        } else {
            setActiveStudentId(null)
        }

        setInitialized(true)
    }, [role, parentAccount, mappedChildren])

    const selectChild = useCallback(
        (studentId) => {
            if (!parentAccount) return false
            if (!isStudentMappedToParent(parentAccount.id, studentId)) return false

            setActiveStudentId(studentId)
            writeStoredChildId(parentAccount.id, studentId)
            return true
        },
        [parentAccount],
    )

    const clearActiveChild = useCallback(() => {
        if (!parentAccount) return
        setActiveStudentId(null)
        writeStoredChildId(parentAccount.id, null)
    }, [parentAccount])

    const activeStudent = useMemo(() => {
        if (!activeStudentId) return null
        return getStudentProfileById(activeStudentId)
    }, [activeStudentId])

    const value = useMemo(
        () => ({
            parentAccount,
            mappedChildren,
            activeStudentId,
            activeStudent,
            selectChild,
            clearActiveChild,
            initialized,
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
