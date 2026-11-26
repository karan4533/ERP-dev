import { useParams } from 'react-router-dom'
import OperationsRequestDetail from '../../../Common/operations/OperationsRequestDetail'
import { getRequestById, WORKFLOW_STAGES } from './requestsData'

const ViewRequest = () => {
    const { id } = useParams()

    return (
        <OperationsRequestDetail
            request={getRequestById(id)}
            backPath='/stationery-store-manager/requests-approvals'
            workflowStages={WORKFLOW_STAGES}
        />
    )
}

export default ViewRequest
