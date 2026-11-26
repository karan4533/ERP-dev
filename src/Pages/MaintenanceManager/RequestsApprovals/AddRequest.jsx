import OperationsRequestWorkspace from '../../../Common/operations/OperationsRequestWorkspace'
import { AUTO_FILLED, BUDGET_CATEGORIES, PRIORITY_OPTIONS, REQUEST_TYPE_OPTIONS, WORKFLOW_STAGES } from './requestsData'

const AddRequest = () => (
    <OperationsRequestWorkspace
        title='Create Maintenance Request'
        description='Prepare an equipment purchase, AMC servicing renewal, or spares replenishment request with item-level estimates for Joint Director Operations and Finance review.'
        backPath='/maintenance-manager/requests-approvals'
        requestTypes={REQUEST_TYPE_OPTIONS}
        priorityOptions={PRIORITY_OPTIONS}
        budgetCategories={BUDGET_CATEGORIES}
        requester={AUTO_FILLED.requestedBy}
        department={AUTO_FILLED.department}
        sentTo={AUTO_FILLED.sentTo}
        workflow={WORKFLOW_STAGES}
        enableLineItems
        storageKey='erp:maintenance:request-draft'
    />
)

export default AddRequest

