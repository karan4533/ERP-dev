import { useCallback, useEffect, useState } from 'react'
import {
    getCampusMemory,
    hydrateCampusKey,
    persistCampusJson,
    usesCampusApiForKey,
} from '../../services/campusJsonStore'

/**
 * Hydrate + mutate a campus ops JSON collection keyed by localStorage/API registry key.
 * API mode never injects demo seed rows.
 */
export const useOpsCollection = (storageKey) => {
    const [rows, setRows] = useState(() => getCampusMemory(storageKey) ?? [])
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState('')

    const refresh = useCallback(async () => {
        setStatus('loading')
        setError('')
        try {
            if (usesCampusApiForKey(storageKey)) {
                const ok = await hydrateCampusKey(storageKey, [])
                const next = getCampusMemory(storageKey) ?? []
                setRows(Array.isArray(next) ? next : [])
                if (!ok && !(getCampusMemory(storageKey) ?? []).length) {
                    setError('Could not load records from the server.')
                    setStatus('error')
                    return
                }
            } else {
                setRows([])
            }
            setStatus('ready')
        } catch (err) {
            setError(err?.message || 'Could not load records.')
            setStatus('error')
        }
    }, [storageKey])

    useEffect(() => {
        refresh()
    }, [refresh])

    const replaceAll = useCallback(
        async (nextRows) => {
            const list = Array.isArray(nextRows) ? nextRows : []
            setRows(list)
            const saved = await persistCampusJson(storageKey, list)
            if (!saved) {
                setError('Could not save changes to the server.')
                return false
            }
            setError('')
            return true
        },
        [storageKey],
    )

    const upsert = useCallback(
        async (row) => {
            if (!row?.id) return false
            const next = [...rows]
            const index = next.findIndex((item) => String(item.id) === String(row.id))
            if (index >= 0) next[index] = row
            else next.unshift(row)
            return replaceAll(next)
        },
        [rows, replaceAll],
    )

    return { rows, status, error, refresh, replaceAll, upsert, setError }
}

export const nextCollectionId = (rows, prefix) => {
    const nums = (rows || [])
        .map((row) => Number(String(row.id ?? '').replace(/\D/g, '')))
        .filter((n) => Number.isFinite(n))
    const max = nums.length ? Math.max(...nums) : 1000
    return `${prefix}-${max + 1}`
}
