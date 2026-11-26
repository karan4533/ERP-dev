import OperationsInventoryWorkspace from '../../../Common/operations/OperationsInventoryWorkspace'
import { CATEGORIES, UNITS } from './inventoryData'

const AddInventory = () => (
    <OperationsInventoryWorkspace
        title='Create housekeeping inventory item'
        description='Prepare a cleaning supply or equipment item with opening stock and supplier context.'
        backPath='/housekeeping-manager/inventory'
        categories={CATEGORIES}
        units={UNITS}
        itemLabel='Product'
        storageKey='erp:housekeeping:inventory-draft'
    />
)

export default AddInventory
