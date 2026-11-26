import OperationsReportWorkspace from '../../../Common/operations/OperationsReportWorkspace'
import { StatusBadge } from '../../../Common/ui'
import { REPORT_TYPES, TASK_COMPLETION_REPORT, SUPPLY_USAGE_REPORT, ZONE_CLEANING_REPORT, LOW_STOCK_REPORT } from './reportsData'

const definitions = {
    'Task Completion Report': {
        rows: TASK_COMPLETION_REPORT,
        rowKey: (row) => `${row.task}-${row.date}`,
        dateKey: 'date',
        searchPlaceholder: 'Search task, staff member or zone…',
        columns: [
            { key: 'task', label: 'Task', required: true },
            { key: 'assignedTo', label: 'Assigned to', required: true },
            { key: 'zone', label: 'Zone', required: true },
            { key: 'completed', label: 'Completed', required: true, render: (row) => <StatusBadge status={row.completed === 'Yes' ? 'Completed' : 'Pending'} label={row.completed} /> },
            { key: 'date', label: 'Task date', required: true },
        ],
    },
    'Supply Usage Report': {
        rows: SUPPLY_USAGE_REPORT,
        rowKey: (row) => `${row.item}-${row.zone}`,
        searchPlaceholder: 'Search supply, zone or period…',
        columns: [
            { key: 'item', label: 'Supply', required: true },
            { key: 'quantityUsed', label: 'Used', required: true },
            { key: 'zone', label: 'Zone', required: true },
            { key: 'period', label: 'Reporting period', required: true },
        ],
    },
    'Zone Cleaning Report': {
        rows: ZONE_CLEANING_REPORT,
        rowKey: 'zone',
        dateKey: 'lastCleaned',
        searchPlaceholder: 'Search zone, status or staff member…',
        columns: [
            { key: 'zone', label: 'Zone', required: true },
            { key: 'lastCleaned', label: 'Last cleaned', required: true },
            { key: 'status', label: 'Cleaning state', required: true, render: (row) => <StatusBadge status={row.status} /> },
            { key: 'staff', label: 'Assigned staff', required: true },
        ],
    },
    'Low Stock Report': {
        rows: LOW_STOCK_REPORT,
        rowKey: 'item',
        searchPlaceholder: 'Search low-stock supply…',
        columns: [
            { key: 'item', label: 'Supply', required: true },
            { key: 'currentQty', label: 'Current quantity', required: true },
            { key: 'reorderLevel', label: 'Reorder level', required: true },
        ],
    },
}

const Reports = () => (
    <OperationsReportWorkspace
        title='Housekeeping reports'
        description='Review task completion, supply usage, zone readiness and replenishment risk without presenting frontend samples as authoritative service evidence.'
        integrationTitle='Housekeeping reporting service not connected'
        integrationDescription='Production reports must derive from timestamped task completion evidence, duty and zone records, immutable supply movements and approved inventory balances. Date controls appear only on task and zone datasets that contain record-level dates.'
        reportTypes={REPORT_TYPES}
        definitions={definitions}
    />
)

export default Reports
