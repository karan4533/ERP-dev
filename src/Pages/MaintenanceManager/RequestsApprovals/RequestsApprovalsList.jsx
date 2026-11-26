import OperationsRecordRegister from '../../../Common/operations/OperationsRecordRegister'
import { StatusBadge } from '../../../Common/ui'
import { REQUESTS, REQUEST_TYPE_OPTIONS } from './requestsData'

const columns = [
    { key: 'requestId', label: 'Request', required: true },
    {
        key: 'title',
        label: 'Requirement',
        required: true,
        render: (request) => (
            <div>
                <p className='font-semibold text-[var(--erp-ink)]'>{request.title}</p>
                <p className='mt-0.5 text-xs text-[var(--erp-muted)]'>
                    {request.requestType} · {request.budgetCategory}
                </p>
            </div>
        ),
    },
    { key: 'amount', label: 'Amount', required: true },
    { key: 'vendor', label: 'Proposed vendor' },
    { key: 'priority', label: 'Priority', required: true, render: (request) => <StatusBadge status={request.priority} /> },
    { key: 'submittedDate', label: 'Submitted' },
    { key: 'currentStage', label: 'Current owner', required: true, render: (request) => <StatusBadge status={request.currentStage} /> },
    { key: 'status', label: 'Decision', required: true, render: (request) => <StatusBadge status={request.status} /> },
]

const RequestsApprovalsList = () => (
    <OperationsRecordRegister
        rows={REQUESTS}
        columns={columns}
        rowKey='requestId'
        title='Maintenance Requests & Approvals'
        description='Submit and track campus infrastructure requisitions, vendor AMC renewals, major equipment repairs, and spares indents through Joint Director Operations and Finance.'
        caption='Maintenance approval request register'
        searchPlaceholder='Search request, title, vendor or budget category…'
        integrationTitle='Maintenance approval workflow active'
        integrationDescription='Requisitions follow the documented institutional SOP: Maintenance Manager → Joint Director Operations → Finance approval.'
        primaryFilter={{ key: 'requestType', label: 'Request type', options: REQUEST_TYPE_OPTIONS }}
        secondaryFilter={{ key: 'status', label: 'Decision status' }}
        createPath='/maintenance-manager/requests-approvals/add-request'
        createLabel='Add request'
        viewPath={(request) => `/maintenance-manager/requests-approvals/view-request/${request.requestId}`}
    />
)

export default RequestsApprovalsList

