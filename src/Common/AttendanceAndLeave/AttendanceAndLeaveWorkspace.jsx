import React, { useState, useMemo, useEffect } from 'react'
import {
    CalendarCheck,
    Clock,
    CheckCircle2,
    AlertCircle,
    Users,
    UserCheck,
    FileText,
    Plus,
    Search,
    Filter,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Layers,
    X,
    Eye,
    Check,
    RotateCcw,
    Sliders,
    Building2,
    User,
    Paperclip,
    AlertTriangle,
    ShieldCheck,
    FileSpreadsheet,
    CalendarX,
    Sparkles,
    RefreshCw
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import {
    ENTERPRISE_EMPLOYEES,
    DEFAULT_HR_POLICIES,
    getAttendanceRecords,
    getLeaveRequests,
    getHrPolicies,
    saveHrPolicies,
    calculateEmployeeLeaveBalance,
    getAuthorizedAttendanceRecords,
    getAuthorizedReceivedLeaveRequests,
    getMyLeaveRequests,
    submitLeaveRequest,
    updateLeaveRequestDecision,
    cancelLeaveRequest,
    getLeaveLedger,
    calculateWorkingDays,
    previewCarryForward,
    executeCarryForward,
    adjustEmployeeLeaveBalance,
    updateHrPolicyCategory,
    canUserManagePolicies,
    getRoleAwareKPIs,
    FULL_ACCESS_MANAGEMENT_ROLES,
    CURRENT_ACADEMIC_YEAR,
    ACADEMIC_YEARS,
    submitAttendanceRegularization,
    approveAttendanceRegularization,
    rejectAttendanceRegularization,
    directAdminAttendanceOverride,
    getAuthorizedCorrectionRequests
} from './attendanceLeaveData'

// Helpers for badges
const getStatusBadge = (status) => {
    switch (status) {
        case 'Approved':
            return { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
        case 'Pending':
            return { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
        case 'Rejected':
            return { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
        case 'Cancelled':
            return { label: 'Cancelled', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
        case 'Withdrawn':
            return { label: 'Withdrawn', bg: 'bg-slate-100 text-slate-600 border-slate-200' }
        default:
            return { label: status || 'Pending', bg: 'bg-slate-50 text-slate-700 border-slate-200' }
    }
}

const getAttendanceStatusBadge = (status) => {
    switch (status) {
        case 'Present':
            return { label: 'Present', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
        case 'Late Arrival':
            return { label: 'Late Arrival', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
        case 'Early Departure':
            return { label: 'Early Departure', bg: 'bg-orange-50 text-orange-700 border-orange-200' }
        case 'Half-Day':
            return { label: 'Half-Day', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
        case 'On Leave':
            return { label: 'On Leave', bg: 'bg-purple-50 text-purple-700 border-purple-200' }
        case 'Absent':
            return { label: 'Absent', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
        default:
            return { label: status || 'Present', bg: 'bg-slate-50 text-slate-700 border-slate-200' }
    }
}

export default function AttendanceAndLeaveWorkspace({ defaultTab = 'overview', roleOverride = null }) {
    const { role: authRole, email: authEmail, name: authName } = useAuth()
    const activeRole = (roleOverride || authRole || 'teacher').trim().toLowerCase()
    const roleLabel = getProfileLabel(activeRole)

    // Current employee profile
    const currentEmployee = useMemo(() => {
        const cleanActive = activeRole.replace(/[-_\s]/g, '')
        return (
            ENTERPRISE_EMPLOYEES.find(
                (e) => (authEmail && e.email.toLowerCase() === authEmail.toLowerCase()) ||
                       e.roleKey.toLowerCase().replace(/[-_\s]/g, '') === cleanActive
            ) || ENTERPRISE_EMPLOYEES[0]
        )
    }, [authEmail, activeRole])

    const currentUserId = currentEmployee?.id || 'EMP-TCH-006'
    const currentUserName = authName || currentEmployee?.name || roleLabel

    // Permission flags
    const isFullAccessRole = FULL_ACCESS_MANAGEMENT_ROLES.includes(activeRole)
    const isDeptHead = [
        'coordinator',
        'stationery-store-manager',
        'transport-manager',
        'account-head',
        'it-support-manager',
        'gatekeeper-manager',
        'housekeeping-manager',
        'maintenance-manager',
        'maintenancemanager',
        'canteen-manager'
    ].includes(activeRole)

    const isManagementOrHR = isFullAccessRole || isDeptHead
    const canManagePolicies = canUserManagePolicies(activeRole)
    const canApproveOrReject = activeRole === 'hr' || activeRole === 'super-admin'

    // Resolve initial active tab based on defaultTab prop
    const getInitialTab = () => {
        if (defaultTab === 'my-leaves' || defaultTab === 'my-leave') return 'my-leave'
        if (defaultTab === 'received-leaves' || defaultTab === 'leave-management') return isManagementOrHR ? 'leave-management' : 'my-leave'
        if (defaultTab === 'my-attendance') return 'my-attendance'
        if (defaultTab === 'attendance' || defaultTab === 'staff-attendance') return isManagementOrHR ? 'attendance' : 'my-attendance'
        if (defaultTab === 'records') return isManagementOrHR ? 'attendance' : 'my-attendance'
        if (defaultTab === 'policies' || defaultTab === 'configuration') return canManagePolicies ? 'policies' : 'overview'
        return 'overview'
    }

    const [activeTab, setActiveTab] = useState(getInitialTab)

    useEffect(() => {
        setActiveTab(getInitialTab())
    }, [defaultTab, isManagementOrHR, canManagePolicies])
    const [refreshKey, setRefreshKey] = useState(0)
    const [bannerMessage, setBannerMessage] = useState('')

    // Modals state
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
    const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(null)
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
    const [isAdjustBalanceModalOpen, setIsAdjustBalanceModalOpen] = useState(false)
    const [isCarryForwardModalOpen, setIsCarryForwardModalOpen] = useState(false)
    const [isPolicyEditModalOpen, setIsPolicyEditModalOpen] = useState(false)
    const [selectedPolicyCategory, setSelectedPolicyCategory] = useState(null)
    const [policyCategoryType, setPolicyCategoryType] = useState('Academic') // 'Academic' | 'Non-Academic'
    const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false)
    const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState(null)

    const notify = (msg) => {
        setBannerMessage(msg)
        setTimeout(() => setBannerMessage(''), 4000)
    }

    const refreshData = () => {
        setRefreshKey((k) => k + 1)
    }

    // Role-Aware Dynamic KPIs
    const kpis = useMemo(() => {
        void refreshKey
        return getRoleAwareKPIs(activeRole, currentUserId, authEmail)
    }, [activeRole, currentUserId, authEmail, refreshKey])

    // Authorized Attendance records
    const authorizedAttendance = useMemo(() => {
        void refreshKey
        return getAuthorizedAttendanceRecords(activeRole, authEmail, currentUserId)
    }, [activeRole, authEmail, currentUserId, refreshKey])

    // Authorized Leave Requests (Received/subordinate requests)
    const authorizedLeaveRequests = useMemo(() => {
        void refreshKey
        return getAuthorizedReceivedLeaveRequests(activeRole, authEmail)
    }, [activeRole, authEmail, refreshKey])

    // Employee's own Leave Requests
    const myLeaveRequests = useMemo(() => {
        void refreshKey
        return getMyLeaveRequests(currentUserId)
    }, [currentUserId, refreshKey])

    // Employee's Leave Balance
    const employeeBalance = useMemo(() => {
        void refreshKey
        return calculateEmployeeLeaveBalance(currentUserId)
    }, [currentUserId, refreshKey])

    // All policies
    const hrPolicies = useMemo(() => {
        void refreshKey
        return getHrPolicies()
    }, [refreshKey])

    // Navigation tab list
    const availableTabs = useMemo(() => {
        if (isManagementOrHR) {
            const tabs = [
                { id: 'overview', label: 'Overview', icon: Layers },
                { id: 'my-leave', label: 'My Leave', icon: UserCheck },
                { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
                { id: 'leave-management', label: 'Leave Management', icon: FileText }
            ]
            if (canManagePolicies) {
                tabs.push({ id: 'policies', label: 'Leave Policies', icon: Sliders })
            }
            return tabs
        } else {
            return [
                { id: 'overview', label: 'Overview', icon: Layers },
                { id: 'my-attendance', label: 'My Attendance', icon: Clock },
                { id: 'my-leave', label: 'My Leave', icon: FileText }
            ]
        }
    }, [isManagementOrHR, canManagePolicies])

    return (
        <div className="min-h-screen bg-slate-50/60 p-4 md:p-6 lg:p-8 space-y-6">
            {/* Banner Alert */}
            {bannerMessage && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-sm animate-fade-in">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-medium">{bannerMessage}</span>
                    </div>
                    <button onClick={() => setBannerMessage('')} className="text-emerald-600 hover:text-emerald-900">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <CalendarCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Attendance & Leave Management
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Manage attendance, leave applications, employee leave balances, and HR policies in one place.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Apply for Leave Button (Available to all employees) */}
                    <button
                        onClick={() => setIsApplyModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Apply for Leave</span>
                    </button>

                    {canManagePolicies && (
                        <button
                            onClick={() => setIsCarryForwardModalOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-medium text-xs transition"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Run Carry-Forward</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 4 Dynamic Role-Aware KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.isManagement ? (
                    <>
                        {/* 1. Total Staff */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Staff</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalStaff}</p>
                                <span className="text-xs text-slate-400">Authorized personnel</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>

                        {/* 2. Present Today */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Today</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.presentToday}</p>
                                <span className="text-xs text-slate-400">Active checked-in staff</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <UserCheck className="w-6 h-6" />
                            </div>
                        </div>

                        {/* 3. On Leave Today */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">On Leave Today</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.onLeaveToday}</p>
                                <span className="text-xs text-slate-400">Approved leave absence</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <CalendarX className="w-6 h-6" />
                            </div>
                        </div>

                        {/* 4. Pending Leave Approvals */}
                        <div className={`bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between ${kpis.pendingLeaveApprovals > 0 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'}`}>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
                                <p className={`text-2xl font-bold mt-1 ${kpis.pendingLeaveApprovals > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                                    {kpis.pendingLeaveApprovals}
                                </p>
                                <span className="text-xs text-slate-400">Action required</span>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpis.pendingLeaveApprovals > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* 1. Present Days */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Days</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.presentDays}</p>
                                <span className="text-xs text-slate-400">This month</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CalendarCheck className="w-6 h-6" />
                            </div>
                        </div>

                        {/* 2. Leave Balance */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Balance</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.leaveBalance} <span className="text-xs font-normal text-slate-400">days</span></p>
                                <span className="text-xs text-slate-400">Total available statutory</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>
                        </div>

                        {/* 3. Pending Leave Requests */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Requests</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.pendingLeaveRequests}</p>
                                <span className="text-xs text-slate-400">Under review</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>

                        {/* 4. Approved Leave Days */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Leave</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.approvedLeaveDays} <span className="text-xs font-normal text-slate-400">days</span></p>
                                <span className="text-xs text-slate-400">This academic year</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Dashboard Container: Minimal Navigation Tabs & Tab Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Minimal Tab Bar */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        {availableTabs.map((tab) => {
                            const Icon = tab.icon
                            const active = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${active
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                    {tab.id === 'leave-management' && kpis.pendingLeaveApprovals > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${active ? 'bg-blue-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                            {kpis.pendingLeaveApprovals}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Tab Views */}
                <div className="p-6">
                    {activeTab === 'overview' && (
                        <OverviewSection
                            isManagement={isManagementOrHR}
                            currentEmployee={currentEmployee}
                            employeeBalance={employeeBalance}
                            authorizedAttendance={authorizedAttendance}
                            authorizedLeaveRequests={authorizedLeaveRequests}
                            myLeaveRequests={myLeaveRequests}
                            onApply={() => setIsApplyModalOpen(true)}
                            onReview={(req) => {
                                setSelectedLeaveRequest(req)
                                setIsReviewModalOpen(true)
                            }}
                        />
                    )}

                    {activeTab === 'my-attendance' && (
                        <MyAttendanceView
                            currentEmployee={currentEmployee}
                            attendanceRecords={authorizedAttendance}
                            onRequestRegularization={(record) => {
                                setSelectedAttendanceRecord(record)
                                setIsCorrectionModalOpen(true)
                            }}
                        />
                    )}

                    {activeTab === 'my-leave' && (
                        <MyLeaveView
                            currentEmployee={currentEmployee}
                            employeeBalance={employeeBalance}
                            myLeaveRequests={myLeaveRequests}
                            onApply={() => setIsApplyModalOpen(true)}
                            onCancelRequest={(requestId) => {
                                const res = cancelLeaveRequest(requestId, 'Cancelled by employee')
                                refreshData()
                                notify('Leave request cancelled.')
                            }}
                        />
                    )}

                    {activeTab === 'attendance' && isManagementOrHR && (
                        <ManagementAttendanceView
                            authorizedAttendance={authorizedAttendance}
                            onCorrectRecord={(record) => {
                                setSelectedAttendanceRecord(record)
                                setIsCorrectionModalOpen(true)
                            }}
                            onMarkManualAttendance={() => {
                                setSelectedAttendanceRecord(null)
                                setIsCorrectionModalOpen(true)
                            }}
                        />
                    )}

                    {activeTab === 'leave-management' && isManagementOrHR && (
                        <ManagementLeaveView
                            leaveRequests={authorizedLeaveRequests}
                            myLeaveRequests={myLeaveRequests}
                            currentEmployee={currentEmployee}
                            employeeBalance={employeeBalance}
                            canManagePolicies={canManagePolicies}
                            canApproveOrReject={canApproveOrReject}
                            onReview={(req) => {
                                setSelectedLeaveRequest(req)
                                setIsReviewModalOpen(true)
                            }}
                            onApply={() => setIsApplyModalOpen(true)}
                            onCancelMyRequest={(requestId) => {
                                cancelLeaveRequest(requestId, 'Cancelled by employee')
                                refreshData()
                                notify('Your leave request has been cancelled.')
                            }}
                            onAdjustBalance={() => setIsAdjustBalanceModalOpen(true)}
                        />
                    )}

                    {activeTab === 'policies' && canManagePolicies && (
                        <LeavePoliciesSection
                            hrPolicies={hrPolicies}
                            onEditPolicyCategory={(cat, type) => {
                                setSelectedPolicyCategory(cat)
                                setPolicyCategoryType(type)
                                setIsPolicyEditModalOpen(true)
                            }}
                            onRunCarryForward={() => setIsCarryForwardModalOpen(true)}
                        />
                    )}
                </div>
            </div>

            {/* APPLY FOR LEAVE MODAL */}
            {isApplyModalOpen && (
                <ApplyLeaveModal
                    currentEmployee={currentEmployee}
                    employeeBalance={employeeBalance}
                    isHR={canManagePolicies}
                    onClose={() => setIsApplyModalOpen(false)}
                    onSuccess={(newReq) => {
                        setIsApplyModalOpen(false)
                        refreshData()
                        notify(`Leave application submitted successfully (Ref: ${newReq.id})`)
                    }}
                />
            )}

            {/* REVIEW / APPROVE LEAVE MODAL */}
            {isReviewModalOpen && selectedLeaveRequest && (
                <ReviewLeaveModal
                    request={selectedLeaveRequest}
                    approverName={currentUserName}
                    isHR={canApproveOrReject}
                    userRole={activeRole}
                    onClose={() => {
                        setIsReviewModalOpen(false)
                        setSelectedLeaveRequest(null)
                    }}
                    onSuccess={(updated) => {
                        setIsReviewModalOpen(false)
                        setSelectedLeaveRequest(null)
                        refreshData()
                        notify(`Leave request ${updated.id} marked as ${updated.status}`)
                    }}
                />
            )}

            {/* HR LEAVE BALANCE ADJUSTMENT MODAL */}
            {isAdjustBalanceModalOpen && canManagePolicies && (
                <AdjustBalanceModal
                    performedBy={currentUserName}
                    onClose={() => setIsAdjustBalanceModalOpen(false)}
                    onSuccess={() => {
                        setIsAdjustBalanceModalOpen(false)
                        refreshData()
                        notify('Employee leave balance adjusted successfully.')
                    }}
                />
            )}

            {/* CARRY FORWARD EXECUTION MODAL */}
            {isCarryForwardModalOpen && canManagePolicies && (
                <CarryForwardModal
                    performedBy={currentUserName}
                    onClose={() => setIsCarryForwardModalOpen(false)}
                    onSuccess={(msg) => {
                        setIsCarryForwardModalOpen(false)
                        refreshData()
                        notify(msg)
                    }}
                />
            )}

            {/* POLICY EDIT MODAL */}
            {isPolicyEditModalOpen && selectedPolicyCategory && (
                <EditPolicyModal
                    category={selectedPolicyCategory}
                    policyType={policyCategoryType}
                    performedBy={currentUserName}
                    onClose={() => {
                        setIsPolicyEditModalOpen(false)
                        setSelectedPolicyCategory(null)
                    }}
                    onSuccess={() => {
                        setIsPolicyEditModalOpen(false)
                        setSelectedPolicyCategory(null)
                        refreshData()
                        notify('Leave policy updated successfully.')
                    }}
                />
            )}

            {/* ATTENDANCE CORRECTION / REGULARIZATION MODAL */}
            {isCorrectionModalOpen && (
                <AttendanceCorrectionModal
                    record={selectedAttendanceRecord}
                    currentEmployee={currentEmployee}
                    isManagement={isManagementOrHR}
                    performedBy={currentUserName}
                    onClose={() => {
                        setIsCorrectionModalOpen(false)
                        setSelectedAttendanceRecord(null)
                    }}
                    onSuccess={(msg) => {
                        setIsCorrectionModalOpen(false)
                        setSelectedAttendanceRecord(null)
                        refreshData()
                        notify(msg)
                    }}
                />
            )}
        </div>
    )
}

// -------------------------------------------------------------
// OVERVIEW SECTION (Shared Employee / Management)
// -------------------------------------------------------------
function OverviewSection({
    isManagement,
    currentEmployee,
    employeeBalance,
    authorizedAttendance,
    authorizedLeaveRequests,
    myLeaveRequests,
    onApply,
    onReview
}) {
    return (
        <div className="space-y-6 text-xs">
            {/* Quick Balances Grid */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-slate-900">
                        {isManagement ? "Your Personal Leave Balances" : "Statutory Leave Balances"}
                    </h2>
                    <button
                        onClick={onApply}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Apply Leave</span>
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {(employeeBalance?.categories || []).map((cat) => (
                        <div key={cat.code} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                <span>{cat.name}</span>
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                                    {cat.code}
                                </span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-slate-900">{cat.availableBalance}</span>
                                <span className="text-[10px] text-slate-400">/ {cat.annualAllocation} days</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                                <span>Used: {cat.used}</span>
                                {cat.pending > 0 && <span className="text-amber-600 font-semibold">Pending: {cat.pending}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Management: Subordinate Requests Needing Action */}
            {isManagement && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900">Pending Leave Approvals ({authorizedLeaveRequests.filter(r => r.status === 'Pending').length})</h2>
                        <span className="text-[11px] text-slate-400">Subordinate requests awaiting review</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs divide-y divide-slate-200">
                            <thead className="bg-slate-50 font-semibold text-slate-500 uppercase text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">Employee</th>
                                    <th className="py-2.5 px-3">Department</th>
                                    <th className="py-2.5 px-3">Leave Type</th>
                                    <th className="py-2.5 px-3">Duration</th>
                                    <th className="py-2.5 px-3">Reason</th>
                                    <th className="py-2.5 px-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {authorizedLeaveRequests.filter((r) => r.status === 'Pending').length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400">
                                            No pending leave requests requiring your review.
                                        </td>
                                    </tr>
                                ) : (
                                    authorizedLeaveRequests
                                        .filter((r) => r.status === 'Pending')
                                        .slice(0, 5)
                                        .map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50">
                                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                                    {req.employeeName}
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600">{req.department}</td>
                                                <td className="py-2.5 px-3">
                                                    <span className="font-medium text-slate-800">{req.leaveCategory || req.leaveType}</span>
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600">
                                                    {req.fromDate} to {req.toDate} ({req.totalDays} day{req.totalDays !== 1 ? 's' : ''})
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{req.reason}</td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <button
                                                        onClick={() => onReview(req)}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition"
                                                    >
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Employee: Recent Submitted Leaves */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">Your Recent Leave Applications</h2>
                    <span className="text-[11px] text-slate-400">Showing last 4 submissions</span>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs divide-y divide-slate-200">
                        <thead className="bg-slate-50 font-semibold text-slate-500 uppercase text-[10px]">
                            <tr>
                                <th className="py-2.5 px-3">Leave Type</th>
                                <th className="py-2.5 px-3">Dates</th>
                                <th className="py-2.5 px-3">Days</th>
                                <th className="py-2.5 px-3">Applied On</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Approver Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {myLeaveRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-slate-400">
                                        No recent leave requests found.
                                    </td>
                                </tr>
                            ) : (
                                myLeaveRequests.slice(0, 4).map((req) => {
                                    const b = getStatusBadge(req.status)
                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50">
                                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                                                {req.leaveCategory || req.leaveType}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600">
                                                {req.fromDate} &rarr; {req.toDate}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-slate-800">{req.totalDays}</td>
                                            <td className="py-2.5 px-3 text-slate-500">{req.appliedOn}</td>
                                            <td className="py-2.5 px-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.bg}`}>
                                                    {b.label}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                                                {req.approverRemarks || req.reviewRemarks || '—'}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// MY ATTENDANCE VIEW (Employee Monthly Records)
// -------------------------------------------------------------
function MyAttendanceView({ currentEmployee, attendanceRecords, onRequestRegularization }) {
    const myRecords = attendanceRecords.filter((r) => r.employeeId === currentEmployee.id)

    return (
        <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">My Attendance Records</h2>
                    <p className="text-slate-500 text-[11px]">Monthly shift logs, punch timings, and status tracking.</p>
                </div>
                <button
                    onClick={() => onRequestRegularization(myRecords[0] || null)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition"
                >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Request Regularization</span>
                </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left divide-y divide-slate-200">
                    <thead className="bg-slate-50 font-semibold text-slate-500 uppercase text-[10px]">
                        <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Shift</th>
                            <th className="py-2.5 px-3">Check-In</th>
                            <th className="py-2.5 px-3">Check-Out</th>
                            <th className="py-2.5 px-3">Duration</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {myRecords.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400">
                                    No attendance records found for this period.
                                </td>
                            </tr>
                        ) : (
                            myRecords.map((r, i) => {
                                const b = getAttendanceStatusBadge(r.status)
                                return (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3 font-semibold text-slate-800">{r.date}</td>
                                        <td className="py-2.5 px-3 text-slate-600">{r.shiftName || 'Standard'}</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-700">{r.checkInTime || '—'}</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-700">{r.checkOutTime || '—'}</td>
                                        <td className="py-2.5 px-3 text-slate-600">{r.duration || '—'}</td>
                                        <td className="py-2.5 px-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.bg}`}>
                                                {b.label}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{r.remarks || '—'}</td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// MY LEAVE VIEW (Employee Balances & Applications)
// -------------------------------------------------------------
function MyLeaveView({ currentEmployee, employeeBalance, myLeaveRequests, onApply, onCancelRequest }) {
    const [subSection, setSubSection] = useState('applications') // 'applications' | 'ledger'
    const ledger = getLeaveLedger(currentEmployee.id)

    return (
        <div className="space-y-6 text-xs">
            {/* Leave Balance Cards */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Available Statutory Leave Balance</h2>
                        <p className="text-slate-500 text-[11px]">Academic Year: {CURRENT_ACADEMIC_YEAR} ({currentEmployee.category} Policy)</p>
                    </div>
                    <button
                        onClick={onApply}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Apply for Leave</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {(employeeBalance?.categories || []).map((cat) => (
                        <div key={cat.code} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-800 text-[11px] block">{cat.name}</span>
                            <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-blue-600">{cat.availableBalance}</span>
                                <span className="text-[10px] text-slate-400">/ {cat.annualAllocation} days</span>
                            </div>
                            <div className="mt-1 text-[10px] text-slate-500 flex justify-between">
                                <span>Used: {cat.used}</span>
                                {cat.carryForwardAllowed && (
                                    <span className="text-emerald-600 font-semibold">CF Cap: {cat.maxCarryForward}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sub-navigation: Applications | Ledger */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setSubSection('applications')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${subSection === 'applications'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    Leave Applications ({myLeaveRequests.length})
                </button>
                <button
                    onClick={() => setSubSection('ledger')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${subSection === 'ledger'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    Leave Balance Ledger ({ledger.length})
                </button>
            </div>

            {subSection === 'applications' && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 font-semibold text-slate-500 uppercase text-[10px]">
                            <tr>
                                <th className="py-2.5 px-3">Ref ID</th>
                                <th className="py-2.5 px-3">Leave Type</th>
                                <th className="py-2.5 px-3">From - To</th>
                                <th className="py-2.5 px-3">Working Days</th>
                                <th className="py-2.5 px-3">Reason</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Review Notes</th>
                                <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {myLeaveRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-400">
                                        No leave requests submitted yet.
                                    </td>
                                </tr>
                            ) : (
                                myLeaveRequests.map((req) => {
                                    const b = getStatusBadge(req.status)
                                    const canCancel = req.status === 'Pending' || req.status === 'Approved'
                                    return (
                                        <tr key={req.id} className="hover:bg-slate-50">
                                            <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{req.id}</td>
                                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                                                {req.leaveCategory || req.leaveType}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600">
                                                {req.fromDate} &rarr; {req.toDate}
                                            </td>
                                            <td className="py-2.5 px-3 font-semibold text-slate-900">{req.totalDays}</td>
                                            <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{req.reason}</td>
                                            <td className="py-2.5 px-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.bg}`}>
                                                    {b.label}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                                                {req.approverRemarks || req.reviewRemarks || '—'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                {canCancel && (
                                                    <button
                                                        onClick={() => onCancelRequest(req.id)}
                                                        className="text-rose-600 hover:text-rose-800 text-[11px] font-bold"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {subSection === 'ledger' && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 font-semibold text-slate-500 uppercase text-[10px]">
                            <tr>
                                <th className="py-2.5 px-3">Date / Time</th>
                                <th className="py-2.5 px-3">Transaction Type</th>
                                <th className="py-2.5 px-3">Leave Type</th>
                                <th className="py-2.5 px-3">Credited</th>
                                <th className="py-2.5 px-3">Debited</th>
                                <th className="py-2.5 px-3">Balance</th>
                                <th className="py-2.5 px-3">Performed By</th>
                                <th className="py-2.5 px-3">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {ledger.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-400">
                                        No ledger transactions recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                ledger.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{tx.timestamp}</td>
                                        <td className="py-2.5 px-3 font-semibold text-slate-800">{tx.transactionType}</td>
                                        <td className="py-2.5 px-3 text-slate-700 font-mono">{tx.leaveTypeCode}</td>
                                        <td className="py-2.5 px-3 text-emerald-600 font-bold">
                                            {tx.creditedDays > 0 ? `+${tx.creditedDays}` : '—'}
                                        </td>
                                        <td className="py-2.5 px-3 text-rose-600 font-bold">
                                            {tx.debitedDays > 0 ? `-${tx.debitedDays}` : '—'}
                                        </td>
                                        <td className="py-2.5 px-3 font-bold text-slate-900">{tx.newBalance ?? '—'}</td>
                                        <td className="py-2.5 px-3 text-slate-600">{tx.performedBy || 'System'}</td>
                                        <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">{tx.remarks}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// -------------------------------------------------------------
// MANAGEMENT ATTENDANCE VIEW (Daily & Monthly Table + Search)
// -------------------------------------------------------------
function ManagementAttendanceView({ authorizedAttendance, onCorrectRecord, onMarkManualAttendance }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [deptFilter, setDeptFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const filtered = useMemo(() => {
        return authorizedAttendance.filter((r) => {
            if (searchTerm) {
                const term = searchTerm.toLowerCase()
                const nameMatch = (r.employeeName || '').toLowerCase().includes(term)
                const idMatch = (r.employeeId || '').toLowerCase().includes(term)
                if (!nameMatch && !idMatch) return false
            }
            if (deptFilter && !r.department.includes(deptFilter)) return false
            if (statusFilter && r.status !== statusFilter) return false
            return true
        })
    }, [authorizedAttendance, searchTerm, deptFilter, statusFilter])

    return (
        <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Organization Attendance Ledger</h2>
                    <p className="text-slate-500 text-[11px]">Real-time shift tracking across authorized departments.</p>
                </div>
                {onMarkManualAttendance && (
                    <button
                        type="button"
                        onClick={onMarkManualAttendance}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Mark Manual Attendance
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative min-w-[200px] flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
                >
                    <option value="">All Departments</option>
                    <option value="Academics">Academics & Teaching</option>
                    <option value="Administration">Administration</option>
                    <option value="Stores">Stores & Procurement</option>
                    <option value="Transport">Transport & Fleet</option>
                    <option value="Finance">Finance & Accounts</option>
                    <option value="Security">Campus Security</option>
                    <option value="Facilities">Facilities & Sanitation</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
                >
                    <option value="">All Statuses</option>
                    <option value="Present">Present</option>
                    <option value="Late Arrival">Late Arrival</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Early Departure">Early Departure</option>
                    <option value="Absent">Absent</option>
                </select>

                {(searchTerm || deptFilter || statusFilter) && (
                    <button
                        onClick={() => {
                            setSearchTerm('')
                            setDeptFilter('')
                            setStatusFilter('')
                        }}
                        className="text-xs text-rose-600 font-semibold"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 font-semibold text-slate-500 uppercase text-[10px]">
                        <tr>
                            <th className="py-2.5 px-3">Employee</th>
                            <th className="py-2.5 px-3">Department</th>
                            <th className="py-2.5 px-3">Shift</th>
                            <th className="py-2.5 px-3">Check-In</th>
                            <th className="py-2.5 px-3">Check-Out</th>
                            <th className="py-2.5 px-3">Duration</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-8 text-center text-slate-400">
                                    No attendance records found matching filters.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((r, i) => {
                                const b = getAttendanceStatusBadge(r.status)
                                return (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                                            <div>{r.employeeName}</div>
                                            <span className="text-[10px] text-slate-400 font-mono">#{r.employeeId}</span>
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-600">{r.department}</td>
                                        <td className="py-2.5 px-3 text-slate-600">{r.shiftName || 'Standard Shift'}</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-700">{r.checkInTime || '—'}</td>
                                        <td className="py-2.5 px-3 font-mono text-slate-700">{r.checkOutTime || '—'}</td>
                                        <td className="py-2.5 px-3 text-slate-600">{r.duration || '—'}</td>
                                        <td className="py-2.5 px-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.bg}`}>
                                                {b.label}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <button
                                                onClick={() => onCorrectRecord(r)}
                                                className="text-blue-600 hover:text-blue-800 font-bold text-[11px]"
                                            >
                                                Override / Correct
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// MANAGEMENT LEAVE VIEW (Approvals, Employee Balances & Calendar)
// -------------------------------------------------------------
function ManagementLeaveView({
    leaveRequests,
    myLeaveRequests = [],
    currentEmployee,
    employeeBalance,
    canManagePolicies,
    canApproveOrReject,
    onReview,
    onApply,
    onCancelMyRequest,
    onAdjustBalance
}) {
    const [statusFilter, setStatusFilter] = useState('Pending')
    const [searchTerm, setSearchTerm] = useState('')
    const [subSection, setSubSection] = useState('requests') // 'requests' | 'my-requests' | 'balances' | 'calendar'

    const filteredRequests = useMemo(() => {
        return leaveRequests.filter((r) => {
            if (statusFilter && statusFilter !== 'ALL' && r.status !== statusFilter) return false
            if (searchTerm) {
                const term = searchTerm.toLowerCase()
                const nameMatch = (r.employeeName || '').toLowerCase().includes(term)
                const deptMatch = (r.department || '').toLowerCase().includes(term)
                if (!nameMatch && !deptMatch) return false
            }
            return true
        })
    }, [leaveRequests, statusFilter, searchTerm])

    return (
        <div className="space-y-4 text-xs">
            {/* Header + Sub-nav */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSubSection('requests')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${subSection === 'requests'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        Staff Requests ({leaveRequests.length})
                    </button>
                    <button
                        onClick={() => setSubSection('my-requests')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition ${subSection === 'my-requests'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>My Personal Leaves ({myLeaveRequests.length})</span>
                    </button>
                    <button
                        onClick={() => setSubSection('balances')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${subSection === 'balances'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        Staff Leave Balances
                    </button>
                    <button
                        onClick={() => setSubSection('calendar')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${subSection === 'calendar'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        Leave Calendar
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {subSection === 'my-requests' && (
                        <button
                            onClick={onApply}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Apply for Leave / Permission</span>
                        </button>
                    )}
                    {canManagePolicies && subSection === 'balances' && (
                        <button
                            onClick={onAdjustBalance}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adjust Staff Balance</span>
                        </button>
                    )}
                </div>
            </div>

            {subSection === 'my-requests' && (
                <div className="space-y-4">
                    {/* Personal Balances row */}
                    {employeeBalance && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-slate-800 text-xs">
                                    Your Statutory Leave Balances ({currentEmployee?.name} • {currentEmployee?.roleLabel || currentEmployee?.designation})
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">Academic Year 2026-2027</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                                {(employeeBalance.categories || []).map((cat) => (
                                    <div key={cat.code} className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                                        <span className="text-[10px] font-bold text-slate-500 block truncate">{cat.name}</span>
                                        <span className="text-lg font-bold text-blue-600 block mt-0.5">{cat.availableBalance}</span>
                                        <span className="text-[9px] text-slate-400">Used: {cat.used}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Applications Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left divide-y divide-slate-200 text-xs">
                            <thead className="bg-slate-50 font-semibold text-slate-500 uppercase text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">Leave Type</th>
                                    <th className="py-2.5 px-3">Dates</th>
                                    <th className="py-2.5 px-3">Duration / Days</th>
                                    <th className="py-2.5 px-3">Applied On</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3">HR Decision Remarks</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {myLeaveRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-400">
                                            You haven't submitted any leave or permission requests yet.
                                        </td>
                                    </tr>
                                ) : (
                                    myLeaveRequests.map((req) => {
                                        const b = getStatusBadge(req.status)
                                        const isPerm = req.leaveTypeCode === 'PERM' || (req.leaveCategory || '').toLowerCase().includes('permission')
                                        return (
                                            <tr key={req.id} className="hover:bg-slate-50">
                                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{req.leaveCategory || req.leaveType}</span>
                                                        {isPerm && (
                                                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-bold">
                                                                Permission
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600">
                                                    {req.fromDate} {req.toDate && req.toDate !== req.fromDate ? `→ ${req.toDate}` : ''}
                                                </td>
                                                <td className="py-2.5 px-3 font-medium text-slate-800">
                                                    {isPerm ? `${req.permissionHours || 2} Hours` : `${req.totalDays} Day${req.totalDays !== 1 ? 's' : ''}`}
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-500">{req.appliedOn}</td>
                                                <td className="py-2.5 px-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.bg}`}>
                                                        {b.label}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                                                    {req.approverRemarks || req.reviewRemarks || '—'}
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                    {req.status === 'Pending' ? (
                                                        <button
                                                            onClick={() => onCancelMyRequest(req.id)}
                                                            className="text-rose-600 hover:text-rose-800 font-semibold"
                                                        >
                                                            Cancel
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {subSection === 'requests' && (
                <div className="space-y-3">
                    {/* View-Only Transparency Notice for Non-HR Roles */}
                    {!canApproveOrReject && (
                        <div className="p-3 bg-blue-50/80 border border-blue-200 text-blue-900 rounded-xl flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>
                                    <strong>View-Only Transparency:</strong> Department heads, PRM, and leadership have full visibility over subordinate requests and attendance rosters. Final decision authority (Accept / Reject) is centrally executed by Human Resources (HR).
                                </span>
                            </div>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold text-[10px] uppercase tracking-wider shrink-0">
                                View Only
                            </span>
                        </div>
                    )}

                    {/* Filter bar */}
                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="relative min-w-[200px] flex-1 max-w-xs">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search by name or department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold"
                        >
                            <option value="Pending">Pending Approvals</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="ALL">All Statuses</option>
                        </select>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left divide-y divide-slate-200 text-xs">
                            <thead className="bg-slate-50 font-semibold text-slate-500 uppercase text-[10px]">
                                <tr>
                                    <th className="py-2.5 px-3">Employee</th>
                                    <th className="py-2.5 px-3">Department</th>
                                    <th className="py-2.5 px-3">Leave Type</th>
                                    <th className="py-2.5 px-3">Dates</th>
                                    <th className="py-2.5 px-3">Duration</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3">Reason</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-slate-400">
                                            No leave requests found matching filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((req) => {
                                        const b = getStatusBadge(req.status)
                                        const isPerm = req.leaveTypeCode === 'PERM' || (req.leaveCategory || '').toLowerCase().includes('permission')
                                        return (
                                            <tr key={req.id} className="hover:bg-slate-50">
                                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                                    <div>{req.employeeName}</div>
                                                    <span className="text-[10px] text-slate-400 font-mono">#{req.employeeId}</span>
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600">{req.department}</td>
                                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{req.leaveCategory || req.leaveType}</span>
                                                        {isPerm && (
                                                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-bold">
                                                                Permission
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600">
                                                    {req.fromDate} {req.toDate && req.toDate !== req.fromDate ? `→ ${req.toDate}` : ''}
                                                </td>
                                                <td className="py-2.5 px-3 font-bold text-slate-900">
                                                    {isPerm ? `${req.permissionHours || 2}h` : `${req.totalDays}d`}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.bg}`}>
                                                        {b.label}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{req.reason}</td>
                                                <td className="py-2.5 px-3 text-right">
                                                    {canApproveOrReject ? (
                                                        <button
                                                            onClick={() => onReview(req)}
                                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition"
                                                        >
                                                            Review & Decide
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => onReview(req)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                            <span>View Details</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {subSection === 'balances' && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 font-semibold text-slate-500 uppercase text-[10px]">
                            <tr>
                                <th className="py-2.5 px-3">Employee</th>
                                <th className="py-2.5 px-3">Category</th>
                                <th className="py-2.5 px-3">Casual (CL)</th>
                                <th className="py-2.5 px-3">Sick (SL)</th>
                                <th className="py-2.5 px-3">Earned (EL)</th>
                                <th className="py-2.5 px-3">Medical (ML)</th>
                                <th className="py-2.5 px-3">Total Available</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {ENTERPRISE_EMPLOYEES.map((emp) => {
                                const bal = calculateEmployeeLeaveBalance(emp.id)
                                const cl = bal.categories.find(c => c.code === 'CL')?.availableBalance ?? 0
                                const sl = bal.categories.find(c => c.code === 'SL')?.availableBalance ?? 0
                                const el = bal.categories.find(c => c.code === 'EL')?.availableBalance ?? 0
                                const ml = bal.categories.find(c => c.code === 'ML')?.availableBalance ?? 0
                                return (
                                    <tr key={emp.id} className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3">
                                            <div className="font-semibold text-slate-800">{emp.name}</div>
                                            <span className="text-[10px] text-slate-400 font-mono">#{emp.id} • {emp.department}</span>
                                        </td>
                                        <td className="py-2.5 px-3 font-medium text-slate-700">{emp.category}</td>
                                        <td className="py-2.5 px-3 font-semibold text-slate-800">{cl} days</td>
                                        <td className="py-2.5 px-3 font-semibold text-slate-800">{sl} days</td>
                                        <td className="py-2.5 px-3 font-semibold text-slate-800">{el} days</td>
                                        <td className="py-2.5 px-3 font-semibold text-slate-800">{ml} days</td>
                                        <td className="py-2.5 px-3 font-bold text-blue-600">{bal.summary.availableBalance} days</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {subSection === 'calendar' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-sm">Monthly Approved Leave Calendar</h3>
                        <span className="text-[11px] text-slate-500">October - November 2026</span>
                    </div>
                    <div className="space-y-2">
                        {leaveRequests.filter(r => r.status === 'Approved').map(req => (
                            <div key={req.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                        {req.totalDays}d
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{req.employeeName} ({req.department})</p>
                                        <p className="text-[11px] text-slate-500">
                                            {req.leaveCategory || req.leaveType} • {req.fromDate} to {req.toDate}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    Approved
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// -------------------------------------------------------------
// LEAVE POLICIES SECTION (HR Management)
// -------------------------------------------------------------
function LeavePoliciesSection({ hrPolicies, onEditPolicyCategory, onRunCarryForward }) {
    const [policyTab, setPolicyTab] = useState('Academic') // 'Academic' | 'Non-Academic'
    const currentPolicy = policyTab === 'Academic' ? hrPolicies.academic : hrPolicies.nonAcademic

    return (
        <div className="space-y-5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Centralized HR Leave Policies</h2>
                    <p className="text-slate-500 text-[11px]">
                        Configure entitlements, carry-forward caps, notice periods, and statutory rules.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRunCarryForward}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Execute Carry-Forward</span>
                    </button>
                </div>
            </div>

            {/* Academic vs Non-Academic Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setPolicyTab('Academic')}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition ${policyTab === 'Academic'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    Academic Staff Policy ({hrPolicies.academic.categories.length} Types)
                </button>
                <button
                    onClick={() => setPolicyTab('Non-Academic')}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition ${policyTab === 'Non-Academic'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    Non-Academic Staff Policy ({hrPolicies.nonAcademic.categories.length} Types)
                </button>
            </div>

            {/* Policy Info Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">{currentPolicy.categoryName}</h3>
                    <p className="text-slate-500 text-[11px] mt-0.5">{currentPolicy.applicableTo}</p>
                </div>
                <div className="flex items-center gap-3 text-slate-600 font-medium">
                    <span>Effective: <strong>{currentPolicy.effectiveDate}</strong></span>
                    <span>Cycle: <strong>{currentPolicy.leaveYear}</strong></span>
                </div>
            </div>

            {/* Policy Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentPolicy.categories.map((cat) => (
                    <div key={cat.code} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-bold">
                                {cat.code}
                            </span>
                        </div>

                        <p className="text-slate-500 text-[11px] line-clamp-2">{cat.description}</p>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Annual Entitlement:</span>
                                <span className="font-bold text-slate-800">{cat.annualEntitlement} days</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Monthly Accrual:</span>
                                <span className="font-semibold text-slate-700">{cat.monthlyAccrual} days</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Carry-Forward:</span>
                                <span className={`font-bold ${cat.carryForwardAllowed ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {cat.carryForwardAllowed ? `Enabled (Max ${cat.maxCarryForward}d)` : 'Disabled'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Notice Period:</span>
                                <span className="font-semibold text-slate-700">{cat.minNoticeDays} days</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Medical Certificate:</span>
                                <span className="font-semibold text-slate-700">{cat.docRequired ? 'Required (>2d)' : 'Not Required'}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => onEditPolicyCategory(cat, policyTab)}
                            className="w-full mt-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-blue-600 font-bold rounded-lg border border-slate-200 text-xs transition"
                        >
                            Edit Policy Rules
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// APPLY LEAVE & PERMISSION MODAL (Statutory Leave & Short Absence)
// -------------------------------------------------------------
function ApplyLeaveModal({ currentEmployee, employeeBalance, isHR, onClose, onSuccess }) {
    const [selectedEmpId, setSelectedEmpId] = useState(currentEmployee.id)
    const emp = ENTERPRISE_EMPLOYEES.find(e => e.id === selectedEmpId) || currentEmployee
    const balance = calculateEmployeeLeaveBalance(emp.id)

    // Request Type: 'LEAVE' | 'PERMISSION'
    const [requestType, setRequestType] = useState('LEAVE')

    // Standard Leave state
    const [leaveTypeCode, setLeaveTypeCode] = useState('CL')
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() + 2)
        return d.toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() + 3)
        return d.toISOString().split('T')[0]
    })
    const [isHalfDay, setIsHalfDay] = useState(false)

    // Permission state (Short absence up to 2 hours)
    const [permissionDate, setPermissionDate] = useState(() => new Date().toISOString().split('T')[0])
    const [permissionSession, setPermissionSession] = useState('Morning Session (08:30 AM - 10:30 AM)')
    const [permissionHours, setPermissionHours] = useState('2')

    const [reason, setReason] = useState('')
    const [errorMsg, setErrorMsg] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Designated Approver is fixed to HR as per policy
    const designatedApprover = 'Human Resources Department (Sunita Deshmukh)'

    // Dynamic Working Days Calculation (for standard leave)
    const calculatedWorkingDays = useMemo(() => {
        if (requestType === 'PERMISSION') return 0
        return calculateWorkingDays(startDate, endDate, isHalfDay)
    }, [requestType, startDate, endDate, isHalfDay])

    // Selected Leave Category info
    const selectedCat = balance.categories.find(c => c.code === leaveTypeCode) || balance.categories[0]

    const handleLeaveTypeChange = (code) => {
        if (code === 'PERM') {
            setRequestType('PERMISSION')
            setLeaveTypeCode('PERM')
        } else {
            setLeaveTypeCode(code)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setErrorMsg('')

        if (requestType === 'PERMISSION') {
            if (!permissionDate) {
                setErrorMsg('Permission date is mandatory.')
                return
            }
            if (!reason.trim()) {
                setErrorMsg('Please state the specific official or domestic purpose for this permission.')
                return
            }

            setIsSubmitting(true)
            try {
                const req = submitLeaveRequest({
                    employeeId: emp.id,
                    employeeName: emp.name,
                    department: emp.department,
                    designation: emp.designation,
                    leaveType: 'Permission (Short Leave)',
                    leaveCategory: 'Permission',
                    leaveTypeCode: 'PERM',
                    startDate: permissionDate,
                    endDate: permissionDate,
                    totalDays: 0,
                    isHalfDay: false,
                    isPermission: true,
                    permissionHours: Number(permissionHours),
                    permissionSession,
                    reason: reason.trim(),
                    approver: designatedApprover,
                    approverRole: 'hr'
                })
                onSuccess(req)
            } catch (err) {
                setErrorMsg(err.message || 'Failed to submit permission request.')
                setIsSubmitting(false)
            }
            return
        }

        // Standard Leave validation
        if (!startDate || !endDate) {
            setErrorMsg('Start date and end date are mandatory.')
            return
        }
        if (calculatedWorkingDays <= 0) {
            setErrorMsg('Selected date range contains 0 working days (falls entirely on weekends or holidays).')
            return
        }
        if (!reason.trim()) {
            setErrorMsg('Please provide a specific reason for your leave application.')
            return
        }

        // Validate balance (allow LOP even if 0)
        if (leaveTypeCode !== 'LOP' && selectedCat && selectedCat.availableBalance < calculatedWorkingDays) {
            setErrorMsg(`Insufficient leave balance. You have ${selectedCat.availableBalance} days available for ${selectedCat.name}, but requested ${calculatedWorkingDays} days.`)
            return
        }

        setIsSubmitting(true)
        try {
            const req = submitLeaveRequest({
                employeeId: emp.id,
                employeeName: emp.name,
                department: emp.department,
                designation: emp.designation,
                leaveType: selectedCat?.name || 'Casual Leave',
                leaveTypeCode,
                startDate,
                endDate,
                totalDays: calculatedWorkingDays,
                isHalfDay,
                reason: reason.trim(),
                approver: designatedApprover,
                approverRole: 'hr'
            })
            onSuccess(req)
        } catch (err) {
            setErrorMsg(err.message || 'Failed to submit leave request.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            {requestType === 'PERMISSION' ? 'Apply for Short Permission' : 'Apply for Leave'}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {requestType === 'PERMISSION'
                                ? 'Permission request up to 2 hours (0 days deducted from leave balance).'
                                : 'Statutory working-day calculation & entitlement verification.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                    {errorMsg && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Request Mode Toggle (Leave vs Permission) */}
                    <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                        <button
                            type="button"
                            onClick={() => {
                                setRequestType('LEAVE')
                                if (leaveTypeCode === 'PERM') setLeaveTypeCode('CL')
                            }}
                            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${requestType === 'LEAVE'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Standard Leave
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setRequestType('PERMISSION')
                                setLeaveTypeCode('PERM')
                            }}
                            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${requestType === 'PERMISSION'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Permission (Max 2 Hours)
                        </button>
                    </div>

                    {isHR && (
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Applying on Behalf of Employee</label>
                            <select
                                value={selectedEmpId}
                                onChange={(e) => setSelectedEmpId(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                            >
                                {ENTERPRISE_EMPLOYEES.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.name} ({e.department} - {e.category})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {requestType === 'PERMISSION' ? (
                        /* PERMISSION FIELDS */
                        <div className="space-y-3 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Permission Date *</label>
                                <input
                                    type="date"
                                    value={permissionDate}
                                    onChange={(e) => setPermissionDate(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Permission Session *</label>
                                    <select
                                        value={permissionSession}
                                        onChange={(e) => setPermissionSession(e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                                    >
                                        <option value="Morning Session (08:30 AM - 10:30 AM)">Morning (Late Entry: 08:30 - 10:30 AM)</option>
                                        <option value="Mid-Day Session (11:30 AM - 01:30 PM)">Mid-Day (Interim Exit: 11:30 - 01:30 PM)</option>
                                        <option value="Evening Session (02:00 PM - 04:00 PM)">Evening (Early Exit: 02:00 - 04:00 PM)</option>
                                        <option value="Custom Time Window">Custom Window (Max 2 Hours)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Permission Duration *</label>
                                    <select
                                        value={permissionHours}
                                        onChange={(e) => setPermissionHours(e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                                    >
                                        <option value="1">1 Hour</option>
                                        <option value="1.5">1.5 Hours</option>
                                        <option value="2">2 Hours (Maximum Allowed)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-200 text-amber-900">
                                <div>
                                    <span className="font-bold text-xs block">Short Permission Allowance</span>
                                    <span className="text-[10px] text-slate-500">2 permissions allowed per month • 0 leave days deducted</span>
                                </div>
                                <span className="text-base font-bold text-amber-700">{permissionHours} Hours</span>
                            </div>
                        </div>
                    ) : (
                        /* STANDARD LEAVE FIELDS */
                        <div className="space-y-3">
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Leave Type</label>
                                <select
                                    value={leaveTypeCode}
                                    onChange={(e) => handleLeaveTypeChange(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
                                >
                                    {balance.categories.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.name} {c.code === 'PERM' ? '(Short Absence - Max 2 Hours)' : `(${c.availableBalance} days available)`}
                                        </option>
                                    ))}
                                </select>
                                <div className="mt-1 text-[11px] text-slate-500">
                                    Available Balance: <strong className="text-blue-600">{selectedCat?.availableBalance || 0} days</strong>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div>
                                    <span className="font-bold text-slate-800 text-xs block">Computed Working Days</span>
                                    <span className="text-[10px] text-slate-500">Sundays & school holidays excluded automatically</span>
                                </div>
                                <span className="text-xl font-bold text-blue-600">
                                    {calculatedWorkingDays} <span className="text-xs font-normal text-slate-500">day{calculatedWorkingDays !== 1 ? 's' : ''}</span>
                                </span>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isHalfDay}
                                    onChange={(e) => setIsHalfDay(e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="font-semibold text-slate-700">Apply as Half Day (0.5 day)</span>
                            </label>
                        </div>
                    )}

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                            {requestType === 'PERMISSION' ? 'Purpose of Permission *' : 'Reason for Leave *'}
                        </label>
                        <textarea
                            rows={3}
                            placeholder={
                                requestType === 'PERMISSION'
                                    ? 'State the specific official or domestic commitment requiring 1-2 hours permission...'
                                    : 'State reason, commitments covered, and handover details...'
                            }
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Centralized HR Approver (Fixed / View-Only) */}
                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Designated Request Approver *</label>
                        <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="flex-1">
                                <span className="font-bold text-xs text-slate-900 block">Human Resources Department</span>
                                <span className="text-[10px] text-slate-500">Centralized sanction authority: Sunita Deshmukh (Head of HR)</span>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold uppercase tracking-wider">
                                Only HR
                            </span>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
                        >
                            {isSubmitting
                                ? 'Submitting...'
                                : requestType === 'PERMISSION'
                                    ? 'Submit Permission Request'
                                    : 'Submit Leave Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// REVIEW / APPROVE LEAVE MODAL (Role-Aware: View-Only vs HR Decision)
// -------------------------------------------------------------
function ReviewLeaveModal({ request, approverName, isHR = false, userRole, onClose, onSuccess }) {
    const [remarks, setRemarks] = useState('')
    const [errorMsg, setErrorMsg] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    const balance = calculateEmployeeLeaveBalance(request.employeeId)
    const isPerm = request.leaveTypeCode === 'PERM' || (request.leaveCategory || '').toLowerCase().includes('permission')

    const handleAction = (decision) => {
        if (!isHR) {
            setErrorMsg('Unauthorized: Only Human Resources (HR) has permission to accept or reject leave applications.')
            return
        }

        setErrorMsg('')
        if (decision === 'Rejected' && (!remarks || !remarks.trim())) {
            setErrorMsg('Rejection rationale is mandatory when rejecting a leave application.')
            return
        }

        setIsProcessing(true)
        try {
            const res = updateLeaveRequestDecision(request.id, decision, approverName, remarks.trim(), userRole || 'hr')
            onSuccess(res.request)
        } catch (err) {
            setErrorMsg(err.message || 'Action failed.')
            setIsProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900">
                                {isHR ? 'Review & Sanction Leave Application' : 'Leave Application Details'}
                            </h2>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isHR ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                }`}>
                                {isHR ? 'HR Decision Authority' : 'View Only'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Ref #{request.id} • Submitted by {request.employeeName}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                    {errorMsg && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {!isHR && (
                        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>
                                <strong>View-Only Mode:</strong> Department heads, PRM, and leadership have read-only visibility. As per institutional policy, final decision to accept or reject is made exclusively by Human Resources (HR).
                            </span>
                        </div>
                    )}

                    {/* Details Card */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-slate-700">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                                <span className="font-semibold">{request.department}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Leave Category</span>
                                <span className="font-semibold text-blue-600">
                                    {request.leaveCategory || request.leaveType}
                                    {isPerm && ' (Short Absence)'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dates</span>
                                <span className="font-semibold">{request.fromDate} {request.toDate && request.toDate !== request.fromDate ? `to ${request.toDate}` : ''}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                                <span className="font-bold text-slate-900">
                                    {isPerm ? `${request.permissionHours || 2} Hours (${request.permissionSession || 'Morning'})` : `${request.totalDays} Day${request.totalDays !== 1 ? 's' : ''}`}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Applied Date</span>
                                <span className="font-semibold">{request.appliedOn || request.appliedDate || '—'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Designated Approver</span>
                                <span className="font-semibold text-emerald-700">Human Resources (HR)</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee Reason / Purpose</span>
                            <p className="text-slate-800 mt-1 bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
                                {request.reason || 'No detailed reason provided.'}
                            </p>
                        </div>

                        {(request.approverRemarks || request.reviewRemarks) && (
                            <div className="pt-2 border-t border-slate-200">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">HR Decision Remarks</span>
                                <p className="text-slate-700 mt-1 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                                    "{request.approverRemarks || request.reviewRemarks}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Employee Current Balance Snapshot */}
                    <div>
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-1">
                            Applicant Leave Balance Snapshot
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {balance.categories.slice(0, 4).map((c) => (
                                <div key={c.code} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                                    <span className="text-[10px] text-slate-500 block truncate">{c.name}</span>
                                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{c.availableBalance}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isHR && (
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">HR Review & Sanction Remarks</label>
                            <textarea
                                rows={3}
                                placeholder="Add sanction notes or mandatory rejection rationale..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                        {isHR ? 'Cancel' : 'Close'}
                    </button>

                    {isHR ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleAction('Rejected')}
                                disabled={isProcessing}
                                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
                            >
                                Reject Leave
                            </button>
                            <button
                                onClick={() => handleAction('Approved')}
                                disabled={isProcessing}
                                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
                            >
                                Approve Leave
                            </button>
                        </div>
                    ) : (
                        <span className="text-[11px] text-slate-500 font-medium">
                            Only HR can approve or reject
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// HR ADJUST BALANCE MODAL
// -------------------------------------------------------------
function AdjustBalanceModal({ performedBy, onClose, onSuccess }) {
    const [selectedEmpId, setSelectedEmpId] = useState(ENTERPRISE_EMPLOYEES[0]?.id || '')
    const [leaveTypeCode, setLeaveTypeCode] = useState('CL')
    const [adjType, setAdjType] = useState('CREDIT') // 'CREDIT' | 'DEBIT'
    const [days, setDays] = useState(1)
    const [remarks, setRemarks] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    const handleSave = () => {
        setErrorMsg('')
        if (!remarks.trim()) {
            setErrorMsg('Mandatory adjustment remarks / audit reason must be provided.')
            return
        }

        try {
            adjustEmployeeLeaveBalance({
                employeeId: selectedEmpId,
                leaveTypeCode,
                adjustmentType: adjType,
                days: Number(days),
                remarks: remarks.trim(),
                performedBy
            })
            onSuccess()
        } catch (err) {
            setErrorMsg(err.message || 'Adjustment failed.')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Adjust Employee Leave Balance</h3>
                        <p className="text-[11px] text-slate-500">HR Administrative ledger credit/debit.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-3.5 text-xs">
                    {errorMsg && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                            {errorMsg}
                        </div>
                    )}

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Target Employee</label>
                        <select
                            value={selectedEmpId}
                            onChange={(e) => setSelectedEmpId(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        >
                            {ENTERPRISE_EMPLOYEES.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.name} ({e.department})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Leave Type</label>
                            <select
                                value={leaveTypeCode}
                                onChange={(e) => setLeaveTypeCode(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold"
                            >
                                <option value="CL">Casual Leave (CL)</option>
                                <option value="SL">Sick Leave (SL)</option>
                                <option value="EL">Earned Leave (EL)</option>
                                <option value="ML">Medical Leave (ML)</option>
                                <option value="CompOff">Comp Off</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Adjustment Type</label>
                            <select
                                value={adjType}
                                onChange={(e) => setAdjType(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold"
                            >
                                <option value="CREDIT">Credit (+) Days</option>
                                <option value="DEBIT">Debit (-) Days</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Number of Days</label>
                        <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">Mandatory Audit Reason / Remarks *</label>
                        <textarea
                            rows={3}
                            placeholder="Reason for adjustment, approval reference, or discrepancy resolution..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                    >
                        Save Ledger Adjustment
                    </button>
                </div>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// CARRY FORWARD EXECUTION MODAL (With Preview & Idempotency)
// -------------------------------------------------------------
function CarryForwardModal({ performedBy, onClose, onSuccess }) {
    const [staffCategory, setStaffCategory] = useState('Academic') // 'Academic' | 'Non-Academic'
    const [sourceYear, setSourceYear] = useState('2025-2026')
    const [targetYear, setTargetYear] = useState('2026-2027')
    const [isExecuting, setIsExecuting] = useState(false)

    const preview = useMemo(() => {
        return previewCarryForward({ staffCategory, sourceYear, targetYear })
    }, [staffCategory, sourceYear, targetYear])

    const handleExecute = () => {
        setIsExecuting(true)
        const res = executeCarryForward({ staffCategory, sourceYear, targetYear, performedBy })
        setIsExecuting(false)
        onSuccess(res.message)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Year-End Leave Carry-Forward Execution</h2>
                        <p className="text-xs text-slate-500">Preview eligible carry-forward & expiry according to statutory policy caps.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400">Staff Category</label>
                            <select
                                value={staffCategory}
                                onChange={(e) => setStaffCategory(e.target.value)}
                                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                            >
                                <option value="Academic">Academic Staff</option>
                                <option value="Non-Academic">Non-Academic Staff</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400">Source Cycle</label>
                            <span className="font-bold text-slate-800 text-xs">{sourceYear}</span>
                        </div>

                        <div className="text-slate-400 font-bold">&rarr;</div>

                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400">Target Credit Cycle</label>
                            <span className="font-bold text-blue-600 text-xs">{targetYear}</span>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                        <table className="w-full text-left divide-y divide-slate-200 text-xs">
                            <thead className="bg-slate-50 font-semibold text-slate-500 uppercase text-[10px] sticky top-0">
                                <tr>
                                    <th className="py-2.5 px-3">Employee</th>
                                    <th className="py-2.5 px-3">Leave Type</th>
                                    <th className="py-2.5 px-3">Balance</th>
                                    <th className="py-2.5 px-3">Cap</th>
                                    <th className="py-2.5 px-3 text-emerald-600 font-bold">Carry-Forward</th>
                                    <th className="py-2.5 px-3 text-rose-600 font-bold">Lapsed / Expired</th>
                                    <th className="py-2.5 px-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {preview.map((p, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                                            {p.employeeName}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono">{p.leaveTypeCode}</td>
                                        <td className="py-2.5 px-3 font-medium text-slate-700">{p.remainingBalance}d</td>
                                        <td className="py-2.5 px-3 text-slate-500">{p.carryForwardAllowed ? `${p.maxLimit}d` : 'None'}</td>
                                        <td className="py-2.5 px-3 font-bold text-emerald-600">+{p.eligibleCarryForward}d</td>
                                        <td className="py-2.5 px-3 font-bold text-rose-600">-{p.expiringDays}d</td>
                                        <td className="py-2.5 px-3">
                                            {p.alreadyProcessed ? (
                                                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                                                    Processed
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                                                    Ready
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
                        Cancel
                    </button>
                    <button
                        onClick={handleExecute}
                        disabled={isExecuting}
                        className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
                    >
                        {isExecuting ? 'Processing...' : 'Confirm & Execute Carry-Forward'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// EDIT POLICY MODAL
// -------------------------------------------------------------
function EditPolicyModal({ category, policyType, performedBy, onClose, onSuccess }) {
    const [annual, setAnnual] = useState(category.annualEntitlement)
    const [accrual, setAccrual] = useState(category.monthlyAccrual)
    const [cfAllowed, setCfAllowed] = useState(Boolean(category.carryForwardAllowed))
    const [maxCf, setMaxCf] = useState(category.maxCarryForward || 0)
    const [notice, setNotice] = useState(category.minNoticeDays || 0)
    const [docRequired, setDocRequired] = useState(Boolean(category.docRequired))

    const handleSave = () => {
        updateHrPolicyCategory(
            policyType,
            {
                code: category.code,
                name: category.name,
                annualEntitlement: Number(annual),
                monthlyAccrual: Number(accrual),
                carryForwardAllowed: cfAllowed,
                maxCarryForward: Number(maxCf),
                minNoticeDays: Number(notice),
                docRequired
            },
            performedBy
        )
        onSuccess()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Edit {category.name} ({category.code})</h3>
                        <p className="text-[11px] text-slate-500">{policyType} Staff Policy</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Annual Entitlement (Days)</label>
                            <input
                                type="number"
                                value={annual}
                                onChange={(e) => setAnnual(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Monthly Accrual (Days)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={accrual}
                                onChange={(e) => setAccrual(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={cfAllowed}
                                onChange={(e) => setCfAllowed(e.target.checked)}
                                className="rounded border-slate-300 text-blue-600"
                            />
                            <span className="font-semibold text-slate-800">Carry-Forward Enabled</span>
                        </label>

                        {cfAllowed && (
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Max Carry-Forward Cap (Days)</label>
                                <input
                                    type="number"
                                    value={maxCf}
                                    onChange={(e) => setMaxCf(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Min Notice (Days)</label>
                            <input
                                type="number"
                                value={notice}
                                onChange={(e) => setNotice(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                            />
                        </div>
                        <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={docRequired}
                                    onChange={(e) => setDocRequired(e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600"
                                />
                                <span className="font-semibold text-slate-800">Doctor Note Req.</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                    >
                        Save Policy Changes
                    </button>
                </div>
            </div>
        </div>
    )
}

// -------------------------------------------------------------
// ATTENDANCE CORRECTION MODAL
// -------------------------------------------------------------
function AttendanceCorrectionModal({ record, currentEmployee, isManagement, performedBy, onClose, onSuccess }) {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(record?.employeeId || (ENTERPRISE_EMPLOYEES[0]?.id || ''))
    const [attendanceDate, setAttendanceDate] = useState(
        record?.date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
    )
    const [inTime, setInTime] = useState(record?.checkInTime || '08:30 AM')
    const [outTime, setOutTime] = useState(record?.checkOutTime || '03:45 PM')
    const [status, setStatus] = useState(record?.status || 'Present')
    const [reason, setReason] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    const handleSave = () => {
        setErrorMsg('')
        if (!reason.trim()) {
            setErrorMsg('Mandatory reason / regularization notes are required.')
            return
        }

        if (isManagement) {
            const targetEmployeeId = record?.employeeId || selectedEmployeeId
            const targetDate = record?.date || attendanceDate
            if (!targetEmployeeId) {
                setErrorMsg('Please select an employee.')
                return
            }
            if (!targetDate) {
                setErrorMsg('Please specify a valid attendance date (DD-MM-YYYY).')
                return
            }
            directAdminAttendanceOverride(
                targetEmployeeId,
                targetDate,
                inTime,
                outTime,
                status,
                reason.trim(),
                performedBy
            )
            onSuccess(record ? 'Attendance record override saved with audit history.' : 'Manual attendance marked successfully.')
        } else {
            submitAttendanceRegularization({
                employeeId: currentEmployee.id,
                employeeName: currentEmployee.name,
                department: currentEmployee.department,
                designation: currentEmployee.designation,
                attendanceDate: record?.date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
                requestType: 'MISSING_PUNCH',
                requestedInTime: inTime,
                requestedOutTime: outTime,
                reason: reason.trim()
            })
            onSuccess('Regularization request submitted to supervisor.')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            {isManagement
                                ? (record ? 'Admin Attendance Override' : 'Mark Manual Employee Attendance')
                                : 'Request Attendance Regularization'}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                            {record
                                ? `${record.employeeName} (${record.date})`
                                : isManagement
                                ? 'Select staff member and enter manual attendance parameters'
                                : currentEmployee.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-3.5 text-xs">
                    {errorMsg && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                            {errorMsg}
                        </div>
                    )}

                    {isManagement && !record && (
                        <>
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Select Employee *</label>
                                <select
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                                >
                                    {ENTERPRISE_EMPLOYEES.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} ({emp.id}) — {emp.designation} [{emp.department}]
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Attendance Date (DD-MM-YYYY) *</label>
                                <input
                                    type="text"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    placeholder="e.g. 10-11-2026"
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800"
                                />
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Check-In Time</label>
                            <input
                                type="text"
                                value={inTime}
                                onChange={(e) => setInTime(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Check-Out Time</label>
                            <input
                                type="text"
                                value={outTime}
                                onChange={(e) => setOutTime(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono"
                            />
                        </div>
                    </div>

                    {isManagement && (
                        <div>
                            <label className="block text-slate-700 font-semibold mb-1">Attendance Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold"
                            >
                                <option value="Present">Present</option>
                                <option value="Late Arrival">Late Arrival</option>
                                <option value="Early Departure">Early Departure</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Half-Day">Half-Day</option>
                                <option value="Absent">Absent</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                            {isManagement ? 'Mandatory Audit Override Reason *' : 'Reason / Notes *'}
                        </label>
                        <textarea
                            rows={3}
                            placeholder="State reason for missing punch, machine error, on-duty slip, etc..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                    >
                        {isManagement ? 'Confirm Attendance Override' : 'Submit Regularization'}
                    </button>
                </div>
            </div>
        </div>
    )
}
