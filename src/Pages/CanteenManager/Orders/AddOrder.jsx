import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import OrderInfo from './Components/OrderInfo'
import OrderModal from './Components/OrderModal'
import {
    EMPTY_ORDER_DRAFT,
    buildOrderRecord,
    menuOptionsFromItems,
} from './addOrderData'
import { getOrders, hydrateOrdersFromApi, saveOrders } from './ordersData'
import { getMenuItems, hydrateMenuItemsFromApi } from '../MenuManagement/menuData'

const AddOrder = () => {
    const navigate = useNavigate()
    const [draft, setDraft] = useState(() => ({
        ...EMPTY_ORDER_DRAFT,
        expectedReadyTime: new Date(),
    }))
    const [orderModal, setOrderModal] = useState(false)
    const [saving, setSaving] = useState(false)

    const save = async () => {
        if (saving) return
        if (!draft.selectedMenuIds?.length) {
            toast.error('Select at least one menu item.')
            return
        }
        const qty = Math.max(Number(draft.quantity) || 0, 0)
        if (!qty) {
            toast.error('Quantity must be at least 1.')
            return
        }

        setSaving(true)
        try {
            await Promise.all([hydrateOrdersFromApi(), hydrateMenuItemsFromApi()])
            const menuOptions = menuOptionsFromItems(getMenuItems())
            const record = buildOrderRecord(draft, menuOptions)
            if (!record.items.length) {
                toast.error('Selected menu items are no longer available. Refresh and try again.')
                return
            }
            const existing = getOrders().filter((row) => row.orderId !== record.orderId && row.id !== record.id)
            // Success UI only after saveOrders confirms persistence (API replace or offline store).
            await saveOrders([record, ...existing])
            setOrderModal(true)
        } catch (err) {
            toast.error(err?.message || 'The order could not be saved. Check your connection and try again.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Order Information</h2>
                <OrderInfo draft={draft} onChange={setDraft} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate('/canteen-manager/orders')}
                    disabled={saving}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={save}
                    disabled={saving}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'
                >
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>

            <OrderModal orderModal={orderModal} setOrderModal={setOrderModal} />
        </section>
    )
}

export default AddOrder
