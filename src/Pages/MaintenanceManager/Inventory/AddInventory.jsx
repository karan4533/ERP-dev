import OperationsInventoryWorkspace from '../../../Common/operations/OperationsInventoryWorkspace'
import { CATEGORIES, UNITS } from './inventoryData'

const AddInventory = () => (
    <OperationsInventoryWorkspace
        title='Add Maintenance Spare / Equipment'
        description='Register a new electrical, plumbing, civil, or HVAC spare with opening stock, reorder threshold, and supplier contact details.'
        backPath='/maintenance-manager/inventory'
        categories={CATEGORIES}
        units={UNITS}
        itemLabel='Spare Part'
        storageKey='erp:maintenance:inventory-draft'
    />
)

export default AddInventory

