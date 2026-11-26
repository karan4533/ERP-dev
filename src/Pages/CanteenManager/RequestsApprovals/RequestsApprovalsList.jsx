import CanteenOperationsRegister from '../../../Common/operations/CanteenOperationsRegister'
import { StatusBadge } from '../../../Common/ui'
import { REQUESTS } from './requestsData'

const columns = [
    { key: 'requestId', label: 'Request', required: true },
    {
        key: 'title',
        label: 'Requirement',
        required: true,
        render: (request) => <div><p className='font-semibold text-[var(--erp-ink)]'>{request.title}</p><p className='mt-0.5 text-xs text-[var(--erp-muted)]'>{request.requestType} · required {request.requiredByDate}</p></div>,
    },
    { key: 'requestedAmount', label: 'Amount', required: true },
    { key: 'budgetCategory', label: 'Budget category' },
    { key: 'priority', label: 'Priority', required: true, render: (request) => <StatusBadge status={request.priority} /> },
    { key: 'submittedDate', label: 'Submitted' },
    { key: 'sentTo', label: 'Decision owner', required: true },
    { key: 'status', label: 'Decision', required: true, render: (request) => <StatusBadge status={request.status} /> },
    { key: 'approvalDate', label: 'Decision date' },
]

const RequestsApprovalsList = () => (
    <CanteenOperationsRegister
        rows={REQUESTS}
        columns={columns}
        rowKey='requestId'
        title='Requests and approvals'
        description='Track stock, equipment, invoice and maintenance requests through their accountable decision owner.'
        caption='Canteen approval request register'
        searchPlaceholder='Search request, title, category or owner…'
        integrationDescription='These requests are frontend reference data. Production requires RBAC-scoped submission, budget validation, approval routing, rejection rationale, immutable decision history and procurement hand-off.'
        primaryFilter={{ key: 'status', label: 'Decision status' }}
        secondaryFilter={{ key: 'priority', label: 'Priority' }}
        createPath='/canteen-manager/requests-approvals/add-request'
        createLabel='Add request'
        viewPath={(request) => `/canteen-manager/requests-approvals/view-request/${request.requestId}`}
    />
)

export default RequestsApprovalsList
