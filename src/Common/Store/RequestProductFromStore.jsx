import React, { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import {
    ensureCampusSeed,
    getCampusLoadState,
    hydrateCampusKey,
    persistCampusJsonItem,
    usesCampusApiForKey,
} from '../../services/campusJsonStore'
import { createStationeryRequestApi } from '../../services/opsApi'
import { nextSerial } from '../demoDomain/storage'

const newSubmissionKey = () =>
    (globalThis.crypto?.randomUUID?.() || `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`)

export const STORE_PRODUCT_REQUESTS_KEY = 'schoolerp-stationery-requests-v1'

const STATUS_OPTIONS = ['Pending', 'Approved', 'Issued', 'Rejected']

/**
 * Shared "Request Product from Store" for authorized department roles.
 * Persists into stationery-requests (same SoT Store Reviews & Approvals use).
 */
export default function RequestProductFromStore({
    department = 'General',
    requestedBy = 'Staff',
    title = 'Request Product from Store',
    description = 'Raise a product request to Store. Store Officer reviews and issues stock (JD/Finance for purchases separately).',
    readOnly = false,
}) {
    const [rows, setRows] = useState([])
    const [item, setItem] = useState('')
    const [quantity, setQuantity] = useState('1')
    const [remarks, setRemarks] = useState('')
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState(false)
    const savingRef = useRef(false)
    // One key per filled form: a double click or retry after a timeout cannot create a second request.
    const [submissionKey, setSubmissionKey] = useState(newSubmissionKey)
    const [loadState, setLoadState] = useState(() => getCampusLoadState(STORE_PRODUCT_REQUESTS_KEY))
    const apiMode = usesCampusApiForKey(STORE_PRODUCT_REQUESTS_KEY)

    const refresh = () => {
        setRows(ensureCampusSeed(STORE_PRODUCT_REQUESTS_KEY, []))
        setLoadState(getCampusLoadState(STORE_PRODUCT_REQUESTS_KEY))
    }

    useEffect(() => {
        let active = true
        const hydrate = usesCampusApiForKey(STORE_PRODUCT_REQUESTS_KEY)
            ? hydrateCampusKey(STORE_PRODUCT_REQUESTS_KEY, [])
            : Promise.resolve(false)
        hydrate.finally(() => {
            if (active) refresh()
        })
        return () => { active = false }
    }, [])

    const loading = loadState.api && (loadState.status === 'idle' || loadState.status === 'loading')
    const loadFailed = loadState.api && loadState.status === 'failed'

    const mine = useMemo(() => {
        const q = search.trim().toLowerCase()
        return rows.filter((row) => {
            const deptMatch = !department || row.department === department || row.department === 'Stationery Store'
            const mineMatch = String(row.requestedBy || '').toLowerCase().includes(String(requestedBy).toLowerCase())
                || String(row.department || '') === department
            if (!(deptMatch || mineMatch)) return false
            if (!q) return true
            return [row.requestId, row.title, row.item, row.status, row.department]
                .some((value) => String(value || '').toLowerCase().includes(q))
        })
    }, [rows, department, requestedBy, search])

    const submit = async (event) => {
        event.preventDefault()
        // A second click can arrive before the disabled button re-renders.
        if (readOnly || savingRef.current) return
        if (!item.trim()) {
            toast.error('Item is required.')
            return
        }
        const qty = Number(quantity)
        if (!Number.isFinite(qty) || qty <= 0) {
            toast.error('Quantity must be a positive number.')
            return
        }
        savingRef.current = true
        setSaving(true)
        try {
            const draft = {
                requestType: 'Product Request',
                title: item.trim(),
                item: item.trim(),
                quantity: qty,
                amount: '',
                vendor: '',
                submittedDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
                priority: 'Medium',
                description: remarks.trim() || `Product request from ${department}`,
                requestedBy,
                sentTo: 'Store Officer',
                lineItems: [{ item: item.trim(), quantity: qty, estimatedCost: '' }],
            }
            if (apiMode) {
                // Server assigns the request number, department and requester; status always starts Pending.
                const saved = await createStationeryRequestApi({ ...draft, clientRequestId: submissionKey })
                await hydrateCampusKey(STORE_PRODUCT_REQUESTS_KEY, [])
                refresh()
                toast.success(saved?.requestId ? `Product request ${saved.requestId} sent to Store.` : 'Product request sent to Store.')
            } else {
                // Offline demo mode only: browser copy, clearly not a server record.
                const current = ensureCampusSeed(STORE_PRODUCT_REQUESTS_KEY, [])
                const requestId = nextSerial('REQ-ST-', current, 'requestId')
                const result = await persistCampusJsonItem(STORE_PRODUCT_REQUESTS_KEY, {
                    ...draft,
                    id: requestId,
                    requestId,
                    department,
                    status: 'Pending',
                    currentStage: 'Store Officer',
                    quantityRequested: qty,
                    createdAt: new Date().toISOString(),
                })
                if (result?.success === false) {
                    toast.error(result.message || 'Could not save request.')
                    return
                }
                refresh()
                toast.success('Product request saved in this browser (offline demo mode).')
            }
            setItem('')
            setQuantity('1')
            setRemarks('')
            setSubmissionKey(newSubmissionKey())
        } catch (error) {
            // Form values are kept so the user can retry with the same submission key.
            toast.error(error?.message || 'Could not send the request to Store.')
        } finally {
            savingRef.current = false
            setSaving(false)
        }
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>{title}</h2>
                <p className='text-sm text-[#667085] mt-1'>{description}</p>
                {!readOnly && (
                    <form onSubmit={submit} className='grid grid-cols-1 md:grid-cols-4 gap-3 mt-4'>
                        <input
                            value={item}
                            onChange={(event) => setItem(event.target.value)}
                            placeholder='Product / item name'
                            className='border border-[#D9D9D9] rounded-md px-2 py-2 text-sm md:col-span-2'
                            required
                        />
                        <input
                            type='number'
                            min='1'
                            value={quantity}
                            onChange={(event) => setQuantity(event.target.value)}
                            placeholder='Qty'
                            className='border border-[#D9D9D9] rounded-md px-2 py-2 text-sm'
                            required
                        />
                        <button
                            type='submit'
                            disabled={saving || loading || loadFailed}
                            className='bg-[#515DEF] text-white rounded-md text-sm cursor-pointer disabled:opacity-50'
                        >
                            {saving ? 'Sending…' : 'Request from Store'}
                        </button>
                        <textarea
                            value={remarks}
                            onChange={(event) => setRemarks(event.target.value)}
                            placeholder='Remarks (optional)'
                            className='border border-[#D9D9D9] rounded-md px-2 py-2 text-sm md:col-span-4 min-h-[72px]'
                        />
                    </form>
                )}
                <div className='mt-4 flex gap-2 items-end'>
                    <label className='flex flex-col gap-1 text-sm text-[#808080] flex-1'>
                        Search
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className='border border-[#D9D9D9] rounded-md px-2 py-2 text-sm'
                            placeholder='Request ID, item, status…'
                        />
                    </label>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>
                            {['Request', 'Item', 'Qty', 'Department', 'Status', 'Stage'].map((label) => (
                                <th key={label} className='px-2 py-3 text-[#0C1E5B] uppercase'>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={6} className='px-2 py-6 text-center text-[#667085]'>Loading requests…</td></tr>
                        )}
                        {loadFailed && (
                            <tr><td colSpan={6} className='px-2 py-6 text-center text-[#B42318]'>
                                Could not load store requests from the server{loadState.error ? `: ${loadState.error}` : ''}. Refresh to try again.
                            </td></tr>
                        )}
                        {!loading && !loadFailed && mine.length === 0 && (
                            <tr>
                                <td colSpan={6} className='px-2 py-6 text-center text-[#667085]'>No store product requests yet.</td>
                            </tr>
                        )}
                        {!loading && !loadFailed && mine.map((row) => (
                            <tr key={row.requestId || row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.requestId || row.id}</td>
                                <td className='px-2 py-3'>{row.item || row.title}</td>
                                <td className='px-2 py-3'>{row.quantity || row.quantityRequested || '—'}</td>
                                <td className='px-2 py-3'>{row.department || '—'}</td>
                                <td className='px-2 py-3'>
                                    {STATUS_OPTIONS.includes(row.status) ? row.status : (row.status || '—')}
                                </td>
                                <td className='px-2 py-3'>{row.currentStage || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
