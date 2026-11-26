import React, { useState, useEffect, useMemo } from 'react'
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Calendar, ChevronLeft, ChevronRight, Search, CreditCard, CheckCircle2, AlertCircle, Receipt } from "lucide-react"
import { toast } from 'react-toastify'
import { feeService } from '../../../services/modules/feeService'
import { useAuth } from '../../../context/AuthContext'

const HostelPayment = () => {
    const { auth } = useAuth()
    const studentId = auth?.user?.id || 'STU-001'

    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)

    const bagdeColor = {
        "Paid": "bg-[#4CAF5033] text-[#4CAF50]",
        "Pending": "bg-[#FF980033] text-[#FF9800]",
        "Partially Paid": "bg-[#FF980033] text-[#FF9800]",
        "Not Paid": "bg-[#FF000033] text-[#FF0000]",
    }

    const loadHostelInvoices = async () => {
        setLoading(true)
        try {
            const res = await feeService.getInvoices({ feeHead: 'FH-HSTL' })
            if (res.success && Array.isArray(res.data)) {
                // Find invoices for this student or related hostel invoices
                const matched = res.data.filter((inv) => inv.studentId === studentId || inv.feeHeadId === 'FH-HSTL')
                if (matched.length > 0) {
                    setInvoices(matched)
                } else {
                    // Seed fallback row
                    setInvoices([
                        {
                            id: 'INV-HSTL-2026-001',
                            invoiceNumber: 'INV/2026/HSTL/001',
                            studentId: studentId,
                            feeHeadName: 'Hostel Term 1 Accommodation & Mess',
                            totalAmount: 18000,
                            balanceAmount: 0,
                            dueDate: '15-06-2025',
                            status: 'Paid',
                            paymentMethod: 'Net Banking'
                        },
                        {
                            id: 'INV-HSTL-2026-002',
                            invoiceNumber: 'INV/2026/HSTL/002',
                            studentId: studentId,
                            feeHeadName: 'Hostel Term 2 Accommodation & Mess',
                            totalAmount: 18000,
                            balanceAmount: 18000,
                            dueDate: '15-12-2025',
                            status: 'Pending',
                            paymentMethod: 'Pending Gateway / Cheque'
                        }
                    ])
                }
            }
        } catch (err) {
            console.warn('Failed to load hostel fee invoices:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadHostelInvoices()
    }, [studentId])

    const handlePayNow = async (invoice) => {
        try {
            const res = await feeService.recordPayment({
                invoiceId: invoice.id,
                amountPaid: invoice.balanceAmount || invoice.totalAmount,
                paymentMode: 'Net Banking',
                transactionReference: `UPI-HSTL-${Date.now().toString().slice(-6)}`,
            })
            if (res.success) {
                toast.success(`✓ Payment of ₹${Number(invoice.balanceAmount || invoice.totalAmount).toLocaleString('en-IN')} recorded successfully! Receipt generated.`)
                loadHostelInvoices()
            }
        } catch (err) {
            toast.error(err.message || 'Payment simulation failed.')
        }
    }

    const filteredInvoices = useMemo(() => {
        return invoices.filter((inv) => {
            const matchesQuery =
                !searchQuery ||
                inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inv.feeHeadName?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus =
                statusFilter === 'All' ||
                inv.status === statusFilter

            return matchesQuery && matchesStatus
        })
    }, [invoices, searchQuery, statusFilter])

    return (
        <section className='space-y-6'>
            {/* Filter Section */}
            <div className='bg-white rounded-2xl shadow-md p-6'>
                <div className='flex justify-between md:items-center flex-col sm:flex-row gap-4'>
                    <button
                        type='button'
                        onClick={() => {
                            setSearchQuery('')
                            setStatusFilter('All')
                            setFromDate(null)
                            setToDate(null)
                        }}
                        className='bg-[#515DEF] text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-lg hover:opacity-90 transition-all cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <span className='text-xs font-semibold text-slate-500'>
                        Central Fee Management Synchronized Ledger (FH-HSTL)
                    </span>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6'>
                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-bold text-slate-500 uppercase'>Search Invoice / Term</label>
                        <div className='relative'>
                            <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' />
                            <input
                                type="text"
                                placeholder='Search by invoice no or term...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='text-sm text-slate-800 border border-slate-200 rounded-lg pl-9 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-bold text-slate-500 uppercase'>Payment Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='text-sm text-slate-800 border border-slate-200 rounded-lg px-3 py-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500'
                        >
                            <option value="All">All Invoices</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>

                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-bold text-slate-500 uppercase'>From Date</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable={true}
                                placeholderText="Select start date"
                                className='w-full text-sm text-slate-800 border border-slate-200 rounded-lg px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
                            />
                        </div>
                    </div>

                    <div className='flex flex-col gap-y-1.5'>
                        <label className='text-xs font-bold text-slate-500 uppercase'>To Date</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable={true}
                                placeholderText="Select end date"
                                className='w-full text-sm text-slate-800 border border-slate-200 rounded-lg px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar
                                size={16}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices List */}
            <div className='bg-white rounded-2xl shadow-md p-6'>
                <div className='flex justify-between items-center mb-4'>
                    <h2 className='text-lg font-bold text-slate-900'>Hostel Fees & Boarding Installments</h2>
                    <span className='text-xs font-semibold text-slate-500'>
                        {filteredInvoices.length} Record(s) Found
                    </span>
                </div>

                <div className="relative overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] text-[#0C1E5B] uppercase font-bold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3.5">Invoice / Fee Type</th>
                                <th className="px-4 py-3.5">Total Amount</th>
                                <th className="px-4 py-3.5">Balance Due</th>
                                <th className="px-4 py-3.5">Due Date</th>
                                <th className="px-4 py-3.5">Payment Status</th>
                                <th className="px-4 py-3.5">Payment Method</th>
                                <th className="px-4 py-3.5 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody className='divide-y divide-slate-100'>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-4 py-8 text-center text-slate-400'>
                                        No hostel fee installment records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3.5">
                                            <span className='font-bold text-slate-900 block'>{inv.feeHeadName || 'Hostel Fee'}</span>
                                            <span className='text-xs text-slate-400 font-mono'>{inv.invoiceNumber}</span>
                                        </td>
                                        <td className="px-4 py-3.5 font-bold text-slate-900">
                                            ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3.5 font-bold text-amber-600">
                                            ₹{Number(inv.balanceAmount ?? inv.totalAmount).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-600 text-xs">
                                            {inv.dueDate}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${bagdeColor[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-600 text-xs">
                                            {inv.paymentMethod || 'Online Gateway / Net Banking'}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            {inv.status === 'Pending' ? (
                                                <button
                                                    type='button'
                                                    onClick={() => handlePayNow(inv)}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer'
                                                >
                                                    <CreditCard size={14} />
                                                    Pay Now
                                                </button>
                                            ) : (
                                                <button
                                                    type='button'
                                                    onClick={() => toast.info(`Viewing receipt for ${inv.invoiceNumber}`)}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer'
                                                >
                                                    <Receipt size={14} />
                                                    View Receipt
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

export default HostelPayment
