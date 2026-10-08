import React, { useMemo } from 'react'
import { ArrowLeftRight, Landmark, Scale, TrendingUp } from 'lucide-react'
import {
    FINANCIAL_STATEMENT_CAMPUSES,
    FINANCIAL_STATEMENT_CARDS,
    FINANCIAL_STATEMENT_DEPARTMENTS,
    TRIAL_BALANCE_REGISTER,
    PROFIT_LOSS_STATEMENT,
    BALANCE_SHEET_STATEMENT,
    CASH_FLOW_STATEMENT,
    parseRupeeAmount,
    formatRupeeAmount,
} from '../accountingData'
import { ICON_TONES, Panel, TableCard, tdClass, thClass } from './AccountingShared'

const STATEMENT_ICON_MAP = {
    'trial-balance': Scale,
    'profit-loss': TrendingUp,
    'balance-sheet': Landmark,
    'cash-flow': ArrowLeftRight,
}

const STATEMENT_LABELS = {
    'trial-balance': 'Trial Balance',
    'profit-loss': 'Profit & Loss Statement',
    'balance-sheet': 'Balance Sheet',
    'cash-flow': 'Cash Flow Statement',
}

const formatFilterSummary = (filters) => {
    const parts = []
    if (filters.department !== 'All Departments') parts.push(filters.department)
    if (filters.campus !== 'All Campuses') parts.push(filters.campus)
    if (filters.dateFrom || filters.dateTo) {
        const from = filters.dateFrom || 'start'
        const to = filters.dateTo || 'today'
        parts.push(`${from} to ${to}`)
    }
    return parts.length > 0 ? parts.join(' · ') : 'All departments and campuses'
}

export const filterTrialBalance = (rows, filters) => rows.filter((row) => {
    if (filters.department !== 'All Departments' && row.department !== filters.department) return false
    if (filters.campus !== 'All Campuses' && row.campus !== filters.campus) return false
    return true
})

export const buildTrialBalanceTotals = (rows) => {
    const totalDebit = rows.reduce((sum, row) => sum + parseRupeeAmount(row.debit), 0)
    const totalCredit = rows.reduce((sum, row) => sum + parseRupeeAmount(row.credit), 0)
    return {
        debit: formatRupeeAmount(totalDebit),
        credit: formatRupeeAmount(totalCredit),
    }
}

const StatementCards = ({ activeType, onSelect }) => (
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
        {FINANCIAL_STATEMENT_CARDS.map((card) => {
            const Icon = STATEMENT_ICON_MAP[card.id] ?? Scale
            const isActive = activeType === card.id
            return (
                <button
                    key={card.id}
                    type='button'
                    onClick={() => onSelect(card.id)}
                    className={`text-left bg-white rounded-2xl shadow-md p-4 transition-all cursor-pointer border-2 ${
                        isActive
                            ? 'border-[#515DEF] ring-2 ring-[#515DEF33]'
                            : 'border-transparent hover:border-[#515DEF66]'
                    }`}
                >
                    <div className='flex items-start justify-between gap-2 mb-3'>
                        <div className={`p-2 rounded-xl ${ICON_TONES[card.iconTone]}`}>
                            <Icon size={18} />
                        </div>
                    </div>
                    <p className='text-sm font-semibold text-[#1E1E1E]'>{card.label}</p>
                    <p className='text-xs text-[#667085] mt-1'>{card.description}</p>
                </button>
            )
        })}
    </div>
)

const SectionReportTable = ({ rows }) => (
    <table className='w-full text-sm text-left mt-4'>
        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
            <tr>
                <th className={`${thClass} rounded-s-lg`}>Particulars</th>
                <th className={`${thClass} rounded-e-lg w-44 text-right`}>Amount (₹)</th>
            </tr>
        </thead>
        <tbody>
            {rows.map((row, index) => (
                <tr
                    key={`${row.label}-${index}`}
                    className={`border-b border-[#f2f4f7] ${
                        row.type === 'total' || row.type === 'net' ? 'bg-[#EDEEF5] font-semibold text-[#1E1E1E]' : ''
                    }`}
                >
                    <td className={`${tdClass} rounded-s-lg ${
                        row.indent ? 'pl-8' : ''
                    } ${row.type === 'section' ? 'font-semibold text-[#1E1E1E] pt-5' : ''}`}>
                        {row.label}
                    </td>
                    <td className={`${tdClass} rounded-e-lg text-right ${
                        row.type === 'net' && row.profit ? 'text-[#4CAF50]' : ''
                    } ${row.type === 'net' && row.profit === false ? 'text-[#FF5722]' : ''}`}>
                        {row.amount ?? ''}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
)

const TrialBalanceTable = ({ rows, totals }) => (
    <table className='w-full text-sm text-left mt-4 min-w-[600px]'>
        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
            <tr>
                <th className={`${thClass} rounded-s-lg`}>Account</th>
                <th className={`${thClass} text-right`}>Debit</th>
                <th className={`${thClass} rounded-e-lg text-right`}>Credit</th>
            </tr>
        </thead>
        <tbody>
            {rows.length === 0 ? (
                <tr>
                    <td colSpan={3} className='px-2 py-8 text-center text-[#667085]'>
                        No accounts match the selected filters.
                    </td>
                </tr>
            ) : (
                <>
                    {rows.map((row) => (
                        <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                            <td className={`${tdClass} rounded-s-lg font-medium text-[#1E1E1E]`}>{row.account}</td>
                            <td className={`${tdClass} text-right`}>{row.debit}</td>
                            <td className={`${tdClass} rounded-e-lg text-right`}>{row.credit}</td>
                        </tr>
                    ))}
                    <tr className='bg-[#EDEEF5] font-semibold text-[#1E1E1E]'>
                        <td className={`${tdClass} rounded-s-lg`}>Total</td>
                        <td className={`${tdClass} text-right`}>{totals.debit}</td>
                        <td className={`${tdClass} rounded-e-lg text-right`}>{totals.credit}</td>
                    </tr>
                </>
            )}
        </tbody>
    </table>
)

const FinancialStatementsTab = ({
    statementType,
    onStatementTypeChange,
    filters,
    onFilterChange,
    appliedFilters,
    lastGeneratedAt,
    isGenerating,
}) => {
    const trialBalanceRows = useMemo(
        () => filterTrialBalance(TRIAL_BALANCE_REGISTER, appliedFilters),
        [appliedFilters],
    )

    const trialBalanceTotals = useMemo(
        () => buildTrialBalanceTotals(trialBalanceRows),
        [trialBalanceRows],
    )

    const sectionRows = useMemo(() => {
        if (statementType === 'profit-loss') return PROFIT_LOSS_STATEMENT
        if (statementType === 'balance-sheet') return BALANCE_SHEET_STATEMENT
        if (statementType === 'cash-flow') return CASH_FLOW_STATEMENT
        return []
    }, [statementType])

    const reportTitle = `${STATEMENT_LABELS[statementType]} — FY ${appliedFilters.financialYear}`
    const filterSummary = formatFilterSummary(appliedFilters)

    return (
        <div className='space-y-6' id='financial-statements-print-area'>
            <StatementCards activeType={statementType} onSelect={onStatementTypeChange} />

            <TableCard
                title='Report filters'
                filters={(
                    <div className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3'>
                        <select
                            value={filters.financialYear}
                            onChange={(event) => onFilterChange('financialYear', event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'
                        >
                            {['2025–26', '2024–25', '2023–24'].map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <input
                            type='date'
                            value={filters.dateFrom}
                            onChange={(event) => onFilterChange('dateFrom', event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                            aria-label='Date from'
                        />
                        <input
                            type='date'
                            value={filters.dateTo}
                            onChange={(event) => onFilterChange('dateTo', event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[140px]'
                            aria-label='Date to'
                        />
                        <select
                            value={filters.department}
                            onChange={(event) => onFilterChange('department', event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[160px]'
                        >
                            {FINANCIAL_STATEMENT_DEPARTMENTS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <select
                            value={filters.campus}
                            onChange={(event) => onFilterChange('campus', event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[150px]'
                        >
                            {FINANCIAL_STATEMENT_CAMPUSES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                )}
            >
                <p className='text-sm text-[#667085] mt-4'>
                    Select filters above, then use <span className='font-medium text-[#1E1E1E]'>Generate Report</span> in the page header to refresh the report.
                </p>
            </TableCard>

            <Panel
                title={reportTitle}
                action={(
                    <div className='text-right'>
                        <p className='text-xs text-[#667085]'>{filterSummary}</p>
                        {lastGeneratedAt && (
                            <p className='text-xs text-[#808080] mt-0.5'>
                                {isGenerating ? 'Generating...' : `Generated ${lastGeneratedAt}`}
                            </p>
                        )}
                    </div>
                )}
            >
                {isGenerating ? (
                    <div className='py-16 text-center text-[#667085] text-sm animate-pulse'>
                        Compiling {STATEMENT_LABELS[statementType].toLowerCase()}...
                    </div>
                ) : statementType === 'trial-balance' ? (
                    <TrialBalanceTable rows={trialBalanceRows} totals={trialBalanceTotals} />
                ) : (
                    <SectionReportTable rows={sectionRows} />
                )}
            </Panel>
        </div>
    )
}

export default FinancialStatementsTab
