import React, { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import AuditReportsDataTable from './Components/AuditReportsDataTable'
import { hydrateFindingsFromApi, getFindings } from '../../JointDirectorAudit/FindingsCompliance/findingsComplianceData'
import { buildLiveAuditReports, getComplianceColor } from './liveAuditReports'

const AuditReportsSectionList = ({ sectionKey }) => {
    const [findings, setFindings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        setLoading(true)
        setError('')
        hydrateFindingsFromApi()
            .catch((err) => {
                if (active) setError(err?.message || 'Findings could not be loaded from the API.')
            })
            .finally(() => {
                if (!active) return
                setFindings(getFindings())
                setLoading(false)
            })
        return () => { active = false }
    }, [sectionKey])

    const live = useMemo(() => buildLiveAuditReports(findings), [findings])
    const meta = live.sectionMeta(sectionKey)
    const summary = live.sectionSummary(sectionKey)
    const tables = live.tablesFor(sectionKey)

    const riskSeverityOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {c}' },
        series: [{
            type: 'pie',
            radius: ['42%', '68%'],
            center: ['50%', '45%'],
            label: { show: false },
            data: [
                { name: 'Critical', value: live.severityCounts.Critical, itemStyle: { color: '#FF0000' } },
                { name: 'High', value: live.severityCounts.High, itemStyle: { color: '#FF9800' } },
                { name: 'Medium', value: live.severityCounts.Medium, itemStyle: { color: '#2196F3' } },
                { name: 'Low', value: live.severityCounts.Low, itemStyle: { color: '#667085' } },
            ].filter((row) => row.value > 0),
        }],
    }), [live.severityCounts])

    if (!meta || sectionKey === 'overview') {
        return null
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-2xl font-semibold text-black'>{meta.label}</h1>
                <p className='text-sm text-[#667085] mt-2'>
                    Live campus audit findings collection (JD Audit). Empty when no findings have been logged yet.
                </p>
                {loading ? <p className='text-sm text-[#667085] mt-2'>Loading findings…</p> : null}
                {error ? <p className='text-sm text-[#B42318] mt-2'>{error}</p> : null}
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
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
                        <h2 className='text-lg font-semibold text-black'>Overall Compliance Score</h2>
                        <p className='text-4xl font-bold' style={{ color: getComplianceColor(live.complianceScore ?? 0) }}>
                            {live.complianceScore == null ? '—' : `${live.complianceScore}%`}
                        </p>
                    </div>
                    <p className='text-xs text-[#667085] mb-4'>
                        Closed findings ÷ (open + closed) by department, then averaged. No monthly fake trend.
                    </p>
                    {live.complianceCards.length > 1 ? (
                        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
                            {live.complianceCards.slice(1).map((item) => (
                                <div key={item.label} className='rounded-xl border border-[#EDEEF5] bg-[#FAFBFF] p-4 text-center'>
                                    <p className='text-xs font-medium text-[#808080] uppercase'>{item.label}</p>
                                    <p className='text-2xl font-bold mt-2' style={{ color: item.accent }}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className='text-sm text-[#667085]'>No department findings yet.</p>
                    )}
                </div>
            )}

            {sectionKey === 'department-ranking' && (
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <h2 className='text-lg font-semibold text-black mb-4'>Compliance by Department</h2>
                    {live.ranking.length === 0 ? (
                        <p className='text-sm text-[#667085] py-10 text-center'>No departments with findings yet.</p>
                    ) : (
                        <ReactECharts
                            option={{
                                tooltip: { trigger: 'axis' },
                                grid: { left: 48, right: 24, top: 24, bottom: 64 },
                                xAxis: {
                                    type: 'category',
                                    data: live.ranking.map((row) => row.department),
                                    axisLabel: { color: '#667085', fontSize: 10, rotate: 30 },
                                },
                                yAxis: {
                                    type: 'value',
                                    min: 0,
                                    max: 100,
                                    axisLabel: { color: '#667085', fontSize: 11, formatter: '{value}%' },
                                },
                                series: [{
                                    type: 'bar',
                                    data: live.ranking.map((row) => row.compliance),
                                    itemStyle: { color: '#515DEF', borderRadius: [4, 4, 0, 0] },
                                    barWidth: 28,
                                }],
                            }}
                            style={{ height: 300 }}
                        />
                    )}
                </div>
            )}

            {sectionKey === 'risk-dashboard' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h2 className='text-lg font-semibold text-black mb-4'>Open Findings by Severity</h2>
                        {live.pending.length === 0 ? (
                            <p className='text-sm text-[#667085] py-10 text-center'>No open findings.</p>
                        ) : (
                            <ReactECharts option={riskSeverityOption} style={{ height: 260 }} />
                        )}
                    </div>
                    <div className='bg-white rounded-2xl shadow-md p-4'>
                        <h2 className='text-lg font-semibold text-black mb-4'>Risk Status Summary</h2>
                        <div className='grid grid-cols-2 gap-4 mt-4'>
                            {[
                                { status: 'Active', count: live.riskStatusCounts.Active, className: 'text-[#FF0000] border-[#FF000033] bg-[#FF00000D]' },
                                { status: 'Monitoring', count: live.riskStatusCounts.Monitoring, className: 'text-[#FF9800] border-[#FF980033] bg-[#FF98000D]' },
                                { status: 'Mitigated', count: live.riskStatusCounts.Mitigated, className: 'text-[#4CAF50] border-[#4CAF5033] bg-[#4CAF500D]' },
                            ].map((item) => (
                                <div key={item.status} className={`rounded-xl border p-4 ${item.className}`}>
                                    <p className='text-sm font-medium'>{item.status}</p>
                                    <p className='text-3xl font-bold mt-2'>{item.count}</p>
                                </div>
                            ))}
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
