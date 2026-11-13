import React from 'react'
import { Download } from 'lucide-react'
import { IntegrationNotice, PageHeader } from '../../../Common/ui'
import ExecutiveFindingSummary from '../../../Common/AuditGovernance/ExecutiveFindingSummary'
import { FINDINGS } from '../FindingsCompliance/findingsComplianceData'
import {
    AUDIT_SUMMARY_REPORT,
    FINDINGS_ANALYSIS_REPORT,
    COMPLIANCE_PERFORMANCE_REPORT,
    RECURRING_ISSUES_REPORT,
    RISK_ANALYSIS_REPORT,
    severityBadgeColor,
    statusBadgeColor,
} from './reportsAnalyticsData'

const ReportWidget = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-lg font-semibold text-black mb-4'>{title}</h3>
        <div className='relative overflow-x-auto'>{children}</div>
    </div>
)

const thClass = 'px-2 py-3 text-[#0C1E5B] font-medium uppercase text-xs'
const tdClass = 'px-2 py-3 text-[#667085] text-sm'

const ReportsAnalytics = () => (
        <section className='space-y-6'>
            <PageHeader
                title='Reports & analytics'
                description='Executive risk, closure and compliance views from the current audit reference dataset.'
                context='Static demonstration data · no authoritative date-series service connected'
                actions={<button type='button' disabled title='Requires reporting and document services' className='inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-lg bg-[var(--erp-primary)] px-4 py-2 text-sm font-semibold text-white opacity-50'><Download size={16} aria-hidden='true' /> Export reports</button>}
            />
            <IntegrationNotice state='demo' title='Reporting integration required' description='The figures below are reference fixtures and do not respond to a reporting period until the audit analytics API is connected. Export is intentionally disabled.' />
            <ExecutiveFindingSummary findings={FINDINGS} />

            <ReportWidget title='Audit Summary Report'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Audit ID</th>
                            <th className={thClass}>Department</th>
                            <th className={thClass}>Type</th>
                            <th className={`${thClass} text-center`}>Findings</th>
                            <th className={`${thClass} rounded-e-lg`}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {AUDIT_SUMMARY_REPORT.map((row) => (
                            <tr key={row.auditId} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.auditId}</td>
                                <td className={tdClass}>{row.department}</td>
                                <td className={tdClass}>{row.type}</td>
                                <td className={`${tdClass} text-center`}>{row.findings}</td>
                                <td className={`${tdClass} rounded-e-lg`}>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[row.status]}`}>
                                        {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ReportWidget>

            <ReportWidget title='Findings Analysis Report'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Finding ID</th>
                            <th className={thClass}>Department</th>
                            <th className={thClass}>Severity</th>
                            <th className={`${thClass} rounded-e-lg`}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {FINDINGS_ANALYSIS_REPORT.map((row) => (
                            <tr key={row.findingId} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.findingId}</td>
                                <td className={tdClass}>{row.department}</td>
                                <td className={tdClass}>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${severityBadgeColor[row.severity]}`}>
                                        {row.severity}
                                    </span>
                                </td>
                                <td className={`${tdClass} rounded-e-lg`}>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[row.status]}`}>
                                        {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ReportWidget>

            <ReportWidget title='Compliance Performance Report'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Department</th>
                            <th className={thClass}>Total Findings</th>
                            <th className={thClass}>Closed</th>
                            <th className={thClass}>Pending</th>
                            <th className={`${thClass} rounded-e-lg`}>Compliance %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {COMPLIANCE_PERFORMANCE_REPORT.map((row) => (
                            <tr key={row.department} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.department}</td>
                                <td className={`${tdClass} text-center`}>{row.totalFindings}</td>
                                <td className={`${tdClass} text-center text-[#4CAF50] font-medium`}>{row.closed}</td>
                                <td className={`${tdClass} text-center ${row.pending > 0 ? 'text-[#FF9800] font-medium' : ''}`}>{row.pending}</td>
                                <td className={`${tdClass} rounded-e-lg`}>
                                    <div className='flex items-center gap-3'>
                                        <div className='flex-1 h-2 bg-[#EDEEF5] rounded-full overflow-hidden max-w-[120px]'>
                                            <div className='h-full bg-[#515DEF] rounded-full' style={{ width: `${row.compliance}%` }} />
                                        </div>
                                        <span className='font-semibold text-[#1E1E1E]'>{row.compliance}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ReportWidget>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <ReportWidget title='Recurring Issues Report'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Department</th>
                                <th className={thClass}>Issue Type</th>
                                <th className={`${thClass} rounded-e-lg`}>Occurrences</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECURRING_ISSUES_REPORT.map((row) => (
                                <tr key={`${row.department}-${row.issueType}`} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg whitespace-nowrap`}>{row.department}</td>
                                    <td className={tdClass}>{row.issueType}</td>
                                    <td className={`${tdClass} text-center font-semibold text-[#515DEF] rounded-e-lg`}>{row.occurrences}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportWidget>

                <ReportWidget title='Risk Analysis Report'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Risk Area</th>
                                <th className={thClass}>Department</th>
                                <th className={thClass}>Severity</th>
                                <th className={`${thClass} rounded-e-lg`}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RISK_ANALYSIS_REPORT.map((row) => (
                                <tr key={row.riskArea} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg max-w-[160px]`}>{row.riskArea}</td>
                                    <td className={`${tdClass} whitespace-nowrap`}>{row.department}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${severityBadgeColor[row.severity]}`}>
                                            {row.severity}
                                        </span>
                                    </td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${statusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportWidget>
            </div>

        </section>
)

export default ReportsAnalytics
