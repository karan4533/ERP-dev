import { useCallback, useEffect, useState } from 'react'
import {
    CLASS_CATALOG_UPDATED_EVENT,
    getClasses,
    getSections,
    getSectionsForClass,
} from './academicsCatalogData'
import {
    canUseClassDetailsApi,
    ensureClassCatalogHydrated,
    refreshClassCatalog,
} from '../../services/classDetailsApi'

const readSnapshot = (className = '') => ({
    classes: getClasses(),
    sections: className ? getSectionsForClass(className) : getSections(),
    allSections: getSections(),
})

/**
 * Keeps class/section dropdowns in sync with Admin Class Details for every role.
 * Hydrates from `/masters` in API mode and re-reads when the catalog mirror updates.
 * On API failure: status=`error` and empty options — never silent A/B/C fallbacks.
 */
export const useClassCatalogOptions = (selectedClassName = '') => {
    const [snapshot, setSnapshot] = useState(() => readSnapshot(selectedClassName))
    const [status, setStatus] = useState(() => (canUseClassDetailsApi() ? 'loading' : 'idle'))
    const [error, setError] = useState('')
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        const refresh = () => setSnapshot(readSnapshot(selectedClassName))
        refresh()
        window.addEventListener(CLASS_CATALOG_UPDATED_EVENT, refresh)
        return () => window.removeEventListener(CLASS_CATALOG_UPDATED_EVENT, refresh)
    }, [selectedClassName])

    useEffect(() => {
        if (!canUseClassDetailsApi()) {
            setStatus('idle')
            setError('')
            return undefined
        }
        let cancelled = false
        setStatus('loading')
        setError('')
        const loader = reloadKey === 0 ? ensureClassCatalogHydrated() : refreshClassCatalog()
        loader
            .then((result) => {
                if (cancelled) return
                setSnapshot(readSnapshot(selectedClassName))
                if (!result) {
                    setStatus('error')
                    setError('Could not load classes and sections from the server.')
                    return
                }
                setStatus('ready')
            })
            .catch((err) => {
                if (cancelled) return
                setStatus('error')
                setError(err?.message || 'Could not load classes and sections from the server.')
            })
        return () => {
            cancelled = true
        }
        // selectedClassName handled by the snapshot listener; reloadKey triggers a fresh fetch.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey])

    const reload = useCallback(() => setReloadKey((value) => value + 1), [])

    return {
        classes: snapshot.classes,
        sections: snapshot.sections,
        allSections: snapshot.allSections,
        status,
        error,
        reload,
        sectionsFor: getSectionsForClass,
    }
}
