import OperationsCustodyWorkspace from '../../../Common/operations/OperationsCustodyWorkspace'
import { CONDITION_OPTIONS, DEPARTMENTS, ITEM_OPTIONS, PURPOSE_OPTIONS } from './issueReturnsData'

const AddIssueReturn = () => (
    <OperationsCustodyWorkspace
        backPath='/stationery-store-manager/issue-returns'
        departments={DEPARTMENTS}
        items={ITEM_OPTIONS}
        purposes={PURPOSE_OPTIONS}
        conditions={CONDITION_OPTIONS}
        storageKey='erp:stationery:custody-draft'
    />
)

export default AddIssueReturn
