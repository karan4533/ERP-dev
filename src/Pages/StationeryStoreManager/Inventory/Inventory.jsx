import React, { useState } from 'react'
import InventoryRegister from '../../../Common/operations/InventoryRegister'
import { DataTable, StatusBadge } from '../../../Common/ui'
import {
    CATEGORIES,
    INVENTORY_ITEMS,
    MONTHLY_CONSUMPTION_LOG,
    DEPARTMENT_DISTRIBUTION,
} from './inventoryData'

const columns = [
    { key: 'itemId', label: 'Item ID', required: true },
    {
        key: 'itemName',
        label: 'Item',
        required: true,
        render: (item) => (
            <div>
                <p className='font-semibold text-[var(--erp-ink)]'>{item.itemName}</p>
                <p className='mt-0.5 text-xs text-[var(--erp-muted)]'>{item.itemCode}</p>
            </div>
        ),
    },
    { key: 'category', label: 'Category' },
    { key: 'batchNo', label: 'Batch No', render: (item) => item.batchNo || '—' },
    { key: 'expiryDate', label: 'Expiry Date', render: (item) => item.expiryDate || 'N/A' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'unit', label: 'Unit' },
    { key: 'availableQuantity', label: 'Available' },
    { key: 'reorderLevel', label: 'Reorder at' },
    { key: 'unitCost', label: 'Unit cost' },
    { key: 'stockValue', label: 'Stock value' },
    { key: 'status', label: 'Status', required: true },
]

const consumptionColumns = [
    { key: 'id', label: 'Log ID', required: true },
    { key: 'month', label: 'Month / Period', required: true },
    { key: 'itemName', label: 'Item Issued', required: true },
    { key: 'issuedQty', label: 'Issued Qty', render: (row) => `${row.issuedQty} ${row.unit}` },
    { key: 'department', label: 'Department / Consumer', required: true },
    { key: 'recordedBy', label: 'Recorded By' },
]

const departmentColumns = [
    { key: 'department', label: 'Department', required: true },
    { key: 'itemsIssued', label: 'Total Units Dispatched' },
    { key: 'totalCost', label: 'Total Valuation Dispatched' },
    { key: 'topItem', label: 'Primary Item' },
]

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('inventory')

    return (
        <section className='space-y-4'>
            <div className='flex border-b border-[var(--erp-line)] bg-white px-4 pt-3 rounded-t-2xl gap-4'>
                <button
                    type='button'
                    onClick={() => setActiveTab('inventory')}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'inventory'
                            ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]'
                            : 'border-transparent text-[var(--erp-slate)] hover:text-[var(--erp-ink)]'
                    }`}
                >
                    All Inventory Items & Batches
                </button>
                <button
                    type='button'
                    onClick={() => setActiveTab('consumption')}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'consumption'
                            ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]'
                            : 'border-transparent text-[var(--erp-slate)] hover:text-[var(--erp-ink)]'
                    }`}
                >
                    Monthly Consumption Register
                </button>
                <button
                    type='button'
                    onClick={() => setActiveTab('department')}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'department'
                            ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]'
                            : 'border-transparent text-[var(--erp-slate)] hover:text-[var(--erp-ink)]'
                    }`}
                >
                    Department-Wise Distribution
                </button>
            </div>

            {activeTab === 'inventory' && (
                <InventoryRegister
                    records={INVENTORY_ITEMS}
                    columns={columns}
                    categories={CATEGORIES}
                    caption='Stationery inventory register'
                    title='Stationery inventory & Batch Tracking'
                    description='Track item codes, batch numbers, expiry dates, suppliers, stock thresholds, and valuation.'
                    rowKey='itemId'
                    createPath='/stationery-store-manager/inventory/add-item'
                    viewPath={(item) => `/stationery-store-manager/inventory/view-item/${item.itemId}`}
                />
            )}

            {activeTab === 'consumption' && (
                <div className='rounded-2xl bg-white p-5 shadow-md space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-lg font-semibold text-[var(--erp-ink)]'>Monthly Consumption Log</h2>
                            <p className='text-xs text-[var(--erp-muted)]'>Chronological log of items dispatched to academic and administrative wings.</p>
                        </div>
                    </div>
                    <DataTable
                        caption='Monthly Consumption Log'
                        rows={MONTHLY_CONSUMPTION_LOG}
                        columns={consumptionColumns}
                        rowKey='id'
                    />
                </div>
            )}

            {activeTab === 'department' && (
                <div className='rounded-2xl bg-white p-5 shadow-md space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-lg font-semibold text-[var(--erp-ink)]'>Department Consumption Analysis</h2>
                            <p className='text-xs text-[var(--erp-muted)]'>Aggregated stationery utilization per department.</p>
                        </div>
                    </div>
                    <DataTable
                        caption='Department Consumption Analysis'
                        rows={DEPARTMENT_DISTRIBUTION}
                        columns={departmentColumns}
                        rowKey='department'
                    />
                </div>
            )}
        </section>
    )
}

export default Inventory
