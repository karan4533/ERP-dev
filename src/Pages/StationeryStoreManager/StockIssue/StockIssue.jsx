import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { StatusBadge } from '../../../Common/demoDomain/statusBadge'
import { getInventoryItems, hydrateInventoryItemsFromApi } from '../Inventory/inventoryData'
import {
    getStationeryStockIssues,
    hydrateStationeryStockIssuesFromApi,
    issueStationeryStock,
    ISSUE_DESTINATIONS,
} from './stockIssuesData'

const inputClass = 'text-sm border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

const StockIssue = () => {
    const [items, setItems] = useState(() => getInventoryItems())
    const [rows, setRows] = useState(() => getStationeryStockIssues())
    const [form, setForm] = useState({
        itemName: items[0]?.itemName || '',
        quantity: 1,
        to: ISSUE_DESTINATIONS[0],
        receivedBy: '',
    })

    const refresh = () => {
        const nextItems = getInventoryItems()
        setItems(nextItems)
        setRows(getStationeryStockIssues())
        setForm((prev) => ({
            ...prev,
            itemName: nextItems.some((item) => item.itemName === prev.itemName)
                ? prev.itemName
                : (nextItems[0]?.itemName || ''),
        }))
    }

    useEffect(() => {
        let active = true
        Promise.all([
            hydrateStationeryStockIssuesFromApi(),
            hydrateInventoryItemsFromApi(),
        ]).finally(() => {
            if (active) refresh()
        })
        return () => { active = false }
    }, [])

    const submit = async (event) => {
        event.preventDefault()
        if (!form.itemName) {
            toast.error('Select an inventory item.')
            return
        }
        const result = await issueStationeryStock({
            ...form,
            issuedBy: 'Stores Manager',
            receivedBy: form.receivedBy || form.to,
        })
        if (!result.success) {
            toast.error(result.message || 'Could not issue stock.')
            return
        }
        refresh()
        toast.success('Stock issued and saved to stationery stores.')
    }

    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Stock issue</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Uses the same server stock ledger as Issue / Return (live API). Prefer{' '}
                    <a className='text-[#515DEF] underline' href='/stationery-store-manager/issue-returns/add'>Issue / Return</a>
                    {' '}for multi-line and returnable tracking.
                </p>
            </div>
            <form onSubmit={submit} className='bg-white rounded-2xl shadow-md p-4 grid grid-cols-1 md:grid-cols-4 gap-3'>
                <select value={form.itemName} onChange={(event) => setForm({ ...form, itemName: event.target.value })} className={inputClass}>
                    {items.length === 0 && <option value=''>No inventory items</option>}
                    {items.map((item) => (
                        <option key={item.itemId} value={item.itemName}>
                            {item.itemName} ({item.availableQuantity} {item.unit || ''})
                        </option>
                    ))}
                </select>
                <input type='number' min='1' value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} className={inputClass} />
                <select value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} className={inputClass}>
                    {ISSUE_DESTINATIONS.map((item) => <option key={item}>{item}</option>)}
                </select>
                <button type='submit' className='bg-[#515DEF] text-white rounded-md text-sm cursor-pointer'>Issue stock</button>
            </form>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <h2 className='text-lg font-semibold mb-3'>Inventory movement</h2>
                <table className='w-full text-sm'>
                    <thead className='text-xs bg-[#EDEEF5]'>
                        <tr>{['ID', 'Item', 'Qty', 'From', 'To', 'Issued by', 'Date', 'Status'].map((label) => <th key={label} className='px-2 py-3 text-left'>{label}</th>)}</tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr><td colSpan={8} className='px-2 py-6 text-center text-[#667085]'>No stock issues yet.</td></tr>
                        )}
                        {rows.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7]'>
                                <td className='px-2 py-3'>{row.id}</td>
                                <td className='px-2 py-3'>{row.item}</td>
                                <td className='px-2 py-3'>{row.quantity}</td>
                                <td className='px-2 py-3'>{row.from}</td>
                                <td className='px-2 py-3'>{row.to}</td>
                                <td className='px-2 py-3'>{row.issuedBy}</td>
                                <td className='px-2 py-3'>{row.date}</td>
                                <td className='px-2 py-3'><StatusBadge status={row.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default StockIssue
