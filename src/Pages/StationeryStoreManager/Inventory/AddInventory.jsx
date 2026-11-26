import OperationsInventoryWorkspace from '../../../Common/operations/OperationsInventoryWorkspace'
import { CATEGORIES, UNITS } from './inventoryData'

const AddInventory = () => (
    <OperationsInventoryWorkspace
        title='Create stationery catalogue item'
        description='Prepare item identity, opening stock and supplier context for the stores catalogue.'
        backPath='/stationery-store-manager/inventory'
        categories={CATEGORIES}
        units={UNITS}
        itemLabel='Item'
        requireCode
        showUnitCost
        storageKey='erp:stationery:inventory-draft'
    />
)

export default AddInventory
