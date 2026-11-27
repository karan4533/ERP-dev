import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Download } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import { StatCard } from '../AuditReports/Components/AuditReportSections'
import { formatCompliance } from '../../../../Common/auditDomain/complianceFromAudits'
import {
    computeCompliance,
    getComplianceColor,
    getComplianceSources,
    hydrateComplianceSources,
} from './complianceReportsData'

const inputClass = 'text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'

const ComplianceReports = () => {
    const location = useLocation()
    const [sources, setSources] = useState(() => getComplianceSources())
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState('')
    const [department, setDepartment] = useState('')
    const [scheduleId, setScheduleId] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [exportModal, setExportModal] = useState(false)

    useEffect(() => {
        let active = true
        hydrateComplianceSources().then((problem) => {
            if (!active) return
            setSources(getComplianceSources())
            setError(problem)
            setStatus(problem ? 'failed' : 'loaded')
        })
        return () => { active = false }
    }, [location.pathname])

    const filters = useMemo(() => ({ department, scheduleId, fromDate, toDate }), [department, scheduleId, fromDate, toDate])
    const report = useMemo(() => computeCompliance(sources, filters), [sources, filters])
    const allDepartments = useMemo(
        () => computeCompliance(sources, {}).departments.map((row) => row.department),
        [sources],
    )
    const exportRows = report.departments.map((row) => ({ ...row, compliance: formatCompliance(row.compliance) }))

    const clearFilters = () => {
        setDepartment('')
        setScheduleId('')
        setFromDate('')
        setToDate('')
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 mb-8'>
                <p className='text-sm text-[#667085] mb-6'>
                    Department-wise compliance computed from executed process audits (answered checklist items) and the observation register.
                </p>
                {status === 'loading' ? <p className='text-sm text-[#667085] mb-4'>Loading audit records…</p> : null}
                {status === 'failed' ? (
                    <p className='text-sm text-[#FF0000] mb-4'>Could not load audit records: {error} Figures below may be incomplete.</p>
                ) : null}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6'>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>
                        Department
                        <select value={department} onChange={(event) => setDepartment(event.target.value)} className={inputClass}>
                            <option value=''>All</option>
                            {allDepartments.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </label>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>
                        Schedule
                        <select value={scheduleId} onChange={(event) => setScheduleId(event.target.value)} className={inputClass}>
                            <option value=''>All</option>
                            {sources.schedules.map((item) => (
                                <option key={item.scheduleId} value={item.scheduleId}>{item.scheduleId} · {item.auditName}</option>
                            ))}
                        </select>
                    </label>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>
                        From
                        <input type='date' value={fromDate} onChange={(event) => setFromDate(event.target.value)} className={inputClass} />
                    </label>
                    <label className='flex flex-col gap-y-2 text-sm text-[#808080]'>
                        To
                        <input type='date' value={toDate} onChange={(event) => setToDate(event.target.value)} className={inputClass} />
                    </label>
                    <div className='flex items-end'>
                        <button type='button' onClick={clearFilters} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 rounded-lg cursor-pointer'>Clear Filters</button>
                    </div>
                </div>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
                    <StatCard
                        label='Overall Compliance'
                        value={formatCompliance(report.totals.overall)}
                        accent={getComplianceColor(report.totals.overall)}
                    />
                    <StatCard label='Audits Executed' value={report.totals.totalAudits} accent='#515DEF' />
                    <StatCard label='Items Passed / Failed' value={`${report.totals.passed} / ${report.totals.failed}`} accent='#667085' />
                    <StatCard label='Pending Findings' value={report.totals.pendingFindings} accent='#FF9800' />
                    <StatCard label='Closed Findings' value={report.totals.closedFindings} accent='#4CAF50' />
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Department Compliance</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        disabled={!report.departments.length}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left rtl:text-right'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase rounded-s-lg'>Department</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase text-center'>Total Audits</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase text-center'>Passed / Failed</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase text-center'>Compliance</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase text-center'>Pending Findings</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase text-center rounded-e-lg'>Closed Findings</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.departments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className='px-3 py-8 text-center text-[#667085]'>
                                        {status === 'loading' ? 'Loading…' : 'No executed audits or observations match the filters.'}
                                    </td>
                                </tr>
                            ) : report.departments.map((row) => (
                                <tr key={row.department} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className='px-3 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{row.department}</td>
                                    <td className='px-3 py-4 text-center'>{row.totalAudits}</td>
                                    <td className='px-3 py-4 text-center'>{row.passed} / {row.failed}</td>
                                    <td className='px-3 py-4 text-center'>
                                        <span className='font-semibold' style={{ color: getComplianceColor(row.compliance) }}>
                                            {formatCompliance(row.compliance)}
                                        </span>
                                    </td>
                                    <td className='px-3 py-4 text-center font-semibold text-[#FF9800]'>{row.pendingFindings}</td>
                                    <td className='px-3 py-4 text-center font-semibold text-[#4CAF50] rounded-e-lg'>{row.closedFindings}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                rows={exportRows}
                columns={[
                    { key: 'department', label: 'Department' },
                    { key: 'totalAudits', label: 'Total Audits' },
                    { key: 'passed', label: 'Items Passed' },
                    { key: 'failed', label: 'Items Failed' },
                    { key: 'compliance', label: 'Compliance %' },
                    { key: 'pendingFindings', label: 'Pending Findings' },
                    { key: 'closedFindings', label: 'Closed Findings' },
                ]}
                filename='compliance-report'
                title='Compliance Report'
                exportDescription={<>You are exporting {exportRows.length} department row(s) for the selected filters.</>}
            />
        </section>
    )
}

export default ComplianceReports
