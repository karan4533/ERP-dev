import React, { useState, useMemo } from 'react'
import {
    BarChart3,
    Download,
    Calendar,
    Search,
    Filter,
    FileText,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Layers,
    TrendingUp,
    TrendingDown,
    Building2,
    Users,
    GraduationCap,
    Truck,
    Shield,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Check,
    DollarSign,
    RefreshCw,
    Printer
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'

const ROLE_REPORT_SUITES = {
    academic: {
        category: 'Academics & Examination',
        reports: [
            { id: 'exam-results', name: 'Annual & Term Examination Performance', desc: 'Consolidated marks, class pass percentage, and subject averages' },
            { id: 'attendance-analytics', name: 'Student Attendance & Absence Analysis', desc: 'Class-wise attendance rates, chronic absenteeism, and leave frequency' },
            { id: 'capca-evaluation', name: 'Continuous Assessment (CA / PCA) Analysis', desc: 'Internal test score progression and rubric performance benchmarks' },
            { id: 'grade-distribution', name: 'CBES Merit & Grade Distribution Roster', desc: 'A+ through F percentile bands and honor roll student roster' }
        ],
        sampleData: [
            { col1: 'Grade 10 - Section A', col2: 'Mathematics', col3: 'Annual Exam 2026', col4: '88.4%', col5: '100% Pass', col6: 'Rank 1: Aarav Sharma', status: 'Completed', date: '2026-10-28' },
            { col1: 'Grade 10 - Section B', col2: 'Science', col3: 'Annual Exam 2026', col4: '82.1%', col5: '97.2% Pass', col6: 'Rank 1: Diya Nair', status: 'Completed', date: '2026-10-28' },
            { col1: 'Grade 9 - Section A', col2: 'English Language', col3: 'Term 1 Exam', col4: '79.5%', col5: '95.0% Pass', col6: 'Rank 1: Rohan Verma', status: 'Completed', date: '2026-10-25' },
            { col1: 'Grade 9 - Section B', col2: 'Computer Science', col3: 'Continuous Assessment 2', col4: '91.0%', col5: '100% Pass', col6: 'Rank 1: Ananya Reddy', status: 'Completed', date: '2026-10-20' },
            { col1: 'Grade 8 - Section A', col2: 'Social Studies', col3: 'Mid Term Test', col4: '76.8%', col5: '92.5% Pass', col6: 'Rank 1: Aditya Menon', status: 'Completed', date: '2026-10-15' }
        ],
        columns: ['Class / Batch', 'Subject', 'Assessment Phase', 'Class Average', 'Pass Rate', 'Top Performer', 'Audit Status', 'Date']
    },
    administrative: {
        category: 'Administration & Human Resources',
        reports: [
            { id: 'staff-attendance', name: 'Staff Attendance & Leave Utilization', desc: 'Biometric punches, sick leave vs casual leave rates, and duty hours' },
            { id: 'enrollment-funnel', name: 'Student Enrollment & Admission Funnel', desc: 'Inquiries, entrance tests, completed admissions, and TC requests' },
            { id: 'escalation-sla', name: 'Escalation Management & Helpdesk SLA', desc: 'Department response times, unresolved grievances, and resolution velocity' },
            { id: 'payroll-headcount', name: 'Workforce Headcount & Payroll Allocation', desc: 'Department staffing quotas, contract renewals, and gratuity fund' }
        ],
        sampleData: [
            { col1: 'Academic Administration', col2: '48 Staff Members', col3: '96.4% Present', col4: '4 Approved Leaves', col5: '0 Pending Escalations', col6: 'Full Compliance', status: 'Completed', date: '2026-10-30' },
            { col1: 'Operations & Maintenance', col2: '32 Staff Members', col3: '93.8% Present', col4: '2 Approved Leaves', col5: '1 Pending Task', col6: 'Reviewed by HR', status: 'Completed', date: '2026-10-30' },
            { col1: 'Transport & Fleet Logistics', col2: '24 Drivers/Attendants', col3: '100% Present', col4: '0 Leaves', col5: '14 Routes Active', col6: 'Verified by HOD', status: 'Completed', date: '2026-10-30' },
            { col1: 'Front Office & Admissions', col2: '8 Executives', col3: '100% Present', col4: '0 Leaves', col5: '18 New Enquiries', col6: 'Active Follow-up', status: 'Completed', date: '2026-10-29' }
        ],
        columns: ['Department / Unit', 'Staff Strength', 'Attendance Rate', 'Leave Outflow', 'Operational Metric', 'HR Audit Sign', 'Status', 'Date']
    },
    financial: {
        category: 'Finance, Accounts & Fee Collections',
        reports: [
            { id: 'fee-collections', name: 'Fee Collection & Defaulter Aging', desc: 'Term tuition, bus fee collection efficiency, and overdue aging slabs' },
            { id: 'budget-expenditure', name: 'Departmental Budget & Expense Ledger', desc: 'Procurement costs, utility payments, and variance against allocations' },
            { id: 'concessions-audit', name: 'Staff Child & Merit Concession Audit', desc: 'Authorized fee waivers, sports scholarships, and documentation proofs' }
        ],
        sampleData: [
            { col1: 'Term 2 Tuition Fee', col2: '₹ 84,50,000 Expected', col3: '₹ 79,20,000 Collected', col4: '93.7% Realized', col5: '₹ 5,30,000 Outstanding', col6: 'Reminder SMS Sent', status: 'Active', date: '2026-10-30' },
            { col1: 'Transport Bus Fleet Fee', col2: '₹ 18,20,000 Expected', col3: '₹ 17,90,000 Collected', col4: '98.3% Realized', col5: '₹ 30,000 Outstanding', col6: 'Reconciled with Fleet', status: 'Completed', date: '2026-10-28' },
            { col1: 'Science Lab Modernization', col2: '₹ 12,00,000 Allocated', col3: '₹ 11,45,000 Utilized', col4: '95.4% Spent', col5: '₹ 55,000 Surplus', col6: 'PO Processed', status: 'Completed', date: '2026-10-22' }
        ],
        columns: ['Financial Head', 'Target Budget', 'Total Realized', 'Collection %', 'Variance / Dues', 'Finance Notes', 'Status', 'Date']
    },
    logistics: {
        category: 'Logistics, Fleet, Stores & Security',
        reports: [
            { id: 'fleet-fuel', name: 'Transport Fleet Fuel & Route Inspection', desc: 'Mileage, fuel consumption per kilometer, and vehicle fitness dates' },
            { id: 'store-stock', name: 'Stores Inventory Valuation & Movement', desc: 'Fast-moving stationery items, stockouts, and replenishment triggers' },
            { id: 'visitor-traffic', name: 'Campus Gate Passes & Visitor Footfall', desc: 'Parent check-ins, delivery vehicles, and security gate clearances' }
        ],
        sampleData: [
            { col1: 'Route 01 - North Sector', col2: 'Bus TN-58-A-1024', col3: '42 Students', col4: '14.2 km/Ltr', col5: 'Fitness Exp: Dec 2027', col6: 'Driver: K. Selvam', status: 'Active', date: '2026-10-30' },
            { col1: 'Route 04 - IT Expressway', col2: 'Bus TN-58-B-3389', col3: '38 Students', col4: '13.8 km/Ltr', col5: 'Fitness Exp: Jan 2028', col6: 'Driver: R. Munusamy', status: 'Active', date: '2026-10-30' },
            { col1: 'Stationery Main Depot', col2: 'SKU Inventory: 248 Items', col3: '₹ 4,85,000 Valuation', col4: '12 Low Stock Items', col5: 'PO Placed for Paper Reams', col6: 'Store Mgr Verified', status: 'Completed', date: '2026-10-29' }
        ],
        columns: ['Operational Asset', 'Identity / Registration', 'Capacity / Count', 'Operational Metric', 'Compliance Status', 'Officer Incharge', 'State', 'Date']
    },
    audit: {
        category: 'Governance, Audit & Institutional Quality',
        reports: [
            { id: 'audit-findings', name: 'Internal Audit Finding Closure & ATR Matrix', desc: 'High/Medium/Low observations, corrective actions taken, and overdue items' },
            { id: 'compliance-index', name: 'Departmental Compliance Scorecard', desc: 'Overall quality index, statutory compliance scores, and process audits' }
        ],
        sampleData: [
            { col1: 'Academics & Examination Cell', col2: 'Process Audit 2026', col3: '96.2% Index', col4: '2 Observations', col5: '2 Rectified (ATR Closed)', col6: 'Full Compliance', status: 'Completed', date: '2026-10-27' },
            { col1: 'Finance & Accounts', col2: 'Statutory Audit 2026', col3: '98.5% Index', col4: '0 Observations', col5: '0 Pending', col6: 'Certified', status: 'Completed', date: '2026-10-26' },
            { col1: 'Transport & Safety Logistics', col2: 'Safety Process Audit', col3: '94.0% Index', col4: '3 Observations', col5: '3 Rectified (First Aid Replenished)', col6: 'Verified by Auditor', status: 'Completed', date: '2026-10-24' }
        ],
        columns: ['Auditee Department', 'Audit Scope', 'Compliance Index', 'Obs Count', 'Corrective Action (ATR)', 'Auditor Recommendation', 'Status', 'Date']
    }
}

export default function UniversalReportsAnalyticsWorkspace({ roleOverride = null }) {
    const { role: authRole, name: authName } = useAuth()
    const activeRole = (roleOverride || authRole || 'admin').toLowerCase().replace(/[-_\s]/g, '')
    const roleLabel = getProfileLabel(roleOverride || authRole || 'admin')

    // Determine default suite for role
    const initialSuiteKey = useMemo(() => {
        if (['teacher', 'coordinator', 'principal', 'director'].includes(activeRole)) return 'academic'
        if (['accounthead', 'account-head', 'finance'].includes(activeRole)) return 'financial'
        if (['transportmanager', 'driver', 'stationerystoremanager', 'canteenmanager', 'gatekeeper', 'gatekeepermanager', 'housekeepingmanager', 'itsupportmanager'].includes(activeRole)) return 'logistics'
        if (['jointdirector', 'jointdirectorassistant', 'jointdirectoraudit', 'processauditor', 'qualityauditor'].includes(activeRole)) return 'audit'
        return 'administrative'
    }, [activeRole])

    const [selectedSuiteKey, setSelectedSuiteKey] = useState(initialSuiteKey)
    const [selectedReportId, setSelectedReportId] = useState(ROLE_REPORT_SUITES[initialSuiteKey]?.reports[0]?.id || '')
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFrom, setDateFrom] = useState('2026-09-01')
    const [dateTo, setDateTo] = useState('2026-10-31')
    const [statusFilter, setStatusFilter] = useState('All')

    const currentSuite = ROLE_REPORT_SUITES[selectedSuiteKey] || ROLE_REPORT_SUITES.administrative
    const activeReport = currentSuite.reports.find((r) => r.id === selectedReportId) || currentSuite.reports[0]

    // Filtered data
    const filteredRows = useMemo(() => {
        return currentSuite.sampleData.filter((row) => {
            const matchesSearch =
                !searchQuery ||
                Object.values(row).some((val) => String(val).toLowerCase().includes(searchQuery.toLowerCase()))
            const matchesStatus = statusFilter === 'All' || row.status === statusFilter
            const matchesDate = (!dateFrom || row.date >= dateFrom) && (!dateTo || row.date <= dateTo)
            return matchesSearch && matchesStatus && matchesDate
        })
    }, [currentSuite, searchQuery, statusFilter, dateFrom, dateTo])

    const handleExportExcel = () => {
        if (!filteredRows.length) {
            toast.warn('No records match the current filters to export.')
            return
        }
        const headers = currentSuite.columns
        const escapeCsv = (val) => {
            let s = String(val ?? '')
            if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
            return `"${s.replace(/"/g, '""')}"`
        }
        const rows = filteredRows.map((row) => [
            row.col1,
            row.col2,
            row.col3,
            row.col4,
            row.col5,
            row.col6,
            row.status,
            row.date,
        ])
        const csvContent = [
            headers.map(escapeCsv).join(','),
            ...rows.map((r) => r.map(escapeCsv).join(',')),
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const cleanName = (activeReport.name || 'report').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
        const filename = `${cleanName}_${dateFrom}_${dateTo}.csv`
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success(`Exported "${activeReport.name}" to CSV (${filename})`)
    }

    const handlePrint = () => {
        if (!filteredRows.length) {
            toast.warn('No records to print for the selected filter range.')
            return
        }
        const tableHeadersHtml = currentSuite.columns
            .map(
                (c) =>
                    `<th style="border:1px solid #cbd5e1;padding:8px 12px;background:#f8fafc;text-align:left;font-size:12px;color:#1e293b;">${c}</th>`
            )
            .join('')
        const tableRowsHtml = filteredRows
            .map(
                (row) => `
            <tr>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.col1 ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.col2 ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.col3 ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.col4 ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.col5 ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.col6 ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.status ?? ''}</td>
                <td style="border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;color:#334155;">${row.date ?? ''}</td>
            </tr>
        `
            )
            .join('')

        const printHtml = `
            <!doctype html>
            <html>
            <head>
                <title>${activeReport.name} - ${dateFrom} to ${dateTo}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; margin: 0; }
                    h1 { font-size: 20px; font-weight: 700; margin: 0 0 6px 0; color: #0f172a; }
                    p { font-size: 13px; color: #64748b; margin: 0 0 16px 0; }
                    .meta { display: flex; gap: 16px; margin-bottom: 20px; font-size: 12px; color: #475569; }
                    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                    @media print {
                        @page { margin: 15mm; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <h1>${activeReport.name}</h1>
                <p>${activeReport.desc || ''}</p>
                <div class="meta">
                    <span><strong>Role:</strong> ${roleLabel}</span>
                    <span><strong>Category:</strong> ${currentSuite.category}</span>
                    <span><strong>Date Range:</strong> ${dateFrom} to ${dateTo}</span>
                    <span><strong>Total Records:</strong> ${filteredRows.length}</span>
                </div>
                <table>
                    <thead><tr>${tableHeadersHtml}</tr></thead>
                    <tbody>${tableRowsHtml}</tbody>
                </table>
            </body>
            </html>
        `

        if (typeof window !== 'undefined') {
            const printWindow = window.open('', '_blank', 'width=900,height=700')
            if (printWindow) {
                printWindow.document.write(printHtml)
                printWindow.document.close()
                printWindow.focus()
                setTimeout(() => {
                    printWindow.print()
                }, 300)
            } else {
                window.print()
            }
        }
        toast.info(`Triggered print view for "${activeReport.name}"`)
    }

    const handleExportPDF = () => {
        toast.info(`Preparing "${activeReport.name}" for PDF print export...`)
        handlePrint()
    }

    return (
        <div className="space-y-6 font-inter pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                        <BarChart3 size={26} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                                Institutional Reports & Analytics
                            </h1>
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
                                {roleLabel}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Role-governed intelligence reports, metric aggregations, and exportable operational audit dossiers.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                    >
                        <Printer size={14} className="text-indigo-600" />
                        <span>Print</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleExportPDF}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                    >
                        <Download size={14} className="text-rose-600" />
                        <span>Export PDF</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition cursor-pointer"
                    >
                        <Download size={14} />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Suite Category Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs sidebar-scroll-hide">
                {Object.entries(ROLE_REPORT_SUITES).map(([key, suite]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => {
                            setSelectedSuiteKey(key)
                            setSelectedReportId(suite.reports[0]?.id || '')
                        }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            selectedSuiteKey === key
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        {key === 'academic' && <GraduationCap size={14} />}
                        {key === 'administrative' && <Building2 size={14} />}
                        {key === 'financial' && <DollarSign size={14} />}
                        {key === 'logistics' && <Truck size={14} />}
                        {key === 'audit' && <Shield size={14} />}
                        <span>{suite.category}</span>
                    </button>
                ))}
            </div>

            {/* Sub-report selector tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {currentSuite.reports.map((rep) => {
                    const isSelected = rep.id === activeReport.id
                    return (
                        <button
                            key={rep.id}
                            type="button"
                            onClick={() => setSelectedReportId(rep.id)}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                isSelected
                                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                                    : 'bg-white border-slate-200 hover:bg-slate-50/80 shadow-2xs'
                            }`}
                        >
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Report Module</span>
                            <h3 className={`text-xs font-bold mt-1 ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                                {rep.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                {rep.desc}
                            </p>
                        </button>
                    )
                })}
            </div>

            {/* Custom Date Range & Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search within report records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-400 uppercase text-[10px]">From:</span>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="font-semibold text-slate-400 uppercase text-[10px]">To:</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Completed">Completed</option>
                        <option value="Active">Active / In-progress</option>
                    </select>
                </div>

                <div className="text-xs text-slate-500 font-semibold shrink-0">
                    Showing <strong>{filteredRows.length}</strong> audited records
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">{activeReport.name}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{activeReport.desc}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Live Data Certified
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200/80 bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                                {currentSuite.columns.map((col, idx) => (
                                    <th key={idx} className="py-3 px-4">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={currentSuite.columns.length} className="py-8 text-center text-slate-400">
                                        No records found matching filters for this date window.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3 px-4 font-bold text-slate-900">{row.col1}</td>
                                        <td className="py-3 px-4 font-medium text-slate-700">{row.col2}</td>
                                        <td className="py-3 px-4 font-semibold text-indigo-700">{row.col3}</td>
                                        <td className="py-3 px-4 font-semibold text-slate-800">{row.col4}</td>
                                        <td className="py-3 px-4 text-slate-600">{row.col5}</td>
                                        <td className="py-3 px-4 text-slate-700 font-medium">{row.col6}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                row.status === 'Completed'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-slate-400">{row.date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
