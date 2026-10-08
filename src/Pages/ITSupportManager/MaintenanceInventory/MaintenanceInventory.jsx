import React, { useState } from 'react'
import { toast } from 'react-toastify'

const KEY = 'school-erp-maintenance-inventory-v1'
const SEED = [
    { id: 'MNT-001', item: 'Electrical wire', category: 'Electrical', available: 40, minimum: 20, movement: 'Opening stock' },
    { id: 'MNT-002', item: 'LED tube light', category: 'Electrical', available: 12, minimum: 15, movement: 'Issued 3 to Block B' },
    { id: 'MNT-003', item: 'Toolkit', category: 'Tools', available: 6, minimum: 4, movement: 'Received 1' },
]

const load = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(KEY) || 'null')
        return Array.isArray(stored) && stored.length ? stored : SEED
    } catch {
        return SEED
    }
}

const MaintenanceInventory = () => {
    const [rows, setRows] = useState(load)
    const [form, setForm] = useState({ item: '', category: 'Electrical', quantity: 1, remarks: '' })
    const save = (next) => {
        localStorage.setItem(KEY, JSON.stringify(next))
        setRows(next)
    }
    const add = (event) => {
        event.preventDefault()
        if (!form.item.trim()) return
        save([{ id: `MNT-${String(rows.length + 1).padStart(3, '0')}`, item: form.item, category: form.category, available: Number(form.quantity) || 0, minimum: 5, movement: form.remarks || 'Requirement added' }, ...rows])
        toast.success('Maintenance stock updated in this browser.')
    }
    return (
        <section className='space-y-4'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold'>Maintenance Inventory</h2>
                <p className='text-sm text-[#667085] mt-1'>Separate from Stores and Stationery. Seeded with wire, light, and toolkit.</p>
            </div>
            <form onSubmit={add} className='bg-white rounded-2xl shadow-md p-4 grid md:grid-cols-4 gap-3'>
                <input className='border rounded-md px-2 py-2 text-sm' placeholder='Item' value={form.item} onChange={(event) => setForm({ ...form, item: event.target.value })} />
                <select className='border rounded-md px-2 py-2 text-sm' value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Electrical</option><option>Tools</option><option>Plumbing</option></select>
                <input className='border rounded-md px-2 py-2 text-sm' type='number' value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
                <button className='bg-[#515DEF] text-white rounded-md text-sm cursor-pointer'>Add movement</button>
            </form>
            <div className='bg-white rounded-2xl shadow-md p-4 overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                    <thead className='bg-[#EDEEF5]'><tr>{['S.No', 'Item', 'Category', 'Available', 'Minimum', 'Status', 'Movement'].map((label) => <th key={label} className='px-2 py-3'>{label}</th>)}</tr></thead>
                    <tbody>{rows.map((row, index) => <tr key={row.id} className='border-b'><td className='px-2 py-3'>{index + 1}</td><td className='px-2 py-3'>{row.item}</td><td className='px-2 py-3'>{row.category}</td><td className='px-2 py-3'>{row.available}</td><td className='px-2 py-3'>{row.minimum}</td><td className='px-2 py-3'>{row.available < row.minimum ? 'Low' : 'Available'}</td><td className='px-2 py-3'>{row.movement}</td></tr>)}</tbody>
                </table>
            </div>
        </section>
    )
}

export default MaintenanceInventory
