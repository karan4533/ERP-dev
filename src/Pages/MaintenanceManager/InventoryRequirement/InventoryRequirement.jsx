import React from 'react'
import { SimpleRegister } from '../../../Common/demoDomain/DemoScreens'
import { MAINT_REQUIREMENT_KEY, MAINT_REQUIREMENT_SEED } from '../maintenanceOpsData'

const InventoryRequirement = () => (
    <SimpleRegister
        title="Inventory Requirement"
        description="Raise Maintenance material and spare-part requirements toward Store / purchase planning. Vendor comparison stays with Store Officer (PDF §4.3)."
        storageKey={MAINT_REQUIREMENT_KEY}
        seed={MAINT_REQUIREMENT_SEED}
        idPrefix="MIR-2026-"
        columns={[
            { key: 'id', label: 'Req ID' },
            { key: 'item', label: 'Item' },
            { key: 'quantity', label: 'Qty' },
            { key: 'requiredDate', label: 'Needed by' },
            { key: 'status', label: 'Status' },
        ]}
        fields={[
            { key: 'item', label: 'Item', required: true },
            { key: 'quantity', label: 'Quantity', type: 'number', required: true },
            { key: 'requiredDate', label: 'Required Date', type: 'date' },
            { key: 'requestedBy', label: 'Requested By' },
            { key: 'department', label: 'Department' },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: ['Pending', 'Submitted to Store', 'Fulfilled', 'Rejected'],
            },
            { key: 'remarks', label: 'Remarks', type: 'textarea' },
        ]}
    />
)

export default InventoryRequirement
