import React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import InventoryInfo from './Components/InventoryInfo'
import { getInventoryItems, hydrateInventoryItemsFromApi, saveInventoryItems } from './inventoryData'

const read = (id) => String(document.getElementById(id)?.value ?? '').trim()

const AddInventory = () => {
    const navigate = useNavigate()

    const save = async () => {
        const itemName = read('item-name')
        if (!itemName) {
            toast.error('Item name is required.')
            return
        }
        await hydrateInventoryItemsFromApi()
        const id = `STN-${Date.now()}`
        const quantity = Number(read('quantity') || 0)
        const existing = getInventoryItems().filter((row) => row.itemName !== itemName)
        const saved = await saveInventoryItems([{
            id,
            itemId: id,
            itemName,
            category: read('category'),
            itemCode: read('item-code'),
            description: read('description'),
            availableQuantity: quantity,
            unit: read('unit'),
            reorderLevel: Number(read('reorder-level') || 0),
            unitCost: read('unit-cost'),
            supplier: read('supplier-name'),
            supplierContact: read('supplier-contact'),
            invoiceNumber: read('invoice-number'),
            status: quantity > 0 ? 'Available' : 'Out of Stock',
        }, ...existing])
        if (!saved) {
            toast.error('The inventory item could not be saved.')
            return
        }
        toast.success('Inventory item saved.')
        navigate('/stationery-store-manager/inventory')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Inventory</h2>
                <InventoryInfo />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button type='button' onClick={() => navigate('/stationery-store-manager/inventory')} className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Discard Changes
                </button>
                <button type='button' onClick={save} className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddInventory
