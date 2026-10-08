import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import AuditReportsDataTable from './Components/AuditReportsDataTable'
import {
    getComplianceScore,
    getComplianceSummaryCards,
    getDepartmentRanking,
    getSectionMeta,
    getSectionSummary,
    getSectionTables,
    MONTHLY_COMPLIANCE_TREND,
    RISK_ANALYSIS_REPORT,
} from './auditReportsOverviewData'

const AuditReportsSectionList = ({ sectionKey }) => {
    const meta = useMemo(() => getSectionMeta(sectionKey), [sectionKey])
    const summary = useMemo(() => getSectionSummary(sectionKey), [sectionKey])
    const tables = useMemo(() => getSectionTables(sectionKey), [sectionKey])
    const complianceCards = useMemo(() => getComplianceSummaryCards(), [])
    const departmentRanking = useMemo(() => getDepartmentRanking(), [])

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
            type: 'line',
            smooth: true,
            data: MONTHLY_COMPLIANCE_TREND.values,
            itemStyle: { color: '#515DEF' },
            areaStyle: { color: 'rgba(81, 93, 239, 0.12)' },
        }],
    }), [])

    const riskSeverityOption = useMemo(() => {
        const counts = RISK_ANALYSIS_REPORT.reduce((acc, row) => {
            acc[row.severity] = (acc[row.severity] ?? 0) + 1
            return acc
        }, {})
        return {
            tooltip: { trigger: 'item', formatter: '{b}: {c}' },
            series: [{
                type: 'pie',
                radius: ['42%', '68%'],
                center: ['50%', '45%'],
                label: { show: false },
                data: [
                    { name: 'Critical', value: counts.Critical ?? 0, itemStyle: { color: '#FF0000' } },
                    { name: 'High', value: counts.High ?? 0, itemStyle: { color: '#FF9800' } },
                    { name: 'Medium', value: counts.Medium ?? 0, itemStyle: { color: '#2196F3' } },
                    { name: 'Low', value: counts.Low ?? 0, itemStyle: { color: '#667085' } },
                ],
            }],
        }
    }, [])

    if (!meta || sectionKey === 'overview') {
        return null
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-2xl font-semibold text-black'>{meta.label}</h1>
                <p className='text-sm text-[#667085] mt-2'>
                    Read-only audit oversight aggregated from Process Auditor, Quality Auditor, and Joint Director Audit modules.
                </p>
            </div>

            {summary.length > 0 && (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {summary.map((item) => (
                        <div key={item.label} className='bg-white rounded-2xl shadow-md p-4'>
                            <p className='text-sm font-medium text-[#808080]'>{item.label}</p>
                            <p className='text-2xl font-semibold text-[#515DEF] mt-2'>{item.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {sectionKey === 'compliance' && (
                <>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
                            <h2 className='text-lg font-semibold text-black'>Overall Compliance Score</h2>
                            <p className='text-4xl font-bold text-[#515DEF]'>{getComplianceScore()}%</p>
                        </div>
                        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
                            {complianceCards.slice(1).map((item) => (
                                <div key={item.label} className='rounded-xl border border-[#EDEEF5] bg-[#FAFBFF] p-4 text-center'>
                                    <p className='text-xs font-medium text-[#808080] uppercase'>{item.label}</p>
                                    <p className='text-2xl font-bold mt-2' style={{ color: item.accent }}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h2 className='text-lg font-semibold text-black mb-4'>Monthly Compliance Trend</h2>
                        <ReactECharts option={complianceTrendOption} style={{ height: 280 }} />
                    </div>
                </>
            )}

            {sectionKey === 'department-ranking' && (
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h2 className='text-lg font-semibold text-black mb-4'>Compliance by Department</h2>
                    <ReactECharts
                        option={{
                            tooltip: { trigger: 'axis' },
                            grid: { left: 48, right: 24, top: 24, bottom: 64 },
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
                            },
                            series: [{
                                type: 'bar',
                                data: departmentRanking.map((row) => row.compliance),
                                itemStyle: { color: '#515DEF', borderRadius: [4, 4, 0, 0] },
                                barWidth: 28,
                            }],
                        }}
                        style={{ height: 300 }}
                    />
                </div>
            )}

            {sectionKey === 'risk-dashboard' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h2 className='text-lg font-semibold text-black mb-4'>Risk by Severity</h2>
                        <ReactECharts option={riskSeverityOption} style={{ height: 260 }} />
                    </div>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h2 className='text-lg font-semibold text-black mb-4'>Risk Status Summary</h2>
                        <div className='grid grid-cols-2 gap-4 mt-4'>
                            {['Active', 'Monitoring', 'Mitigated'].map((status) => {
                                const count = RISK_ANALYSIS_REPORT.filter((row) => row.status === status).length
                                const colors = {
                                    Active: 'text-[#FF0000] border-[#FF000033] bg-[#FF00000D]',
                                    Monitoring: 'text-[#FF9800] border-[#FF980033] bg-[#FF98000D]',
                                    Mitigated: 'text-[#4CAF50] border-[#4CAF5033] bg-[#4CAF500D]',
                                }
                                return (
                                    <div key={status} className={`rounded-xl border p-4 ${colors[status]}`}>
                                        <p className='text-sm font-medium'>{status}</p>
                                        <p className='text-3xl font-bold mt-2'>{count}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {tables.map((table) => (
                <AuditReportsDataTable
                    key={table.title}
                    title={table.title}
                    columns={table.columns}
                    rows={table.rows}
                />
            ))}
        </section>
    )
}

export default AuditReportsSectionList
