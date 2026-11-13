import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

/**
 * EnterpriseBarChart - Vertical rounded bar chart with soft blue bars.
 * Matches the reference layout's "Traffic by Device" / "Grade-Wise Strength" widget.
 */
const EnterpriseBarChart = ({
    title = 'Traffic by Device',
    categories = ['Linux', 'Mac', 'iOS', 'Windows', 'Android', 'Other'],
    data = [18, 32, 22, 33, 16, 28],
    barColor = '#BAE6FD',
    height = 240,
    unit = 'K',
    className = '',
}) => {
    const option = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1E293B',
            borderColor: '#334155',
            textStyle: { color: '#FFFFFF', fontSize: 12 },
            formatter: (params) => {
                const item = params[0]
                return `<div class="p-1 text-xs"><b>${item.name}</b>: ${item.value}${unit}</div>`
            },
        },
        grid: {
            left: 24,
            right: 16,
            top: 20,
            bottom: 24,
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            data: categories,
            axisLine: { show: false },
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
                formatter: (val) => (val === 0 ? '0' : `${val}${unit}`),
            },
        },
        series: [
            {
                type: 'bar',
                data,
                barWidth: 26,
                itemStyle: {
                    color: barColor,
                    borderRadius: [8, 8, 8, 8],
                },
                emphasis: {
                    itemStyle: {
                        color: '#60A5FA',
                    },
                },
            },
        ],
    }), [categories, data, barColor, unit])

    return (
        <div className={`rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs ${className}`}>
            <h3 className='text-sm font-semibold tracking-tight text-slate-900 mb-2'>
                {title}
            </h3>
            <ReactECharts
                option={option}
                style={{ height, width: '100%' }}
                opts={{ renderer: 'svg' }}
            />
        </div>
    )
}

export default EnterpriseBarChart

