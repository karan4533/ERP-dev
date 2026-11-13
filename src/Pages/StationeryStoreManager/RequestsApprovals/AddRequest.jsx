import OperationsRequestWorkspace from '../../../Common/operations/OperationsRequestWorkspace'
import { AUTO_FILLED, BUDGET_CATEGORIES, PRIORITY_OPTIONS, REQUEST_TYPE_OPTIONS, WORKFLOW_STAGES } from './requestsData'

const AddRequest = () => (
    <OperationsRequestWorkspace
        title='Create stationery request'
        description='Prepare a stock-replenishment or purchase request with item-level estimates.'
        backPath='/stationery-store-manager/requests-approvals'
        requestTypes={REQUEST_TYPE_OPTIONS}
        priorityOptions={PRIORITY_OPTIONS}
        budgetCategories={BUDGET_CATEGORIES}
        requester={AUTO_FILLED.requestedBy}
        department={AUTO_FILLED.department}
        sentTo={AUTO_FILLED.sentTo}
        workflow={WORKFLOW_STAGES}
        enableLineItems
        storageKey='erp:stationery:request-draft'
    />
)

export default AddRequest
