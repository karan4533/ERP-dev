import React, { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Download, IndianRupee, ShoppingCart, ClipboardCheck, UtensilsCrossed } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { parseCanteenDate } from '../Dashboard/dashboardData'
import {
    REPORT_CATEGORIES,
    getReportsView,
    hydrateReportsFromApi,
    persistReportSnapshot,
    orderStatusBadgeColor,
    requestStatusBadgeColor,
} from './reportsData'

const CARD_ICONS = {
    'Total Orders': ShoppingCart,
    'Order Sales': IndianRupee,
    'Pending Requests': ClipboardCheck,
    'Top Selling Menu Item': UtensilsCrossed,
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

const EmptyRow = ({ cols, message }) => (
    <tr>
        <td colSpan={cols} className="px-2 py-6 text-center text-[#667085]">{message}</td>
    </tr>
)

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const Reports = () => {
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [activeCategory, setActiveCategory] = useState('All')
    const [view, setView] = useState(() => getReportsView())

    useEffect(() => {
        let cancelled = false
        hydrateReportsFromApi().finally(() => {
            if (cancelled) return
            const next = getReportsView()
            setView(next)
            persistReportSnapshot(next)
        })
        return () => {
            cancelled = true
        }
    }, [])

    const show = (category) => activeCategory === 'All' || activeCategory === category

    const filteredSales = useMemo(() => {
        const from = fromDate ? new Date(fromDate) : null
        const to = toDate ? new Date(toDate) : null
        if (from) from.setHours(0, 0, 0, 0)
        if (to) to.setHours(23, 59, 59, 999)
        return view.salesReport.filter((row) => {
            const date = parseCanteenDate(row.orderDate)
            if (!date) return !from && !to
            if (from && date < from) return false
            if (to && date > to) return false
            return true
        })
    }, [view.salesReport, fromDate, toDate])

    const clearFilters = () => {
        setFromDate(null)
        setToDate(null)
        setActiveCategory('All')
    }

    return (
        <section className='space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                {view.summaryCards.map((card) => {
                    const Icon = CARD_ICONS[card.label] ?? ShoppingCart
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
                    <button
                        type='button'
                        onClick={clearFilters}
                        className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'
                    >
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs'>
                        <option value="">From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 lg:mt-6 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker selected={fromDate} onChange={setFromDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown placeholderText="Start date" className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker selected={toDate} onChange={setToDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown placeholderText="End date" className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            {show('Order Summary Report') && (
                <ReportTableSection title="Order Totals by Status" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Status</th>
                                <th className={thClass}>Count</th>
                                <th className={`${thClass} rounded-e-lg`}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {view.orderStatusRows.some((row) => row.count) ? view.orderStatusRows.map((row) => (
                                <tr key={row.status} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className="px-2 py-4 rounded-s-lg">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${orderStatusBadgeColor[row.status] || 'bg-[#66708533] text-[#667085]'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={tdClass}>{row.count}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>{row.amount}</td>
                                </tr>
                            )) : <EmptyRow cols={3} message="No orders to summarize." />}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            {show('Sales Report') && (
                <ReportTableSection title="Sales Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Order ID</th>
                                <th className={thClass}>Customer Name</th>
                                <th className={thClass}>Customer Type</th>
                                <th className={thClass}>Order Date</th>
                                <th className={thClass}>Amount</th>
                                <th className={thClass}>Payment Method</th>
                                <th className={`${thClass} rounded-e-lg`}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.length ? filteredSales.map((row) => (
                                <tr key={row.orderId} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className="px-2 py-4 font-medium text-[#1E1E1E] rounded-s-lg">{row.orderId}</td>
                                    <td className={tdClass}>{row.customerName}</td>
                                    <td className={tdClass}>{row.customerType}</td>
                                    <td className={tdClass}>{row.orderDate}</td>
                                    <td className={tdClass}>{row.amount}</td>
                                    <td className={tdClass}>{row.paymentMethod}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${orderStatusBadgeColor[row.status] || 'bg-[#66708533] text-[#667085]'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : <EmptyRow cols={7} message="No orders in this range." />}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            {show('Request Summary') && (
                <ReportTableSection title="Request Totals by Status" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Status</th>
                                <th className={thClass}>Count</th>
                                <th className={`${thClass} rounded-e-lg`}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {view.requestStatusRows.some((row) => row.count) ? view.requestStatusRows.map((row) => (
                                <tr key={row.status} className="border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className="px-2 py-4 rounded-s-lg">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${requestStatusBadgeColor[row.status] || 'bg-[#66708533] text-[#667085]'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={tdClass}>{row.count}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>{row.amount}</td>
                                </tr>
                            )) : <EmptyRow cols={3} message="No requests to summarize." />}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='reports'
                title='Reports'
                rows={Array.isArray(filteredSales) ? filteredSales : []}
                exportDescription={<>You are exporting {Array.isArray(filteredSales) ? filteredSales.length : 0} record(s).</>}
            />
        </section>
    )
}

export default Reports
