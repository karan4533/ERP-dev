import OperationsRecordRegister from '../../../Common/operations/OperationsRecordRegister'
import { StatusBadge } from '../../../Common/ui'
import { ACTIVITY_TYPES, ISSUE_RETURNS } from './issueReturnsData'

const columns = [
    { key: 'id', label: 'Movement', required: true },
    { key: 'activityType', label: 'Activity', required: true, render: (row) => <StatusBadge status={row.activityType} /> },
    {
        key: 'requestedBy',
        label: 'Custodian',
        required: true,
        render: (row) => <div><p className='font-semibold text-[var(--erp-ink)]'>{row.requestedBy}</p><p className='mt-0.5 text-xs text-[var(--erp-muted)]'>{row.employeeId} · {row.department}</p></div>,
    },
    { key: 'itemName', label: 'Item', required: true },
    { key: 'quantity', label: 'Quantity', required: true },
    { key: 'issueDate', label: 'Issued' },
    { key: 'returnDate', label: 'Returned' },
    { key: 'originalIssueRef', label: 'Source issue' },
    { key: 'condition', label: 'Return condition' },
    { key: 'status', label: 'Custody state', required: true, render: (row) => <StatusBadge status={row.status} /> },
]

const IssueReturnsList = () => (
    <OperationsRecordRegister
        rows={ISSUE_RETURNS}
        columns={columns}
        rowKey='id'
        title='Issue and return custody'
        description='Track each stationery movement against its custodian, department, source issue and return condition.'
        caption='Stationery issue and return custody register'
        searchPlaceholder='Search movement, employee, department or item…'
        integrationTitle='Stationery custody service not connected'
        integrationDescription='These movements are frontend reference data. Production must validate available stock, commit stock and custody changes atomically, link every return to its source issue, and record condition, loss, damage and actor timestamps in an immutable ledger.'
        primaryFilter={{ key: 'activityType', label: 'Activity type', options: ACTIVITY_TYPES }}
        secondaryFilter={{ key: 'status', label: 'Custody state' }}
        createPath='/stationery-store-manager/issue-returns/add'
        createLabel='Record issue / return'
        viewPath={(row) => `/stationery-store-manager/issue-returns/view/${row.id}`}
    />
)

export default IssueReturnsList
