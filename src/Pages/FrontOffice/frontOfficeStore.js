import {
    canUseFrontOfficeApi,
    createFrontOfficeRecordApi,
    decideFrontOfficeRecordApi,
    deleteFrontOfficeRecordApi,
    listFrontOfficeRecordsApi,
    updateFrontOfficeRecordApi,
} from '../../services/frontOfficeApi'

/** In-memory cache per collection when the Front Office API is on. */
const caches = new Map()

export const frontOfficeApiOn = () => canUseFrontOfficeApi()

export const hydrateFrontOfficeCollection = async (collection) => {
    const rows = await listFrontOfficeRecordsApi(collection)
    caches.set(collection, Array.isArray(rows) ? rows : [])
    return caches.get(collection)
}

export const peekFrontOfficeCollection = (collection) => [...(caches.get(collection) || [])]

export const createFrontOfficeItem = async (collection, body) => {
    const row = await createFrontOfficeRecordApi(collection, body)
    const list = peekFrontOfficeCollection(collection)
    caches.set(collection, [row, ...list.filter((item) => item.id !== row.id)])
    return row
}

export const updateFrontOfficeItem = async (collection, id, body) => {
    const row = await updateFrontOfficeRecordApi(collection, id, body)
    const list = peekFrontOfficeCollection(collection)
    caches.set(
        collection,
        list.some((item) => item.id === id)
            ? list.map((item) => (item.id === id ? row : item))
            : [row, ...list],
    )
    return row
}

export const decideFrontOfficeItem = async (collection, id, decision) => {
    const row = await decideFrontOfficeRecordApi(collection, id, decision)
    const list = peekFrontOfficeCollection(collection)
    caches.set(
        collection,
        list.some((item) => item.id === id)
            ? list.map((item) => (item.id === id ? row : item))
            : [row, ...list],
    )
    return row
}

export const deleteFrontOfficeItem = async (collection, id) => {
    await deleteFrontOfficeRecordApi(collection, id)
    caches.set(
        collection,
        peekFrontOfficeCollection(collection).filter((item) => item.id !== id),
    )
}
