import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import FinanceDataTable from './Components/FinanceDataTable'
import {
    COLLECTION_SPLIT,
    getOverviewSummary,
    INCOME_EXPENDITURE_TREND,
    RECENT_COLLECTIONS,
    RECENT_EXPENSES,
    transactionStatusBadgeColor,
} from './financeOverviewData'

const FinanceOverview = () => {
    const summary = useMemo(() => getOverviewSummary(), [])

    const incomeExpenseOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        legend: { data: ['Income', 'Expenditure'], bottom: 0, textStyle: { color: '#667085', fontSize: 11 } },
        grid: { left: 48, right: 24, top: 24, bottom: 48 },
        xAxis: {
            type: 'category',
            data: INCOME_EXPENDITURE_TREND.labels,
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#667085', fontSize: 11, formatter: '{value}L' },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [
            {
                name: 'Income',
                type: 'bar',
                data: INCOME_EXPENDITURE_TREND.income,
                itemStyle: { color: '#515DEF', borderRadius: [4, 4, 0, 0] },
                barWidth: 24,
            },
            {
                name: 'Expenditure',
                type: 'bar',
                data: INCOME_EXPENDITURE_TREND.expenditure,
                itemStyle: { color: '#FF5722', borderRadius: [4, 4, 0, 0] },
                barWidth: 24,
            },
        ],
    }), [])

    const collectionSplitOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
        series: [{
            type: 'pie',
            radius: ['42%', '68%'],
            center: ['50%', '45%'],
            label: { show: false },
            data: [
                { name: 'Online', value: COLLECTION_SPLIT.onlineValue, itemStyle: { color: '#515DEF' } },
                { name: 'Offline', value: COLLECTION_SPLIT.offlineValue, itemStyle: { color: '#B4C4FF' } },
            ],
        }],
    }), [])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-2xl font-semibold text-black'>Finance Overview</h1>
                <p className='text-sm text-[#667085] mt-2'>
                    School-wide financial governance view — collections, fees, wallets, transport costs, accounting, and reports.
                </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4'>
                {summary.map((item) => (
                    <div key={item.label} className='bg-white rounded-2xl shadow-md p-5'>
                        <p className='text-sm font-medium text-[#808080]'>{item.label}</p>
                        <p className='text-2xl font-bold text-[#0C1E5B] mt-2'>{item.value}</p>
                        {item.sub && <p className='text-sm text-[#667085] mt-2'>{item.sub}</p>}
                    </div>
                ))}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h2 className='text-lg font-semibold text-black mb-4'>Income vs Expenditure (₹ Lakhs)</h2>
                    <ReactECharts option={incomeExpenseOption} style={{ height: 280 }} />
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h2 className='text-lg font-semibold text-black mb-4'>Collection Split — Today</h2>
                    <ReactECharts option={collectionSplitOption} style={{ height: 220 }} />
                    <div className='grid grid-cols-2 gap-4 mt-2'>
                        <div className='rounded-xl border border-[#E4E7EC] p-3'>
                            <p className='text-xs text-[#808080]'>Online ({COLLECTION_SPLIT.onlinePercent}%)</p>
                            <p className='text-sm font-semibold text-[#515DEF] mt-1'>{COLLECTION_SPLIT.onlineAmount}</p>
                        </div>
                        <div className='rounded-xl border border-[#E4E7EC] p-3'>
                            <p className='text-xs text-[#808080]'>Offline</p>
                            <p className='text-sm font-semibold text-[#515DEF] mt-1'>{COLLECTION_SPLIT.offlineAmount}</p>
                        </div>
                    </div>
                </div>
            </div>

            <FinanceDataTable
                title='Recent Collections'
                columns={[
                    { key: 'id', label: 'Receipt ID' },
                    { key: 'student', label: 'Student' },
                    { key: 'category', label: 'Category' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'paymentMode', label: 'Mode' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: transactionStatusBadgeColor },
                ]}
                rows={RECENT_COLLECTIONS}
            />

            <FinanceDataTable
                title='Recent Expenses'
                columns={[
                    { key: 'id', label: 'Expense ID' },
                    { key: 'vendor', label: 'Vendor' },
                    { key: 'department', label: 'Department' },
                    { key: 'category', label: 'Category' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'status', label: 'Status', badge: true, badgeMap: transactionStatusBadgeColor },
                ]}
                rows={RECENT_EXPENSES}
            />
        </section>
    )
}

export default FinanceOverview
