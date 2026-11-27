import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { OVERVIEW_SUMMARY } from '../reportsAnalyticsData'
import { Panel, SummaryCards } from './ReportsShared'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency } from '../../financeDomain/financeHelpers'
import {
    buildIncomeMixFromTransactions,
    buildMonthlyTxnSeries,
} from '../../financeDomain/financeSnapshotAccounting'

const FinancialOverviewTab = () => {
    const { dashboardMetrics, transactions, receipts, financePersistence } = useFinance()
    const apiLive = Boolean(financePersistence?.apiEnabled)

    const summaryCards = useMemo(() => {
        const income = (transactions || [])
            .filter((row) => row.direction === 'IN' && row.status === 'POSTED')
            .reduce((sum, row) => sum + Number(row.amount || 0), 0)
        const expense = (transactions || [])
            .filter((row) => row.direction === 'OUT' && row.status === 'POSTED')
            .reduce((sum, row) => sum + Number(row.amount || 0), 0)
        const net = income - expense
        const margin = income > 0 ? `${((net / income) * 100).toFixed(1)}% margin` : 'No income yet'
        return OVERVIEW_SUMMARY.map((card) => {
            if (/income \(ytd\)|total income/i.test(card.label)) {
                return { ...card, value: formatCurrency(income), sub: `${receipts?.length || 0} receipts`, subTone: 'success' }
            }
            if (/expense|expenditure|outflow/i.test(card.label)) {
                return { ...card, value: formatCurrency(expense), sub: 'Posted OUT vouchers', subTone: 'danger' }
            }
            if (/surplus|net/i.test(card.label)) {
                return {
                    ...card,
                    value: formatCurrency(net),
                    sub: margin,
                    subTone: net >= 0 ? 'success' : 'danger',
                }
            }
            if (/efficiency|collection/i.test(card.label)) {
                return { ...card, value: formatCurrency(income), sub: `${receipts?.length || 0} receipts` }
            }
            if (/due|pending|outstanding/i.test(card.label)) {
                return { ...card, value: formatCurrency(dashboardMetrics?.currentDue || 0), sub: 'Fee balances' }
            }
            return card
        })
    }, [dashboardMetrics, receipts, transactions])

    const monthly = useMemo(() => buildMonthlyTxnSeries(transactions || []), [transactions])
    const incomeMix = useMemo(() => buildIncomeMixFromTransactions(transactions || []), [transactions])

    const incomeExpenditureOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: {
            data: ['Income', 'Expenditure'],
            bottom: 0,
            textStyle: { color: '#667085', fontSize: 11 },
        },
        grid: { left: 40, right: 16, top: 16, bottom: 48 },
        xAxis: {
            type: 'category',
            data: monthly.labels.length ? monthly.labels : ['—'],
            axisLine: { lineStyle: { color: '#E0E0E0' } },
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#667085', fontSize: 11, formatter: (v) => `₹${v}` },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [
            {
                name: 'Income',
                type: 'bar',
                barWidth: 28,
                data: monthly.labels.length ? monthly.income : [0],
                itemStyle: { color: '#4CAF50', borderRadius: [4, 4, 0, 0] },
            },
            {
                name: 'Expenditure',
                type: 'bar',
                data: monthly.labels.length ? monthly.expenditure : [0],
                itemStyle: { color: '#FF5722', borderRadius: [4, 4, 0, 0] },
            },
        ],
    }), [monthly])

    const incomeMixOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
        series: [{
            type: 'pie',
            radius: ['58%', '78%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            label: { show: false },
            labelLine: { show: false },
            data: (incomeMix.length ? incomeMix : [{ name: 'No posted IN', value: 1, color: '#E0E0E0' }]).map((item) => ({
                value: item.value || item.percent || 1,
                name: item.name,
                itemStyle: { color: item.color },
            })),
        }],
    }), [incomeMix])

    return (
        <div className='space-y-6'>
            {apiLive && (
                <p className='text-sm text-[#667085]'>
                    Overview cards and charts use posted finance snapshot transactions / fee KPIs.
                </p>
            )}
            <SummaryCards cards={summaryCards} />

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel title='Income vs expenditure — by month'>
                    <ReactECharts option={incomeExpenditureOption} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
                </Panel>

                <Panel title='Income mix'>
                    <div className='flex items-center gap-6'>
                        <div className='flex-1 min-w-0'>
                            <ReactECharts option={incomeMixOption} style={{ height: 220 }} opts={{ renderer: 'svg' }} />
                        </div>
                        <div className='space-y-3 shrink-0'>
                            {(incomeMix.length ? incomeMix : [{ name: 'No posted IN', percent: 0, color: '#E0E0E0' }]).map((item) => (
                                <div key={item.name} className='flex items-center gap-2 text-sm'>
                                    <span className='size-2.5 rounded-sm shrink-0' style={{ backgroundColor: item.color }} />
                                    <span className='text-[#667085]'>{item.name}</span>
                                    <span className='font-semibold text-[#1E1E1E]'>{item.percent}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    )
}

export default FinancialOverviewTab
