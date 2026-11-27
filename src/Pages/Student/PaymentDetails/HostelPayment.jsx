import React, { useEffect, useState } from 'react'
import { useActiveStudent } from '../../../context/ActiveStudentContext'
import {
    findHostelPayments,
    formatHostelAmount,
    hostelPaymentStatusColor,
    loadHostelBundle,
} from '../Hostel/hostelData'

const HostelPayment = () => {
    const { activeStudent } = useActiveStudent()
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        if (!activeStudent?.id && !activeStudent?.admissionNumber && !activeStudent?.admissionNo) {
            setRows([])
            setLoading(false)
            return undefined
        }
        setLoading(true)
        loadHostelBundle(activeStudent)
            .then((bundle) => {
                if (!cancelled) setRows(findHostelPayments(activeStudent, bundle.payments))
            })
            .catch(() => {
                if (!cancelled) setRows([])
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [activeStudent])

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black mb-1'>Hostel Payment</h2>
                <p className='text-sm text-[#667085] mb-4'>
                    Hostel fee installments from the campus hostel payments store.
                    School fees stay under Fees Payment.
                </p>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Installment</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Period</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Due date</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Amount</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Paid</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'>Receipt</th>
                                <th className='px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>
                                        Loading hostel payments…
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-2 py-8 text-center text-[#667085]'>
                                        <p className='font-medium text-[#1E1E1E]'>No hostel assignment yet</p>
                                        <p className='text-sm mt-1'>
                                            No hostel fee installments are linked to this student.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => {
                                    const status = row.status || row.paymentStatus || 'Due'
                                    return (
                                        <tr key={row.id || `${row.installmentLabel}-${row.dueDate}`} className='border-b text-[#667085] border-[#f2f4f7]'>
                                            <td className='px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>
                                                {row.installmentLabel || row.feeHead || row.title || 'Hostel fee'}
                                            </td>
                                            <td className='px-2 py-4'>{row.period || row.academicYear || '—'}</td>
                                            <td className='px-2 py-4'>{row.dueDate || '—'}</td>
                                            <td className='px-2 py-4'>{formatHostelAmount(row.amount ?? row.netAmount)}</td>
                                            <td className='px-2 py-4'>{formatHostelAmount(row.paidAmount ?? (status === 'Paid' ? row.amount : 0))}</td>
                                            <td className='px-2 py-4'>{row.receiptNo || row.receiptNumber || '—'}</td>
                                            <td className='px-2 py-4 rounded-e-lg'>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${hostelPaymentStatusColor[status] || 'bg-[#66708533] text-[#667085]'}`}>
                                                    {status}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

export default HostelPayment
