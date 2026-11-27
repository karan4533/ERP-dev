import React, { useEffect, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Download, EllipsisIcon, Plus, X } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { toast } from 'react-toastify'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    CATEGORIES,
    UNITS,
    getInventoryItems,
    hydrateInventoryItemsFromApi,
    statusColor,
    upsertInventoryItem,
} from './inventoryData'

const EMPTY_FORM = { name: '', category: 'Grains', quantity: '', unit: 'kg', reorderLevel: '' }

const Inventory = () => {
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [items, setItems] = useState(() => getInventoryItems())
    const [addOpen, setAddOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)

    useEffect(() => {
        hydrateInventoryItemsFromApi().finally(() => setItems(getInventoryItems()))
    }, [])

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

    const handleAdd = async (event) => {
        event.preventDefault()
        if (!form.name.trim()) {
            toast.error('Item name is required.')
            return
        }
        setSaving(true)
        try {
            const result = await upsertInventoryItem(form)
            if (result?.success === false) {
                toast.error(result.message || 'Could not save inventory item.')
                return
            }
            setItems(getInventoryItems())
            setForm(EMPTY_FORM)
            setAddOpen(false)
            toast.success('Inventory item saved.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs'>
                        <option value="">From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:mt-8 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Search</label>
                        <input type="text" placeholder="Item name, ID..." className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full' />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>Status</label>
                        <select className='text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'>
                            <option value="">All</option>
                            <option value="in-stock">In Stock</option>
                            <option value="low-stock">Low Stock</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker selected={fromDate} onChange={setFromDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker selected={toDate} onChange={setToDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4 mt-8'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Inventory</h2>
                    <div className='flex gap-x-2'>
                        <button
                            type='button'
                            onClick={() => setAddOpen(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                        >
                            <Plus size={16} />
                            Add Inventory
                        </button>
                        <button onClick={() => setExportModal(true)} className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Item ID</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Item Name</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Category</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Quantity</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Unit</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Reorder Level</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Status</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-2 py-6 text-center text-[#667085]">
                                        No inventory items yet.
                                    </td>
                                </tr>
                            )}
                            {items.map((item) => (
                                <tr key={item.id} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className="px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg">{item.id}</td>
                                    <td className="px-2 py-4">{item.name}</td>
                                    <td className="px-2 py-4">{item.category}</td>
                                    <td className="px-2 py-4">{item.quantity}</td>
                                    <td className="px-2 py-4">{item.unit}</td>
                                    <td className="px-2 py-4">{item.reorderLevel}</td>
                                    <td className="px-2 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusColor[item.status] || ''}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-2 py-4 text-center rounded-e-lg">
                                        <Dropdown buttonContent={<EllipsisIcon size={16} className='text-black' />}>
                                            <button type='button' className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer">View</button>
                                            <button type='button' className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer">Edit</button>
                                            <button type='button' className="w-full text-left p-2 hover:bg-[#515DEF] hover:text-white rounded cursor-pointer">Restock</button>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='flex justify-between items-center px-4 mt-4'>
                <p className='text-sm font-medium text-[#515DEF]'>
                    Showing {items.length === 0 ? 0 : 1} to {items.length} of {items.length} entries
                </p>
                <div className="flex justify-center gap-x-2">
                    <button className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer"><ChevronLeft size={16} /></button>
                    <button className="size-8 flex justify-center items-center p-2 bg-[#EDEDF5] text-[#515DEF] border border-[#E2E8F0] rounded-full cursor-pointer">1</button>
                    <button className="size-8 flex justify-center items-center p-2 bg-white text-[#515DEF] border border-[#E2E8F0] hover:bg-[#515DEF] hover:text-white rounded-full cursor-pointer"><ChevronRight size={16} /></button>
                </div>
            </div>

            {addOpen && (
                <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4'>
                    <div className='bg-white rounded-2xl shadow-lg w-full max-w-lg p-4'>
                        <div className='flex justify-between items-center mb-4'>
                            <h3 className='text-lg font-medium text-black'>Add Inventory</h3>
                            <button type='button' onClick={() => setAddOpen(false)} className='text-[#667085] hover:text-black cursor-pointer'>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAdd} className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                            <div className='flex flex-col gap-y-1 sm:col-span-2'>
                                <label className='text-sm text-[#667085]'>Item name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setField('name', e.target.value)}
                                    className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'
                                    placeholder='Basmati Rice'
                                />
                            </div>
                            <div className='flex flex-col gap-y-1'>
                                <label className='text-sm text-[#667085]'>Category</label>
                                <select value={form.category} onChange={(e) => setField('category', e.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'>
                                    {CATEGORIES.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex flex-col gap-y-1'>
                                <label className='text-sm text-[#667085]'>Unit</label>
                                <select value={form.unit} onChange={(e) => setField('unit', e.target.value)} className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'>
                                    {UNITS.map((unit) => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex flex-col gap-y-1'>
                                <label className='text-sm text-[#667085]'>Quantity</label>
                                <input
                                    type='number'
                                    min='0'
                                    value={form.quantity}
                                    onChange={(e) => setField('quantity', e.target.value)}
                                    className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'
                                />
                            </div>
                            <div className='flex flex-col gap-y-1'>
                                <label className='text-sm text-[#667085]'>Reorder level</label>
                                <input
                                    type='number'
                                    min='0'
                                    value={form.reorderLevel}
                                    onChange={(e) => setField('reorderLevel', e.target.value)}
                                    className='text-sm border border-[#D9D9D9] rounded-md px-2 py-2'
                                />
                            </div>
                            <div className='sm:col-span-2 flex justify-end gap-2 mt-2'>
                                <button type='button' onClick={() => setAddOpen(false)} className='px-4 py-2 text-sm border border-[#D9D9D9] rounded-md cursor-pointer'>
                                    Cancel
                                </button>
                                <button type='submit' disabled={saving} className='px-4 py-2 text-sm bg-[#515DEF] text-white rounded-md cursor-pointer disabled:opacity-60'>
                                    {saving ? 'Saving…' : 'Save item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='inventory'
                title='Inventory'
                rows={Array.isArray(items) ? items : []}
                exportDescription={<>You are exporting {Array.isArray(items) ? items.length : 0} record(s).</>}
            />
        </section>
    )
}

export default Inventory
