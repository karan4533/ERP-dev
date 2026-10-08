import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import {
    INFLOW_OUTFLOW_TREND,
    MONEY_IN_SOURCES,
    MONEY_OUT_SOURCES,
    OVERVIEW_SUMMARY,
} from '../collectionsData'
import { FlowBars, Panel, SummaryCards } from './CollectionsShared'

const OverviewTab = () => {
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
            <SummaryCards cards={OVERVIEW_SUMMARY} />

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
