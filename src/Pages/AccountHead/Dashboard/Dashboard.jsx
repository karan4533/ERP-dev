import { createElement, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Download, Gauge, IndianRupee, Landmark, ReceiptText, Wallet, Calendar } from 'lucide-react'
import { DataTable, IntegrationNotice, PageHeader, StatusBadge, EnterpriseKpiCard, HierarchyFilterBar, EnterpriseTrendChart, EnterpriseDonutChart } from '../../../Common/ui'
import { useFinance } from '../financeDomain/FinanceContext'
import { formatCurrency, formatDisplayDate } from '../financeDomain/financeHelpers'
import { APPROVAL_STATUS, CHART_COLORS, RECENT_EXPENSES } from './dashboardData'

const Panel = ({ title, subtitle, children }) => (
    <section className='h-full rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-xs'>
        <div className='mb-4 border-b border-slate-100 pb-2.5'>
            <h3 className='text-sm font-semibold tracking-tight text-slate-900'>{title}</h3>
            {subtitle ? <p className='mt-0.5 text-xs text-slate-400'>{subtitle}</p> : null}
        </div>
        {children}
    </section>
)

const Dashboard = () => {
    const { dashboardMetrics, receipts = [], students = [], annualBudget = [] } = useFinance()
    const [filterState, setFilterState] = useState({
        campus: 'All Campuses',
        department: 'Finance & Accounts',
        team: 'All Teams',
        period: 'Today',
    })

    const recentCollectionRows = receipts.slice(0, 10).map((item) => {
        const student = students.find((row) => row.id === item.studentId)
        return {
            id: item.receiptNo,
            student: student?.name ?? 'Student not linked',
            studentId: student?.admissionNo ?? item.studentId,
            category: (item.feeHeads || []).join(', ') || 'Student fees',
            amount: formatCurrency(item.amountPaid),
            status: 'Recorded',
            paymentMode: item.paymentMode || 'Not recorded',
            collectedBy: item.collectedBy || 'Finance',
            collectionDate: formatDisplayDate(item.paymentDate),
        }
    })

    const collectionTotals = useMemo(() => receipts.reduce((totals, item) => {
        const amount = Number(item.amountPaid) || 0
        if (item.paymentMode === 'Cash') totals.cash += amount
        else totals.online += amount
        return totals
    }, { online: 0, cash: 0 }), [receipts])

    const collectionColumns = [
        { key: 'id', label: 'Receipt #', required: true },
        { key: 'student', label: 'Student' },
        { key: 'studentId', label: 'Admission #' },
        { key: 'category', label: 'Fee Heads' },
        { key: 'amount', label: 'Amount' },
        { key: 'paymentMode', label: 'Mode' },
        { key: 'collectionDate', label: 'Date' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]

    const expenseRows = RECENT_EXPENSES.map((item) => ({
        ...item,
        amount: formatCurrency(item.amount),
        date: formatDisplayDate(item.date),
    }))

    const expenseColumns = [
        { key: 'id', label: 'Voucher #', required: true },
        { key: 'department', label: 'Department' },
        { key: 'category', label: 'Expense Head' },
        { key: 'vendor', label: 'Vendor' },
        { key: 'amount', label: 'Amount' },
        { key: 'date', label: 'Incurred Date' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]

    return (
        <section className='space-y-6 pb-6 font-inter'>
            {/* Header: Title + Context */}
                        {/* Header: Title */}
            <PageHeader
                title='Finance & Accounts Overview'
                description='Fee collection status, annual fee projection, cheque bounce ledger, and immutable accounting vouchers.'
                actions={<span className='text-xs text-slate-400'>Export unavailable</span>}
            />
            <IntegrationNotice
                state='demo'
                title='Demonstration finance ledger'
                description='Collections and vouchers are stored in browser memory.'
            />

            {/* Hierarchical Filter Bar */}
            <HierarchyFilterBar
                onFilterChange={setFilterState}
                showCampus={true}
                showDepartment={false}
                showTeam={false}
            />

            {/* 4 Soft Pastel Blue KPI Cards in Grid (Reference Design Layout) */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <EnterpriseKpiCard
                    title='Recorded Collection Today'
                    value={formatCurrency(dashboardMetrics.todaysCollection || 142000)}
                    change='+5.4%'
                    isPositive={true}
                    context='Cash and verified online receipts'
                />
                <EnterpriseKpiCard
                    title='Collection Efficiency'
                    value={`${Number(dashboardMetrics.collectionEfficiency || 94.8).toFixed(1)}%`}
                    change='+1.8%'
                    isPositive={true}
                    context='Term 1 & Term 2 realizing against target'
                />
                <EnterpriseKpiCard
                    title='Total Outstanding Fee Dues'
                    value={formatCurrency(dashboardMetrics.overdue || 48000)}
                    change='-12.4%'
                    isPositive={true}
                    context='Defaulter parent notices dispatched'
                />
                <EnterpriseKpiCard
                    title='Cheques Pending Clearance'
                    value={formatCurrency(dashboardMetrics.chequePending || 25000)}
                    change='3 instruments'
                    isPositive={false}
                    context='Under clearing or verification'
                />
            </div>

            {/* Analytics Rows */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                <div className='lg:col-span-2'>
                    <EnterpriseTrendChart
                        tabs={['Monthly Fee Inflow', 'Collection Velocity', 'Expenditure Outflow']}
                        categories={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                        dataByTab={{
                            'Monthly Fee Inflow': {
                                current: [120, 280, 240, 210, 310, 360, 420],
                                previous: [100, 240, 210, 190, 270, 320, 380],
                            },
                            'Collection Velocity': {
                                current: [88, 94, 92, 91, 95, 96, 97],
                                previous: [82, 88, 86, 85, 90, 92, 94],
                            },
                            'Expenditure Outflow': {
                                current: [90, 110, 105, 115, 120, 118, 125],
                                previous: [85, 98, 95, 102, 108, 110, 115],
                            },
                        }}
                        height={280}
                    />
                </div>

                <div className='lg:col-span-1'>
                    <EnterpriseDonutChart
                        title='Collection Split by Instrument'
                        data={[
                            { name: 'Online Netbanking / UPI', value: 68.4, color: '#1E40AF' },
                            { name: 'Bank Demand Draft / NEFT', value: 18.2, color: '#3B82F6' },
                            { name: 'Direct Counter Cash', value: 9.8, color: '#10B981' },
                            { name: 'Parent Cheques', value: 3.6, color: '#F59E0B' },
                        ]}
                        height={280}
                    />
                </div>
            </div>

            {/* Recent Collections Table */}
            <section className='overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-xs'>
                <div className='border-b border-slate-100 px-5 py-4 flex items-center justify-between'>
                    <div>
                        <h3 className='font-semibold text-slate-900 text-sm'>Recent Fee Collections</h3>
                        <p className='mt-0.5 text-xs text-slate-400'>Recorded receipts awaiting bank deposit or automated WhatsApp confirmation.</p>
                    </div>
                </div>
                <DataTable caption='Browser-stored receipts' rows={recentCollectionRows} columns={collectionColumns} rowKey='id' emptyTitle='No fee receipts recorded' emptyDescription='A receipt will appear here after it is recorded in the fee collection workflow.' />
            </section>

            {/* Expense Reference Table */}
            <section className='overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-xs'>
                <div className='border-b border-slate-100 px-5 py-4'>
                    <h3 className='font-semibold text-slate-900 text-sm'>Immutable Payment Vouchers</h3>
                    <p className='mt-0.5 text-xs text-slate-400'>Audited payment vouchers compliant with the Immutable Record Principle.</p>
                </div>
                <DataTable caption='Sample finance expenses' rows={expenseRows} columns={expenseColumns} rowKey='id' />
            </section>
        </section>
    )
}

export default Dashboard
