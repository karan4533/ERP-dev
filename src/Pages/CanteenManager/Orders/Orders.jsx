import CanteenOperationsRegister from '../../../Common/operations/CanteenOperationsRegister'
import { StatusBadge } from '../../../Common/ui'
import { ORDERS } from './ordersData'

const columns = [
    { key: 'orderId', label: 'Order', required: true },
    {
        key: 'customerName',
        label: 'Customer',
        required: true,
        render: (order) => <div><p className='font-semibold text-[var(--erp-ink)]'>{order.customerName}</p><p className='mt-0.5 text-xs text-[var(--erp-muted)]'>{order.customerType} · {order.customerId}</p></div>,
    },
    { key: 'classOrDepartment', label: 'Class / department' },
    { key: 'itemsCount', label: 'Items', required: true },
    { key: 'totalAmount', label: 'Amount', required: true },
    { key: 'paymentMethod', label: 'Payment method' },
    { key: 'paymentStatus', label: 'Payment', required: true, render: (order) => <StatusBadge status={order.paymentStatus} /> },
    { key: 'orderStatus', label: 'Fulfilment', required: true, render: (order) => <StatusBadge status={order.orderStatus} /> },
    { key: 'orderDateTime', label: 'Ordered at' },
]

const Orders = () => (
    <CanteenOperationsRegister
        rows={ORDERS}
        columns={columns}
        rowKey='orderId'
        title='Order fulfilment'
        description='Prioritise paid orders through preparation and hand-off while keeping payment and fulfilment state separate.'
        caption='Canteen order fulfilment register'
        searchPlaceholder='Search order, customer, ID or item…'
        integrationDescription='These orders are frontend reference data. Production requires server-owned order transitions, wallet/payment verification, inventory reservations, receipt numbering and timestamped hand-off evidence.'
        primaryFilter={{ key: 'orderStatus', label: 'Fulfilment status' }}
        secondaryFilter={{ key: 'paymentStatus', label: 'Payment status' }}
        createPath='/canteen-manager/orders/add-order'
        createLabel='Add counter order'
        viewPath={(order) => `/canteen-manager/orders/view-order/${order.orderId}`}
    />
)

export default Orders
