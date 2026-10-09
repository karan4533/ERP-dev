import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import {
    INFLOW_OUTFLOW_TREND,
    MONEY_IN_SOURCES,
    MONEY_OUT_SOURCES,
    OVERVIEW_SUMMARY,
} from '../collectionsData'
import { FlowBars, Panel, SummaryCards } from './CollectionsShared'
import { useFinance } from '../../financeDomain/FinanceContext'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const OverviewTab = () => {
    const { dashboardMetrics, postedInflow, transactions } = useFinance()
    const summaryCards = useMemo(() => {
        const inflow = (postedInflow || []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
        const outflow = (transactions || [])
            .filter((row) => row.direction === 'OUT' && row.status === 'POSTED')
            .reduce((sum, row) => sum + Number(row.amount || 0), 0)
        const net = inflow - outflow
        return OVERVIEW_SUMMARY.map((card) => {
            if (card.label === 'Total Inflow') {
                return { ...card, value: formatCurrency(inflow), sub: 'Live posted inflow' }
            }
            if (card.label === 'Total Outflow') {
                return { ...card, value: formatCurrency(outflow), sub: 'Live posted outflow' }
            }
            if (card.label === 'Net Position') {
                return { ...card, value: formatCurrency(net), sub: 'Inflow − outflow', subTone: net >= 0 ? 'success' : 'danger' }
            }
            if (card.label === 'Closing Balance') {
                return { ...card, value: formatCurrency(dashboardMetrics?.currentDue ?? 0), sub: 'Outstanding fee dues' }
            }
            return card
        })
    }, [dashboardMetrics, postedInflow, transactions])

    const inflowOutflowOption = useMemo(() => ({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: {
            data: ['Inflow', 'Outflow'],
            bottom: 0,
            textStyle: { color: '#667085', fontSize: 11 },
        },
        grid: { left: 40, right: 16, top: 16, bottom: 48 },
        xAxis: {
            type: 'category',
            data: INFLOW_OUTFLOW_TREND.labels,
            axisLine: { lineStyle: { color: '#E0E0E0' } },
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#667085', fontSize: 11, formatter: (v) => `₹${v}L` },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [
            {
                name: 'Inflow',
                type: 'bar',
                stack: 'total',
                barWidth: 28,
                data: INFLOW_OUTFLOW_TREND.inflow,
                itemStyle: { color: '#4CAF50', borderRadius: [4, 4, 0, 0] },
            },
            {
                name: 'Outflow',
                type: 'bar',
                stack: 'total',
                data: INFLOW_OUTFLOW_TREND.outflow,
                itemStyle: { color: '#FF5722', borderRadius: [0, 0, 4, 4] },
            },
        ],
    }), [])

    return (
        <div className='space-y-6'>
            <SummaryCards cards={summaryCards} />

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel
                    title='Where money is coming from'
                    action={(
                        <button type='button' className='text-sm font-medium text-[#515DEF] hover:opacity-80 cursor-pointer'>
                            View sources
                        </button>
                    )}
                >
                    <FlowBars items={MONEY_IN_SOURCES} />
                </Panel>

                <Panel
                    title='Where money is going'
                    action={(
                        <button type='button' className='text-sm font-medium text-[#515DEF] hover:opacity-80 cursor-pointer'>
                            View expenses
                        </button>
                    )}
                >
                    <FlowBars items={MONEY_OUT_SOURCES} />
                </Panel>
            </div>

            <Panel
                title='Inflow vs outflow — last 6 months'
                action={(
                    <button type='button' className='text-sm font-medium text-[#515DEF] hover:opacity-80 cursor-pointer'>
                        Full report
                    </button>
                )}
            >
                <ReactECharts option={inflowOutflowOption} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
            </Panel>
        </div>
    )
}

export default OverviewTab
