import React, { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Clock } from 'lucide-react'
import {
    MENU_OPTIONS,
    RFID_CUSTOMERS,
    calculateTotalAmount,
    formatCurrency,
    lookupCustomerByRfid,
} from '../addOrderData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full'

const selectClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-white'

const readOnlyClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-3 w-full bg-[#F9F9F9]'

const OrderInfo = () => {
    const [rfidCardNo, setRfidCardNo] = useState('')
    const [customer, setCustomer] = useState(null)
    const [selectedMenuIds, setSelectedMenuIds] = useState([])
    const [quantity, setQuantity] = useState(1)
    const [specialInstructions, setSpecialInstructions] = useState('')
    const [orderType, setOrderType] = useState('Counter')
    const [paymentMethod, setPaymentMethod] = useState('Cash')
    const [paymentStatus, setPaymentStatus] = useState('Paid')
    const [orderStatus, setOrderStatus] = useState('Preparing')
    const [expectedReadyTime, setExpectedReadyTime] = useState(new Date())

    const totalAmount = useMemo(
        () => calculateTotalAmount(selectedMenuIds, quantity),
        [selectedMenuIds, quantity],
    )

    const handleRfidChange = (value) => {
        setRfidCardNo(value)
        const match = lookupCustomerByRfid(value)
        setCustomer(match)
    }

    const handleRfidLookup = () => {
        const match = lookupCustomerByRfid(rfidCardNo)
        setCustomer(match)
    }

    const toggleMenuItem = (menuId) => {
        setSelectedMenuIds((prev) =>
            prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId],
        )
    }

    return (
        <div className='space-y-8 lg:mt-8 mt-2'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Customer Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="rfid-card" className='text-base font-medium text-[#1E1E1E]'>RFID Card No:</label>
                        <div className='flex gap-2'>
                            <input
                                type="text"
                                id="rfid-card"
                                list="rfid-suggestions"
                                value={rfidCardNo}
                                onChange={(e) => handleRfidChange(e.target.value)}
                                onBlur={handleRfidLookup}
                                placeholder="Scan or enter RFID"
                                className={inputClass}
                            />
                            <datalist id="rfid-suggestions">
                                {RFID_CUSTOMERS.map((entry) => (
                                    <option key={entry.rfidCardNo} value={entry.rfidCardNo} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Name:</label>
                        <input type="text" readOnly value={customer?.name ?? ''} placeholder="Auto" className={readOnlyClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Student ID / Employee ID:</label>
                        <input type="text" readOnly value={customer?.customerId ?? ''} placeholder="Auto" className={readOnlyClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Customer Type:</label>
                        <input type="text" readOnly value={customer?.customerType ?? ''} placeholder="Auto" className={readOnlyClass} />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Class / Department:</label>
                        <input type="text" readOnly value={customer?.classOrDepartment ?? ''} placeholder="Auto" className={readOnlyClass} />
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Order Details</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Menu Items:</label>
                        <div className='border border-[#D9D9D9] rounded-md p-3 max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'>
                            {MENU_OPTIONS.map((item) => (
                                <label
                                    key={item.id}
                                    className='flex items-center gap-2 text-sm text-[#1E1E1E] cursor-pointer p-2 rounded-md hover:bg-[#F9F9F9]'
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedMenuIds.includes(item.id)}
                                        onChange={() => toggleMenuItem(item.id)}
                                        className='accent-[#515DEF]'
                                    />
                                    <span>{item.name} ({formatCurrency(item.price)})</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="quantity" className='text-base font-medium text-[#1E1E1E]'>Quantity:</label>
                        <input
                            type="number"
                            id="quantity"
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="order-type" className='text-base font-medium text-[#1E1E1E]'>Order Type:</label>
                        <select id="order-type" value={orderType} onChange={(e) => setOrderType(e.target.value)} className={selectClass}>
                            <option value="Counter">Counter</option>
                            <option value="Pre-Order">Pre-Order</option>
                            <option value="Event">Event</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Total Amount:</label>
                        <input
                            type="text"
                            readOnly
                            value={totalAmount > 0 ? formatCurrency(totalAmount) : ''}
                            placeholder="Auto Calculated"
                            className={readOnlyClass}
                        />
                    </div>
                    <div className='lg:col-span-3 flex flex-col gap-y-2'>
                        <label htmlFor="special-instructions" className='text-base font-medium text-[#1E1E1E]'>Special Instructions:</label>
                        <textarea
                            id="special-instructions"
                            rows={3}
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Any special preparation notes"
                            className={`${inputClass} resize-none`}
                        />
                    </div>
                </div>
            </div>

            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Payment & Status</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="payment-method" className='text-base font-medium text-[#1E1E1E]'>Payment Method:</label>
                        <select id="payment-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={selectClass}>
                            <option value="Cash">Cash</option>
                            <option value="Wallet">Wallet</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="payment-status" className='text-base font-medium text-[#1E1E1E]'>Payment Status:</label>
                        <select id="payment-status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={selectClass}>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label htmlFor="order-status" className='text-base font-medium text-[#1E1E1E]'>Order Status:</label>
                        <select id="order-status" value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className={selectClass}>
                            <option value="Preparing">Preparing</option>
                            <option value="Ready">Ready</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#1E1E1E]'>Expected Ready Time:</label>
                        <div className='relative'>
                            <DatePicker
                                selected={expectedReadyTime}
                                onChange={(date) => setExpectedReadyTime(date)}
                                showTimeSelect
                                showTimeSelectOnly
                                timeIntervals={15}
                                timeCaption="Time"
                                dateFormat="h:mm aa"
                                className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-3 py-3 pr-10 focus:outline-none'
                            />
                            <Clock size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderInfo
