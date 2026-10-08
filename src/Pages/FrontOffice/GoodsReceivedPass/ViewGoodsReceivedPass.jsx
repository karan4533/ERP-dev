import React, { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import SignatorySection from './Components/SignatorySection'
import {
    calculateTotalItems,
    formatDisplayTime,
    getGoodsReceivedPassById,
    statusBadgeColor,
} from './goodsReceivedPassData'

const ViewGoodsReceivedPass = () => {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const record = getGoodsReceivedPassById(id)

    useEffect(() => {
        if (searchParams.get('print') === '1' && record) {
            window.print()
        }
    }, [searchParams, record])

    if (!record) {
        return (
            <section>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Goods received pass not found.
                </div>
            </section>
        )
    }

    const totalItems = calculateTotalItems(record.materials)

    return (
        <section className='space-y-6 print:space-y-4'>
            <div className='flex flex-wrap items-center gap-3 print:hidden'>
                <button type='button' onClick={() => navigate('/front-office/goods-received-pass-list')} className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <button type='button' onClick={() => window.print()} className='inline-flex items-center gap-2 text-sm text-white bg-[#515DEF] rounded-md px-4 py-2 hover:opacity-90 cursor-pointer'>
                    <Printer size={16} />
                    Print
                </button>
            </div>

            <div id='goods-received-pass-print' className='bg-white rounded-2xl shadow-md p-4 sm:p-6 print:shadow-none print:rounded-none print:p-0'>
                <div className='rounded-xl border border-[#515DEF33] bg-[#F8F9FF] p-4 sm:p-6 print:border print:border-[#0C1E5B]'>
                    <div className='text-center space-y-1 mb-6'>
                        <p className='text-xl font-bold tracking-wide text-[#0C1E5B] uppercase'>Queen Mira International School</p>
                        <p className='text-sm text-[#667085]'>Melakkal Main Road, Kochadai, Madurai - 625016</p>
                        <p className='text-base font-semibold text-[#0C1E5B] pt-1'>Goods Received Note</p>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                        <div className='rounded-lg border border-[#D9D9D9] p-3'>
                            <p className='text-xs font-medium text-[#808080]'>G.R. No.</p>
                            <p className='text-lg font-bold text-[#0C1E5B] mt-1'>{record.grNo}</p>
                        </div>
                        <div className='rounded-lg border border-[#D9D9D9] p-3'>
                            <p className='text-xs font-medium text-[#808080]'>Payment Type</p>
                            <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{record.paymentType}</p>
                        </div>
                        <div className='rounded-lg border border-[#D9D9D9] p-3'>
                            <p className='text-xs font-medium text-[#808080]'>Date</p>
                            <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{record.date}</p>
                        </div>
                        <div className='rounded-lg border border-[#D9D9D9] p-3'>
                            <p className='text-xs font-medium text-[#808080]'>Time In</p>
                            <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{formatDisplayTime(record.time, record.timePeriod)}</p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-4 border-b border-[#E4E7EC]'>
                        <div>
                            <p className='text-xs font-medium text-[#808080]'>Supplier Name</p>
                            <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{record.supplierName}</p>
                        </div>
                        <div>
                            <p className='text-xs font-medium text-[#808080]'>Bill No.</p>
                            <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{record.billNo}</p>
                        </div>
                        <div>
                            <p className='text-xs font-medium text-[#808080]'>Bill Date</p>
                            <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{record.billDate}</p>
                        </div>
                    </div>

                    <div className='overflow-x-auto rounded-xl border border-[#D9D9D9] mb-6'>
                        <table className='w-full min-w-[700px] text-sm'>
                            <thead className='bg-[#EDEEF5] text-xs uppercase text-[#0C1E5B]'>
                                <tr>
                                    <th className='px-3 py-3 w-16 text-left'>S.No.</th>
                                    <th className='px-3 py-3 text-left'>Name of the Description</th>
                                    <th className='px-3 py-3 w-20 text-left'>Qty.</th>
                                    <th className='px-3 py-3 text-left'>Remarks</th>
                                    <th className='px-3 py-3 w-24 text-left'>L.P.No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {record.materials.map((item, index) => (
                                    <tr key={item.id} className='border-t border-[#E4E7EC]'>
                                        <td className='px-3 py-3'>{index + 1}</td>
                                        <td className='px-3 py-3'>{item.description}</td>
                                        <td className='px-3 py-3'>{item.quantity}</td>
                                        <td className='px-3 py-3'>{item.remarks || '—'}</td>
                                        <td className='px-3 py-3'>{item.lpNo || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className='rounded-xl border border-[#D9D9D9] p-4 mb-6'>
                        <p className='text-xs font-medium text-[#808080]'>Total No. of Items</p>
                        <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{totalItems}</p>
                    </div>

                    <SignatorySection signatories={record.signatories} readOnly />

                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-[#E4E7EC] print:hidden'>
                        <div>
                            <p className='text-xs font-medium text-[#808080]'>Status</p>
                            <span className={`inline-flex mt-1 px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[record.status] ?? statusBadgeColor.Pending}`}>{record.status}</span>
                        </div>
                        <div>
                            <p className='text-xs font-medium text-[#808080]'>Created By</p>
                            <p className='text-sm text-[#1E1E1E] mt-1'>{record.createdBy}</p>
                        </div>
                        <div>
                            <p className='text-xs font-medium text-[#808080]'>Created At</p>
                            <p className='text-sm text-[#1E1E1E] mt-1'>{record.createdAt}</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #goods-received-pass-print, #goods-received-pass-print * { visibility: visible; }
                    #goods-received-pass-print { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>
        </section>
    )
}

export default ViewGoodsReceivedPass
