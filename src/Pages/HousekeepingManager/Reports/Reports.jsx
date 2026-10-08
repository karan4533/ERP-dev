import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Download } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import {
    REPORT_TYPES,
    TASK_COMPLETION_REPORT,
    SUPPLY_USAGE_REPORT,
    ZONE_CLEANING_REPORT,
    LOW_STOCK_REPORT,
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

const Reports = () => {
    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [exportModal, setExportModal] = useState(false)
    const [activeReport, setActiveReport] = useState('All')

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
                    <button className='bg-[#515DEF] text-white uppercase text-sm px-6 py-2 border border-[#515DEF] rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer'>Clear Filters</button>
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

            {show('Task Completion Report') && (
                <ReportTableSection title="Task Completion Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Task</th>
                                <th className={thClass}>Assigned To</th>
                                <th className={thClass}>Zone</th>
                                <th className={thClass}>Completed</th>
                                <th className={`${thClass} rounded-e-lg`}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {TASK_COMPLETION_REPORT.map((row) => (
                                <tr key={`${row.task}-${row.date}`} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.task}</td>
                                    <td className={tdClass}>{row.assignedTo}</td>
                                    <td className={tdClass}>{row.zone}</td>
                                    <td className={tdClass}>{row.completed}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>{row.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            {show('Supply Usage Report') && (
                <ReportTableSection title="Supply Usage Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Item</th>
                                <th className={thClass}>Quantity Used</th>
                                <th className={thClass}>Zone</th>
                                <th className={`${thClass} rounded-e-lg`}>Period</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SUPPLY_USAGE_REPORT.map((row) => (
                                <tr key={`${row.item}-${row.zone}`} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.item}</td>
                                    <td className={tdClass}>{row.quantityUsed}</td>
                                    <td className={tdClass}>{row.zone}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>{row.period}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            {show('Zone Cleaning Report') && (
                <ReportTableSection title="Zone Cleaning Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Zone</th>
                                <th className={thClass}>Last Cleaned</th>
                                <th className={thClass}>Status</th>
                                <th className={`${thClass} rounded-e-lg`}>Staff</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ZONE_CLEANING_REPORT.map((row) => (
                                <tr key={row.zone} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.zone}</td>
                                    <td className={tdClass}>{row.lastCleaned}</td>
                                    <td className={tdClass}>{row.status}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>{row.staff}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            {show('Low Stock Report') && (
                <ReportTableSection title="Low Stock Report" onExport={() => setExportModal(true)}>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg">
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Item</th>
                                <th className={thClass}>Current Qty</th>
                                <th className={`${thClass} rounded-e-lg`}>Reorder Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {LOW_STOCK_REPORT.map((row) => (
                                <tr key={row.item} className="border-b border-[#f2f4f7] hover:bg-[#f2f4f7]">
                                    <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.item}</td>
                                    <td className={`${tdClass} ${row.currentQty <= row.reorderLevel ? 'text-[#FF5722] font-medium' : ''}`}>{row.currentQty}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>{row.reorderLevel}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportTableSection>
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default Reports
