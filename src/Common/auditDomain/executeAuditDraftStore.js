/**
 * Execute-audit drafts are stored as a JSON array of draft records so campus-audit
 * replace APIs (array-only) and localStorage stay compatible.
 *
 * Legacy single-object drafts are still accepted on load.
 */

export const draftRecordId = (draft) => {
    const header = draft?.header ?? {}
    return String(
        draft?.id ||
            header.auditId ||
            header.auditNumber ||
            draft?.auditId ||
            'default-draft',
    ).trim()
}

/** Normalize stored value (array | object | JSON string | null) → draft list. */
export const normalizeDraftList = (stored) => {
    if (stored == null) return []

    let value = stored
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value)
        } catch {
            return []
        }
    }

    if (Array.isArray(value)) {
        return value.filter((row) => row && typeof row === 'object')
    }

    if (value && typeof value === 'object') {
        return [{ ...value, id: draftRecordId(value) }]
    }

    return []
}

export const findDraftInStore = (stored, auditId) => {
    const list = normalizeDraftList(stored)
    if (!list.length) return null

    if (!auditId) {
        return list[0] ?? null
    }

    const target = String(auditId)
    return (
        list.find((row) => {
            const header = row.header ?? {}
            return (
                String(row.id) === target ||
                String(header.auditId ?? '') === target ||
                String(header.auditNumber ?? '') === target
            )
        }) ?? null
    )
}

export const upsertDraftInStore = (stored, draft) => {
    const id = draftRecordId(draft)
    const payload = { ...draft, id }
    const list = normalizeDraftList(stored)
    const next = [payload, ...list.filter((row) => draftRecordId(row) !== id)]
    return { list: next, payload }
}

/** Coerce a non-array campus payload into an array of objects with ids. */
export const coerceCampusRows = (rows) => {
    if (Array.isArray(rows)) return rows
    if (rows && typeof rows === 'object') {
        const id =
            String(rows.id || rows.itemId || rows.requestId || rows.header?.auditId || rows.header?.auditNumber || '').trim() ||
            'draft'
        return [{ ...rows, id: rows.id || id }]
    }
    return []
}
