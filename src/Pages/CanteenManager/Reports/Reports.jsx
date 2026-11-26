import { useMemo, useState } from 'react'
import { Download, IndianRupee, Layers, Package, ShoppingCart, Trash2, TrendingUp, Truck } from 'lucide-react'
import { DataTable, DataToolbar, IntegrationNotice, StatusBadge } from '../../../Common/ui'
import { filterCanteenReportRows } from '../../../Common/operations/canteenReportState'
import {
    SUMMARY_CARDS,
    REPORT_CATEGORIES,
    SALES_REPORT,
    INVENTORY_CONSUMPTION_REPORT,
    WASTAGE_REPORT,
    VENDOR_PURCHASE_REPORT,
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

const REPORT_DEFINITIONS = {
    'Sales Report': {
        rows: SALES_REPORT,
        rowKey: 'orderId',
        dateKey: 'orderDate',
        searchPlaceholder: 'Search order, customer or payment method…',
        columns: [
            { key: 'orderId', label: 'Order', required: true },
            { key: 'customerName', label: 'Customer', required: true },
            { key: 'customerType', label: 'Type' },
            { key: 'orderDate', label: 'Date', required: true },
            { key: 'amount', label: 'Amount', required: true },
            { key: 'paymentMethod', label: 'Payment method' },
            { key: 'status', label: 'Fulfilment', required: true, render: (row) => <StatusBadge status={row.status} /> },
        ],
    },
    'Inventory Consumption Report': {
        rows: INVENTORY_CONSUMPTION_REPORT,
        rowKey: (row) => `${row.itemName}-${row.consumptionDate}`,
        dateKey: 'consumptionDate',
        searchPlaceholder: 'Search item, quantity or unit…',
        columns: [
            { key: 'itemName', label: 'Item', required: true },
            { key: 'openingStock', label: 'Opening', required: true },
            { key: 'consumedQuantity', label: 'Consumed', required: true },
            { key: 'remainingStock', label: 'Remaining', required: true },
            { key: 'unit', label: 'Unit' },
            { key: 'consumptionDate', label: 'Date', required: true },
        ],
    },
    'Wastage Report': {
        rows: WASTAGE_REPORT,
        rowKey: (row) => `${row.itemName}-${row.date}`,
        dateKey: 'date',
        searchPlaceholder: 'Search item, reason or recorder…',
        columns: [
            { key: 'itemName', label: 'Item', required: true },
            { key: 'wastedQuantity', label: 'Wasted', required: true },
            { key: 'unit', label: 'Unit' },
            { key: 'reason', label: 'Reason', required: true },
            { key: 'recordedBy', label: 'Recorded by' },
            { key: 'date', label: 'Date', required: true },
        ],
    },
    'Vendor Purchase Report': {
        rows: VENDOR_PURCHASE_REPORT,
        rowKey: 'purchaseId',
        dateKey: 'purchaseDate',
        searchPlaceholder: 'Search purchase, vendor or invoice…',
        columns: [
            { key: 'purchaseId', label: 'Purchase', required: true },
            { key: 'vendor', label: 'Vendor', required: true },
            { key: 'itemCount', label: 'Items' },
            { key: 'purchaseAmount', label: 'Amount', required: true },
            { key: 'invoiceNo', label: 'Invoice', required: true },
            { key: 'purchaseDate', label: 'Date', required: true },
        ],
    },
    'Order Summary Report': null,
}

const dateInputClass = 'min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm text-[var(--erp-ink)]'

const Reports = () => {
    const [activeCategory, setActiveCategory] = useState(REPORT_CATEGORIES[0])
    const [query, setQuery] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const report = REPORT_DEFINITIONS[activeCategory]
    const visibleRows = useMemo(() => report ? filterCanteenReportRows(report.rows, {
        query,
        dateKey: report.dateKey,
        fromDate,
        toDate,
    }) : [], [fromDate, query, report, toDate])
    const resetFilters = () => {
        setQuery('')
        setFromDate('')
        setToDate('')
    }
    const selectCategory = (category) => {
        setActiveCategory(category)
        resetFilters()
    }

    return (
        <section className='space-y-5'>
            <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
                <h2 className='text-xl font-semibold text-[var(--erp-ink)]'>Canteen reports</h2>
                <p className='mt-1 max-w-3xl text-sm text-[var(--erp-slate)]'>Review sales, stock consumption, wastage and vendor purchasing without presenting reference records as authoritative finance data.</p>
                <IntegrationNotice
                    state='demo'
                    className='mt-4'
                    title='Reference analytics only'
                    description='All totals and report rows on this page are static frontend samples. Production reports must be generated from reconciled order, payment, inventory, wastage and procurement ledgers with period locks and export audit events.'
                />
            </div>

            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                {SUMMARY_CARDS.map((card) => {
                    const Icon = CARD_ICONS[card.label] ?? Layers
                    return (
                        <article key={card.label} className='rounded-2xl bg-white p-4 shadow-md'>
                            <div className='flex items-start justify-between gap-3'>
                                <div><p className='text-sm text-[var(--erp-muted)]'>{card.label}</p><p className='mt-1 text-xl font-semibold text-[var(--erp-ink)]'>{card.value}</p><p className='mt-1 text-xs text-[var(--erp-slate)]'>{card.sub} · sample</p></div>
                                <span className='rounded-xl bg-[var(--erp-indigo-soft)] p-2.5 text-[var(--erp-indigo)]'><Icon aria-hidden='true' size={20} /></span>
                            </div>
                        </article>
                    )
                })}
            </div>

            <div className='rounded-2xl bg-white p-4 shadow-md'>
                <h3 className='text-sm font-semibold text-[var(--erp-ink)]'>Report dataset</h3>
                <div className='mt-3 flex flex-wrap gap-2' role='tablist' aria-label='Canteen report datasets'>
                    {REPORT_CATEGORIES.map((category) => (
                        <button
                            key={category}
                            type='button'
                            role='tab'
                            aria-selected={activeCategory === category}
                            onClick={() => selectCategory(category)}
                            className={`min-h-10 rounded-lg border px-3 text-sm font-semibold ${activeCategory === category ? 'border-[var(--erp-indigo)] bg-[var(--erp-indigo)] text-white' : 'border-[var(--erp-line-strong)] text-[var(--erp-slate)] hover:border-[var(--erp-indigo)] hover:text-[var(--erp-indigo)]'}`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {report ? (
                <div className='overflow-hidden rounded-2xl bg-white shadow-md'>
                    <DataToolbar
                        query={query}
                        onQueryChange={setQuery}
                        searchLabel={`Search ${activeCategory.toLowerCase()}`}
                        searchPlaceholder={report.searchPlaceholder}
                        resultCount={visibleRows.length}
                        onReset={query || fromDate || toDate ? resetFilters : undefined}
                        filters={(
                            <>
                                <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>From date<input type='date' value={fromDate} onChange={(event) => setFromDate(event.target.value)} className={dateInputClass} /></label>
                                <label className='grid gap-1 text-sm font-medium text-[var(--erp-ink)]'>To date<input type='date' value={toDate} onChange={(event) => setToDate(event.target.value)} className={dateInputClass} /></label>
                            </>
                        )}
                        actions={(
                            <button type='button' disabled title='Export requires the reporting service.' className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-70'>
                                <Download aria-hidden='true' size={16} /> Export unavailable
                            </button>
                        )}
                    />
                    <DataTable
                        caption={activeCategory}
                        rows={visibleRows}
                        columns={report.columns}
                        rowKey={report.rowKey}
                        emptyTitle='No report rows match'
                        emptyDescription='Reset the search and date range to review the complete sample dataset.'
                    />
                </div>
            ) : (
                <IntegrationNotice
                    state='disconnected'
                    title='Order summary dataset unavailable'
                    description='The current frontend contains no independent order-summary dataset or aggregation contract. Define dimensions, measures, grouping periods, cancellation treatment and reconciliation rules before implementing this report.'
                />
            )}
        </section>
    )
}

export default Reports
