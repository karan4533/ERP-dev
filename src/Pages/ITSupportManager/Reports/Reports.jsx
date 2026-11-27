import React, { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import { getTickets, hydrateTicketsFromApi } from '../../../Common/demoDomain/itTickets'
import { getAssets, hydrateAssetsFromApi } from '../AssetManagement/assetData'
import {
    REPORT_TYPES,
    buildTicketResolutionReport,
    buildAssetUtilizationReport,
    buildDamagedAssetsReport,
    buildRenewedLicensesReport,
    priorityBadgeColor,
    ticketStatusBadgeColor,
    usageStatusBadgeColor,
    damageStatusBadgeColor,
} from './reportsData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const ReportTableSection = ({ title, children, onExport }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <div className='flex justify-between items-center sm:flex-row flex-col gap-y-2 mb-4'>
            <h2 className='text-xl font-medium text-black'>{title}</h2>
            {onExport && (
                <button
                    type='button'
                    onClick={onExport}
                    className='bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer flex items-center gap-x-2'
                >
                    <Download size={16} />
                    Export
                </button>
            )}
        </div>
        <div className="relative overflow-x-auto">{children}</div>
    </div>
)

const EmptyRow = ({ cols }) => (
    <tr>
        <td colSpan={cols} className='px-2 py-6 text-center text-[#667085]'>No records from current tickets and assets.</td>
    </tr>
)

const Reports = () => {
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [exportModal, setExportModal] = useState(false)
    const [activeReport, setActiveReport] = useState('All')
    const [tickets, setTickets] = useState(() => getTickets())
    const [assets, setAssets] = useState(() => getAssets())

    useEffect(() => {
        let active = true
        Promise.all([hydrateTicketsFromApi(), hydrateAssetsFromApi()]).finally(() => {
            if (!active) return
            setTickets(getTickets())
            setAssets(getAssets())
        })
        return () => { active = false }
    }, [])

    const ticketRows = useMemo(() => buildTicketResolutionReport(tickets, fromDate, toDate), [tickets, fromDate, toDate])
    const utilizationRows = useMemo(() => buildAssetUtilizationReport(assets), [assets])
    const damagedRows = useMemo(() => buildDamagedAssetsReport(assets, tickets), [assets, tickets])
    const licenseRows = useMemo(() => buildRenewedLicensesReport(assets), [assets])

    const show = (type) => activeReport === 'All' || activeReport === type

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h3 className='text-base font-semibold text-[#1E1E1E] mb-4'>Report Types</h3>
                <div className='flex flex-wrap gap-2'>
                    <button
                        type='button'
                        onClick={() => setActiveReport('All')}
                        className={`text-sm px-4 py-2 rounded-md border transition-all cursor-pointer ${activeReport === 'All' ? 'bg-[#515DEF] text-white border-[#515DEF]' : 'bg-white text-[#515DEF] border-[#515DEF] hover:bg-[#515DEF] hover:text-white'}`}
                    >
                        All Reports
                    </button>
                    {REPORT_TYPES.map((type) => (
                        <button
                            key={type}
                            type='button'
                            onClick={() => setActiveReport(type)}
                            className={`text-sm px-4 py-2 rounded-md border transition-all cursor-pointer ${activeReport === type ? 'bg-[#515DEF] text-white border-[#515DEF]' : 'bg-white text-[#515DEF] border-[#515DEF] hover:bg-[#515DEF] hover:text-white'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between md:items-center sm:items-stretch md:flex-row sm:flex-col flex-col gap-y-4'>
                    <button type='button' onClick={() => { setFromDate(null); setToDate(null); setActiveReport('All') }} className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
                    <select className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full md:max-w-xs'>
                        <option value="">From Beginning</option>
                    </select>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 lg:mt-6 mt-2'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>From</label>
                        <div className='relative w-full'>
                            <DatePicker selected={fromDate} onChange={setFromDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-base font-medium text-[#808080]'>To</label>
                        <div className='relative'>
                            <DatePicker selected={toDate} onChange={setToDate} isClearable showMonthYearDropdown scrollableMonthYearDropdown className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none' />
                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                        </div>
                    </div>
                </div>
            </div>

            {show('Ticket Resolution Report') && (
                <ReportTableSection title="Ticket Resolution Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Ticket ID</th>
                                <th className={thClass}>Issue Type</th>
                                <th className={thClass}>Priority</th>
                                <th className={thClass}>Assigned To</th>
                                <th className={thClass}>Resolution Time</th>
                                <th className={`${thClass} rounded-e-lg`}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ticketRows.length === 0 && <EmptyRow cols={6} />}
                            {ticketRows.map((row) => (
                                <tr key={row.ticketId} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.ticketId}</td>
                                    <td className={tdClass}>{row.issueType}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${priorityBadgeColor[row.priority] || ''}`}>{row.priority}</span>
                                    </td>
                                    <td className={tdClass}>{row.assignedTo}</td>
                                    <td className={tdClass}>{row.resolutionTime}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${ticketStatusBadgeColor[row.status] || ''}`}>{row.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            {show('Asset Utilization Report') && (
                <ReportTableSection title="Asset Utilization Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Asset ID</th>
                                <th className={thClass}>Asset Name</th>
                                <th className={thClass}>Assigned To</th>
                                <th className={thClass}>Usage Status</th>
                                <th className={`${thClass} rounded-e-lg`}>Department</th>
                            </tr>
                        </thead>
                        <tbody>
                            {utilizationRows.length === 0 && <EmptyRow cols={5} />}
                            {utilizationRows.map((row) => (
                                <tr key={row.assetId} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.assetId}</td>
                                    <td className={`${tdClass} max-w-[180px] truncate`} title={row.assetName}>{row.assetName}</td>
                                    <td className={tdClass}>{row.assignedTo}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${usageStatusBadgeColor[row.usageStatus] || ''}`}>{row.usageStatus}</span>
                                    </td>
                                    <td className={`${tdClass} rounded-e-lg`}>{row.department}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            {show('Damaged Assets Report') && (
                <ReportTableSection title="Damaged Assets Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Asset ID</th>
                                <th className={thClass}>Asset Name</th>
                                <th className={thClass}>Damage Type</th>
                                <th className={thClass}>Reported Date</th>
                                <th className={`${thClass} rounded-e-lg`}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {damagedRows.length === 0 && <EmptyRow cols={5} />}
                            {damagedRows.map((row) => (
                                <tr key={`${row.assetId}-${row.reportedDate}`} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.assetId}</td>
                                    <td className={`${tdClass} max-w-[180px] truncate`} title={row.assetName}>{row.assetName}</td>
                                    <td className={tdClass}>{row.damageType}</td>
                                    <td className={tdClass}>{row.reportedDate}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${damageStatusBadgeColor[row.status] || ''}`}>{row.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            {show('Renewed Licenses Report') && (
                <ReportTableSection title="Renewed Licenses Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>License Name</th>
                                <th className={thClass}>Vendor</th>
                                <th className={thClass}>Renewal Date</th>
                                <th className={thClass}>Expiry Date</th>
                                <th className={`${thClass} rounded-e-lg`}>Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {licenseRows.length === 0 && <EmptyRow cols={5} />}
                            {licenseRows.map((row) => (
                                <tr key={row.licenseName} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.licenseName}</td>
                                    <td className={tdClass}>{row.vendor}</td>
                                    <td className={tdClass}>{row.renewalDate}</td>
                                    <td className={tdClass}>{row.expiryDate}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>{row.cost}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename="it-support-reports"
                title="IT Support Reports"
                rows={[...ticketRows, ...utilizationRows, ...damagedRows, ...licenseRows]}
                exportDescription={<>You are exporting IT support report rows for the selected filters.</>}
            />
        </section>
    )
}

export default Reports
