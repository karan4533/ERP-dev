import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import {
    ORDERS,
    paymentStatusBadgeColor,
    orderStatusBadgeColor,
} from './ordersData'

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

const ViewOrder = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const order = ORDERS.find((entry) => entry.orderId === id) ?? ORDERS[0]

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/canteen-manager/orders')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <button
                    type='button'
                    className='inline-flex items-center gap-2 text-sm bg-[#515DEF] text-white px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                >
                    <Printer size={16} />
                    Print Receipt
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{order.orderId}</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            {order.customerName} · {order.customerType}
                        </p>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        <Badge label={order.paymentStatus} colorMap={paymentStatusBadgeColor} />
                        <Badge label={order.orderStatus} colorMap={orderStatusBadgeColor} />
                    </div>
                </div>
            </div>

            <Section title='Order details'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Order ID' value={order.orderId} />
                    <Field label='Customer name' value={order.customerName} />
                    <Field label='Customer type' value={order.customerType} />
                    <Field label='Student ID / Employee ID' value={order.customerId} />
                    <Field label='Class / Department' value={order.classOrDepartment} />
                    <Field label='Items count' value={order.itemsCount} />
                    <Field label='Total amount' value={order.totalAmount} />
                    <Field label='Payment method' value={order.paymentMethod} />
                    <Field label='Payment status' value={order.paymentStatus} />
                    <Field label='Order status' value={order.orderStatus} />
                    <Field label='Order date & time' value={order.orderDateTime} />
                </div>
            </Section>

            <Section title='Ordered items'>
                <ul className='list-disc list-inside space-y-2 text-sm text-[#1E1E1E]'>
                    {order.items.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </Section>
        </section>
    )
}

export default ViewOrder
