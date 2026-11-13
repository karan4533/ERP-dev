import { useParams } from 'react-router-dom'
import OperationsInventoryDetail from '../../../Common/operations/OperationsInventoryDetail'
import { getInventoryItemById } from './inventoryData'

const ViewInventoryItem = () => {
    const { id } = useParams()
    const source = getInventoryItemById(id)
    const item = source && {
        id: source.productId,
        name: source.productName,
        category: source.category,
        description: source.description,
        availableQuantity: source.availableQuantity,
        reorderLevel: source.reorderLevel,
        unit: source.unit,
        supplier: source.supplier,
        supplierContact: source.supplierContact,
        purchaseDate: source.purchaseDate,
        lastPurchaseDate: source.lastPurchaseDate,
        invoiceNumber: source.invoiceNumber,
    }

    return <OperationsInventoryDetail item={item} backPath='/housekeeping-manager/inventory' itemLabel='Product' />
}

export default ViewInventoryItem
