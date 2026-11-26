import InventoryRegister from '../../../Common/operations/InventoryRegister'
import { CATEGORIES, INVENTORY_ITEMS } from './inventoryData'

const columns = [
    { key: 'productId', label: 'Item Code', required: true },
    { key: 'productName', label: 'Spare / Material', required: true },
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
        caption='Maintenance spares & equipment register'
        title='Maintenance Spares & Equipment Inventory'
        description='Register of critical spares, replacement parts, electrical consumables, and diagnostic equipment maintained for immediate campus repairs.'
        rowKey='productId'
        viewPath={(item) => `/maintenance-manager/inventory/view-item/${item.productId}`}
    />
)

export default Inventory

