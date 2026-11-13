import React, { useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

/**
 * EnterpriseTrendChart - Dual-spline smooth area chart directly inspired by the reference design.
 * Features:
 * - Interactive tab switcher (e.g. Total Users / Operating Status / Projects)
 * - Coordinated legend: "• This year" (solid dark line) vs "• Last year" (dashed blue line)
 * - Clean SVG/ECharts bezier curve interpolation
 */
const EnterpriseTrendChart = ({
    tabs = ['Total Users', 'Total Projects', 'Operating Status'],
    dataByTab,
    categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    height = 280,
    className = '',
}) => {
    const [activeTab, setActiveTab] = useState(tabs[0] || 'Total Users')

    // Default mock data if not supplied
    const activeData = useMemo(() => {
        if (dataByTab && dataByTab[activeTab]) {
            return dataByTab[activeTab]
        }
        if (activeTab === 'Total Projects') {
            return {
                current: [12, 18, 15, 24, 28, 22, 30],
                previous: [8, 14, 19, 16, 21, 26, 32],
            }
        }
        if (activeTab === 'Operating Status') {
            return {
                current: [92, 94, 91, 96, 95, 98, 97],
                previous: [88, 90, 89, 92, 93, 94, 95],
            }
        }
        // Default (Total Users / Students)
        return {
            current: [18, 14, 16, 28, 26, 23, 25],
            previous: [10, 19, 12, 17, 24, 28, 32],
        }
    }, [dataByTab, activeTab])

    const option = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1E293B',
            borderColor: '#334155',
            textStyle: { color: '#FFFFFF', fontSize: 12 },
            formatter: (params) => {
                const title = params[0]?.name || ''
                const lines = params.map(
                    (p) => `${p.marker} ${p.seriesName}: <b>${p.value}k</b>`
                )
                return `<div class="p-1"><p class="font-semibold mb-1 text-slate-300">${title}</p>${lines.join('<br/>')}</div>`
            },
        },
        grid: {
            left: 28,
            right: 16,
            top: 24,
            bottom: 24,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: categories,
            boundaryGap: false,
            axisLine: { lineStyle: { color: '#E2E8F0' } },
            axisTick: { show: false },
            axisLabel: { color: '#94A3B8', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            splitLine: {
                lineStyle: {
                    color: '#F1F5F9',
                    type: 'solid',
                },
            },
            axisLabel: {
                color: '#94A3B8',
                fontSize: 11,
                formatter: (val) => (val === 0 ? '0' : `${val}K`),
            },
        },
        series: [
            {
                name: 'This year',
                type: 'line',
                smooth: 0.45,
                showSymbol: false,
                data: activeData.current,
                lineStyle: {
                    color: '#1E293B',
                    width: 2.2,
                },
                itemStyle: { color: '#1E293B' },
            },
            {
                name: 'Last year',
                type: 'line',
                smooth: 0.45,
                showSymbol: false,
                data: activeData.previous,
                lineStyle: {
                    color: '#60A5FA',
                    width: 2,
                    type: [4, 4],
                },
                itemStyle: { color: '#60A5FA' },
            },
        ],
    }), [categories, activeData])

    return (
        <div className={`rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs ${className}`}>
            {/* Header: Tabs + Legend */}
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3'>
                <div className='flex items-center gap-4 text-xs font-semibold'>
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type='button'
                            onClick={() => setActiveTab(tab)}
                            className={`transition-colors cursor-pointer ${
                                activeTab === tab
                                    ? 'text-slate-900 font-bold border-b-2 border-slate-900 pb-1 -mb-3.5'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className='flex items-center gap-3 text-xs text-slate-500'>
                    <span className='flex items-center gap-1.5'>
                        <span className='size-2 rounded-full bg-slate-900' />
                        <span>This year</span>
                    </span>
                    <span className='flex items-center gap-1.5'>
                        <span className='size-2 rounded-full bg-blue-400' />
                        <span className='text-slate-400'>Last year</span>
                    </span>
                </div>
            </div>

            {/* Chart Area */}
            <div className='mt-2'>
                <ReactECharts
                    option={option}
                    style={{ height, width: '100%' }}
                    opts={{ renderer: 'svg' }}
                />
            </div>
        </div>
    )
}

export default EnterpriseTrendChart

