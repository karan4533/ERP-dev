import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Download, BarChart3 } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    AUDIT_SUMMARY_REPORT,
    FINDINGS_ANALYSIS_REPORT,
    COMPLIANCE_PERFORMANCE_REPORT,
    RECURRING_ISSUES_REPORT,
    RISK_ANALYSIS_REPORT,
    REPORT_PERIODS,
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

const ReportsAnalytics = () => {
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center gap-3 mb-4'>
                    <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <BarChart3 size={22} />
                    </div>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Reports & Analytics</h2>
                        <p className='text-sm text-[#667085] mt-0.5'>Audit summaries, findings analysis, compliance performance, and risk reports.</p>
                    </div>
                </div>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' className='bg-[#515DEF] text-white uppercase text-sm px-6 py-1.5 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>
                        Clear Filters
                    </button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs sm:max-w-full' defaultValue='Current Quarter'>
                        {REPORT_PERIODS.map((period) => (
                            <option key={period} value={period}>{period}</option>
                        ))}
                    </select>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker
                                selected={fromDate}
                                onChange={(date) => setFromDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker
                                selected={toDate}
                                onChange={(date) => setToDate(date)}
                                isClearable
                                showMonthYearDropdown
                                scrollableMonthYearDropdown
                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                            />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2 lg:col-span-2 lg:justify-end'>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center justify-center gap-x-2 w-full sm:w-auto sm:ml-auto'
                        >
                            <Download size={16} />
                            Export All Reports
                        </button>
                    </div>
                </div>
            </div>

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

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default ReportsAnalytics
