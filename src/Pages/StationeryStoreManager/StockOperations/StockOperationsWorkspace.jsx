import React, { useState } from 'react'
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    FileCheck,
    AlertTriangle,
    Plus,
    Search,
    Check,
    Calendar,
    Package,
    Building2,
    Truck,
    Shield
} from 'lucide-react'
import { INVENTORY_ITEMS } from '../Inventory/inventoryData'
import { DataTable } from '../../../Common/ui'

const TABS = [
    { id: 'inward', label: 'Stock Inward (GRN)', icon: ArrowDownToLine },
    { id: 'outward', label: 'Stock Issues & Outward', icon: ArrowUpFromLine },
    { id: 'transfers', label: 'Inter-Department Transfers', icon: ArrowLeftRight },
    { id: 'gatepass', label: 'Gate Pass Management', icon: FileCheck },
    { id: 'damaged', label: 'Damaged & Returns Register', icon: AlertTriangle },
]

const INITIAL_INWARDS = [
    { id: 'GRN-2026-088', poNumber: 'PO-2026-004', vendor: 'PaperPro Supplies', item: 'A4 Paper Ream (500 sheets)', qty: 50, batchNo: 'BAT-2026-R88', date: '30 Oct 2026', bin: 'Rack A, Shelf 2', receivedBy: 'Meena Kapoor' },
    { id: 'GRN-2026-087', poNumber: 'PO-2026-002', vendor: 'PrintTech Solutions', item: 'HP 803 Black Ink Cartridge', qty: 20, batchNo: 'BAT-2026-HP803', date: '28 Oct 2026', bin: 'Rack C, Shelf 1', receivedBy: 'Meena Kapoor' },
    { id: 'GRN-2026-086', poNumber: 'PO-2026-001', vendor: 'Classmate Wholesale', item: 'Spiral Notebook (200 pgs)', qty: 500, batchNo: 'BAT-2026-NB1', date: '24 Oct 2026', bin: 'Rack B, Bin 4', receivedBy: 'Meena Kapoor' },
]

const INITIAL_ISSUES = [
    { id: 'ISS-2026-112', requestNo: 'REQ-STR-2026-008', department: 'Senior Secondary', issuedTo: 'R. Srinivasan', item: 'A4 Paper Reams', qty: 10, date: 'Today, 10:15 AM', status: 'Dispatched' },
    { id: 'ISS-2026-111', requestNo: 'REQ-STR-2026-006', department: 'Admin Office', issuedTo: 'K. Meenakshi', item: 'HP 803 Ink Cartridge', qty: 2, date: 'Yesterday, 03:20 PM', status: 'Dispatched' },
    { id: 'ISS-2026-110', requestNo: 'REQ-STR-2026-004', department: 'Examination Cell', issuedTo: 'Dr. Ramanathan', item: 'Whiteboard Markers (Blue & Black)', qty: 30, date: '28 Oct 2026', status: 'Dispatched' },
]

const INITIAL_GATEPASSES = [
    { id: 'GP-2026-034', type: 'Returnable', item: 'Overhead Projector (Epson EB-X06)', purpose: 'Vendor Factory Optical Repair', carrier: 'BlueDart Courier (AWB #88921)', destination: 'PrintTech Center, Madurai', expectedReturn: '05 Nov 2026', status: 'Outside Campus' },
    { id: 'GP-2026-033', type: 'Non-Returnable', item: 'Old Answer Scripts (Recycling)', purpose: 'Authorized Paper Shredding Vendor', carrier: 'GreenEarth Recyclers (TN-58-B-4412)', destination: 'EcoMills, Madurai', expectedReturn: 'N/A', status: 'Cleared Gate' },
]

const StockOperationsWorkspace = () => {
    const [activeTab, setActiveTab] = useState('inward')
    const [inwards, setInwards] = useState(INITIAL_INWARDS)
    const [issues, setIssues] = useState(INITIAL_ISSUES)
    const [gatePasses, setGatePasses] = useState(INITIAL_GATEPASSES)
    const [actionMessage, setActionMessage] = useState(null)

    // Form states for adding inward
    const [newInward, setNewInward] = useState({
        poNumber: 'PO-2026-009',
        vendor: 'PaperPro Supplies',
        item: 'A4 Paper Ream (500 sheets)',
        qty: 40,
        batchNo: `BAT-2026-${Math.floor(100 + Math.random() * 900)}`,
        bin: 'Rack A, Shelf 2',
    })

    const handleAddInward = (e) => {
        e.preventDefault()
        const grn = {
            id: `GRN-2026-${Math.floor(100 + Math.random() * 900)}`,
            ...newInward,
            date: 'Today',
            receivedBy: 'Meena Kapoor',
        }
        setInwards([grn, ...inwards])
        setActionMessage(`Goods Receipt Note ${grn.id} recorded and inventory stock balance increased by ${newInward.qty} units.`)
        setTimeout(() => setActionMessage(null), 3000)
    }

    return (
        <div className='space-y-6 pb-8 font-inter'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                        Stock Operations & Logistics Engine
                    </h1>
                    <p className='mt-1 text-xs text-slate-500'>
                        Comprehensive management for Goods Receipt (GRN), Department Stock Outward, Inter-Facility Transfers, and Gate Passes.
                    </p>
                </div>
            </div>

            {actionMessage && (
                <div className='flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200'>
                    <Check size={16} />
                    {actionMessage}
                </div>
            )}

            {/* Navigation Tabs */}
            <div className='flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 bg-white px-2 py-1.5 rounded-2xl shadow-2xs sidebar-scroll-hide'>
                {TABS.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            type='button'
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <Icon size={14} />
                            <span>{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Tab 1: Stock Inward (GRN) */}
            {activeTab === 'inward' && (
                <div className='space-y-6'>
                    {/* Add Inward Form Card */}
                    <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs text-xs'>
                        <h2 className='text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4'>
                            Generate Goods Receipt Note (GRN)
                        </h2>
                        <form onSubmit={handleAddInward} className='grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>PO Reference</label>
                                <input
                                    type='text'
                                    value={newInward.poNumber}
                                    onChange={(e) => setNewInward({ ...newInward, poNumber: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Vendor / Supplier</label>
                                <input
                                    type='text'
                                    value={newInward.vendor}
                                    onChange={(e) => setNewInward({ ...newInward, vendor: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Item Name</label>
                                <input
                                    type='text'
                                    value={newInward.item}
                                    onChange={(e) => setNewInward({ ...newInward, item: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Quantity Received</label>
                                <input
                                    type='number'
                                    min='1'
                                    value={newInward.qty}
                                    onChange={(e) => setNewInward({ ...newInward, qty: parseInt(e.target.value, 10) || 1 })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-semibold text-slate-700 mb-1'>Assigned Bin Location</label>
                                <input
                                    type='text'
                                    value={newInward.bin}
                                    onChange={(e) => setNewInward({ ...newInward, bin: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div className='flex items-end'>
                                <button
                                    type='submit'
                                    className='w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer'
                                >
                                    Receive Stock
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Inwards History Table */}
                    <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                        <h2 className='text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-3'>
                            Recent Goods Receipt Notes (GRN Ledger)
                        </h2>
                        <div className='overflow-x-auto text-xs'>
                            <table className='w-full text-left'>
                                <thead>
                                    <tr className='border-b border-slate-200 text-slate-400 font-semibold'>
                                        <th className='py-2.5 px-3'>GRN #</th>
                                        <th className='py-2.5 px-3'>PO #</th>
                                        <th className='py-2.5 px-3'>Vendor</th>
                                        <th className='py-2.5 px-3'>Item Received</th>
                                        <th className='py-2.5 px-3'>Qty</th>
                                        <th className='py-2.5 px-3'>Batch #</th>
                                        <th className='py-2.5 px-3'>Bin Location</th>
                                        <th className='py-2.5 px-3'>Date</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {inwards.map((row) => (
                                        <tr key={row.id} className='hover:bg-slate-50 transition-colors'>
                                            <td className='py-2.5 px-3 font-mono font-bold text-blue-700'>{row.id}</td>
                                            <td className='py-2.5 px-3 font-mono text-slate-600'>{row.poNumber}</td>
                                            <td className='py-2.5 px-3 font-semibold text-slate-800'>{row.vendor}</td>
                                            <td className='py-2.5 px-3 text-slate-700'>{row.item}</td>
                                            <td className='py-2.5 px-3 font-bold text-slate-900'>{row.qty}</td>
                                            <td className='py-2.5 px-3 font-mono text-slate-500'>{row.batchNo}</td>
                                            <td className='py-2.5 px-3 text-slate-500'>{row.bin}</td>
                                            <td className='py-2.5 px-3 text-slate-400'>{row.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Stock Issues & Outward */}
            {activeTab === 'outward' && (
                <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                    <h2 className='text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-3'>
                        Department Stock Outward & Issue Register
                    </h2>
                    <div className='overflow-x-auto text-xs'>
                        <table className='w-full text-left'>
                            <thead>
                                <tr className='border-b border-slate-200 text-slate-400 font-semibold'>
                                    <th className='py-2.5 px-3'>Issue Slip #</th>
                                    <th className='py-2.5 px-3'>Requisition Ref</th>
                                    <th className='py-2.5 px-3'>Department</th>
                                    <th className='py-2.5 px-3'>Recipient</th>
                                    <th className='py-2.5 px-3'>Item Issued</th>
                                    <th className='py-2.5 px-3'>Qty</th>
                                    <th className='py-2.5 px-3'>Dispatch Date</th>
                                    <th className='py-2.5 px-3'>Status</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-100'>
                                {issues.map((row) => (
                                    <tr key={row.id} className='hover:bg-slate-50 transition-colors'>
                                        <td className='py-2.5 px-3 font-mono font-bold text-slate-800'>{row.id}</td>
                                        <td className='py-2.5 px-3 font-mono text-blue-600'>{row.requestNo}</td>
                                        <td className='py-2.5 px-3 font-semibold text-slate-700'>{row.department}</td>
                                        <td className='py-2.5 px-3 text-slate-700'>{row.issuedTo}</td>
                                        <td className='py-2.5 px-3 text-slate-800'>{row.item}</td>
                                        <td className='py-2.5 px-3 font-bold text-slate-900'>{row.qty}</td>
                                        <td className='py-2.5 px-3 text-slate-400'>{row.date}</td>
                                        <td className='py-2.5 px-3'>
                                            <span className='rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700'>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 3: Inter-Department Transfers */}
            {activeTab === 'transfers' && (
                <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs space-y-4 text-xs'>
                    <h2 className='text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5'>
                        Inter-Facility Stock Movement & Transfers
                    </h2>
                    <p className='text-slate-500'>
                        Record physical stock transfers between Central Stationery Warehouse, Senior Science Labs, Examination Cell, and Primary Campus Wing.
                    </p>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2'>
                        <div className='rounded-xl border border-slate-200 bg-slate-50/50 p-4'>
                            <p className='font-bold text-slate-900 mb-1'>Transfer #TR-2026-012</p>
                            <p className='text-slate-600'>From: Central Warehouse $\rightarrow$ To: Senior Science Chemistry Lab</p>
                            <p className='text-slate-400 mt-1'>Items: 50 Glass Beakers (250ml) · Transferred by: Meena Kapoor · Status: Received</p>
                        </div>
                        <div className='rounded-xl border border-slate-200 bg-slate-50/50 p-4'>
                            <p className='font-bold text-slate-900 mb-1'>Transfer #TR-2026-011</p>
                            <p className='text-slate-600'>From: Central Warehouse $\rightarrow$ To: Primary Wing Staff Room</p>
                            <p className='text-slate-400 mt-1'>Items: 20 Reams A4 Paper, 100 Red Marking Pens · Status: Received</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 4: Gate Pass Management */}
            {activeTab === 'gatepass' && (
                <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-100 pb-3 mb-3'>
                        <h2 className='text-sm font-bold text-slate-900'>
                            Official Material Gate Pass Register (Returnable & Non-Returnable)
                        </h2>
                    </div>
                    <div className='space-y-3 text-xs'>
                        {gatePasses.map((gp) => (
                            <div key={gp.id} className='rounded-xl border border-slate-200 p-4 bg-slate-50/40 hover:bg-slate-50 transition-colors'>
                                <div className='flex items-center justify-between flex-wrap gap-2'>
                                    <div className='flex items-center gap-2'>
                                        <span className='font-mono font-bold text-slate-900 text-sm'>{gp.id}</span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                gp.type === 'Returnable'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-slate-200 text-slate-700'
                                            }`}
                                        >
                                            {gp.type}
                                        </span>
                                    </div>
                                    <span className='rounded bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200'>
                                        {gp.status}
                                    </span>
                                </div>
                                <p className='font-semibold text-slate-800 text-sm mt-2'>{gp.item}</p>
                                <p className='text-slate-500 mt-0.5'>Purpose: {gp.purpose} · Carrier: {gp.carrier} · Destination: {gp.destination}</p>
                                {gp.type === 'Returnable' && (
                                    <p className='text-blue-600 font-semibold mt-1'>Expected Return Date: {gp.expectedReturn}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 5: Damaged & Returns Register */}
            {activeTab === 'damaged' && (
                <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs text-xs space-y-3'>
                    <h2 className='text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5'>
                        Damaged Stock & Vendor Return Claims
                    </h2>
                    <div className='rounded-xl border border-red-200 bg-red-50/30 p-4'>
                        <div className='flex items-center justify-between'>
                            <p className='font-bold text-red-900 text-sm'>HP 803 Cartridge Leakage (2 Units)</p>
                            <span className='rounded bg-red-100 text-red-700 font-bold px-2 py-0.5'>Under Vendor Claim</span>
                        </div>
                        <p className='text-slate-600 mt-1'>Invoice #INV-PT-1109 · Supplier: PrintTech Solutions · Replacement due on next delivery.</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StockOperationsWorkspace

