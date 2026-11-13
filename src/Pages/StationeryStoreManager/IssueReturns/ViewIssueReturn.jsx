import { useParams } from 'react-router-dom'
import OperationsCustodyDetail from '../../../Common/operations/OperationsCustodyDetail'
import { getIssueReturnById } from './issueReturnsData'

const ViewIssueReturn = () => {
    const { id } = useParams()
    return <OperationsCustodyDetail record={getIssueReturnById(id)} backPath='/stationery-store-manager/issue-returns' />
}

export default ViewIssueReturn
