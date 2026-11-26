import { useParams } from 'react-router-dom'
import CanteenOrderDetail from '../../../Common/operations/CanteenOrderDetail'
import { ORDERS } from './ordersData'

const ViewOrder = () => {
    const { id } = useParams()
    const order = ORDERS.find((entry) => entry.orderId === id)
    return <CanteenOrderDetail order={order} backPath='/canteen-manager/orders' />
}

export default ViewOrder
