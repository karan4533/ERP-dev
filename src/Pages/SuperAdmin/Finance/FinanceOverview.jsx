import React, { useEffect, useMemo, useState } from 'react'
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
import { formatCurrency } from '../../AccountHead/financeDomain/financeHelpers'
import { pullFinanceState } from '../../../services/financeApi'
import { isApiFinanceEnabled } from '../../../services/apiClient'

const FinanceOverview = () => {
    const [live, setLive] = useState(null)

    useEffect(() => {
        if (!isApiFinanceEnabled()) return undefined
        let cancelled = false
        pullFinanceState()
            .then((state) => {
                if (!cancelled) setLive(state?.data || null)
            })
            .catch(() => {
                if (!cancelled) setLive(null)
            })
        return () => { cancelled = true }
    }, [])

    const summary = useMemo(() => {
        const base = getOverviewSummary()
        if (!live) return base
        const postedIn = (live.transactions || []).filter(
            (row) => row.direction === 'IN' && row.status === 'POSTED',
        )
        const today = new Date().toISOString().slice(0, 10)
        const todays = postedIn
            .filter((row) => row.transactionDate === today)
            .reduce((sum, row) => sum + Number(row.amount || 0), 0)
        const pendingFees = (live.installments || []).reduce(
            (sum, row) => sum + Number(row.balanceAmount || 0),
            0,
        )
        const pendingApprovals = (live.approvals || []).filter(
            (row) => !row.status || row.status === 'Pending',
        ).length
        return [
            { label: "Today's Collection", value: formatCurrency(todays), sub: 'Live finance snapshot' },
            { label: 'Pending Fees', value: formatCurrency(pendingFees), sub: 'Outstanding dues' },
            base[2],
            base[3],
            { label: 'Pending Finance Approvals', value: String(pendingApprovals), sub: 'Live queue' },
        ]
    }, [live])

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

    const recentCollections = useMemo(() => {
        if (!live?.receipts?.length) return RECENT_COLLECTIONS
        return live.receipts.slice(0, 8).map((row) => ({
            id: row.receiptNo || row.id,
            student: row.studentId,
            amount: formatCurrency(row.amountPaid || 0),
            mode: row.paymentMode || '—',
            status: row.status || 'Issued',
        }))
    }, [live])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Finance Overview</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    {live ? 'Live campus finance snapshot' : 'Seed overview (API offline or empty)'}
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mt-6'>
                    {summary.map((card) => (
                        <div key={card.label} className='rounded-xl border border-[#F2F4F7] p-4'>
                            <p className='text-xs text-[#667085]'>{card.label}</p>
                            <p className='text-xl font-semibold text-[#1E1E1E] mt-1'>{card.value}</p>
                            <p className='text-xs text-[#808080] mt-1'>{card.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h3 className='text-base font-semibold text-[#1E1E1E] mb-2'>Income vs Expenditure</h3>
                    <ReactECharts option={incomeExpenseOption} style={{ height: 280 }} />
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h3 className='text-base font-semibold text-[#1E1E1E] mb-2'>Collection Split</h3>
                    <ReactECharts option={collectionSplitOption} style={{ height: 280 }} />
                </div>
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                <FinanceDataTable
                    title='Recent Collections'
                    columns={['Receipt', 'Student', 'Amount', 'Mode', 'Status']}
                    rows={recentCollections.map((row) => [
                        row.id,
                        row.student,
                        row.amount,
                        row.mode,
                        <span key={row.id} className={`px-2 py-1 rounded-lg text-xs font-semibold ${transactionStatusBadgeColor[row.status] || ''}`}>
                            {row.status}
                        </span>,
                    ])}
                />
                <FinanceDataTable
                    title='Recent Expenses'
                    columns={['Id', 'Category', 'Amount', 'Status']}
                    rows={RECENT_EXPENSES.map((row) => [row.id, row.category, row.amount, row.status])}
                />
            </div>
        </section>
    )
}

export default FinanceOverview
