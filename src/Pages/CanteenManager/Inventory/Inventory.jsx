import InventoryRegister from '../../../Common/operations/InventoryRegister'

const INVENTORY_ITEMS = [
    { id: 'INV-001', name: 'Basmati Rice', category: 'Grains', quantity: 25, unit: 'kg', reorderLevel: 10, status: 'In Stock' },
    { id: 'INV-002', name: 'Cooking Oil', category: 'Essentials', quantity: 8, unit: 'L', reorderLevel: 15, status: 'Low Stock' },
    { id: 'INV-003', name: 'Fresh Vegetables', category: 'Produce', quantity: 40, unit: 'kg', reorderLevel: 20, status: 'In Stock' },
    { id: 'INV-004', name: 'Chicken (Fresh)', category: 'Meat', quantity: 5, unit: 'kg', reorderLevel: 12, status: 'Critical' },
]

const columns = [
    { key: 'id', label: 'Item ID', required: true },
    { key: 'name', label: 'Ingredient', required: true },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Available' },
    { key: 'unit', label: 'Unit' },
    { key: 'reorderLevel', label: 'Reorder at' },
    { key: 'status', label: 'Status', required: true },
]

const Inventory = () => (
    <InventoryRegister
        records={INVENTORY_ITEMS}
        columns={columns}
        categories={['Grains', 'Essentials', 'Produce', 'Meat']}
        caption='Canteen ingredient inventory register'
        title='Canteen ingredient inventory'
        description='Review current kitchen ingredient availability and reorder exposure. Batch, expiry and allergen data require the production inventory service.'
        rowKey='id'
        createPending
    />
)

export default Inventory
