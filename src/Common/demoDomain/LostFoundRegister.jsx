import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { canUseOpsApi } from '../../services/opsApi'
import { uploadProfileImage } from '../../services/filesApi'
import {
    claimLostFoundApi,
    createLostFoundApi,
    decideLostFoundDisposalApi,
    handoverLostFoundApi,
    listLostFoundApi,
    requestLostFoundDisposalApi,
} from '../../services/opsWorkflowsApi'

/** Shared Lost & Found register (Housekeeping, Front Office, Admin, Principal). Roles are enforced by the server. */

const STATUSES = ['Found', 'Claimed', 'Handed Over', 'Disposal Requested', 'Disposed']
const CLAIMANT_TYPES = ['Student', 'Parent', 'Staff', 'Visitor', 'Other']

const statusBadge = {
    Found: 'bg-[#FF980033] text-[#FF9800]',
    Claimed: 'bg-[#2196F333] text-[#2196F3]',
    'Handed Over': 'bg-[#4CAF5033] text-[#4CAF50]',
    'Disposal Requested': 'bg-[#7C3AED33] text-[#7C3AED]',
    Disposed: 'bg-[#66708533] text-[#667085]',
}

const inputClass = 'text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
const labelClass = 'text-sm font-medium text-[#808080]'
const primaryBtn = 'bg-[#515DEF] text-white text-sm px-6 py-2 rounded-lg cursor-pointer disabled:opacity-60'
const secondaryBtn = 'bg-white text-[#515DEF] text-sm px-6 py-2 rounded-lg border border-[#515DEF] cursor-pointer'

const today = () => new Date().toISOString().slice(0, 10)
const formatStamp = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString('en-GB')
}

const FORMS = {
    record: {
        title: 'Record Found Item',
        submit: 'Save Item',
        fields: [
            { key: 'item', label: 'Item', placeholder: 'e.g. Blue water bottle' },
            { key: 'description', label: 'Description', type: 'textarea', required: true },
            { key: 'foundLocation', label: 'Found Location', required: true },
            { key: 'foundDate', label: 'Found Date', type: 'date', required: true },
            { key: 'foundBy', label: 'Found By', required: true },
            { key: 'photo', label: 'Photo (optional)', type: 'file' },
        ],
        initial: () => ({ foundDate: today() }),
    },
    claim: {
        title: 'Record Claim',
        submit: 'Record Claim',
        fields: [
            { key: 'claimantName', label: 'Claimant Name', required: true },
            { key: 'claimantType', label: 'Claimant Type', type: 'select', options: CLAIMANT_TYPES },
            { key: 'claimantIdentity', label: 'Identity (class / admission no. / staff ID / ID proof)' },
            { key: 'claimantContact', label: 'Contact', required: true },
            { key: 'proofNote', label: 'Proof of Ownership', type: 'textarea', required: true },
        ],
        initial: () => ({ claimantType: 'Student' }),
    },
    handover: {
        title: 'Hand Over Item',
        submit: 'Confirm Handover',
        fields: [
            { key: 'handedTo', label: 'Handed To', required: true },
            { key: 'handoverNote', label: 'Note', type: 'textarea' },
        ],
        initial: (item) => ({ handedTo: item?.claimantName || '' }),
    },
    disposal: {
        title: 'Request Disposal',
        submit: 'Send to Principal',
        fields: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true }],
        initial: () => ({}),
    },
    refuse: {
        title: 'Refuse Disposal',
        submit: 'Refuse',
        fields: [{ key: 'remark', label: 'Remark', type: 'textarea', required: true }],
        initial: () => ({}),
    },
}

function ActionModal({ kind, item, onClose, onDone }) {
    const config = FORMS[kind]
    const [form, setForm] = useState(() => config.initial(item))
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const submit = async (event) => {
        event.preventDefault()
        const missing = config.fields.find((field) => field.required && !String(form[field.key] || '').trim())
        if (missing) {
            setError(`${missing.label} is required.`)
            return
        }
        setSaving(true)
        setError('')
        try {
            let saved
            if (kind === 'record') {
                const { photo, ...rest } = form
                let photoFileId = ''
                if (photo) {
                    const asset = await uploadProfileImage(photo, 'lost-found')
                    photoFileId = asset?.id || ''
                }
                saved = await createLostFoundApi({ ...rest, photoFileId })
            } else if (kind === 'claim') {
                saved = await claimLostFoundApi(item.id, form)
            } else if (kind === 'handover') {
                saved = await handoverLostFoundApi(item.id, form)
            } else if (kind === 'disposal') {
                saved = await requestLostFoundDisposalApi(item.id, form)
            } else if (kind === 'refuse') {
                saved = await decideLostFoundDisposalApi(item.id, { decision: 'reject', remark: form.remark })
            }
            onDone(saved, `${config.title}: saved (${saved?.id || item?.id}).`)
        } catch (err) {
            setError(err?.message || 'The server did not accept this change.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <form onSubmit={submit} className="bg-white rounded-2xl shadow-md p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-black">{config.title}</h3>
                {item && <p className="text-sm text-[#667085] mt-1">{item.id} · {item.item}</p>}
                <div className="flex flex-col gap-y-4 mt-4">
                    {config.fields.map((field) => (
                        <div key={field.key} className="flex flex-col gap-y-1">
                            <label className={labelClass}>
                                {field.label}{field.required ? ' *' : ''}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    rows={3}
                                    className={inputClass}
                                    value={form[field.key] || ''}
                                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    className={inputClass}
                                    value={form[field.key] || ''}
                                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                >
                                    {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            ) : field.type === 'file' ? (
                                <input
                                    type="file"
                                    accept="image/*"
                                    className={inputClass}
                                    onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })}
                                />
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    max={field.type === 'date' ? today() : undefined}
                                    placeholder={field.placeholder}
                                    className={inputClass}
                                    value={form[field.key] || ''}
                                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                />
                            )}
                        </div>
                    ))}
                </div>
                {error && <p className="text-sm text-[#F44336] mt-3">{error}</p>}
                <div className="flex justify-end gap-x-3 mt-6">
                    <button type="button" className={secondaryBtn} onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className={primaryBtn} disabled={saving}>
                        {saving ? 'Saving…' : config.submit}
                    </button>
                </div>
            </form>
        </div>
    )
}

function ItemDetails({ item, onClose }) {
    const rows = [
        ['Description', item.description],
        ['Found Location', item.foundLocation],
        ['Found Date', item.foundDate],
        ['Found By', item.foundBy],
        ['Recorded By', `${item.recordedByName || item.recordedByEmail || '—'} (${item.recordedByRole || '—'})`],
        ['Photo', item.photoFileId ? 'Attached' : '—'],
        ['Claimant', item.claimantName ? `${item.claimantName} (${item.claimantType || '—'})` : '—'],
        ['Claimant Identity', item.claimantIdentity],
        ['Claimant Contact', item.claimantContact],
        ['Proof', item.proofNote],
        ['Handed To', item.handedTo],
        ['Handed Over By', item.handedOverByName || item.handedOverByEmail],
        ['Handed Over At', item.handedOverAt ? formatStamp(item.handedOverAt) : ''],
        ['Disposal Reason', item.disposalReason],
        ['Disposal Decision', item.disposalDecision ? `${item.disposalDecision} by ${item.disposalDecidedByName || '—'}` : ''],
    ].filter(([, value]) => value)
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-black">{item.id} · {item.item}</h3>
                        <span className={`inline-block mt-1 px-2 py-1 rounded-lg text-xs font-semibold ${statusBadge[item.status] || ''}`}>{item.status}</span>
                    </div>
                    <button type="button" className={secondaryBtn} onClick={onClose}>Close</button>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                    {rows.map(([label, value]) => (
                        <div key={label}>
                            <dt className="text-[#808080]">{label}</dt>
                            <dd className="text-[#1E1E1E] break-words">{value}</dd>
                        </div>
                    ))}
                </dl>
                <h4 className="text-base font-medium text-black mt-6 mb-2">History</h4>
                <ol className="flex flex-col gap-y-2 text-sm">
                    {(item.history || []).map((entry, index) => (
                        <li key={`${entry.at}-${index}`} className="border-l-2 border-[#515DEF] pl-3">
                            <p className="font-medium text-[#1E1E1E]">{entry.event} → {entry.toStatus}</p>
                            <p className="text-[#667085]">
                                {formatStamp(entry.at)} · {entry.byName || entry.byEmail} ({entry.byRole})
                            </p>
                            {entry.note && <p className="text-[#667085]">{entry.note}</p>}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    )
}

const LostFoundRegister = () => {
    const api = canUseOpsApi()
    const [items, setItems] = useState([])
    const [permissions, setPermissions] = useState({})
    const [loading, setLoading] = useState(api)
    const [loadError, setLoadError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [modal, setModal] = useState(null)
    const [viewing, setViewing] = useState(null)
    const [busyId, setBusyId] = useState('')

    const refresh = useCallback(async () => {
        if (!api) return
        setLoading(true)
        setLoadError('')
        try {
            const result = await listLostFoundApi()
            setItems(Array.isArray(result?.items) ? result.items : [])
            setPermissions(result?.permissions || {})
        } catch (err) {
            setLoadError(err?.message || 'The Lost & Found register could not be loaded.')
        } finally {
            setLoading(false)
        }
    }, [api])

    useEffect(() => {
        refresh()
    }, [refresh])

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        return items.filter((row) => {
            if (statusFilter && row.status !== statusFilter) return false
            if (!query) return true
            return [row.id, row.item, row.description, row.foundLocation, row.foundBy, row.claimantName]
                .join(' ')
                .toLowerCase()
                .includes(query)
        })
    }, [items, search, statusFilter])

    const applySaved = (saved, message) => {
        setModal(null)
        if (saved?.id) {
            setItems((rows) => [saved, ...rows.filter((row) => row.id !== saved.id)])
        }
        toast.success(message)
        refresh()
    }

    const approveDisposal = async (item) => {
        if (!window.confirm(`Approve disposal of ${item.id} (${item.item})?`)) return
        setBusyId(item.id)
        try {
            const saved = await decideLostFoundDisposalApi(item.id, { decision: 'approve', remark: '' })
            applySaved(saved, `Disposal of ${item.id} approved.`)
        } catch (err) {
            toast.error(err?.message || 'Disposal decision failed.')
        } finally {
            setBusyId('')
        }
    }

    if (!api) {
        return (
            <section className="bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]">
                Sign in through the API to use the Lost &amp; Found register.
            </section>
        )
    }

    return (
        <section>
            <div className="bg-white rounded-2xl shadow-md p-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <h2 className="text-xl font-semibold text-black">Lost &amp; Found</h2>
                    {permissions.canRecord && (
                        <button type="button" className={primaryBtn} onClick={() => setModal({ kind: 'record' })}>
                            Record Found Item
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <div className="flex flex-col gap-y-2">
                        <label className={labelClass}>Search</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ID, item, location, claimant..."
                            className={inputClass}
                        />
                    </div>
                    <div className="flex flex-col gap-y-2">
                        <label className={labelClass}>Status</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
                            <option value="">All</option>
                            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-4 mt-8">
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5]">
                            <tr>
                                {['ID', 'Item', 'Found Location', 'Found Date', 'Found By', 'Status', 'Actions'].map((label) => (
                                    <th key={label} className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">{label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && items.length === 0 ? (
                                <tr><td colSpan={7} className="px-2 py-8 text-center text-[#667085]">Loading Lost &amp; Found…</td></tr>
                            ) : loadError ? (
                                <tr>
                                    <td colSpan={7} className="px-2 py-8 text-center text-[#F44336]">
                                        {loadError}{' '}
                                        <button type="button" className="underline text-[#515DEF]" onClick={refresh}>Retry</button>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-2 py-8 text-center text-[#667085]">
                                        {items.length === 0 ? 'No found items recorded yet.' : 'No items match these filters.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.id} className="border-b border-[#f2f4f7] text-[#667085]">
                                        <td className="px-2 py-4 font-medium text-[#1E1E1E]">{row.id}</td>
                                        <td className="px-2 py-4 max-w-[220px] truncate" title={row.description}>{row.item}</td>
                                        <td className="px-2 py-4">{row.foundLocation}</td>
                                        <td className="px-2 py-4">{row.foundDate}</td>
                                        <td className="px-2 py-4">{row.foundBy}</td>
                                        <td className="px-2 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadge[row.status] || ''}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-2 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <button type="button" className="text-[#515DEF] underline" onClick={() => setViewing(row)}>View</button>
                                                {row.status === 'Found' && permissions.canClaim && (
                                                    <button type="button" className="text-[#515DEF] underline" onClick={() => setModal({ kind: 'claim', item: row })}>Claim</button>
                                                )}
                                                {row.status === 'Claimed' && permissions.canHandover && (
                                                    <button type="button" className="text-[#515DEF] underline" onClick={() => setModal({ kind: 'handover', item: row })}>Hand Over</button>
                                                )}
                                                {row.status === 'Found' && permissions.canRequestDisposal && (
                                                    <button type="button" className="text-[#515DEF] underline" onClick={() => setModal({ kind: 'disposal', item: row })}>Request Disposal</button>
                                                )}
                                                {row.status === 'Disposal Requested' && permissions.canDecideDisposal && (
                                                    <>
                                                        <button type="button" disabled={busyId === row.id} className="text-[#4CAF50] underline" onClick={() => approveDisposal(row)}>Approve Disposal</button>
                                                        <button type="button" disabled={busyId === row.id} className="text-[#F44336] underline" onClick={() => setModal({ kind: 'refuse', item: row })}>Refuse</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <p className="text-sm font-medium text-[#515DEF] mt-4">Showing {filtered.length} of {items.length} entries</p>
            </div>

            {modal && (
                <ActionModal kind={modal.kind} item={modal.item} onClose={() => setModal(null)} onDone={applySaved} />
            )}
            {viewing && <ItemDetails item={viewing} onClose={() => setViewing(null)} />}
        </section>
    )
}

export default LostFoundRegister
