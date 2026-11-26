import { useParams } from 'react-router-dom'
import OperationsInventoryDetail from '../../../Common/operations/OperationsInventoryDetail'
import { getInventoryItemById } from './inventoryData'
import { getInventoryCatalog } from '../../../Common/StoresProcurement/storesProcurementData'

const ViewInventoryItem = () => {
    const { id } = useParams()
    let source = getInventoryItemById(id)
    if (!source) {
        try {
            const catalog = getInventoryCatalog()
            const found = catalog.find((c) => c.itemCode === id || c.id === id)
            if (found) {
                source = {
                    itemId: found.itemCode || found.id,
                    itemName: found.itemName,
                    itemCode: found.itemCode || found.id,
                    category: found.category,
                    description: found.description || found.itemName,
                    availableQuantity: found.currentStock ?? found.quantity,
                    reorderLevel: found.minimumStock ?? 10,
                    unit: found.unitOfMeasure || 'Pieces',
                    unitCost: `₹${found.unitPrice || 0}`,
                    stockValue: `₹${(found.currentStock || 0) * (found.unitPrice || 0)}`,
                    supplier: found.supplierName || 'Empanelled Vendor',
                    supplierContact: '+91 98401 23456',
                    purchaseDate: new Date().toLocaleDateString('en-GB'),
                    invoiceNumber: 'INV-CAT-DIRECT',
                }
            }
        } catch (e) {
            console.warn('Error resolving inventory catalog fallback:', e)
        }
    }

    const item = source && {
        id: source.itemId,
        name: source.itemName,
        code: source.itemCode,
        category: source.category,
        description: source.description,
        availableQuantity: source.availableQuantity,
        reorderLevel: source.reorderLevel,
        unit: source.unit,
        unitCost: source.unitCost,
        stockValue: source.stockValue,
        supplier: source.supplier,
        supplierContact: source.supplierContact,
        purchaseDate: source.purchaseDate,
        invoiceNumber: source.invoiceNumber,
    }

    return <OperationsInventoryDetail item={item} backPath='/stationery-store-manager/inventory' itemLabel='Item' showCost />
}

export default ViewInventoryItem
