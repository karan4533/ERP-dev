import React from 'react'
import { priorityBadgeColor, observationStatusBadgeColor } from '../auditReportsData'

export const StatCard = ({ label, value, accent = '#515DEF' }) => (
    <div className='rounded-xl border border-[#EDEEF5] bg-[#FAFBFF] p-4 text-center'>
        <p className='text-xs font-medium text-[#808080] uppercase tracking-wide mb-2'>{label}</p>
        <p className='text-2xl font-bold' style={{ color: accent }}>{value}</p>
    </div>
)

export const AuditStatisticsSection = ({ statistics }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-base font-semibold text-black mb-4'>Audit Statistics</h3>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3'>
            <StatCard label='Compliance Score' value={`${statistics.complianceScore}%`} accent='#4CAF50' />
            <StatCard label='Total Questions' value={statistics.totalQuestions} />
            <StatCard label='Passed' value={statistics.passed} accent='#4CAF50' />
            <StatCard label='Failed' value={statistics.failed} accent='#FF0000' />
            <StatCard label='Observations Raised' value={statistics.observationsRaised} accent='#FF9800' />
            <StatCard label='Closed' value={statistics.closed} accent='#4CAF50' />
            <StatCard label='Pending' value={statistics.pending} accent='#FF9800' />
        </div>
    </div>
)

export const ChecklistSummarySection = ({ checklistSummary }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-base font-semibold text-black mb-4'>Checklist Summary</h3>
        <div className='relative overflow-x-auto'>
            <table className='w-full text-sm text-left'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Section</th>
                        <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase text-center'>Passed</th>
                        <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase text-center'>Failed</th>
                        <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase text-center'>NA</th>
                        <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase text-center rounded-e-lg'>Compliance</th>
                    </tr>
                </thead>
                <tbody>
                    {checklistSummary.map((row) => (
                        <tr key={row.section} className='border-b border-[#F2F4F7] text-[#667085]'>
                            <td className='px-3 py-3 font-medium text-[#1E1E1E]'>{row.section}</td>
                            <td className='px-3 py-3 text-center text-[#4CAF50] font-semibold'>{row.passed}</td>
                            <td className='px-3 py-3 text-center text-[#FF0000] font-semibold'>{row.failed}</td>
                            <td className='px-3 py-3 text-center'>{row.na}</td>
                            <td className='px-3 py-3 text-center font-semibold text-[#515DEF]'>{row.compliance}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)

export const ObservationSummarySection = ({ observationSummary }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-base font-semibold text-black mb-4'>Observation Summary</h3>
        <div className='relative overflow-x-auto'>
            <table className='w-full text-sm text-left'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Observation ID</th>
                        <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Observation</th>
                        <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Priority</th>
                        <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Assigned To</th>
                        <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase rounded-e-lg'>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {observationSummary.map((row) => (
                        <tr key={row.observationId} className='border-b border-[#F2F4F7] text-[#667085]'>
                            <td className='px-3 py-3 font-medium text-[#515DEF] whitespace-nowrap'>{row.observationId}</td>
                            <td className='px-3 py-3 text-[#1E1E1E]'>{row.observation}</td>
                            <td className='px-3 py-3'>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${priorityBadgeColor[row.priority]}`}>
                                    {row.priority}
                                </span>
                            </td>
                            <td className='px-3 py-3 whitespace-nowrap'>{row.assignedTo}</td>
                            <td className='px-3 py-3'>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${observationStatusBadgeColor[row.status] ?? 'bg-[#EDEEF5] text-[#667085]'}`}>
                                    {row.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)

export const ReadOnlyTextSection = ({ title, content }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h3 className='text-base font-semibold text-black mb-3'>{title}</h3>
        <textarea
            readOnly
            value={content}
            className='w-full min-h-[120px] text-sm text-[#1E1E1E] border border-[#EDEEF5] bg-[#F5F6FA] rounded-lg px-4 py-3 resize-none outline-none'
        />
    </div>
)
