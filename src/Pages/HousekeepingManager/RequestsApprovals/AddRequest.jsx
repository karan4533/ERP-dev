import OperationsRequestWorkspace from '../../../Common/operations/OperationsRequestWorkspace'
import { AUTO_FILLED, BUDGET_CATEGORIES, PRIORITY_OPTIONS, REQUEST_TYPE_OPTIONS, WORKFLOW_STAGES } from './requestsData'

const AddRequest = () => (
    <OperationsRequestWorkspace
        title='Create housekeeping request'
        description='Prepare a supplies or equipment request with item-level estimates for operational review.'
        backPath='/housekeeping-manager/requests-approvals'
        requestTypes={REQUEST_TYPE_OPTIONS}
        priorityOptions={PRIORITY_OPTIONS}
        budgetCategories={BUDGET_CATEGORIES}
        requester={AUTO_FILLED.requestedBy}
        department={AUTO_FILLED.department}
        sentTo={AUTO_FILLED.sentTo}
        workflow={WORKFLOW_STAGES}
        enableLineItems
        storageKey='erp:housekeeping:request-draft'
    />
)

export default AddRequest
