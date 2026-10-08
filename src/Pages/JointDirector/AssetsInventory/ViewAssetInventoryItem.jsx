import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
    getAssetById,
    getViewFilter,
    statusBadgeColor,
    alertBadgeColor,
} from './assetsInventoryData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value ?? '—'}</span>
    </div>
)

const ViewAssetInventoryItem = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const item = getAssetById(id)
    const viewMeta = item ? getViewFilter(item.viewType) : null

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/joint-director/assets-inventory')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!item ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Asset or inventory item not found.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                            <div>
                                <h1 className='text-2xl font-semibold text-black'>{item.assetProduct}</h1>
                                <p className='text-sm text-[#667085] mt-1'>
                                    {item.id} · {item.department} · {item.assetCategory}
                                </p>
                                {viewMeta?.sub && (
                                    <p className='text-xs text-[#808080] mt-1'>{viewMeta.label}: {viewMeta.sub}</p>
                                )}
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${alertBadgeColor[item.alertType]}`}>
                                    {item.alertType}
                                </span>
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[item.status]}`}>
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Section title='Asset / Inventory Details'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            <Field label='Department' value={item.department} />
                            <Field label='Asset Category' value={item.assetCategory} />
                            <Field label='Asset/Product' value={item.assetProduct} />
                            <Field label='Current Quantity' value={item.currentQuantity} />
                            <Field label='Alert Type' value={item.alertType} />
                            <Field label='Status' value={item.status} />
                            <Field label='Last Updated' value={item.lastUpdated} />
                            {item.reorderLevel != null && (
                                <Field label='Reorder Level' value={item.reorderLevel} />
                            )}
                            {item.warrantyExpiry && (
                                <Field label='Warranty Expiry' value={item.warrantyExpiry} />
                            )}
                            {item.maintenanceDue && (
                                <Field label='Maintenance Due' value={item.maintenanceDue} />
                            )}
                            <div className='lg:col-span-3'>
                                <Field label='Description' value={item.description} />
                            </div>
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewAssetInventoryItem
