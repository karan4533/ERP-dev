import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../../../Common/ui'
import { ASSET_CATEGORIES, getAssets, STATUS_OPTIONS } from './assetData'

const selectClass = 'min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm text-[var(--erp-ink)]'

const AssetManagement = () => {
    const assets = useMemo(() => getAssets(), [])
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState('')
    const [status, setStatus] = useState('')
    const filtered = useMemo(() => assets.filter((asset) => {
        const search = query.trim().toLowerCase()
        const matchesSearch = !search || [asset.assetId, asset.assetName, asset.serialNumber, asset.department, asset.custodian].join(' ').toLowerCase().includes(search)
        return matchesSearch && (!category || asset.category === category) && (!status || asset.status === status)
    }), [assets, category, query, status])
    const categoryCounts = ASSET_CATEGORIES.map((item) => ({ category: item, count: assets.filter((asset) => asset.category === item).length })).filter((item) => item.count > 0)
    const columns = [
        { key: 'assetId', label: 'Asset ID', required: true },
        { key: 'assetName', label: 'Asset', required: true },
        { key: 'category', label: 'Category' },
        { key: 'department', label: 'Location / department', required: true, render: (asset) => asset.department || 'Location not recorded' },
        { key: 'custodian', label: 'Owner / custodian', render: (asset) => asset.custodian || 'Unassigned' },
        { key: 'quantity', label: 'Quantity', render: (asset) => asset.quantity || 1 },
        { key: 'serialNumber', label: 'Serial number' },
        { key: 'warrantyExpiry', label: 'Warranty expiry' },
        { key: 'status', label: 'Status', render: (asset) => <StatusBadge status={asset.status} /> },
    ]
    const reset = () => { setQuery(''); setCategory(''); setStatus('') }
    return (
        <section className='space-y-5'>
            <IntegrationNotice state='demo' title='Browser-stored asset register' description='Asset locations, custodians and lifecycle states are local demonstration records. Production updates require the asset API, authorization and immutable transfer history.' />
            <div className='grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6'>{categoryCounts.map((item) => <div key={item.category} className='rounded-2xl bg-white p-4 shadow-md'><p className='text-xs text-[#667085]'>{item.category}</p><p className='text-2xl font-semibold text-[#1E1E1E]'>{item.count}</p></div>)}</div>
            <div className='overflow-hidden rounded-2xl bg-white shadow-md'>
                <DataToolbar query={query} onQueryChange={setQuery} searchLabel='Search IT assets' searchPlaceholder='Asset, serial, location or owner…' resultCount={filtered.length} onReset={reset} filters={<><label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Category<select className={selectClass} value={category} onChange={(event) => setCategory(event.target.value)}><option value=''>All categories</option>{ASSET_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label><label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Status<select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value=''>All statuses</option>{STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label></>} actions={<><NavLink to='/it-support-manager/asset-management/add-asset' className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'><Plus size={16} /> Add asset</NavLink><button type='button' disabled title='Export requires the connected asset service.' className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Export unavailable</button></>} />
                <DataTable caption='IT asset register' rows={filtered} columns={columns} rowKey='assetId' emptyTitle='No assets match these filters' emptyDescription='Reset the filters or add an asset if you have permission.' renderActions={(asset) => <NavLink to={`/it-support-manager/asset-management/view-asset/${asset.assetId}`} className='inline-flex min-h-9 items-center rounded-md border border-[var(--erp-indigo)] px-3 text-xs font-semibold text-[var(--erp-indigo)]'>View record</NavLink>} />
            </div>
        </section>
    )
}

export default AssetManagement
