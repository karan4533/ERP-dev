import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
    MENU_ITEMS,
    availabilityBadgeColor,
    statusBadgeColor,
    comboBadgeColor,
} from './menuData'

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

const Badge = ({ label, colorMap }) => (
    <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${colorMap[label]}`}>
        {label}
    </span>
)

const ViewMenuItem = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const item = MENU_ITEMS.find((entry) => entry.menuId === id) ?? MENU_ITEMS[0]

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/canteen-manager/menu-management')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div>
                    <h1 className='text-2xl font-semibold text-black'>{item.itemName}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            <span className='font-medium text-[#1E1E1E]'>{item.menuId}</span>
                            {' · '}
                            <span className='text-[#808080]'>{item.itemCode}</span>
                        </p>
                        <div className='flex flex-wrap gap-2 mt-3'>
                            <Badge label={item.availability} colorMap={availabilityBadgeColor} />
                            <Badge label={item.status} colorMap={statusBadgeColor} />
                            <Badge label={item.isCombo} colorMap={comboBadgeColor} />
                        </div>
                </div>
            </div>

            <Section title='Menu item details'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Menu ID' value={item.menuId} />
                    <Field label='Item name' value={item.itemName} />
                    <Field label='Category' value={item.category} />
                    <Field label='Item code' value={item.itemCode} />
                    <Field label='Price' value={item.price} />
                    <Field label='Availability' value={item.availability} />
                    <Field label='Is combo' value={item.isCombo} />
                    <Field label='Status' value={item.status} />
                    <div className='lg:col-span-3'>
                        <Field label='Description' value={item.description} />
                    </div>
                </div>
            </Section>

            <Section title='Audit information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Created by' value={item.createdBy} />
                    <Field label='Created date' value={item.createdDate} />
                    <Field label='Last updated' value={item.lastUpdated} />
                </div>
            </Section>
        </section>
    )
}

export default ViewMenuItem
