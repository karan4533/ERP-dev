import React, { useState } from 'react'
import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    CloudUpload,
    Download,
    FileSpreadsheet,
    History,
    Pencil,
    Plus,
    Search,
    Settings2,
    Upload,
    Bell,
    Send,
    Printer,
} from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import DefineFeeStructureModal from './Components/DefineFeeStructureModal'
import ConfigureFeeStructureModal from './Components/ConfigureFeeStructureModal'
import { toast } from 'react-toastify'
import FeeCollectionTab from './Components/FeeCollectionTab'
import { useFinance } from '../financeDomain/FinanceContext'
import { FEE_FREQUENCIES } from '../financeDomain/financeConstants'
import { formatCurrency } from '../financeDomain/financeHelpers'
import ConcessionsWaiversTab from './Components/ConcessionsWaiversTab'
import DefaultersTab from './Components/DefaultersTab'
import ReceiptManagementTab from './Components/ReceiptManagementTab'
import ActivityFeesTab from './Components/ActivityFeesTab'
import {
    ACADEMIC_YEARS,
    FEE_TABS,
    GRADES,
    QUICK_STATS,
    TERMS,
    feeStructureStatusBadgeColor,
} from './feesManagementData'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const FeeStructureTab = ({ exportModal, setExportModal }) => {
    const { feeStructures, feeCategories } = useFinance()
    const categoryName = (id) => feeCategories.find((item) => item.id === id)?.name ?? id
    const frequencyLabel = (id) => FEE_FREQUENCIES.find((item) => item.id === id)?.label ?? id

    return (
    <div className='space-y-6'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='bg-white rounded-2xl shadow-md p-5'>
                <div className='border-2 border-dashed border-[#515DEF]/30 rounded-2xl bg-[#515DEF]/5 px-6 py-10 text-center'>
                    <div className='mx-auto mb-4 size-14 rounded-full bg-[#515DEF]/10 text-[#515DEF] flex items-center justify-center'>
                        <CloudUpload size={28} />
                    </div>
                    <h3 className='text-base font-semibold text-[#1E1E1E]'>Import Fee Structure</h3>
                    <p className='text-sm text-[#667085] mt-2'>
                        Drag and drop your Excel file here or{' '}
                        <button type='button' className='text-[#515DEF] font-medium hover:underline cursor-pointer'>
                            browse file
                        </button>
                    </p>
                    <div className='flex justify-center gap-2 mt-4'>
                        <span className='text-xs font-medium px-2.5 py-1 rounded bg-[#515DEF]/10 text-[#515DEF]'>.xlsx</span>
                        <span className='text-xs font-medium px-2.5 py-1 rounded bg-[#515DEF]/10 text-[#515DEF]'>.csv</span>
                    </div>
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-[#F2F4F7]'>
                    <button type='button' className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] hover:opacity-80 cursor-pointer'>
                        <Download size={16} />
                        Download sample template
                    </button>
                    <p className='text-sm text-[#667085]'>
                        Configuration Status:{' '}
                        <span className='font-semibold text-[#4CAF50]'>Ready</span>
                    </p>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-5'>
                <div className='flex items-start justify-between gap-3 mb-4'>
                    <h3 className='text-base font-semibold text-[#1E1E1E]'>Quick Statistics</h3>
                    <span className='text-[10px] font-semibold px-2.5 py-1 rounded bg-[#515DEF]/10 text-[#515DEF] whitespace-nowrap'>
                        {QUICK_STATS.academicYear}
                    </span>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                    <div className='border border-[#EDEEF5] rounded-xl p-3'>
                        <p className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide'>Grades Configured</p>
                        <p className='text-lg font-semibold text-[#1E1E1E] mt-1'>{QUICK_STATS.gradesConfigured}</p>
                    </div>
                    <div className='border border-[#EDEEF5] rounded-xl p-3'>
                        <p className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide'>Fee Categories</p>
                        <p className='text-lg font-semibold text-[#1E1E1E] mt-1'>{QUICK_STATS.feeCategories}</p>
                    </div>
                    <div className='border border-[#EDEEF5] rounded-xl p-3'>
                        <p className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide'>Terms Split</p>
                        <p className='text-lg font-semibold text-[#515DEF] mt-1'>{QUICK_STATS.termsSplit}</p>
                    </div>
                    <div className='border border-[#EDEEF5] rounded-xl p-3'>
                        <p className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide'>Annual Billing</p>
                        <p className='text-lg font-semibold text-[#515DEF] mt-1'>{QUICK_STATS.annualBilling}</p>
                    </div>
                </div>

                <div className='mt-5'>
                    <div className='flex items-center justify-between text-sm mb-2'>
                        <span className='text-[#667085]'>Overall Setup Progress</span>
                        <span className='font-semibold text-[#515DEF]'>{QUICK_STATS.setupProgress}%</span>
                    </div>
                    <div className='h-2 rounded-full bg-[#EDEEF5] overflow-hidden'>
                        <div
                            className='h-full rounded-full bg-[#515DEF] transition-all duration-300'
                            style={{ width: `${QUICK_STATS.setupProgress}%` }}
                        />
                    </div>
                </div>

                <div className='mt-4 flex items-start gap-3 rounded-xl border border-[#FF572233] bg-[#FF57220D] px-4 py-3'>
                    <AlertTriangle size={18} className='text-[#FF5722] shrink-0 mt-0.5' />
                    <div className='flex-1 min-w-0'>
                        <p className='text-sm text-[#667085]'>{QUICK_STATS.alertMessage}</p>
                    </div>
                    <button type='button' className='text-sm font-semibold text-[#FF5722] hover:opacity-80 whitespace-nowrap cursor-pointer'>
                        Fix Now
                    </button>
                </div>
            </div>
        </div>

        <div className='bg-white rounded-2xl shadow-md p-4'>
            <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4'>
                <h3 className='text-base font-semibold text-[#1E1E1E]'>Configured Fee Structures</h3>
                <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                    <div className='relative min-w-[180px]'>
                        <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-[#808080]' />
                        <input
                            type='text'
                            placeholder='Search grades...'
                            className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                        />
                    </div>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[170px]'>
                        {ACADEMIC_YEARS.map((year) => (
                            <option key={year} value={year}>Academic Year: {year}</option>
                        ))}
                    </select>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                        {TERMS.map((term) => (
                            <option key={term} value={term}>{term}</option>
                        ))}
                    </select>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                        {GRADES.map((grade) => (
                            <option key={grade} value={grade}>{grade}</option>
                        ))}
                    </select>
                    <button
                        type='button'
                        onClick={() => setExportModal(true)}
                        className='size-10 flex items-center justify-center border border-[#D9D9D9] rounded-md text-[#667085] hover:text-[#515DEF] hover:border-[#515DEF] transition-colors cursor-pointer'
                        aria-label='Export fee structures'
                    >
                        <Upload size={16} />
                    </button>
                </div>
            </div>

            <div className='relative overflow-x-auto'>
                <table className='w-full text-sm text-left'>
                    <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                        <tr>
                            <th className={`${thClass} rounded-s-lg`}>Academic Year</th>
                            <th className={thClass}>Class</th>
                            <th className={thClass}>Category</th>
                            <th className={thClass}>Fee Head</th>
                            <th className={thClass}>Frequency</th>
                            <th className={thClass}>Amount</th>
                            <th className={thClass}>Due Day</th>
                            <th className={thClass}>Mandatory</th>
                            <th className={thClass}>Status</th>
                            <th className={`${thClass} rounded-e-lg`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {feeStructures.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.academicYear}</td>
                                <td className={tdClass}>{row.className}</td>
                                <td className={tdClass}>{categoryName(row.feeCategoryId)}</td>
                                <td className={tdClass}>{row.feeHead}</td>
                                <td className={tdClass}>{frequencyLabel(row.frequency)}</td>
                                <td className={`${tdClass} font-semibold text-[#515DEF]`}>{formatCurrency(row.amount)}</td>
                                <td className={tdClass}>{row.dueDayOfMonth ? `${row.dueDayOfMonth}` : '—'}</td>
                                <td className={tdClass}>{row.mandatory ? 'Yes' : 'Optional'}</td>
                                <td className={tdClass}>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${feeStructureStatusBadgeColor[row.status]}`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className={`${tdClass} rounded-e-lg`}>
                                    <div className='flex items-center gap-2'>
                                        <button type='button' className='p-1.5 rounded-md hover:bg-[#EDEEF5] text-[#667085] hover:text-[#515DEF] cursor-pointer' aria-label='Edit fee structure'>
                                            <Pencil size={16} />
                                        </button>
                                        <button type='button' className='p-1.5 rounded-md hover:bg-[#EDEEF5] text-[#667085] hover:text-[#515DEF] cursor-pointer' aria-label='View fee history'>
                                            <History size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-2'>
                <p className='text-sm text-[#667085]'>Showing {feeStructures.length} structures</p>
                <div className='flex items-center gap-2'>
                    <button type='button' className='size-8 flex items-center justify-center rounded-md border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                        <ChevronLeft size={16} />
                    </button>
                    {[1, 2, 3].map((page) => (
                        <button
                            key={page}
                            type='button'
                            className={`size-8 flex items-center justify-center rounded-md text-sm font-medium cursor-pointer transition-colors ${
                                page === 1
                                    ? 'bg-[#515DEF] text-white'
                                    : 'border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button type='button' className='size-8 flex items-center justify-center rounded-md border border-[#E2E8F0] text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>

        <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
    </div>
    )
}

const FeesManagement = () => {
    const [activeTab, setActiveTab] = useState('fee-structure')
    const [exportModal, setExportModal] = useState(false)
    const [defineFeeModal, setDefineFeeModal] = useState(false)
    const [configureFeeModal, setConfigureFeeModal] = useState(false)
    const { addFeeStructure, addFeeCategory } = useFinance()

    const activeTabLabel = activeTab === 'defaulters'
        ? 'Defaulters Management'
        : FEE_TABS.find((tab) => tab.id === activeTab)?.label ?? 'Fee Structure'

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                    <h2 className='text-xl font-semibold text-black'>{activeTabLabel}</h2>
                    {activeTab === 'fee-structure' && (
                        <div className='flex flex-wrap items-center gap-3'>
                            <button
                                type='button'
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                <FileSpreadsheet size={16} />
                                Upload Excel
                            </button>
                            <button
                                type='button'
                                onClick={() => setConfigureFeeModal(true)}
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                <Settings2 size={16} />
                                Configure Fee Structure
                            </button>
                            <button
                                type='button'
                                onClick={() => setDefineFeeModal(true)}
                                className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                            >
                                <Plus size={16} />
                                Define Fee Structure
                            </button>
                        </div>
                    )}
                    {activeTab === 'fee-collection' && (
                        <div className='flex flex-wrap items-center gap-3'>
                            <button
                                type='button'
                                onClick={() => setExportModal(true)}
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                <Download size={16} />
                                Export Collection Report
                            </button>
                            <button
                                type='button'
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                <Bell size={16} />
                                Send Reminder
                            </button>
                            <button
                                type='button'
                                onClick={() => toast.info('Search a student below, select unpaid instalments, then use Pay / Collect.')}
                                className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                            >
                                <Plus size={16} />
                                Collect Fee
                            </button>
                        </div>
                    )}
                    {activeTab === 'concessions-waivers' && (
                        <div className='flex flex-wrap items-center gap-3'>
                            <button
                                type='button'
                                onClick={() => setExportModal(true)}
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                <Download size={16} />
                                Export Report
                            </button>
                            <button
                                type='button'
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                <Upload size={16} />
                                Import Applications
                            </button>
                            <button
                                type='button'
                                className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                            >
                                <Plus size={16} />
                                Add Concession
                            </button>
                        </div>
                    )}
                    {activeTab === 'defaulters' && (
                        <div className='flex flex-wrap items-center gap-3'>
                            <button
                                type='button'
                                onClick={() => setExportModal(true)}
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                <Download size={16} />
                                Export Report
                            </button>
                            <button
                                type='button'
                                className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                            >
                                <Send size={16} />
                                Bulk Reminder
                            </button>
                        </div>
                    )}
                    {activeTab === 'receipt-management' && (
                        <div className='flex flex-wrap items-center gap-3'>
                            <button
                                type='button'
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                <Printer size={16} />
                                Bulk Print
                            </button>
                            <button
                                type='button'
                                onClick={() => setExportModal(true)}
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                <Download size={16} />
                                Export Register
                            </button>
                            <button
                                type='button'
                                className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                            >
                                <Plus size={16} />
                                Generate Receipt
                            </button>
                        </div>
                    )}
                </div>

                <div className='flex gap-6 overflow-x-auto no-scrollbar mt-6 border-b border-[#F2F4F7]'>
                    {FEE_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type='button'
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap px-1 pb-3 text-sm md:text-base font-medium cursor-pointer transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'text-[#515DEF] border-b-2 border-[#515DEF] font-semibold'
                                    : 'text-[#808080]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'fee-structure' && (
                <FeeStructureTab exportModal={exportModal} setExportModal={setExportModal} />
            )}

            {activeTab === 'fee-collection' && <FeeCollectionTab />}
            {activeTab === 'concessions-waivers' && (
                <ConcessionsWaiversTab exportModal={exportModal} setExportModal={setExportModal} />
            )}
            {activeTab === 'defaulters' && (
                <DefaultersTab exportModal={exportModal} setExportModal={setExportModal} />
            )}
            {activeTab === 'receipt-management' && (
                <ReceiptManagementTab exportModal={exportModal} setExportModal={setExportModal} />
            )}
            {activeTab === 'activity-fees' && <ActivityFeesTab />}

            {defineFeeModal && (
                <DefineFeeStructureModal
                    isOpen
                    onClose={() => setDefineFeeModal(false)}
                    onSave={addFeeStructure}
                    onAddCategory={addFeeCategory}
                />
            )}
            <ConfigureFeeStructureModal
                isOpen={configureFeeModal}
                onClose={() => setConfigureFeeModal(false)}
            />
        </section>
    )
}

export default FeesManagement
