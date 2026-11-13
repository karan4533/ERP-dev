import OperationsRequestWorkspace from '../../../Common/operations/OperationsRequestWorkspace'
import { AUTO_FILLED, BUDGET_CATEGORIES, PRIORITY_OPTIONS, REQUEST_TYPE_OPTIONS } from './requestsData'

const AddRequest = () => (
    <OperationsRequestWorkspace
        title='Create canteen request'
        description='Prepare stock, equipment, vendor-bill or maintenance requests for operations review.'
        backPath='/canteen-manager/requests-approvals'
        requestTypes={REQUEST_TYPE_OPTIONS}
        priorityOptions={PRIORITY_OPTIONS}
        budgetCategories={BUDGET_CATEGORIES}
        requester={AUTO_FILLED.requestedBy}
        department={AUTO_FILLED.department}
        sentTo={AUTO_FILLED.sentTo}
        workflow={['Canteen Manager', 'Operations Head', 'Finance review', 'Approved / Rejected']}
        showRequiredByDate
        storageKey='erp:canteen:request-draft'
    />
)

export default AddRequest
