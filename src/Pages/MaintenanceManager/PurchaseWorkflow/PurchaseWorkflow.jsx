import React from 'react'
import { SimpleRegister } from '../../../Common/demoDomain/DemoScreens'
import { MAINT_PROCUREMENT_KEY, MAINT_PROCUREMENT_SEED } from '../maintenanceOpsData'

const PurchaseWorkflow = () => (
    <SimpleRegister
        title="Purchase Workflow"
        description="Maintenance purchase requirements feed the shared Store → JD → Finance chain (PDF §4.3). Do not invent a separate Maintenance PO ledger."
        storageKey={MAINT_PROCUREMENT_KEY}
        seed={MAINT_PROCUREMENT_SEED}
        idPrefix="MPC-2026-"
        columns={[
            { key: 'id', label: 'Request' },
            { key: 'title', label: 'Title' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' },
            { key: 'primaryApprover', label: 'Approver' },
        ]}
        fields={[
            { key: 'title', label: 'Request title', required: true },
            { key: 'amount', label: 'Amount', type: 'number' },
            {
                key: 'minorPurchase',
                label: 'Minor purchase (Yes/No)',
                type: 'select',
                options: ['Yes', 'No'],
            },
            { key: 'requestedBy', label: 'Requested By' },
            { key: 'department', label: 'Department' },
            { key: 'primaryApprover', label: 'Primary Approver' },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: [
                    'QUOTATION_PENDING',
                    'DEPARTMENT_REVIEW',
                    'MINOR_APPROVED',
                    'ESCALATED',
                    'QUOTATION_APPROVED',
                    'PO_REQUIRED',
                    'PO_RAISED',
                    'PO_APPROVED',
                    'REJECTED',
                    'COMPLETED',
                ],
            },
            { key: 'remarks', label: 'Remarks', type: 'textarea' },
        ]}
    />
)

export default PurchaseWorkflow
