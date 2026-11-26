import OperationsReportWorkspace from '../../../Common/operations/OperationsReportWorkspace'
import { StatusBadge } from '../../../Common/ui'
import { REPORT_TYPES, WORK_ORDER_REPORT, PREVENTIVE_MAINTENANCE_REPORT, DG_LOGGING_REPORT, CRITICAL_SPARES_REPORT } from './reportsData'

const definitions = {
    'Work Order Resolution Report': {
        rows: WORK_ORDER_REPORT,
        rowKey: (row) => `${row.orderId}-${row.reportedDate}`,
        dateKey: 'reportedDate',
        searchPlaceholder: 'Search order ID, trade, location or technician…',
        columns: [
            { key: 'orderId', label: 'Work Order', required: true },
            { key: 'serviceType', label: 'Service Category', required: true },
            { key: 'location', label: 'Location', required: true },
            { key: 'technician', label: 'Technician', required: true },
            { key: 'status', label: 'Status', required: true, render: (row) => <StatusBadge status={row.status} /> },
            { key: 'reportedDate', label: 'Reported Date', required: true },
            { key: 'cost', label: 'Cost Incurred' },
        ],
    },
    'Preventive Maintenance Compliance': {
        rows: PREVENTIVE_MAINTENANCE_REPORT,
        rowKey: 'asset',
        dateKey: 'lastCheck',
        searchPlaceholder: 'Search equipment asset or technician…',
        columns: [
            { key: 'asset', label: 'Equipment / Asset', required: true },
            { key: 'frequency', label: 'Inspection Frequency', required: true },
            { key: 'lastCheck', label: 'Last Inspected', required: true },
            { key: 'nextDue', label: 'Next Due Date', required: true },
            { key: 'compliance', label: 'Compliance', required: true, render: (row) => <StatusBadge status={row.compliance} /> },
            { key: 'technician', label: 'Assigned Specialist', required: true },
        ],
    },
    'DG GenSet & Power Logging': {
        rows: DG_LOGGING_REPORT,
        rowKey: (row) => `${row.date}-${row.runningHours}`,
        dateKey: 'date',
        searchPlaceholder: 'Search outage date or reason…',
        columns: [
            { key: 'date', label: 'Date', required: true },
            { key: 'runningHours', label: 'Run Duration', required: true },
            { key: 'fuelAdded', label: 'Diesel Added' },
            { key: 'fuelBalance', label: 'Tank Balance', required: true },
            { key: 'gridOutageReason', label: 'Power Cut / Grid Reason', required: true },
            { key: 'operator', label: 'Operator', required: true },
        ],
    },
    'Critical Spares Reorder Report': {
        rows: CRITICAL_SPARES_REPORT,
        rowKey: 'item',
        searchPlaceholder: 'Search spare parts…',
        columns: [
            { key: 'item', label: 'Spare / Material', required: true },
            { key: 'category', label: 'Category', required: true },
            { key: 'currentQty', label: 'In Stock', required: true },
            { key: 'reorderLevel', label: 'Reorder Level', required: true },
            { key: 'deficit', label: 'Indent Deficit', required: true },
            { key: 'urgency', label: 'Priority', required: true, render: (row) => <StatusBadge status={row.urgency} /> },
        ],
    },
}

const Reports = () => (
    <OperationsReportWorkspace
        reportTypes={REPORT_TYPES}
        definitions={definitions}
        title='Maintenance Reports & Performance Analytics'
        description='Audit work order turnaround, equipment preventive maintenance compliance, diesel generator backup metrics, and critical spares availability.'
        caption='Campus maintenance analytics dashboard'
    />
)

export default Reports

