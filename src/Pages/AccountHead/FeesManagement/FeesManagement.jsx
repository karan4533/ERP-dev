import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Bell, Calculator, Download, Plus, Settings2, Upload } from 'lucide-react'
import { DataTable, DataToolbar, IntegrationNotice, PageHeader, StatusBadge } from '../../../Common/ui'
import { useFinance } from '../financeDomain/FinanceContext'
import { FEE_FREQUENCIES } from '../financeDomain/financeConstants'
import { formatCurrency } from '../financeDomain/financeHelpers'
import ActivityFeesTab from './Components/ActivityFeesTab'
import ConfigureFeeStructureModal from './Components/ConfigureFeeStructureModal'
import FeeIncrementSimulatorModal from './Components/FeeIncrementSimulatorModal'
import ChequeBounceTrackerModal from './Components/ChequeBounceTrackerModal'
import ConcessionsWaiversTab from './Components/ConcessionsWaiversTab'
import DefineFeeStructureModal from './Components/DefineFeeStructureModal'
import DefaultersTab from './Components/DefaultersTab'
import FeeCollectionTab from './Components/FeeCollectionTab'
import AdmissionClearancesTab from './Components/AdmissionClearancesTab'
import ReceiptManagementTab from './Components/ReceiptManagementTab'
import RefundsManagementTab from './Components/RefundsManagementTab'
import { ACADEMIC_YEARS, FEE_TABS, GRADES, QUICK_STATS } from './feesManagementData'

const primaryButton = 'inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'
const secondaryButton = 'inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-indigo)] bg-white px-4 text-sm font-semibold text-[var(--erp-indigo)]'
const unavailableButton = 'inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'

const FeeStructureTab = () => {
    const { feeStructures, feeCategories } = useFinance()
    const [query, setQuery] = useState('')
    const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0])
    const [grade, setGrade] = useState(GRADES[0])
    const categoryName = useCallback((id) => feeCategories.find((item) => item.id === id)?.name ?? id, [feeCategories])
    const frequencyLabel = (id) => FEE_FREQUENCIES.find((item) => item.id === id)?.label ?? id

    const filteredRows = useMemo(() => feeStructures.filter((row) => {
        if (academicYear !== ACADEMIC_YEARS[0] && row.academicYear !== academicYear) return false
        if (grade !== GRADES[0] && row.className !== grade) return false
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return true
        return [row.academicYear, row.className, categoryName(row.feeCategoryId), row.feeHead, row.status]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
    }), [academicYear, categoryName, feeStructures, grade, query])

    const columns = [
        { key: 'academicYear', label: 'Academic year' },
        { key: 'className', label: 'Class', required: true },
        { key: 'category', label: 'Category', render: (row) => categoryName(row.feeCategoryId) },
        { key: 'feeHead', label: 'Fee head' },
        { key: 'frequency', label: 'Frequency', render: (row) => frequencyLabel(row.frequency) },
        { key: 'amount', label: 'Amount', render: (row) => <span className='font-semibold text-[var(--erp-ink)]'>{formatCurrency(row.amount)}</span> },
        { key: 'dueDayOfMonth', label: 'Due day', render: (row) => row.dueDayOfMonth || 'Not set' },
        { key: 'mandatory', label: 'Requirement', render: (row) => row.mandatory ? 'Mandatory' : 'Optional' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]

    return (
        <div className='space-y-5'>
            <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]'>
                <IntegrationNotice
                    state='disconnected'
                    title='Fee structure import unavailable'
                    description='Excel and CSV imports require a validated file contract and connected fee API. Define individual structures with the governed form until that integration is available.'
                />
                <section className='rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white p-4 sm:p-5' aria-labelledby='fee-reference-summary'>
                    <div className='flex items-start justify-between gap-3'>
                        <div><h3 id='fee-reference-summary' className='text-base font-semibold text-[var(--erp-ink)]'>Reference setup summary</h3><p className='mt-1 text-xs text-[var(--erp-muted)]'>Static onboarding fixture · {QUICK_STATS.academicYear}</p></div>
                        <StatusBadge status='Sample data' />
                    </div>
                    <dl className='mt-4 grid grid-cols-2 gap-3'>
                        <div className='rounded-lg bg-[var(--erp-canvas)] p-3'><dt className='text-xs text-[var(--erp-muted)]'>Grades configured</dt><dd className='mt-1 text-lg font-semibold text-[var(--erp-ink)]'>{QUICK_STATS.gradesConfigured}</dd></div>
                        <div className='rounded-lg bg-[var(--erp-canvas)] p-3'><dt className='text-xs text-[var(--erp-muted)]'>Fee categories</dt><dd className='mt-1 text-lg font-semibold text-[var(--erp-ink)]'>{QUICK_STATS.feeCategories}</dd></div>
                        <div className='rounded-lg bg-[var(--erp-canvas)] p-3'><dt className='text-xs text-[var(--erp-muted)]'>Terms split</dt><dd className='mt-1 text-lg font-semibold text-[var(--erp-indigo)]'>{QUICK_STATS.termsSplit}</dd></div>
                        <div className='rounded-lg bg-[var(--erp-canvas)] p-3'><dt className='text-xs text-[var(--erp-muted)]'>Annual billing</dt><dd className='mt-1 text-lg font-semibold text-[var(--erp-indigo)]'>{QUICK_STATS.annualBilling}</dd></div>
                    </dl>
                </section>
            </div>

            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='fee-structure-register-title'>
                <div className='px-4 pt-4 sm:px-5'><h3 id='fee-structure-register-title' className='text-base font-semibold text-[var(--erp-ink)]'>Configured fee structures</h3></div>
                <DataToolbar
                    query={query}
                    onQueryChange={setQuery}
                    searchLabel='Search fee structures'
                    searchPlaceholder='Class, category, fee head or status…'
                    resultCount={filteredRows.length}
                    onReset={() => { setQuery(''); setAcademicYear(ACADEMIC_YEARS[0]); setGrade(GRADES[0]) }}
                    filters={(
                        <>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Academic year
                                <select value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{ACADEMIC_YEARS.map((year) => <option key={year}>{year}</option>)}</select>
                            </label>
                            <label className='grid gap-1 text-xs font-semibold text-[var(--erp-slate)]'>Grade
                                <select value={grade} onChange={(event) => setGrade(event.target.value)} className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'>{GRADES.map((item) => <option key={item}>{item}</option>)}</select>
                            </label>
                        </>
                    )}
                />
                <DataTable
                    caption='Configured fee structures'
                    rows={filteredRows}
                    columns={columns}
                    rowKey='id'
                    emptyTitle='No fee structures found'
                    emptyDescription='Reset the filters or define a new fee structure.'
                    renderActions={() => (
                        <button type='button' disabled title='Editing and version history require the connected fee configuration API.' className='min-h-9 rounded-md border border-[var(--erp-line-strong)] px-3 text-sm font-semibold text-[var(--erp-muted)] opacity-60'>Edit unavailable</button>
                    )}
                />
            </section>
        </div>
    )
}

const FeesManagement = () => {
    const [activeTab, setActiveTab] = useState('fee-structure')
    const [defineFeeModal, setDefineFeeModal] = useState(false)
    const [configureFeeModal, setConfigureFeeModal] = useState(false)
    const [incrementSimulatorModal, setIncrementSimulatorModal] = useState(false)
    const [chequeBounceModal, setChequeBounceModal] = useState(false)
    const { addFeeStructure, addFeeCategory } = useFinance()
    const activeTabLabel = activeTab === 'defaulters' ? 'Defaulters management' : FEE_TABS.find((tab) => tab.id === activeTab)?.label ?? 'Fee structure'

    const exportUnavailable = <button type='button' disabled title='Export requires the connected fee reporting API.' className={unavailableButton}><Download aria-hidden='true' size={16} /> Export unavailable</button>
    const reminderUnavailable = <button type='button' disabled title='Reminder delivery requires connected email or WhatsApp services.' className={unavailableButton}><Bell aria-hidden='true' size={16} /> Reminder unavailable</button>

    const actions = activeTab === 'fee-structure' ? (
        <>
            <button type='button' disabled title='Import requires a validated file contract and connected fee API.' className={unavailableButton}><Upload aria-hidden='true' size={16} /> Import unavailable</button>
            <button type='button' onClick={() => setIncrementSimulatorModal(true)} className={secondaryButton}><Calculator aria-hidden='true' size={16} /> Increment Simulator</button>
            <button type='button' onClick={() => setChequeBounceModal(true)} className={secondaryButton}><AlertCircle aria-hidden='true' size={16} /> Cheque Bounces</button>
            <button type='button' onClick={() => setConfigureFeeModal(true)} className={secondaryButton}><Settings2 aria-hidden='true' size={16} /> Configure structure</button>
            <button type='button' onClick={() => setDefineFeeModal(true)} className={primaryButton}><Plus aria-hidden='true' size={16} /> Define fee structure</button>
        </>
    ) : activeTab === 'fee-collection' ? <>{reminderUnavailable}{exportUnavailable}</>
        : activeTab === 'concessions-waivers' ? <><button type='button' disabled title='Application import requires the connected fee API.' className={unavailableButton}><Upload aria-hidden='true' size={16} /> Import unavailable</button>{exportUnavailable}</>
            : activeTab === 'defaulters' ? <>{reminderUnavailable}{exportUnavailable}</>
                : activeTab === 'receipt-management' ? exportUnavailable
                    : null

    return (
        <section className='space-y-5'>
            <PageHeader
                title={activeTabLabel}
                description='Manage browser-stored fee configuration, collections, concessions, defaulters and receipts without implying connected banking or delivery services.'
                context='Browser-stored finance workspace · production APIs disconnected'
                actions={actions}
            />
            <IntegrationNotice
                state='demo'
                title='Local fee-management workspace'
                description='Fee records and decisions on this screen are demonstration data stored in this browser. Production requires server-side permissions, accounting locks, immutable audit history and connected payment services.'
            />

            <div className='flex gap-2 overflow-x-auto border-b border-[var(--erp-line)]' role='tablist' aria-label='Fee management views'>
                {FEE_TABS.map((tab) => (
                    <button key={tab.id} type='button' role='tab' aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`min-h-11 whitespace-nowrap border-b-2 px-3 text-sm font-semibold ${activeTab === tab.id ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]' : 'border-transparent text-[var(--erp-slate)]'}`}>{tab.label}</button>
                ))}
            </div>

            {activeTab === 'fee-structure' && <FeeStructureTab />}
            {activeTab === 'fee-collection' && <FeeCollectionTab />}
            {activeTab === 'admission-clearances' && <AdmissionClearancesTab />}
            {activeTab === 'concessions-waivers' && <ConcessionsWaiversTab />}
            {activeTab === 'defaulters' && <DefaultersTab />}
            {activeTab === 'receipt-management' && <ReceiptManagementTab />}
            {activeTab === 'activity-fees' && <ActivityFeesTab />}
            {activeTab === 'refunds-adjustments' && <RefundsManagementTab />}

            {defineFeeModal && <DefineFeeStructureModal isOpen onClose={() => setDefineFeeModal(false)} onSave={addFeeStructure} onAddCategory={addFeeCategory} />}
            <ConfigureFeeStructureModal isOpen={configureFeeModal} onClose={() => setConfigureFeeModal(false)} />
            <FeeIncrementSimulatorModal isOpen={incrementSimulatorModal} onClose={() => setIncrementSimulatorModal(false)} />
            <ChequeBounceTrackerModal isOpen={chequeBounceModal} onClose={() => setChequeBounceModal(false)} />
        </section>
    )
}

export default FeesManagement
