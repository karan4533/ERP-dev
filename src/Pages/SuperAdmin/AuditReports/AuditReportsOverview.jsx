import React, { useEffect, useMemo, useState } from 'react'
import AuditReportsDataTable from './Components/AuditReportsDataTable'
import { hydrateFindingsFromApi, getFindings } from '../../JointDirectorAudit/FindingsCompliance/findingsComplianceData'
import { buildLiveAuditReports, getComplianceColor } from './liveAuditReports'

const AuditReportsOverview = () => {
    const [findings, setFindings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        hydrateFindingsFromApi()
            .catch((err) => {
                if (active) setError(err?.message || 'Findings could not be hydrated.')
            })
            .finally(() => {
                if (!active) return
                setFindings(getFindings())
                setLoading(false)
            })
        return () => { active = false }
    }, [])

    const live = useMemo(() => buildLiveAuditReports(findings), [findings])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h1 className='text-2xl font-semibold text-black'>Audit Reports Overview</h1>
                <p className='text-sm text-[#667085] mt-2'>
                    Live audit findings collection — open/closed counts and department ranking. No mock registers.
                </p>
                {loading ? <p className='text-sm text-[#667085] mt-2'>Loading findings…</p> : null}
                {error ? <p className='text-sm text-[#B42318] mt-2'>{error}</p> : null}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {live.overviewSummary.map((item) => (
                    <div key={item.label} className='bg-white rounded-2xl shadow-md p-4'>
                        <p className='text-sm font-medium text-[#808080]'>{item.label}</p>
                        <p
                            className='text-2xl font-semibold mt-2'
                            style={{
                                color: item.label === 'Compliance Score'
                                    ? getComplianceColor(live.complianceScore ?? 0)
                                    : '#515DEF',
                            }}
                        >
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                {[
                    { label: 'Critical Open', value: live.critical.length },
                    { label: 'High Open', value: live.severityCounts.High },
                    { label: 'Departments', value: live.ranking.length },
                    { label: 'Score', value: live.complianceScore == null ? '—' : `${live.complianceScore}%` },
                ].map((item) => (
                    <div key={item.label} className='rounded-xl border border-[#EDEEF5] bg-white p-4 text-center shadow-sm'>
                        <p className='text-xs font-medium text-[#808080] uppercase'>{item.label}</p>
                        <p className='text-2xl font-bold text-[#0C1E5B] mt-2'>{item.value}</p>
                    </div>
                ))}
            </div>

            {live.overviewPreview.map((table) => (
                <AuditReportsDataTable
                    key={table.title}
                    title={table.title}
                    columns={table.columns}
                    rows={table.rows}
                />
            ))}

            {!loading && findings.length === 0 ? (
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    No audit findings in the campus collection yet. Rows appear when JD Audit / Process / Quality auditors log findings.
                </div>
            ) : null}
        </section>
    )
}

export default AuditReportsOverview
