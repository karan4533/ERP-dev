import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
    getFuelExpenseById,
    getServiceExpenseById,
    getOtherExpenseById,
} from './transportExpensesData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>
            {value || '—'}
        </span>
    </div>
)

const VIEW_CONFIG = {
    fuel: {
        title: 'Fuel Expense Information',
        getRecord: getFuelExpenseById,
        fields: (record) => [
            { label: 'Expense ID', value: record.expenseId },
            { label: 'Vehicle Number', value: record.vehicleNumber },
            { label: 'Driver Name', value: record.driverName },
            { label: 'Fuel Date', value: record.fuelDate },
            { label: 'Fuel Station', value: record.fuelStation },
            { label: 'Fuel Quantity', value: record.fuelQuantity },
            { label: 'Amount', value: record.amount },
            { label: 'Payment Mode', value: record.paymentMode },
        ],
        subtitle: (record) => `${record.vehicleNumber} · ${record.fuelDate} · ${record.amount}`,
    },
    service: {
        title: 'Service Expense Information',
        getRecord: getServiceExpenseById,
        fields: (record) => [
            { label: 'Expense ID', value: record.expenseId },
            { label: 'Vehicle Number', value: record.vehicleNumber },
            { label: 'Service Type', value: record.serviceType },
            { label: 'Service Date', value: record.serviceDate },
            { label: 'Service Center', value: record.serviceCenter },
            { label: 'Amount', value: record.amount },
            { label: 'Invoice Number', value: record.invoiceNumber },
            { label: 'Remarks', value: record.remarks },
        ],
        subtitle: (record) => `${record.vehicleNumber} · ${record.serviceType} · ${record.amount}`,
    },
    other: {
        title: 'Other Expense Information',
        getRecord: getOtherExpenseById,
        fields: (record) => [
            { label: 'Expense ID', value: record.expenseId },
            { label: 'Vehicle Number', value: record.vehicleNumber },
            { label: 'Expense Type', value: record.expenseType },
            { label: 'Expense Date', value: record.expenseDate },
            { label: 'Amount', value: record.amount },
            { label: 'Paid To', value: record.paidTo },
            { label: 'Payment Mode', value: record.paymentMode },
            { label: 'Description', value: record.description },
        ],
        subtitle: (record) => `${record.vehicleNumber} · ${record.expenseType} · ${record.amount}`,
    },
}

const ViewTransportExpense = () => {
    const { type, id } = useParams()
    const navigate = useNavigate()
    const config = VIEW_CONFIG[type]
    const record = config?.getRecord(id)

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/transport-manager/transport-expenses')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            {!config || !record ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Expense record not found or could not be loaded.
                </div>
            ) : (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h1 className='text-2xl font-semibold text-black'>{record.expenseId}</h1>
                        <p className='text-sm text-[#667085] mt-2'>{config.subtitle(record)}</p>
                    </div>

                    <Section title={config.title}>
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                            {config.fields(record).map((field) => (
                                <Field key={field.label} label={field.label} value={field.value} />
                            ))}
                        </div>
                    </Section>
                </>
            )}
        </section>
    )
}

export default ViewTransportExpense
