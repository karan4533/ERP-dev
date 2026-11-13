import OperationsReportWorkspace from '../../../Common/operations/OperationsReportWorkspace'
import {
    REPORT_TYPES,
    STOCK_MOVEMENT_REPORT,
    CONSUMPTION_REPORT,
    EXPENSE_REPORT,
    LOW_STOCK_REPORT,
} from './reportsData'

const definitions = {
    'Stock Movement Report': {
        rows: STOCK_MOVEMENT_REPORT,
        rowKey: 'item',
        searchPlaceholder: 'Search item or stock quantity…',
        columns: [
            { key: 'item', label: 'Item', required: true },
            { key: 'openingStock', label: 'Opening', required: true },
            { key: 'issued', label: 'Issued', required: true },
            { key: 'returned', label: 'Returned', required: true },
            { key: 'closingStock', label: 'Closing', required: true },
        ],
    },
    'Consumption Report': {
        rows: CONSUMPTION_REPORT,
        rowKey: (row) => `${row.item}-${row.department}`,
        searchPlaceholder: 'Search item, department or period…',
        columns: [
            { key: 'item', label: 'Item', required: true },
            { key: 'quantityUsed', label: 'Used', required: true },
            { key: 'department', label: 'Department', required: true },
            { key: 'period', label: 'Reporting period', required: true },
        ],
    },
    'Expense Report': {
        rows: EXPENSE_REPORT,
        rowKey: 'invoiceNo',
        dateKey: 'date',
        searchPlaceholder: 'Search invoice, product or vendor…',
        columns: [
            { key: 'invoiceNo', label: 'Invoice', required: true },
            { key: 'productName', label: 'Product', required: true },
            { key: 'vendor', label: 'Vendor', required: true },
            { key: 'amount', label: 'Amount', required: true },
            { key: 'date', label: 'Invoice date', required: true },
        ],
    },
    'Low Stock Report': {
        rows: LOW_STOCK_REPORT,
        rowKey: 'item',
        searchPlaceholder: 'Search low-stock item…',
        columns: [
            { key: 'item', label: 'Item', required: true },
            { key: 'currentQty', label: 'Current quantity', required: true },
            { key: 'reorderLevel', label: 'Reorder level', required: true },
        ],
    },
}

const Reports = () => (
    <OperationsReportWorkspace
        title='Stationery reports'
        description='Review stock movement, departmental consumption, invoice expense and replenishment risk without treating frontend samples as authoritative ledger data.'
        integrationTitle='Stationery reporting service not connected'
        integrationDescription='These datasets are frontend reference records. Production reporting must derive from immutable stock movements, linked custody records, approved purchase invoices and declared reporting periods; expense date filters are available because that dataset contains record-level dates.'
        reportTypes={REPORT_TYPES}
        definitions={definitions}
    />
)

export default Reports
