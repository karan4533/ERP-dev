import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Download } from 'lucide-react'
import ExportModal from '../../../../Common/CommonComponents/ExportModal'
import { StatCard } from '../AuditReports/Components/AuditReportSections'
import { getComplianceData, getComplianceColor } from './complianceReportsData'

const ComplianceReports = () => {
    const location = useLocation()
    const [data, setData] = useState(() => getComplianceData())
    const [exportModal, setExportModal] = useState(false)

    useEffect(() => {
        setData(getComplianceData())
    }, [location.pathname])

    const { summary, departments } = data

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4 mb-8'>
                <p className='text-sm text-[#667085] mb-6'>
                    Department-wise compliance scores and findings summary across all completed audits.
                </p>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
                    <StatCard
                        label='Overall Compliance'
                        value={`${summary.overall}%`}
                        accent={getComplianceColor(summary.overall)}
                    />
                    {summary.departments.map((item) => (
                        <StatCard
                            key={item.label}
                            label={item.label}
                            value={`${item.value}%`}
                            accent={getComplianceColor(item.value)}
                        />
                    ))}
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
                    <h2 className='text-xl font-medium text-black'>Department Compliance</h2>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
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
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase text-center'>Compliance</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase text-center'>Pending Findings</th>
                                <th className='px-3 py-3.5 text-[#0C1E5B] font-medium uppercase text-center rounded-e-lg'>Closed Findings</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map((row) => (
                                <tr key={row.department} className='border-b text-[#667085] border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className='px-3 py-4 font-medium text-[#1E1E1E] rounded-s-lg'>{row.department}</td>
                                    <td className='px-3 py-4 text-center'>{row.totalAudits}</td>
                                    <td className='px-3 py-4 text-center'>
                                        <span
                                            className='font-semibold'
                                            style={{ color: getComplianceColor(row.compliance) }}
                                        >
                                            {row.compliance}%
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

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default ComplianceReports
