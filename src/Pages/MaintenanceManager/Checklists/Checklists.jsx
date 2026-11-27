import React from 'react'
import { SimpleRegister } from '../../../Common/demoDomain/DemoScreens'
import { MAINT_CHECKLIST_KEY, MAINT_CHECKLIST_SEED } from '../maintenanceOpsData'

const Checklists = () => (
    <SimpleRegister
        title="Maintenance Checklists"
        description="Record checklist completion for repairs and facilities inspections (electrical, plumbing, fire-safety). Separate from Housekeeping cleaning checklists."
        storageKey={MAINT_CHECKLIST_KEY}
        seed={MAINT_CHECKLIST_SEED}
        idPrefix="MCL-2026-"
        columns={[
            { key: 'title', label: 'Checklist' },
            { key: 'frequency', label: 'Frequency' },
            { key: 'area', label: 'Area' },
            { key: 'staff', label: 'Staff' },
            { key: 'dueDate', label: 'Due' },
            { key: 'status', label: 'Status' },
        ]}
        fields={[
            { key: 'title', label: 'Title', required: true },
            {
                key: 'frequency',
                label: 'Frequency',
                type: 'select',
                options: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
            },
            { key: 'area', label: 'Area / Asset', required: true },
            { key: 'staff', label: 'Responsible Staff', required: true },
            { key: 'dueDate', label: 'Due Date', type: 'date' },
            { key: 'completedDate', label: 'Completed Date', type: 'date' },
            {
                key: 'checklistItems',
                label: 'Checklist items (one per line)',
                type: 'textarea',
                required: true,
            },
            { key: 'pendingItems', label: 'Pending items', type: 'textarea' },
            { key: 'verifiedBy', label: 'Verified By' },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: ['Pending', 'In Progress', 'Completed', 'Verified'],
            },
            { key: 'remarks', label: 'Remarks', type: 'textarea' },
        ]}
    />
)

export default Checklists
