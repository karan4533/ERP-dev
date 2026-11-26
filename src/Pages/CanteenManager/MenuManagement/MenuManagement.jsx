import CanteenOperationsRegister from '../../../Common/operations/CanteenOperationsRegister'
import { StatusBadge } from '../../../Common/ui'
import { MENU_ITEMS } from './menuData'

const columns = [
    { key: 'menuId', label: 'Menu ID', required: true },
    {
        key: 'itemName',
        label: 'Menu item',
        required: true,
        render: (item) => <div><p className='font-semibold text-[var(--erp-ink)]'>{item.itemName}</p><p className='mt-0.5 text-xs text-[var(--erp-muted)]'>{item.itemCode}</p></div>,
    },
    { key: 'category', label: 'Category', required: true },
    { key: 'price', label: 'Price', required: true },
    { key: 'availability', label: 'Availability', required: true, render: (item) => <StatusBadge status={item.availability} /> },
    { key: 'isCombo', label: 'Combo' },
    { key: 'status', label: 'Menu state', render: (item) => <StatusBadge status={item.status} /> },
    { key: 'createdBy', label: 'Owner' },
    { key: 'lastUpdated', label: 'Last updated' },
]

const MenuManagement = () => (
    <CanteenOperationsRegister
        rows={MENU_ITEMS}
        columns={columns}
        rowKey='menuId'
        title='Menu management'
        description='Review catalogue availability, price and ownership before publishing an item to ordering channels.'
        caption='Canteen menu catalogue'
        searchPlaceholder='Search item, code, category or owner…'
        integrationDescription='These menu items are frontend reference data. Production requires catalogue versioning, recipe and allergen data, price approval, availability windows and channel publication from the canteen API.'
        primaryFilter={{ key: 'category', label: 'Category' }}
        secondaryFilter={{ key: 'availability', label: 'Availability' }}
        createPath='/canteen-manager/menu-management/add-menu-item'
        createLabel='Add menu item'
        viewPath={(item) => `/canteen-manager/menu-management/view-menu/${item.menuId}`}
    />
)

export default MenuManagement
