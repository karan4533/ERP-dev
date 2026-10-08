import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getInventoryItemById, statusBadgeColor } from './inventoryData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value}</span>
    </div>
)

const ViewInventoryItem = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const item = getInventoryItemById(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button type='button' onClick={() => navigate('/housekeeping-manager/inventory')} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!item ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Inventory item not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                            <div>
                                <h1 className='text-2xl font-semibold text-black'>{item.productName}</h1>
                                <p className='text-sm text-[#667085] mt-1'>{item.productId} · {item.category}</p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap w-fit ${statusBadgeColor[item.status]}`}>
                                {item.status}
                            </span>
                        </div>
                    </div>

                    <Section title='Product Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Product ID' value={item.productId} />
                            <Field label='Product Name' value={item.productName} />
                            <Field label='Category' value={item.category} />
                            <div className='lg:col-span-3'>
                                <Field label='Description' value={item.description} />
                            </div>
                        </div>
                    </Section>

                    <Section title='Stock Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Available Quantity' value={item.availableQuantity} />
                            <Field label='Unit' value={item.unit} />
                            <Field label='Reorder Level' value={item.reorderLevel} />
                        </div>
                    </Section>

                    <Section title='Supplier Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Supplier Name' value={item.supplier} />
                            <Field label='Supplier Contact' value={item.supplierContact} />
                        </div>
                    </Section>

                    <Section title='Purchase Information'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Purchase Date' value={item.purchaseDate} />
                            <Field label='Last Purchase Date' value={item.lastPurchaseDate} />
                            <Field label='Invoice Number' value={item.invoiceNumber} />
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewInventoryItem
