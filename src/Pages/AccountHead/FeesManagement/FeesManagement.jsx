import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    AlertTriangle,
    CloudUpload,
    Download,
    FileSpreadsheet,
    Pencil,
    Plus,
    Search,
    Settings2,
    Trash2,
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
    FEE_TABS,
    TERMS,
    feeStructureStatusBadgeColor,
} from './feesManagementData'
import { buildFeeQuickStats } from '../financeDomain/financeLiveViews'
import FinanceSnapshotBanner from '../financeDomain/FinanceSnapshotBanner'
import { FEE_STRUCTURE_CSV_TEMPLATE, parseFeeStructureUpload } from './feeStructureImport'
import { loadAdminAcademicYears } from './feeCampusOptions'
import { feeReminderSweepApi } from '../../../services/financeApi'
import { isApiFinanceEnabled } from '../../../services/apiClient'
import { canShowDeleteOption } from '../../../Common/CommonComponents/approvalGates'
import { useAuth } from '../../../context/AuthContext'

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const downloadFeeTemplate = () => {
    const blob = new Blob([FEE_STRUCTURE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fee-structure-template.csv'
    link.click()
    URL.revokeObjectURL(url)
}

const FeeStructureTab = ({
    exportModal,
    setExportModal,
    onImportFile,
    fileInputRef,
    onEditStructure,
    onDeleteStructure,
    deletingId,
    canWrite = true,
    canDelete = true,
}) => {
    const { feeStructures, feeCategories, students, installments, financePersistence } = useFinance()
    const showDelete = Boolean(canWrite && canDelete)
    const [search, setSearch] = useState('')
    const [yearFilter, setYearFilter] = useState('')
    const [gradeFilter, setGradeFilter] = useState('All Grades')
    const [adminYears, setAdminYears] = useState([])

    useEffect(() => {
        let cancelled = false
        loadAdminAcademicYears()
            .then((years) => { if (!cancelled) setAdminYears(years) })
            .catch(() => { if (!cancelled) setAdminYears([]) })
        return () => { cancelled = true }
    }, [])

    const quickStats = useMemo(
        () => buildFeeQuickStats({ feeStructures, feeCategories, students, installments, adminYears }),
        [feeStructures, feeCategories, students, installments, adminYears],
    )
    const filteredStructures = useMemo(() => {
        const query = search.trim().toLowerCase()
        return feeStructures.filter((row) => {
            if (yearFilter && row.academicYear !== yearFilter) return false
            if (gradeFilter !== 'All Grades' && row.className !== gradeFilter) return false
            if (!query) return true
            return [row.className, row.feeHead, row.academicYear]
                .join(' ')
                .toLowerCase()
                .includes(query)
        })
    }, [feeStructures, search, yearFilter, gradeFilter])
    const categoryName = (id) => feeCategories.find((item) => item.id === id)?.name ?? id
    const frequencyLabel = (id) => FEE_FREQUENCIES.find((item) => item.id === id)?.label ?? id

    return (
    <div className='space-y-6'>
        <FinanceSnapshotBanner mockNote='Quick statistics and the structure table use the campus finance snapshot (not hardcoded 2023-24 demo figures).' />
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='bg-white rounded-2xl shadow-md p-5'>
                <div className='border-2 border-dashed border-[#515DEF]/30 rounded-2xl bg-[#515DEF]/5 px-6 py-10 text-center'>
                    <div className='mx-auto mb-4 size-14 rounded-full bg-[#515DEF]/10 text-[#515DEF] flex items-center justify-center'>
                        <CloudUpload size={28} />
                    </div>
                    <h3 className='text-base font-semibold text-[#1E1E1E]'>Import Fee Structure</h3>
                    <p className='text-sm text-[#667085] mt-2'>
                        Upload a CSV (or .xlsx saved as CSV). Columns:{' '}
                        <span className='font-medium text-[#1E1E1E]'>academicYear, className, feeCategory, feeHead, frequency, amount, dueDay</span>.
                    </p>
                    <button
                        type='button'
                        onClick={() => fileInputRef?.current?.click()}
                        className='mt-4 text-sm font-medium text-[#515DEF] hover:underline cursor-pointer'
                    >
                        browse file
                    </button>
                    <div className='flex justify-center gap-2 mt-4'>
                        <span className='text-xs font-medium px-2.5 py-1 rounded bg-[#515DEF]/10 text-[#515DEF]'>.csv</span>
                        <span className='text-xs font-medium px-2.5 py-1 rounded bg-[#6670851A] text-[#667085]'>.xlsx → save as CSV</span>
                    </div>
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-[#F2F4F7]'>
                    <button
                        type='button'
                        onClick={downloadFeeTemplate}
                        className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] hover:opacity-80 cursor-pointer'
                    >
                        <Download size={16} />
                        Download sample template
                    </button>
                    <p className='text-sm text-[#667085]'>
                        Snapshot:{' '}
                        <span className='font-semibold text-[#4CAF50]'>
                            {financePersistence?.apiEnabled ? 'API' : 'Offline'} · {quickStats.structureCount} structures
                        </span>
                    </p>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-5'>
                <div className='flex items-start justify-between gap-3 mb-4'>
                    <h3 className='text-base font-semibold text-[#1E1E1E]'>Quick Statistics</h3>
                    <span className='text-[10px] font-semibold px-2.5 py-1 rounded bg-[#515DEF]/10 text-[#515DEF] whitespace-nowrap'>
                        {quickStats.academicYear}
                    </span>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                    <div className='border border-[#EDEEF5] rounded-xl p-3'>
                        <p className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide'>Grades Configured</p>
                        <p className='text-lg font-semibold text-[#1E1E1E] mt-1'>{quickStats.gradesConfigured}</p>
                    </div>
                    <div className='border border-[#EDEEF5] rounded-xl p-3'>
                        <p className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide'>Fee Categories</p>
                        <p className='text-lg font-semibold text-[#1E1E1E] mt-1'>{quickStats.feeCategories}</p>
                    </div>
                    <div className='border border-[#EDEEF5] rounded-xl p-3'>
                        <p className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide'>Billing mode</p>
                        <p className='text-lg font-semibold text-[#515DEF] mt-1'>{quickStats.termsSplit}</p>
                    </div>
                    <div className='border border-[#EDEEF5] rounded-xl p-3'>
                        <p className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide'>Structure total</p>
                        <p className='text-lg font-semibold text-[#515DEF] mt-1'>{quickStats.annualBilling}</p>
                    </div>
                </div>

                <div className='mt-5'>
                    <div className='flex items-center justify-between text-sm mb-2'>
                        <span className='text-[#667085]'>Overall Setup Progress</span>
                        <span className='font-semibold text-[#515DEF]'>{quickStats.setupProgress}%</span>
                    </div>
                    <div className='h-2 rounded-full bg-[#EDEEF5] overflow-hidden'>
                        <div
                            className='h-full rounded-full bg-[#515DEF] transition-all duration-300'
                            style={{ width: `${quickStats.setupProgress}%` }}
                        />
                    </div>
                </div>

                <div className='mt-4 flex items-start gap-3 rounded-xl border border-[#FF572233] bg-[#FF57220D] px-4 py-3'>
                    <AlertTriangle size={18} className='text-[#FF5722] shrink-0 mt-0.5' />
                    <div className='flex-1 min-w-0'>
                        <p className='text-sm text-[#667085]'>{quickStats.alertMessage}</p>
                    </div>
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
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Search grades...'
                            className='w-full text-sm border border-[#D9D9D9] rounded-md pl-9 pr-3 py-2'
                        />
                    </div>
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[170px]'
                    >
                        <option value=''>All academic years</option>
                        {quickStats.years.map((year) => (
                            <option key={year} value={year}>Academic Year: {year}</option>
                        ))}
                    </select>
                    <select className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'>
                        {TERMS.map((term) => (
                            <option key={term} value={term}>{term}</option>
                        ))}
                    </select>
                    <select
                        value={gradeFilter}
                        onChange={(e) => setGradeFilter(e.target.value)}
                        className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[130px]'
                    >
                        {quickStats.classOptions.map((grade) => (
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
                            {canWrite && <th className={`${thClass} rounded-e-lg`}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStructures.length === 0 ? (
                            <tr>
                                <td colSpan={canWrite ? 10 : 9} className='px-2 py-10 text-center text-sm text-[#667085]'>
                                    No fee structures in the campus snapshot yet.
                                    {canWrite
                                        ? ' Define one above, or import enrolled students and bootstrap from Settings.'
                                        : ' Ask Account Head to configure fee structures.'}
                                </td>
                            </tr>
                        ) : filteredStructures.map((row) => (
                            <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${tdClass} font-medium text-[#1E1E1E] rounded-s-lg`}>{row.academicYear}</td>
                                <td className={tdClass}>{row.className}</td>
                                <td className={tdClass}>{categoryName(row.feeCategoryId)}</td>
                                <td className={tdClass}>{row.feeHead}</td>
                                <td className={tdClass}>{frequencyLabel(row.frequency)}</td>
                                <td className={`${tdClass} font-semibold text-[#515DEF]`}>{formatCurrency(row.amount)}</td>
                                <td className={tdClass}>{row.dueDayOfMonth ? `${row.dueDayOfMonth}` : '—'}</td>
                                <td className={tdClass}>{row.mandatory ? 'Yes' : 'Optional'}</td>
                                <td className={`${tdClass}${canWrite ? '' : ' rounded-e-lg'}`}>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${feeStructureStatusBadgeColor[row.status] || 'bg-[#F2F4F7] text-[#667085]'}`}>
                                        {row.status}
                                    </span>
                                </td>
                                {canWrite && (
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <div className='flex items-center gap-2'>
                                            <button
                                                type='button'
                                                onClick={() => onEditStructure?.(row)}
                                                className='p-1.5 rounded-md hover:bg-[#EDEEF5] text-[#667085] hover:text-[#515DEF] cursor-pointer'
                                                aria-label='Edit fee structure'
                                                title='Edit'
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            {showDelete ? (
                                                <button
                                                    type='button'
                                                    disabled={deletingId === row.id}
                                                    onClick={() => onDeleteStructure?.(row)}
                                                    className='p-1.5 rounded-md hover:bg-[#FF572214] text-[#667085] hover:text-[#FF5722] cursor-pointer disabled:opacity-50'
                                                    aria-label='Delete fee structure'
                                                    title='Delete'
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            ) : null}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-2'>
                <p className='text-sm text-[#667085]'>
                    Showing {filteredStructures.length} of {feeStructures.length} structures
                    {' · '}
                    {quickStats.studentCount} finance student(s) · {quickStats.installmentCount} installment(s)
                </p>
            </div>
        </div>

        <ExportModal
                exportModal={exportModal}
                setExportModal={setExportModal}
                filename='feesmanagement'
                title='FeesManagement'
                rows={Array.isArray(filteredStructures) ? filteredStructures : []}
                exportDescription={<>You are exporting {Array.isArray(filteredStructures) ? filteredStructures.length : 0} record(s).</>}
            />
    </div>
    )
}

const FeesManagement = () => {
    const { role } = useAuth() || {}
    const canDeleteStructures = canShowDeleteOption(role)
    const {
        defineFeeStructure,
        addFeeCategory,
        saveFeeCategories,
        deleteFeeStructure,
        canWriteFinance,
    } = useFinance()
    const visibleTabs = useMemo(
        () => (canWriteFinance
            ? FEE_TABS
            : FEE_TABS.filter((tab) => tab.id !== 'concessions-waivers')),
        [canWriteFinance],
    )
    const [activeTab, setActiveTab] = useState(() => (canWriteFinance ? 'fee-structure' : 'fee-collection'))
    const [exportModal, setExportModal] = useState(false)
    const [defineFeeModal, setDefineFeeModal] = useState(false)
    const [editingStructure, setEditingStructure] = useState(null)
    const [configureFeeModal, setConfigureFeeModal] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const fileInputRef = useRef(null)
    const [remindersBusy, setRemindersBusy] = useState(false)

    useEffect(() => {
        if (!visibleTabs.some((tab) => tab.id === activeTab)) {
            setActiveTab(visibleTabs[0]?.id || 'fee-collection')
        }
    }, [activeTab, visibleTabs])

    const sendFeeReminders = async () => {
        if (!isApiFinanceEnabled()) {
            toast.info('Fee reminders need the campus server connection.')
            return
        }
        setRemindersBusy(true)
        try {
            const result = await feeReminderSweepApi()
            if (!result?.sent) {
                toast.info('No new reminders due. Parents get one 15 days before each due date and a weekly one in the final month of the year.')
            } else {
                toast.success(`Sent ${result.sent} in-app reminder${result.sent === 1 ? '' : 's'} to parents.`)
            }
            if (result?.skippedNoParentLogin) {
                toast.warning(`${result.skippedNoParentLogin} student(s) with dues have no parent login, so no reminder was sent.`)
            }
        } catch (error) {
            toast.error(error?.message || 'Could not send fee reminders.')
        } finally {
            setRemindersBusy(false)
        }
    }

    const openDefineModal = (structure = null) => {
        setEditingStructure(structure)
        setDefineFeeModal(true)
    }

    const closeDefineModal = () => {
        setDefineFeeModal(false)
        setEditingStructure(null)
    }

    const handleDeleteStructure = async (row) => {
        if (!canDeleteStructures || !row?.id) return
        const label = `${row.className || 'Class'} · ${row.feeHead || 'Fee'} · ${formatCurrency(row.amount)}`
        const confirmed = window.confirm(
            `Delete this fee structure?\n\n${label}\n\nUnpaid installments for this structure will be removed. Paid installments are kept.`,
        )
        if (!confirmed) return
        setDeletingId(row.id)
        try {
            const result = await deleteFeeStructure(row.id)
            if (!result?.success) {
                toast.error(result?.message || result?.persist?.message || 'Could not delete fee structure.')
                return
            }
            toast.success(
                result.persist?.api
                    ? `Deleted ${label}. Removed ${result.removedInstallments || 0} unpaid installment(s).`
                    : `Deleted ${label} (offline / pending sync).`,
            )
        } catch (error) {
            toast.error(error?.message || 'Delete failed.')
        } finally {
            setDeletingId(null)
        }
    }

    const handleImportFile = async (event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        const name = String(file.name || '').toLowerCase()
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            toast.error('Upload a CSV file (Excel → Save As → CSV). Binary .xlsx is not parsed yet.')
            return
        }
        try {
            const text = await file.text()
            const parsed = parseFeeStructureUpload(text)
            if (!parsed.success) {
                toast.error(parsed.message || 'Could not parse file.')
                return
            }
            const categoryNames = [...new Set(parsed.rows.map((row) => row.feeCategory).filter(Boolean))]
            let latestCategories
            if (categoryNames.length) {
                const saved = await saveFeeCategories(categoryNames)
                latestCategories = saved.feeCategories
            }
            let installments = 0
            let latestStructures
            let latestInstallments
            for (const row of parsed.rows) {
                const feeCategoryId = addFeeCategory(row.feeCategory)
                const result = await defineFeeStructure({
                    academicYear: row.academicYear,
                    className: row.className,
                    feeCategoryId,
                    feeHead: row.feeHead,
                    frequency: row.frequency,
                    amount: row.amount,
                    dueDayOfMonth: row.dueDayOfMonth,
                    fineRuleId: null,
                    concessionApplicable: row.concessionApplicable,
                    mandatory: row.mandatory,
                    status: row.status,
                }, {
                    feeCategories: latestCategories,
                    feeStructures: latestStructures,
                    installments: latestInstallments,
                })
                installments += result?.installmentsCreated || 0
                latestStructures = result?.feeStructures
                latestInstallments = result?.installments
            }
            toast.success(
                `Imported ${parsed.rows.length} fee structure row(s) · ${installments} installment(s) via finance API.`,
            )
            if (parsed.errors?.length) {
                toast.warn(`${parsed.errors.length} row(s) skipped.`)
            }
        } catch (error) {
            toast.error(error?.message || 'Import failed.')
        }
    }

    const activeTabLabel = activeTab === 'defaulters'
        ? 'Defaulters Management'
        : FEE_TABS.find((tab) => tab.id === activeTab)?.label ?? 'Fee Structure'

    return (
        <section className='space-y-6'>
            <input
                ref={fileInputRef}
                type='file'
                accept='.csv,text/csv'
                className='hidden'
                onChange={handleImportFile}
            />
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                    <h2 className='text-xl font-semibold text-black'>{activeTabLabel}</h2>
                    {activeTab === 'fee-structure' && canWriteFinance && (
                        <div className='flex flex-wrap items-center gap-3'>
                            <button
                                type='button'
                                onClick={() => fileInputRef.current?.click()}
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                <FileSpreadsheet size={16} />
                                Upload CSV
                            </button>
                            <button
                                type='button'
                                onClick={() => setConfigureFeeModal(true)}
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                            >
                                <Settings2 size={16} />
                                Configure Categories
                            </button>
                            <button
                                type='button'
                                onClick={() => openDefineModal(null)}
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
                                onClick={sendFeeReminders}
                                disabled={remindersBusy}
                                title='In-app reminders to parents: 15 days before each due date, weekly in the final month of the year'
                                className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer disabled:opacity-50'
                            >
                                <Bell size={16} />
                                {remindersBusy ? 'Sending…' : 'Send Reminder'}
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
                    {activeTab === 'concessions-waivers' && canWriteFinance && (
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
                                onClick={sendFeeReminders}
                                disabled={remindersBusy}
                                title='In-app reminders to parents: 15 days before each due date, weekly in the final month of the year'
                                className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50'
                            >
                                <Send size={16} />
                                {remindersBusy ? 'Sending…' : 'Bulk Reminder'}
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
                    {visibleTabs.map((tab) => (
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
                <FeeStructureTab
                    exportModal={exportModal}
                    setExportModal={setExportModal}
                    onImportFile={handleImportFile}
                    fileInputRef={fileInputRef}
                    onEditStructure={openDefineModal}
                    onDeleteStructure={handleDeleteStructure}
                    deletingId={deletingId}
                    canWrite={canWriteFinance}
                    canDelete={canDeleteStructures}
                />
            )}

            {activeTab === 'fee-collection' && <FeeCollectionTab />}
            {activeTab === 'concessions-waivers' && canWriteFinance && (
                <ConcessionsWaiversTab exportModal={exportModal} setExportModal={setExportModal} />
            )}
            {activeTab === 'defaulters' && (
                <DefaultersTab exportModal={exportModal} setExportModal={setExportModal} />
            )}
            {activeTab === 'receipt-management' && (
                <ReceiptManagementTab exportModal={exportModal} setExportModal={setExportModal} />
            )}
            {activeTab === 'activity-fees' && <ActivityFeesTab />}

            {defineFeeModal && canWriteFinance && (
                <DefineFeeStructureModal
                    isOpen
                    editingStructure={editingStructure}
                    onClose={closeDefineModal}
                />
            )}
            {canWriteFinance && (
                <ConfigureFeeStructureModal
                    isOpen={configureFeeModal}
                    onClose={() => setConfigureFeeModal(false)}
                    onOpenDefine={() => openDefineModal(null)}
                />
            )}
        </section>
    )
}

export default FeesManagement
