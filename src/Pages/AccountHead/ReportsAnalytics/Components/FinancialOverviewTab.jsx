import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import {
    INCOME_EXPENDITURE_TREND,
    INCOME_MIX,
    OVERVIEW_SUMMARY,
} from '../reportsAnalyticsData'
import { Panel, SummaryCards } from './ReportsShared'

const FinancialOverviewTab = () => {
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
            data: INCOME_EXPENDITURE_TREND.labels,
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
                name: 'Income',
                type: 'bar',
                stack: 'total',
                barWidth: 28,
                data: INCOME_EXPENDITURE_TREND.income,
                itemStyle: { color: '#4CAF50', borderRadius: [4, 4, 0, 0] },
            },
            {
                name: 'Expenditure',
                type: 'bar',
                stack: 'total',
                data: INCOME_EXPENDITURE_TREND.expenditure,
                itemStyle: { color: '#FF5722', borderRadius: [0, 0, 4, 4] },
            },
        ],
    }), [])

    const incomeMixOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
        series: [{
            type: 'pie',
            radius: ['58%', '78%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            label: { show: false },
            labelLine: { show: false },
            data: INCOME_MIX.map((item) => ({
                value: item.percent,
                name: item.name,
                itemStyle: { color: item.color },
            })),
        }],
    }), [])

    return (
        <div className='space-y-6'>
            <SummaryCards cards={OVERVIEW_SUMMARY} />

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Panel
                    title='Income vs expenditure — by month'
                    action={(
                        <button type='button' className='text-sm font-medium text-[#515DEF] hover:opacity-80 cursor-pointer'>
                            Full report
                        </button>
                    )}
                >
                    <ReactECharts option={incomeExpenditureOption} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
                </Panel>

                <Panel title='Income mix'>
                    <div className='flex items-center gap-6'>
                        <div className='flex-1 min-w-0'>
                            <ReactECharts option={incomeMixOption} style={{ height: 220 }} opts={{ renderer: 'svg' }} />
                        </div>
                        <div className='space-y-3 shrink-0'>
                            {INCOME_MIX.map((item) => (
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
