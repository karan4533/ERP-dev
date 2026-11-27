import React from 'react'
import { SimpleRegister } from '../../../Common/demoDomain/DemoScreens'
import { MAINT_SCHEDULE_KEY, MAINT_SCHEDULE_SEED } from '../maintenanceOpsData'

const Schedules = () => (
    <SimpleRegister
        title="Maintenance Schedules"
        description="Recurring preventive maintenance and inspection schedules for facilities (PDF §4.6–4.7). Not Housekeeping cleaning schedules."
        storageKey={MAINT_SCHEDULE_KEY}
        seed={MAINT_SCHEDULE_SEED}
        idPrefix="MSCH-2026-"
        columns={[
            { key: 'name', label: 'Schedule' },
            { key: 'frequency', label: 'Frequency' },
            { key: 'area', label: 'Area' },
            { key: 'staff', label: 'Staff' },
            { key: 'checklistFocus', label: 'Checklist focus' },
            { key: 'status', label: 'Status' },
        ]}
        fields={[
            { key: 'name', label: 'Name', required: true },
            {
                key: 'frequency',
                label: 'Frequency',
                type: 'select',
                options: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
            },
            { key: 'area', label: 'Area / Asset' },
            { key: 'staff', label: 'Responsible Staff' },
            { key: 'checklistFocus', label: 'Checklist focus' },
            { key: 'weekday', label: 'Weekday (0=Sun…6=Sat, for WEEKLY)', type: 'number' },
            { key: 'dayOfMonth', label: 'Day of month (for MONTHLY)', type: 'number' },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: ['Active', 'Paused'],
            },
        ]}
    />
)

export default Schedules
