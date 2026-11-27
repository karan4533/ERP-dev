import React from 'react'
import { SimpleRegister } from '../../../Common/demoDomain/DemoScreens'
import { MAINT_INVENTORY_KEY, MAINT_INVENTORY_SEED } from '../maintenanceOpsData'

const MaterialsInventory = () => (
    <SimpleRegister
        title="Maintenance Materials"
        description="Department-held repair materials, spare parts, and equipment. Product master and issue approval remain with the Store Officer (PDF §4.2 / §4.4). This is not a parallel Store ledger."
        storageKey={MAINT_INVENTORY_KEY}
        seed={MAINT_INVENTORY_SEED}
        idPrefix="MINV-2026-"
        columns={[
            { key: 'item', label: 'Item' },
            { key: 'category', label: 'Category' },
            { key: 'quantity', label: 'Qty' },
            { key: 'minStock', label: 'Min' },
            { key: 'returnable', label: 'Returnable' },
            { key: 'status', label: 'Status' },
        ]}
        fields={[
            { key: 'item', label: 'Item', required: true },
            {
                key: 'category',
                label: 'Category',
                type: 'select',
                options: ['Electrical spares', 'Plumbing spares', 'Tools', 'Equipment', 'Consumables', 'Other'],
            },
            { key: 'unit', label: 'Unit' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'minStock', label: 'Minimum stock', type: 'number' },
            { key: 'location', label: 'Location' },
            {
                key: 'returnable',
                label: 'Returnable',
                type: 'select',
                options: ['Yes', 'No'],
            },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: ['Available', 'Low Stock', 'Issued', 'Returned', 'Out of Stock'],
            },
            { key: 'remarks', label: 'Remarks', type: 'textarea' },
        ]}
    />
)

export default MaterialsInventory
