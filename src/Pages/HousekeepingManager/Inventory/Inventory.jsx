import InventoryRegister from '../../../Common/operations/InventoryRegister'
import { CATEGORIES, INVENTORY_ITEMS } from './inventoryData'

const columns = [
    { key: 'productId', label: 'Product ID', required: true },
    { key: 'productName', label: 'Product', required: true },
    { key: 'category', label: 'Category' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'unit', label: 'Unit' },
    { key: 'availableQuantity', label: 'Available' },
    { key: 'reorderLevel', label: 'Reorder at' },
    { key: 'lastPurchaseDate', label: 'Last purchase' },
    { key: 'status', label: 'Status', required: true },
]

const Inventory = () => (
    <InventoryRegister
        records={INVENTORY_ITEMS}
        columns={columns}
        categories={CATEGORIES}
        caption='Housekeeping inventory register'
        title='Housekeeping inventory'
        description='Read-only shared stock for cleaning chemicals, equipment and consumables. Submit an inventory requirement when replenishment is needed.'
        rowKey='productId'
        viewPath={(item) => `/housekeeping-manager/inventory/view-item/${item.productId}`}
    />
)

export default Inventory
