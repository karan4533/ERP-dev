import React from 'react'
import { SimpleRegister } from '../../../Common/demoDomain/DemoScreens'
import { MAINT_DUTY_KEY, MAINT_DUTY_SEED } from '../maintenanceOpsData'

const DutyAllotment = () => (
    <SimpleRegister
        title="Duty Allotment"
        description="Assign Maintenance staff to repair and facilities duties. Separate from Housekeeping cleaning duties."
        storageKey={MAINT_DUTY_KEY}
        seed={MAINT_DUTY_SEED}
        idPrefix="MDUTY-2026-"
        columns={[
            { key: 'id', label: 'Duty ID' },
            { key: 'staff', label: 'Staff' },
            { key: 'area', label: 'Area / Asset' },
            { key: 'shift', label: 'Shift' },
            { key: 'dutyType', label: 'Duty' },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status' },
            { key: 'remarks', label: 'Remarks' },
        ]}
        fields={[
            { key: 'staff', label: 'Staff', required: true },
            { key: 'area', label: 'Area / Asset', required: true },
            {
                key: 'shift',
                label: 'Shift',
                type: 'select',
                options: ['Morning', 'Afternoon', 'Evening', 'Night'],
            },
            {
                key: 'dutyType',
                label: 'Duty Type',
                type: 'select',
                options: ['Corrective Repair', 'Preventive Maintenance', 'Inspection', 'Emergency Call'],
            },
            { key: 'assignedBy', label: 'Assigned By' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'startTime', label: 'Start Time', type: 'time' },
            { key: 'endTime', label: 'End Time', type: 'time' },
            { key: 'priority', label: 'Priority', type: 'select', options: ['Normal', 'High', 'Critical'] },
            { key: 'instructions', label: 'Instructions', type: 'textarea' },
            { key: 'remarks', label: 'Remarks', type: 'textarea' },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: ['Assigned', 'In Progress', 'Completed'],
            },
        ]}
    />
)

export default DutyAllotment
