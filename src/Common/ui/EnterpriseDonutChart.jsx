import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

/**
 * EnterpriseDonutChart - Clean circular ring on left + legend with percentages on right.
 * Matches the reference layout's "Traffic by Location" widget.
 */
const EnterpriseDonutChart = ({
    title = 'Traffic by Location',
    data = [
        { name: 'United States', value: 52.1, color: '#334155' },
        { name: 'Canada', value: 22.8, color: '#7DD3FC' },
        { name: 'Mexico', value: 13.9, color: '#10B981' },
        { name: 'Other', value: 11.2, color: '#2563EB' },
    ],
    height = 240,
    className = '',
}) => {
    const option = useMemo(() => ({
        tooltip: {
            trigger: 'item',
            backgroundColor: '#1E293B',
            borderColor: '#334155',
            textStyle: { color: '#FFFFFF', fontSize: 12 },
            formatter: '{b}: <b>{c}%</b>',
        },
        series: [
            {
                type: 'pie',
                radius: ['52%', '78%'],
                center: ['40%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 4,
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                },
                label: { show: false },
                labelLine: { show: false },
                data: data.map((d) => ({
                    name: d.name,
                    value: d.value,
                    itemStyle: { color: d.color },
                })),
            },
        ],
    }), [data])

    return (
        <div className={`rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs ${className}`}>
            <h3 className='text-sm font-semibold tracking-tight text-slate-900 mb-2'>
                {title}
            </h3>

            <div className='flex items-center justify-between gap-4'>
                {/* Donut Ring */}
                <div className='w-1/2'>
                    <ReactECharts
                        option={option}
                        style={{ height, width: '100%' }}
                        opts={{ renderer: 'svg' }}
                    />
                </div>

                {/* Percentage Legend on Right */}
                <div className='w-1/2 space-y-3 pr-2 text-xs'>
                    {data.map((item) => (
                        <div key={item.name} className='flex items-center justify-between gap-2'>
                            <span className='flex items-center gap-2 truncate'>
                                <span
                                    className='size-2 rounded-full shrink-0'
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className='truncate font-medium text-slate-700'>
                                    {item.name}
                                </span>
                            </span>
                            <span className='font-semibold text-slate-900 shrink-0'>
                                {item.value}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default EnterpriseDonutChart

