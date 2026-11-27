import React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import MenuItemInfo from './Components/MenuItemInfo'
import { getMenuItems, hydrateMenuItemsFromApi, saveMenuItems } from './menuData'

const read = (id) => String(document.getElementById(id)?.value ?? '').trim()

const AddMenuItem = () => {
    const navigate = useNavigate()

    const save = async () => {
        const itemName = read('item-name')
        if (!itemName) {
            toast.error('Item name is required.')
            return
        }
        await hydrateMenuItemsFromApi()
        const id = `MENU-${Date.now()}`
        const existing = getMenuItems().filter((row) => row.itemName !== itemName)
        const saved = await saveMenuItems([{
            id,
            menuId: id,
            itemName,
            category: read('category'),
            itemCode: read('item-code'),
            price: read('price'),
            availability: read('availability') || 'Available',
            isCombo: read('is-combo') || 'No',
            status: read('status') || 'Active',
            description: read('description'),
        }, ...existing])
        if (!saved) {
            toast.error('The menu item could not be saved.')
            return
        }
        toast.success('Menu item saved.')
        navigate('/canteen-manager/menu-management')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Menu Item Information</h2>
                <MenuItemInfo />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/canteen-manager/menu-management')}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={save}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Changes
                </button>
            </div>
        </section>
    )
}

export default AddMenuItem
