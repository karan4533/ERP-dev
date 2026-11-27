import { useMemo, useState } from 'react'
import { paginateRows } from './listPagination'

/**
 * Page state for a filtered list. Pass `resetKey` (e.g. the joined filter values)
 * to jump back to page 1 whenever the filters change.
 */
export const useListPagination = (rows, { initialPageSize = 10, resetKey = '' } = {}) => {
    const [page, setPage] = useState(1)
    const [pageSize, setPageSizeState] = useState(initialPageSize)
    const [lastResetKey, setLastResetKey] = useState(resetKey)

    if (lastResetKey !== resetKey) {
        setLastResetKey(resetKey)
        setPage(1)
    }

    const result = useMemo(() => paginateRows(rows, page, pageSize), [rows, page, pageSize])

    const setPageSize = (value) => {
        setPageSizeState(Number(value) || initialPageSize)
        setPage(1)
    }

    return { ...result, setPage, setPageSize }
}
