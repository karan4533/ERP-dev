import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Download, IndianRupee, Package, ShoppingCart, Trash2, Truck, TrendingUp, Layers } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    SUMMARY_CARDS,
    REPORT_CATEGORIES,
    SALES_REPORT,
    INVENTORY_CONSUMPTION_REPORT,
    WASTAGE_REPORT,
    VENDOR_PURCHASE_REPORT,
    orderStatusBadgeColor,
} from './reportsData'

const CARD_ICONS = {
    'Total Sales Today': IndianRupee,
    'Total Sales This Month': TrendingUp,
    'Inventory Consumption Cost': Package,
    'Wastage Cost': Trash2,
    'Pending Vendor Bills': Truck,
    'Top Selling Menu Item': ShoppingCart,
    'Report Categories': Layers,
}

const ReportTableSection = ({ title, children, onExport }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
            <h2 className='text-xl font-medium text-black'>{title}</h2>
            {onExport && (
                <button
                    type='button'
                    onClick={onExport}
                    className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                >
                    <Download size={16} />
                    Export
                </button>
            )}
        </div>
        <div className="relative overflow-x-auto">{children}</div>
    </div>
)

const Reports = () => {
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [activeCategory, setActiveCategory] = useState('All')

    return (
        <section className='space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                {SUMMARY_CARDS.map((card) => {
                    const Icon = CARD_ICONS[card.label] ?? Layers
                    return (
                        <div key={card.label} className='bg-white rounded-2xl shadow-md p-4'>
                            <div className='flex items-start justify-between gap-3'>
                                <div>
                                    <p className='text-sm text-[#808080]'>{card.label}</p>
                                    <p className='text-xl font-semibold text-[#1E1E1E] mt-1'>{card.value}</p>
                                    <p className='text-xs text-[#667085] mt-1'>{card.sub}</p>
                                </div>
                                <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                                    <Icon size={20} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Report Categories</h3>
                <div className='flex flex-wrap gap-2'>
                    <button
                        type='button'
                        onClick={() => setActiveCategory('All')}
                        className={`text-sm px-4 py-2 rounded-md border transition-all cursor-pointer ${activeCategory === 'All' ? 'bg-[#515DEF] text-white border-[#515DEF]' : 'bg-white text-[#515DEF] border-[#515DEF] hover:bg-[#515DEF] hover:text-white'}`}
                    >
                        All Reports
                    </button>
                    {REPORT_CATEGORIES.map((category) => (
                        <button
                            key={category}
                            type='button'
                            onClick={() => setActiveCategory(category)}
                            className={`text-sm px-4 py-2 rounded-md border transition-all cursor-pointer ${activeCategory === category ? 'bg-[#515DEF] text-white border-[#515DEF]' : 'bg-white text-[#515DEF] border-[#515DEF] hover:bg-[#515DEF] hover:text-white'}`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs'>
                        <option value="">From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 lg:mt-6 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker selected={fromDate} onChange={setFromDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker selected={toDate} onChange={setToDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            {(activeCategory === 'All' || activeCategory === 'Sales Report' || activeCategory === 'Order Summary Report') && (
                <ReportTableSection title="Sales Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Order ID</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Customer Name</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Customer Type</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Order Date</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Amount</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Payment Method</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SALES_REPORT.map((row) => (
                                <tr key={row.orderId} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className="px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg">{row.orderId}</td>
                                    <td className="px-2 py-4">{row.customerName}</td>
                                    <td className="px-2 py-4">{row.customerType}</td>
                                    <td className="px-2 py-4">{row.orderDate}</td>
                                    <td className="px-2 py-4">{row.amount}</td>
                                    <td className="px-2 py-4">{row.paymentMethod}</td>
                                    <td className="px-2 py-4 rounded-e-lg">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${orderStatusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            {(activeCategory === 'All' || activeCategory === 'Inventory Consumption Report') && (
                <ReportTableSection title="Inventory Consumption Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Item Name</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Opening Stock</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Consumed Quantity</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Remaining Stock</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Unit</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Consumption Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {INVENTORY_CONSUMPTION_REPORT.map((row) => (
                                <tr key={`${row.itemName}-${row.consumptionDate}`} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className="px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg">{row.itemName}</td>
                                    <td className="px-2 py-4">{row.openingStock}</td>
                                    <td className="px-2 py-4">{row.consumedQuantity}</td>
                                    <td className="px-2 py-4">{row.remainingStock}</td>
                                    <td className="px-2 py-4">{row.unit}</td>
                                    <td className="px-2 py-4 rounded-e-lg">{row.consumptionDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            {(activeCategory === 'All' || activeCategory === 'Wastage Report') && (
                <ReportTableSection title="Wastage Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Item Name</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Wasted Quantity</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Unit</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Reason</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Recorded By</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {WASTAGE_REPORT.map((row) => (
                                <tr key={`${row.itemName}-${row.date}`} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className="px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg">{row.itemName}</td>
                                    <td className="px-2 py-4">{row.wastedQuantity}</td>
                                    <td className="px-2 py-4">{row.unit}</td>
                                    <td className="px-2 py-4 max-w-[200px] truncate" title={row.reason}>{row.reason}</td>
                                    <td className="px-2 py-4">{row.recordedBy}</td>
                                    <td className="px-2 py-4 rounded-e-lg">{row.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            {(activeCategory === 'All' || activeCategory === 'Vendor Purchase Report') && (
                <ReportTableSection title="Vendor Purchase Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg">Purchase ID</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Vendor</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Item Count</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Purchase Amount</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase">Invoice No</th>
                                <th className="px-2 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-e-lg">Purchase Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {VENDOR_PURCHASE_REPORT.map((row) => (
                                <tr key={row.purchaseId} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className="px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg">{row.purchaseId}</td>
                                    <td className="px-2 py-4">{row.vendor}</td>
                                    <td className="px-2 py-4">{row.itemCount}</td>
                                    <td className="px-2 py-4">{row.purchaseAmount}</td>
                                    <td className="px-2 py-4">{row.invoiceNo}</td>
                                    <td className="px-2 py-4 rounded-e-lg">{row.purchaseDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default Reports
