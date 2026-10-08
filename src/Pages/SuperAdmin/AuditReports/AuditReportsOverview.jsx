import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import AuditReportsDataTable from './Components/AuditReportsDataTable'
import {
    getComplianceScore,
    getComplianceSummaryCards,
    getDepartmentRanking,
    getOverviewPreviewTables,
    getOverviewSummary,
    MONTHLY_COMPLIANCE_TREND,
} from './auditReportsOverviewData'

const AuditReportsOverview = () => {
    const summary = useMemo(() => getOverviewSummary(), [])
    const complianceCards = useMemo(() => getComplianceSummaryCards(), [])
    const departmentRanking = useMemo(() => getDepartmentRanking(), [])
    const previewTables = useMemo(() => getOverviewPreviewTables(), [])

    const complianceTrendOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: 48, right: 24, top: 24, bottom: 32 },
        xAxis: {
            type: 'category',
            data: MONTHLY_COMPLIANCE_TREND.labels,
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            min: 75,
            max: 100,
            axisLabel: { color: '#667085', fontSize: 11, formatter: '{value}%' },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [{
            name: 'Compliance',
            type: 'line',
            smooth: true,
            data: MONTHLY_COMPLIANCE_TREND.values,
            itemStyle: { color: '#515DEF' },
            areaStyle: { color: 'rgba(81, 93, 239, 0.12)' },
            lineStyle: { width: 3 },
        }],
    }), [])

    const departmentBarOption = useMemo(() => ({
        tooltip: { trigger: 'axis' },
        grid: { left: 48, right: 24, top: 24, bottom: 48 },
        xAxis: {
            type: 'category',
            data: departmentRanking.map((row) => row.department),
            axisLabel: { color: '#667085', fontSize: 10, rotate: 30 },
        },
        yAxis: {
            type: 'value',
            min: 70,
            max: 100,
            axisLabel: { color: '#667085', fontSize: 11, formatter: '{value}%' },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [{
            type: 'bar',
            data: departmentRanking.map((row) => row.compliance),
            itemStyle: {
                color: (params) => {
                    const value = params.value
                    if (value >= 90) return '#4CAF50'
                    if (value >= 75) return '#FF9800'
                    return '#FF0000'
                },
                borderRadius: [4, 4, 0, 0],
            },
            barWidth: 28,
        }],
    }), [departmentRanking])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-2xl font-semibold text-black'>Audit Reports</h1>
                <p className='text-sm text-[#667085] mt-2'>
                    School-wide audit governance — compliance scores, department rankings, findings, and risk oversight.
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

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
                    <div>
                        <h2 className='text-lg font-semibold text-black'>Compliance Score</h2>
                        <p className='text-sm text-[#667085] mt-1'>Overall school compliance and department breakdown.</p>
                    </div>
                    <div className='rounded-2xl border border-[#EDEEF5] bg-[#FAFBFF] px-6 py-4 text-center'>
                        <p className='text-xs font-medium text-[#808080] uppercase'>Overall</p>
                        <p className='text-4xl font-bold text-[#515DEF] mt-1'>{getComplianceScore()}%</p>
                    </div>
                </div>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
                    {complianceCards.slice(1).map((item) => (
                        <div key={item.label} className='rounded-xl border border-[#EDEEF5] bg-[#FAFBFF] p-4 text-center'>
                            <p className='text-xs font-medium text-[#808080] uppercase'>{item.label}</p>
                            <p className='text-2xl font-bold mt-2' style={{ color: item.accent }}>{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h2 className='text-lg font-semibold text-black mb-4'>Compliance Trend</h2>
                    <ReactECharts option={complianceTrendOption} style={{ height: 280 }} />
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h2 className='text-lg font-semibold text-black mb-4'>Department Ranking</h2>
                    <ReactECharts option={departmentBarOption} style={{ height: 280 }} />
                </div>
            </div>

            {previewTables.map((table) => (
                <AuditReportsDataTable
                    key={table.title}
                    title={table.title}
                    columns={table.columns}
                    rows={table.rows}
                    maxRows={5}
                />
            ))}
        </section>
    )
}

export default AuditReportsOverview
