import React, { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import ReactECharts from 'echarts-for-react'
import {
    Calendar,
    ChevronDown,
    ClipboardList,
    Download,
    IndianRupee,
    MoreVertical,
    RefreshCw,
    RotateCcw,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import Dropdown from '../../../Common/CommonComponents/Dropdown'
import { useFinance } from '../financeDomain/FinanceContext'
import {
    TRANSACTION_DIRECTIONS,
    TRANSACTION_STATUSES,
} from '../financeDomain/financeConstants'
import { formatCurrency, formatDisplayDate } from '../financeDomain/financeHelpers'
import {
    CHART_COLORS,
    CHART_PERIODS,
    KPI_CARDS,
    RECENT_COLLECTIONS,
    RECENT_EXPENSES,
    TIME_FILTERS,
    collectionStatusBadgeColor,
    expenseStatusBadgeColor,
} from './dashboardData'
import { buildApprovalStatus, buildCollectionSplit } from '../financeDomain/financeLiveViews'

const expenseStatusFromTxn = (status) => {
    const value = String(status || '').toUpperCase()
    if (value === TRANSACTION_STATUSES.POSTED || value === 'APPROVED' || value === 'CLEARED') return 'APPROVED'
    if (value === TRANSACTION_STATUSES.PENDING_APPROVAL || value === 'REVIEW' || value === 'DRAFT') return 'REVIEW'
    return value || 'REVIEW'
}

const buildLiveExpenseRows = (transactions = [], transportMaintenance = [], transportOpsExpenses = []) => {
    const fromTxn = (transactions || [])
        .filter((item) => (
            item.direction === TRANSACTION_DIRECTIONS.OUT
            || String(item.entryType || '').toLowerCase() === 'expense'
        ))
        .map((item) => ({
            id: item.transactionNo || item.voucherNo || item.id,
            vendor: item.narration || item.reference || item.category || 'Expense',
            department: item.sourceModule || item.createdBy || 'Finance',
            category: item.category || item.entryType || 'Operational',
            amount: formatCurrency(item.amount),
            status: expenseStatusFromTxn(item.status),
            paymentMode: item.paymentMode || '—',
            approvedBy: item.createdBy || item.approvedBy || 'Finance',
            expenseDate: formatDisplayDate(item.transactionDate || item.date),
            sortKey: String(item.transactionDate || item.createdAt || ''),
        }))

    const fromMaintenance = (transportMaintenance || []).map((item) => ({
        id: item.id,
        vendor: item.vendor || item.description || 'Transport',
        department: 'Transport',
        category: item.type || 'Transport Maintenance',
        amount: item.cost || formatCurrency(item.amount),
        status: /pending/i.test(item.status || '') ? 'REVIEW' : 'APPROVED',
        paymentMode: item.paymentMode || 'Cash',
        approvedBy: item.createdBy || 'Transport Finance',
        expenseDate: formatDisplayDate(item.date),
        sortKey: String(item.date || ''),
    }))

    const fromOps = (transportOpsExpenses || []).map((item) => ({
        id: item.id || item.expenseId,
        vendor: item.serviceCenter || item.fuelStation || item.remarks || 'Transport',
        department: 'Transport',
        category: item.serviceType || (String(item.id || '').startsWith('FE-') ? 'Fuel' : 'Service'),
        amount: item.amount || formatCurrency(0),
        status: /reject|cancel/i.test(item.status || '') ? 'REVIEW' : 'APPROVED',
        paymentMode: item.paymentMode || '—',
        approvedBy: item.source === 'principal-approved-maintenance' ? 'Principal' : 'Transport',
        expenseDate: formatDisplayDate(item.serviceDate || item.fuelDate),
        sortKey: String(item.serviceDate || item.fuelDate || ''),
    }))

    const byId = new Map()
    ;[...fromTxn, ...fromMaintenance, ...fromOps].forEach((row) => {
        if (!row.id) return
        if (!byId.has(row.id)) byId.set(row.id, row)
    })

    return [...byId.values()]
        .sort((a, b) => String(b.sortKey).localeCompare(String(a.sortKey)))
        .slice(0, 8)
}

const thClass = 'px-2 py-3.5 text-[#0C1E5B] font-medium uppercase'
const tdClass = 'px-2 py-4 text-[#667085]'

const KPI_ICON_TONES = {
    success: 'bg-[#4CAF501A] text-[#4CAF50]',
    danger: 'bg-[#FF57221A] text-[#FF5722]',
    info: 'bg-[#515DEF1A] text-[#515DEF]',
}

const KPI_ICONS = {
    "Today's Collection": Wallet,
    "Today's Expenses": ShoppingCart,
    'Pending Requests': ClipboardList,
    'Refund Requests': RotateCcw,
    'Pending Fees': IndianRupee,
}

const BADGE_TONES = {
    success: 'bg-[#4CAF5033] text-[#4CAF50]',
    info: 'bg-[#515DEF33] text-[#515DEF]',
}

const Sparkline = ({ points, tone = 'success' }) => {
    const width = 72
    const height = 28
    const max = Math.max(...points)
    const min = Math.min(...points)
    const range = max - min || 1
    const coords = points
        .map((point, index) => {
            const x = (index / (points.length - 1)) * width
            const y = height - ((point - min) / range) * (height - 4) - 2
            return `${x},${y}`
        })
        .join(' ')

    const stroke = tone === 'success' ? '#4CAF50' : '#FF5722'

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className='shrink-0'>
            <polyline fill='none' stroke={stroke} strokeWidth='2' points={coords} />
        </svg>
    )
}

const PeriodToggle = ({ value, onChange }) => (
    <div className='flex gap-1'>
        {CHART_PERIODS.map((period) => (
            <button
                key={period}
                type='button'
                onClick={() => onChange(period)}
                className={`text-[10px] px-2 py-1 rounded border uppercase tracking-wide transition-all cursor-pointer ${
                    value === period
                        ? 'bg-[#515DEF] text-white border-[#515DEF]'
                        : 'bg-white text-[#667085] border-[#E0E0E0] hover:border-[#515DEF] hover:text-[#515DEF]'
                }`}
            >
                {period}
            </button>
        ))}
    </div>
)

const Panel = ({ title, subtitle, action, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4 h-full'>
        <div className='flex justify-between items-start gap-3 mb-4'>
            <div>
                <h3 className='text-base font-semibold text-black'>{title}</h3>
                {subtitle && <p className='text-xs text-[#667085] mt-0.5'>{subtitle}</p>}
            </div>
            {action}
        </div>
        {children}
    </div>
)

const Dashboard = () => {
    const [timeFilter, setTimeFilter] = useState('Today')
    const [customDate, setCustomDate] = useState(new Date())
    const [approvalPeriod, setApprovalPeriod] = useState('Daily')
    const [exportModal, setExportModal] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const {
        dashboardMetrics,
        receipts,
        students,
        annualBudget,
        approvals,
        transactions,
        transportMaintenance,
        financeStatus,
        financeError,
        financePersistence,
        reloadFinanceFromApi,
    } = useFinance()

    const apiLive = Boolean(financePersistence?.apiEnabled)
    const collectionSplit = useMemo(() => buildCollectionSplit(receipts || []), [receipts])
    const approvalStatus = useMemo(() => buildApprovalStatus(approvals || []), [approvals])
    const [transportOpsExpenses, setTransportOpsExpenses] = useState([])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const {
                    getTransportExpenses,
                    hydrateTransportExpensesFromApi,
                } = await import('../../TransportManager/TransportExpenses/transportExpensesData')
                await hydrateTransportExpensesFromApi()
                if (!cancelled) setTransportOpsExpenses(getTransportExpenses())
            } catch {
                if (!cancelled) setTransportOpsExpenses([])
            }
        })()
        return () => { cancelled = true }
    }, [financeStatus, refreshing])

    const liveExpenseRows = useMemo(
        () => buildLiveExpenseRows(transactions, transportMaintenance, transportOpsExpenses),
        [transactions, transportMaintenance, transportOpsExpenses],
    )
    // API mode: live expenses only. Offline demo may fall back to seed when nothing posted yet.
    const recentExpenseRows = apiLive
        ? liveExpenseRows
        : (liveExpenseRows.length ? liveExpenseRows : RECENT_EXPENSES)

    /** KPI values come only from finance snapshot metrics — never add static seed amounts. */
    const liveKpis = KPI_CARDS.map((card) => {
        if (card.label === "Today's Collection") {
            return {
                ...card,
                value: formatCurrency(dashboardMetrics.todaysCollection || 0),
                trend: undefined,
                badge: apiLive ? 'LIVE' : card.badge,
                badgeTone: 'info',
            }
        }
        if (card.label === "Today's Expenses") {
            return {
                ...card,
                value: formatCurrency(dashboardMetrics.todaysExpenses || 0),
                trend: undefined,
                badge: apiLive ? 'LIVE' : card.badge,
                badgeTone: 'info',
            }
        }
        if (card.label === 'Pending Requests') {
            const count = dashboardMetrics.pendingApprovals || 0
            return {
                ...card,
                value: String(count),
                badge: `${count} REQS`,
                badgeTone: 'info',
            }
        }
        if (card.label === 'Refund Requests') {
            const count = dashboardMetrics.refundRequests || 0
            return {
                ...card,
                value: String(count),
                badge: count > 0 ? 'OPEN' : 'NONE',
                badgeTone: count > 0 ? 'success' : 'info',
            }
        }
        if (card.label === 'Pending Fees') {
            return {
                ...card,
                label: 'Current Fee Due',
                value: formatCurrency(dashboardMetrics.currentDue || 0),
                badge: 'DUE',
            }
        }
        return card
    })

    const liveReceiptRows = receipts.slice(0, 8).map((item) => {
        const student = students.find((row) => row.id === item.studentId)
        return {
            id: item.receiptNo || item.id,
            student: student?.name ?? 'Student',
            studentId: student?.admissionNo ?? item.studentId,
            category: (item.feeHeads || []).join(', ') || 'Student Fees',
            amount: formatCurrency(item.amountPaid),
            status: 'SUCCESS',
            paymentMode: item.paymentMode,
            collectedBy: item.collectedBy || 'Finance',
            collectionDate: formatDisplayDate(item.paymentDate),
        }
    })
    // API mode: show live receipts only (empty table when none). Offline demo may use seed rows.
    const recentCollectionRows = apiLive ? liveReceiptRows : [...liveReceiptRows, ...RECENT_COLLECTIONS]

    const handleRefresh = async () => {
        if (!apiLive || refreshing) return
        setRefreshing(true)
        try {
            await reloadFinanceFromApi()
        } catch {
            /* financeError surfaces via context */
        } finally {
            setRefreshing(false)
        }
    }

    const collectionSplitOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: ₹{c}' },
        series: [{
            type: 'pie',
            radius: ['58%', '78%'],
            center: ['50%', '42%'],
            avoidLabelOverlap: true,
            label: { show: false },
            labelLine: { show: false },
            data: [
                {
                    value: collectionSplit.onlineValue || 0,
                    name: 'Online Transfer',
                    itemStyle: { color: CHART_COLORS.primary },
                },
                {
                    value: collectionSplit.offlineValue || 0,
                    name: 'Offline Cash',
                    itemStyle: { color: CHART_COLORS.muted },
                },
            ],
        }],
        graphic: [{
            type: 'text',
            left: 'center',
            top: '30%',
            style: {
                text: `${collectionSplit.onlinePercent}%\nONLINE`,
                textAlign: 'center',
                fill: '#1E1E1E',
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 22,
                fontFamily: 'Inter',
            },
        }],
    }), [collectionSplit])

    const incomeExpenseOption = useMemo(() => {
        const rows = annualBudget || []
        return {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: {
            data: ['Budget', 'Actual'],
            bottom: 0,
            textStyle: { color: '#667085', fontSize: 11 },
        },
        grid: { left: 48, right: 16, top: 16, bottom: 48 },
        xAxis: {
            type: 'category',
            data: rows.map((row) => row.department),
            axisLine: { lineStyle: { color: '#E0E0E0' } },
            axisLabel: { color: '#667085', fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#667085',
                fontSize: 11,
                formatter: (value) => `₹${(value / 1000).toFixed(0)}k`,
            },
            splitLine: { lineStyle: { color: '#F2F4F7' } },
        },
        series: [
            {
                name: 'Budget',
                type: 'bar',
                barWidth: 14,
                data: rows.map((row) => row.budget),
                itemStyle: { color: '#515DEF', borderRadius: [4, 4, 0, 0] },
            },
            {
                name: 'Actual',
                type: 'bar',
                barWidth: 14,
                data: rows.map((row) => row.actual),
                itemStyle: { color: '#8E9BFF', borderRadius: [4, 4, 0, 0] },
            },
        ],
    }
    }, [annualBudget])

    const approvalStatusOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {c}' },
        series: [{
            type: 'pie',
            radius: ['58%', '78%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            label: { show: false },
            labelLine: { show: false },
            data: [
                { value: approvalStatus.approved, name: 'Approved', itemStyle: { color: CHART_COLORS.success } },
                { value: approvalStatus.pending, name: 'Pending', itemStyle: { color: CHART_COLORS.warning } },
                { value: approvalStatus.rejected, name: 'Rejected', itemStyle: { color: CHART_COLORS.danger } },
            ],
        }],
        graphic: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
                text: `${approvalStatus.successRate}%\nSUCCESS RATE`,
                textAlign: 'center',
                fill: '#1E1E1E',
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 18,
                fontFamily: 'Inter',
            },
        }],
    }), [approvalStatus])

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4'>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Finance Dashboard</h2>
                        <p className='text-sm text-[#667085] mt-0.5'>
                            {apiLive
                                ? `KPIs, collection split, approvals, and recent receipts from campus finance snapshot (${financeStatus}${financeError ? ` — ${financeError}` : ''}).`
                                : 'Offline demo overview — enable Finance API for live campus figures.'}
                        </p>
                    </div>

                    <div className='flex flex-wrap items-center gap-2'>
                        <div className='flex flex-wrap gap-1 bg-[#F9F9F9] border border-[#E0E0E0] rounded-lg p-1'>
                            {TIME_FILTERS.map((filter) => (
                                <button
                                    key={filter}
                                    type='button'
                                    onClick={() => setTimeFilter(filter)}
                                    className={`text-sm px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                                        timeFilter === filter
                                            ? 'bg-[#515DEF] text-white'
                                            : 'text-[#667085] hover:text-[#515DEF]'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        <div className='relative min-w-[150px]'>
                            <DatePicker
                                selected={customDate}
                                onChange={setCustomDate}
                                dateFormat='dd/MM/yy'
                                className='w-full text-sm text-[#667085] border border-[#D9D9D9] rounded-md px-3 py-2 pr-9 focus:outline-none'
                            />
                            <Calendar size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] pointer-events-none' />
                        </div>

                        <button
                            type='button'
                            onClick={handleRefresh}
                            disabled={!apiLive || refreshing || financeStatus === 'loading'}
                            className='size-10 flex items-center justify-center border border-[#D9D9D9] rounded-md text-[#667085] hover:text-[#515DEF] hover:border-[#515DEF] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait'
                            aria-label='Refresh dashboard'
                        >
                            <RefreshCw size={16} className={refreshing || financeStatus === 'loading' ? 'animate-spin' : ''} />
                        </button>

                        <Dropdown
                            buttonContent={(
                                <span className='inline-flex items-center gap-2 bg-[#515DEF] text-white px-4 py-2 rounded-md hover:opacity-90'>
                                    <Download size={16} />
                                    Export
                                    <ChevronDown size={14} />
                                </span>
                            )}
                        >
                            <button type='button' onClick={() => setExportModal(true)} className='text-left px-2 py-1.5 rounded hover:bg-[#F2F4F7] cursor-pointer'>
                                Export PDF
                            </button>
                            <button type='button' onClick={() => setExportModal(true)} className='text-left px-2 py-1.5 rounded hover:bg-[#F2F4F7] cursor-pointer'>
                                Export Excel
                            </button>
                        </Dropdown>
                    </div>
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4'>
                {liveKpis.map((card) => {
                    const Icon = KPI_ICONS[card.label] ?? Wallet
                    return (
                        <div key={card.label} className='bg-white rounded-2xl shadow-md p-4'>
                            <div className='flex items-start justify-between gap-2'>
                                <div className='min-w-0 flex-1'>
                                    <p className='text-xs text-[#808080]'>{card.label}</p>
                                    <p className='text-xl font-semibold text-[#1E1E1E] mt-1'>{card.value}</p>
                                    {card.trend && (
                                        <p className={`text-xs mt-1 flex items-center gap-1 ${card.trendType === 'up' ? 'text-[#4CAF50]' : 'text-[#FF5722]'}`}>
                                            {card.trendType === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {card.trend}
                                        </p>
                                    )}
                                    {card.badge && (
                                        <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded ${BADGE_TONES[card.badgeTone]}`}>
                                            {card.badge}
                                        </span>
                                    )}
                                </div>
                                <div className='flex flex-col items-end gap-2 shrink-0'>
                                    <div className={`p-2 rounded-xl ${KPI_ICON_TONES[card.iconTone]}`}>
                                        <Icon size={18} />
                                    </div>
                                    {card.sparkline && (
                                        <Sparkline points={card.sparkline} tone={card.trendType === 'up' ? 'success' : 'danger'} />
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-xs text-[#808080]'>Overdue Fee</p>
                    <p className='text-xl font-semibold text-[#FF5722] mt-1'>{formatCurrency(dashboardMetrics.overdue)}</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-xs text-[#808080]'>Cheque Pending Clearance</p>
                    <p className='text-xl font-semibold text-[#FF9800] mt-1'>{formatCurrency(dashboardMetrics.chequePending)}</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-xs text-[#808080]'>Collection Efficiency</p>
                    <p className='text-xl font-semibold text-[#515DEF] mt-1'>{dashboardMetrics.collectionEfficiency.toFixed(1)}%</p>
                </div>
                <div className='bg-white rounded-2xl shadow-md p-4'>
                    <p className='text-xs text-[#808080]'>Live Fee Receipts</p>
                    <p className='text-xl font-semibold text-[#1E1E1E] mt-1'>{receipts.length}</p>
                </div>
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
                <Panel title='Collection Split'>
                    <ReactECharts option={collectionSplitOption} style={{ height: 220 }} opts={{ renderer: 'svg' }} />
                    <div className='space-y-2 mt-2'>
                        <div className='flex items-center justify-between text-sm'>
                            <div className='flex items-center gap-2 text-[#667085]'>
                                <span className='size-2.5 rounded-full bg-[#515DEF]' />
                                Online Transfer
                            </div>
                            <span className='font-medium text-[#1E1E1E]'>{collectionSplit.onlineAmount}</span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                            <div className='flex items-center gap-2 text-[#667085]'>
                                <span className='size-2.5 rounded-full bg-[#D9D9D9]' />
                                Offline Cash
                            </div>
                            <span className='font-medium text-[#1E1E1E]'>{collectionSplit.offlineAmount}</span>
                        </div>
                    </div>
                </Panel>

                <Panel
                    title='Budgeted vs Actuals'
                    subtitle='Comparison of daily flow'
                    action={null}
                >
                    <ReactECharts option={incomeExpenseOption} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
                </Panel>

                <Panel
                    title='Approval Status'
                    action={<PeriodToggle value={approvalPeriod} onChange={setApprovalPeriod} />}
                >
                    <div className='flex items-center gap-4'>
                        <div className='flex-1 min-w-0'>
                            <ReactECharts option={approvalStatusOption} style={{ height: 220 }} opts={{ renderer: 'svg' }} />
                        </div>
                        <div className='space-y-3 shrink-0 pr-2'>
                            <div className='flex items-center gap-2 text-sm'>
                                <span className='size-2.5 rounded-full bg-[#4CAF50]' />
                                <span className='text-[#667085]'>Approved</span>
                                <span className='font-semibold text-[#1E1E1E]'>{approvalStatus.approved}</span>
                            </div>
                            <div className='flex items-center gap-2 text-sm'>
                                <span className='size-2.5 rounded-full bg-[#FF9800]' />
                                <span className='text-[#667085]'>Pending</span>
                                <span className='font-semibold text-[#1E1E1E]'>{approvalStatus.pending}</span>
                            </div>
                            <div className='flex items-center gap-2 text-sm'>
                                <span className='size-2.5 rounded-full bg-[#FF5722]' />
                                <span className='text-[#667085]'>Rejected</span>
                                <span className='font-semibold text-[#1E1E1E]'>{String(approvalStatus.rejected).padStart(2, '0')}</span>
                            </div>
                        </div>
                    </div>
                </Panel>
            </div>

            <Panel
                title='Recent Collections'
                action={(
                    <button type='button' className='text-sm font-medium text-[#515DEF] hover:opacity-80 cursor-pointer'>
                        View All
                    </button>
                )}
            >
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Receipt No</th>
                                <th className={thClass}>Student</th>
                                <th className={thClass}>Category</th>
                                <th className={thClass}>Amount</th>
                                <th className={thClass}>Status</th>
                                <th className={thClass}>Payment Mode</th>
                                <th className={thClass}>Collected By</th>
                                <th className={thClass}>Collection Date</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentCollectionRows.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} font-medium text-[#515DEF] rounded-s-lg`}>#{row.id}</td>
                                    <td className={tdClass}>
                                        <div className='font-medium text-[#1E1E1E]'>{row.student}</div>
                                        <div className='text-xs'>ID: {row.studentId}</div>
                                    </td>
                                    <td className={tdClass}>{row.category}</td>
                                    <td className={`${tdClass} font-semibold text-[#515DEF]`}>{row.amount}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${collectionStatusBadgeColor[row.status]}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={tdClass}>{row.paymentMode}</td>
                                    <td className={tdClass}>{row.collectedBy}</td>
                                    <td className={tdClass}>{row.collectionDate}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <button type='button' className='p-1 rounded hover:bg-[#EDEEF5] cursor-pointer' aria-label='Row actions'>
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Panel>

            <Panel
                title='Recent Expenses'
                subtitle={apiLive ? 'From posted finance outflows & transport maintenance' : undefined}
                action={(
                    <button type='button' className='text-sm font-medium text-[#515DEF] hover:opacity-80 cursor-pointer'>
                        View All
                    </button>
                )}
            >
                <div className='relative overflow-x-auto'>
                    <table className='w-full text-sm text-left'>
                        <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                            <tr>
                                <th className={`${thClass} rounded-s-lg`}>Expense ID</th>
                                <th className={thClass}>Vendor/Dept</th>
                                <th className={thClass}>Category</th>
                                <th className={thClass}>Amount</th>
                                <th className={thClass}>Status</th>
                                <th className={thClass}>Payment Mode</th>
                                <th className={thClass}>Approved By</th>
                                <th className={thClass}>Expense Date</th>
                                <th className={`${thClass} rounded-e-lg`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentExpenseRows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className={`${tdClass} text-center py-8`}>
                                        No expenses posted yet. Manual expenses, transport maintenance, and other outflows will appear here.
                                    </td>
                                </tr>
                            ) : recentExpenseRows.map((row) => (
                                <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                    <td className={`${tdClass} font-medium text-[#515DEF] rounded-s-lg`}>#{row.id}</td>
                                    <td className={tdClass}>
                                        <div className='font-medium text-[#1E1E1E]'>{row.vendor}</div>
                                        <div className='text-xs'>{row.department}</div>
                                    </td>
                                    <td className={tdClass}>{row.category}</td>
                                    <td className={`${tdClass} font-semibold text-[#FF5722]`}>{row.amount}</td>
                                    <td className={tdClass}>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${expenseStatusBadgeColor[row.status] || 'bg-[#EDEEF5] text-[#667085]'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={tdClass}>{row.paymentMode}</td>
                                    <td className={tdClass}>{row.approvedBy}</td>
                                    <td className={tdClass}>{row.expenseDate}</td>
                                    <td className={`${tdClass} rounded-e-lg`}>
                                        <button type='button' className='p-1 rounded hover:bg-[#EDEEF5] cursor-pointer' aria-label='Row actions'>
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Panel>

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
        </section>
    )
}

export default Dashboard
