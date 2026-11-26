import { useParams } from 'react-router-dom'
import OperationsRequestDetail from '../../../Common/operations/OperationsRequestDetail'
import { REQUESTS } from './requestsData'

const ViewRequest = () => {
    const { id } = useParams()
    const request = REQUESTS.find((entry) => entry.requestId === id)

    return (
        <OperationsRequestDetail
            request={request}
            backPath='/canteen-manager/requests-approvals'
            workflowStages={['Canteen Manager', 'Operations Head', 'Finance review', 'Approved / Rejected']}
        />
    )
}

export default ViewRequest
