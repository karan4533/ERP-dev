import React, { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import FinanceDataTable from './Components/FinanceDataTable'
import {
    INCOME_EXPENDITURE_TREND,
    transactionStatusBadgeColor,
} from './financeOverviewData'
import { formatCurrency } from '../../AccountHead/financeDomain/financeHelpers'
import { pullFinanceState } from '../../../services/financeApi'
import { isApiFinanceEnabled } from '../../../services/apiClient'

const FinanceOverview = () => {
    const [live, setLive] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isApiFinanceEnabled()) {
            setLoading(false)
            setError('VITE_USE_API_FINANCE is off — SuperAdmin Finance requires the API.')
            return undefined
        }
        let cancelled = false
        setLoading(true)
        pullFinanceState()
            .then((state) => {
                if (!cancelled) {
                    setLive(state?.data || null)
                    setError(null)
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setLive(null)
                    setError(err?.message || 'Finance API failed')
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [])

    const summary = useMemo(() => {
        if (!live) return []
        const postedIn = (live.transactions || []).filter(
            (row) => row.direction === 'IN' && row.status === 'POSTED',
        )
        const postedOut = (live.transactions || []).filter(
            (row) => row.direction === 'OUT' && row.status === 'POSTED',
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
        const inflow = postedIn.reduce((sum, row) => sum + Number(row.amount || 0), 0)
        const outflow = postedOut.reduce((sum, row) => sum + Number(row.amount || 0), 0)
        return [
            { label: "Today's Collection", value: formatCurrency(todays), sub: 'Live finance snapshot' },
            { label: 'Pending Fees', value: formatCurrency(pendingFees), sub: 'Outstanding dues' },
            { label: 'Posted Inflow', value: formatCurrency(inflow), sub: 'All posted IN' },
            { label: 'Posted Outflow', value: formatCurrency(outflow), sub: 'All posted OUT' },
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

    const collectionSplitOption = useMemo(() => {
        const receipts = live?.receipts || []
        const online = receipts.filter((row) => /UPI|ONLINE|CARD|GATEWAY/i.test(row.paymentMode || '')).length
        const offline = Math.max(receipts.length - online, 0)
        return {
            tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
            series: [{
                type: 'pie',
                radius: ['42%', '68%'],
                center: ['50%', '45%'],
                label: { show: false },
                data: [
                    { name: 'Online', value: online || 0, itemStyle: { color: '#515DEF' } },
                    { name: 'Offline', value: offline || 0, itemStyle: { color: '#B4C4FF' } },
                ],
            }],
        }
    }, [live])

    const recentCollections = useMemo(() => {
        if (!live?.receipts?.length) return []
        return live.receipts.slice(0, 8).map((row) => ({
            id: row.receiptNo || row.id,
            student: row.studentId,
            amount: formatCurrency(row.amountPaid || 0),
            mode: row.paymentMode || '—',
            status: row.status || 'Issued',
        }))
    }, [live])

    const recentExpenses = useMemo(() => {
        if (!live?.transactions?.length) return []
        return (live.transactions || [])
            .filter((row) => row.direction === 'OUT')
            .slice(0, 8)
            .map((row) => ({
                id: row.voucherNo || row.id,
                category: row.category || row.sourceModule || 'Expense',
                amount: formatCurrency(row.amount || 0),
                status: row.status || '—',
            }))
    }, [live])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Finance Overview</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    {loading && 'Loading finance API…'}
                    {!loading && error && `API error: ${error}`}
                    {!loading && !error && live && 'Live campus finance snapshot (API only — no seed fallback)'}
                    {!loading && !error && !live && 'Finance snapshot empty on API'}
                </p>
                {!!summary.length && (
                    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mt-6'>
                        {summary.map((card) => (
                            <div key={card.label} className='rounded-xl border border-[#F2F4F7] p-4'>
                                <p className='text-xs text-[#667085]'>{card.label}</p>
                                <p className='text-xl font-semibold text-[#1E1E1E] mt-1'>{card.value}</p>
                                <p className='text-xs text-[#808080] mt-1'>{card.sub}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {live && (
                <>
                    <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                        <div className='bg-white rounded-2xl shadow-md p-4'>
                            <h3 className='text-base font-semibold text-[#1E1E1E] mb-2'>Income vs Expenditure (trend seed chart)</h3>
                            <p className='text-xs text-[#667085] mb-2'>Trend chart still uses static month series; KPI cards above are live.</p>
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
                            rows={recentExpenses.map((row) => [row.id, row.category, row.amount, row.status])}
                        />
                    </div>
                </>
            )}
        </section>
    )
}

export default FinanceOverview
