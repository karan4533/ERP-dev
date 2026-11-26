import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    User,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    KeyRound,
    Wrench,
    HelpCircle,
    X,
    Search,
    LogIn,
    GraduationCap,
    Users,
    CalendarDays,
    ClipboardCheck,
    Layers,
    Sparkles,
    Check,
    Copy,
} from 'lucide-react'
import campusAerial from '../../assets/images/campus-aerial.jpg'
import { ROLE_HOME_PATHS, useAuth } from '../../context/AuthContext'
import { getSafeReturnPath } from './authUi'
import {
    ENTERPRISE_USER_DIRECTORY,
    AUTHENTICATION_CATEGORIES,
} from './enterpriseUserDirectory'

const SignIn = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { login } = useAuth()

    // Form states
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successResolution, setSuccessResolution] = useState(null)
    const [quickFillNotice, setQuickFillNotice] = useState('')

    // Forgot password modal
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
    const [forgotInput, setForgotInput] = useState('')
    const [forgotStatus, setForgotStatus] = useState('')

    // Demo directory modal
    const [isDemoDirectoryOpen, setIsDemoDirectoryOpen] = useState(false)
    const [selectedCategoryTab, setSelectedCategoryTab] = useState('All')
    const [demoSearchQuery, setDemoSearchQuery] = useState('')

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()
        setErrorMessage('')
        setSuccessResolution(null)
        setQuickFillNotice('')

        if (!identifier.trim()) {
            setErrorMessage('Please enter your organizational Email Address or Employee ID.')
            return
        }

        if (!password) {
            setErrorMessage('Please enter your password.')
            return
        }

        setIsLoading(true)

        setTimeout(() => {
            const result = login(identifier, password, rememberMe)

            if (!result.success) {
                setIsLoading(false)
                setErrorMessage(result.message)
                return
            }

            setSuccessResolution({
                name: result.user.name,
                roleLabel: result.user.roleLabel,
                department: result.user.department,
            })

            setTimeout(() => {
                const from = location.state?.from
                const requestedPath = from?.pathname ? `${from.pathname}${from.search || ''}` : ''
                const defaultHomePath = ROLE_HOME_PATHS[result.role] ?? '/dashboard'

                const targetPath = getSafeReturnPath({
                    requestedPath,
                    role: result.role,
                    homePath: defaultHomePath,
                })

                navigate(targetPath, { replace: true })
            }, 400)
        }, 400)
    }

    const handleQuickFill = (user) => {
        setIdentifier(user.email)
        setPassword('School@123')
        setErrorMessage('')
        setQuickFillNotice(`Selected ${user.roleLabel} (${user.email}). Ready to sign in.`)
        setIsDemoDirectoryOpen(false)
    }

    const handleDirectSignIn = (user) => {
        setIdentifier(user.email)
        setPassword('School@123')
        setErrorMessage('')
        setQuickFillNotice('')
        setIsLoading(true)
        setIsDemoDirectoryOpen(false)

        setTimeout(() => {
            const result = login(user.email, 'School@123', true)
            if (!result.success) {
                setIsLoading(false)
                setErrorMessage(result.message)
                return
            }

            setSuccessResolution({
                name: result.user.name,
                roleLabel: result.user.roleLabel,
                department: result.user.department,
            })

            setTimeout(() => {
                const defaultHomePath = ROLE_HOME_PATHS[result.role] ?? '/dashboard'
                navigate(defaultHomePath, { replace: true })
            }, 400)
        }, 350)
    }

    const handleSsoLogin = (provider) => {
        setIsLoading(true)
        setErrorMessage('')
        setQuickFillNotice('')
        setTimeout(() => {
            const targetUser = ENTERPRISE_USER_DIRECTORY.find((u) => u.email === 'director@school.com')
            const result = login(targetUser.email, 'School@123', true)
            if (result.success) {
                setSuccessResolution({
                    name: targetUser.name,
                    roleLabel: targetUser.roleLabel,
                    department: targetUser.department,
                })
                setTimeout(() => {
                    navigate(ROLE_HOME_PATHS[targetUser.role], { replace: true })
                }, 400)
            } else {
                setIsLoading(false)
            }
        }, 500)
    }

    const handleForgotPasswordSubmit = (e) => {
        e.preventDefault()
        if (!forgotInput.trim()) {
            setForgotStatus('Please provide your registered email address or employee ID.')
            return
        }
        setForgotStatus('Password reset instructions have been dispatched to your official inbox. For immediate assistance, contact IT Helpdesk.')
    }

    const activeCategory = AUTHENTICATION_CATEGORIES.find((cat) => cat.name === selectedCategoryTab)

    const filteredUsers = ENTERPRISE_USER_DIRECTORY.filter((user) => {
        const query = demoSearchQuery.trim().toLowerCase()
        const matchesQuery =
            !query ||
            user.roleLabel.toLowerCase().includes(query) ||
            user.name.toLowerCase().includes(query) ||
            user.department.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.employeeId.toLowerCase().includes(query) ||
            user.role.toLowerCase().includes(query)

        if (query) return matchesQuery

        if (selectedCategoryTab === 'All') return true
        return activeCategory?.roles?.includes(user.role) ?? true
    })

    return (
        <div className="min-h-screen w-full bg-[#F0F5FD] bg-gradient-to-br from-[#EBF3FE] via-[#F4F8FE] to-[#E5EFFD] text-slate-800 font-sans flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-x-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-[1440px] w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
                {/* Left Column: Floating Login Card */}
                <div className="lg:col-span-5 xl:col-span-5 flex justify-center">
                    <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 p-8 sm:p-10 max-w-[460px] w-full">
                        {/* Title & Subtitle */}
                        <div className="mb-6">
                            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
                                Enterprise Sign In
                            </h1>
                            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                                Welcome back. Enter your credentials to access your authorized school workspace and applications.
                            </p>
                        </div>

                        {/* Status / Feedback Alerts */}
                        {errorMessage && (
                            <div
                                role="alert"
                                className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm animate-in fade-in duration-200"
                            >
                                <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
                                <div className="flex-1 font-medium leading-relaxed">
                                    {errorMessage}
                                </div>
                            </div>
                        )}

                        {successResolution && (
                            <div
                                role="status"
                                className="mb-5 flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm animate-in fade-in duration-200"
                            >
                                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                                <div>
                                    <span className="font-semibold">{successResolution.name}</span> authenticated.
                                    <span className="block text-emerald-700 text-xs">
                                        {successResolution.roleLabel} • {successResolution.department}
                                    </span>
                                </div>
                            </div>
                        )}

                        {quickFillNotice && (
                            <div
                                role="status"
                                className="mb-5 flex items-center justify-between gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium animate-in fade-in duration-200"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Check size={16} className="text-blue-600 shrink-0" />
                                    <span className="truncate">{quickFillNotice}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setQuickFillNotice('')}
                                    className="text-blue-400 hover:text-blue-600 cursor-pointer shrink-0"
                                    aria-label="Dismiss notice"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* Sign In Form */}
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            {/* Identifier Field */}
                            <div>
                                <label
                                    htmlFor="login-identifier"
                                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                                >
                                    EMAIL / USERNAME / EMPLOYEE ID <span className="text-red-500">*</span>
                                </label>
                                <div className="relative rounded-xl border border-slate-200 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        id="login-identifier"
                                        type="text"
                                        autoComplete="username"
                                        autoFocus
                                        disabled={isLoading}
                                        value={identifier}
                                        onChange={(e) => {
                                            setIdentifier(e.target.value)
                                            if (errorMessage) setErrorMessage('')
                                        }}
                                        placeholder="e.g. name@school.com or EMP-001"
                                        className="block w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl bg-transparent placeholder:text-slate-400 text-slate-900 outline-none disabled:bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label
                                        htmlFor="login-password"
                                        className="block text-[11px] font-bold uppercase tracking-wider text-slate-700"
                                    >
                                        PASSWORD <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForgotStatus('')
                                            setIsForgotModalOpen(true)
                                        }}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative rounded-xl border border-slate-200 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        disabled={isLoading}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value)
                                            if (errorMessage) setErrorMessage('')
                                        }}
                                        placeholder="Enter your password"
                                        className="block w-full pl-10 pr-11 py-3 text-xs sm:text-sm rounded-xl bg-transparent placeholder:text-slate-400 text-slate-900 outline-none disabled:bg-slate-50"
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Device Checkbox */}
                            <div className="flex items-center pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-medium text-slate-700 select-none">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="size-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span>Remember this device for 30 days</span>
                                </label>
                            </div>

                            {/* Sign In Solid Navy Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full relative flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#0A192F] hover:bg-[#152744] active:bg-[#071120] text-white font-bold text-xs sm:text-sm shadow-md transition-all duration-200 hover:shadow-lg cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            <span>Signing In...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign In to Workspace</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Divider */}
                        <div className="mt-6 mb-5">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                                        OR AUTHENTICATE WITH
                                    </span>
                                </div>
                            </div>

                            {/* Google & Microsoft SSO */}
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleSsoLogin('google')}
                                    className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                    <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                                        />
                                    </svg>
                                    <span>Google SSO</span>
                                </button>

                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleSsoLogin('microsoft')}
                                    className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                    <svg className="size-4 shrink-0" viewBox="0 0 23 23">
                                        <path fill="#f35325" d="M1 1h10v10H1z" />
                                        <path fill="#81bc06" d="M12 1h10v10H12z" />
                                        <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                        <path fill="#ffba08" d="M12 12h10v10H12z" />
                                    </svg>
                                    <span>Microsoft 365</span>
                                </button>
                            </div>
                        </div>

                        {/* Demo Credentials Directory Callout (Matching Reference Mockup) */}
                        <div className="mt-6 p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <Wrench size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                        Demo Credentials Directory (All 25 Roles)
                                    </p>
                                    <p className="text-[10px] text-slate-600 line-clamp-1">
                                        Browse all role-based demo credentials with valid logins and sample data.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDemoDirectoryOpen(true)}
                                className="px-3 py-1.5 rounded-lg bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 text-xs font-bold shadow-xs whitespace-nowrap cursor-pointer transition-colors shrink-0"
                            >
                                Explore All 25 Roles →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Platform Header, 5 Badges & High-Res Campus Aerial View */}
                <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-3xl sm:text-4xl lg:text-[40px] xl:text-[44px] font-black tracking-tight text-[#0D1E42] leading-tight mb-3">
                            A Unified Platform for School Operations
                        </h2>
                        <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                            Manage academics, people, resources and administration — all in one secure, role-based ecosystem.
                        </p>
                    </div>

                    {/* 5 Pill Badges */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-xs text-xs sm:text-sm font-semibold text-slate-800">
                            <GraduationCap size={16} className="text-blue-600" />
                            Academics
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-xs text-xs sm:text-sm font-semibold text-slate-800">
                            <Users size={16} className="text-blue-600" />
                            Students
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-xs text-xs sm:text-sm font-semibold text-slate-800">
                            <CalendarDays size={16} className="text-blue-600" />
                            Timetable
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-xs text-xs sm:text-sm font-semibold text-slate-800">
                            <ClipboardCheck size={16} className="text-blue-600" />
                            Attendance
                        </span>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/90 shadow-xs text-xs sm:text-sm font-semibold text-slate-800">
                            <Layers size={16} className="text-blue-600" />
                            Examinations
                        </span>
                    </div>

                    {/* Campus Aerial Image Showcase */}
                    <div className="rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border border-slate-200/70 bg-white">
                        <img
                            src={campusAerial}
                            alt="Queen Mira International School Campus"
                            className="w-full h-auto max-h-[500px] xl:max-h-[560px] 2xl:max-h-[620px] object-cover block"
                        />
                    </div>
                </div>
            </div>

            {/* Demo Credentials Directory Interactive Modal */}
            {isDemoDirectoryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Institutional Role Directory (All 25 Roles)
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Select any verified profile for 1-click login or credential auto-fill.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDemoDirectoryOpen(false)}
                                className="size-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                                aria-label="Close directory"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search & Category Filter Header */}
                        <div className="p-5 border-b border-slate-100 space-y-3 bg-white">
                            {/* Search bar */}
                            <div className="relative">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={demoSearchQuery}
                                    onChange={(e) => setDemoSearchQuery(e.target.value)}
                                    placeholder="Search by role, name, department, or employee ID..."
                                    className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 placeholder:text-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                                {demoSearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setDemoSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                        aria-label="Clear search"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategoryTab('All')
                                        setDemoSearchQuery('')
                                    }}
                                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                                        selectedCategoryTab === 'All'
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    All Roles (25)
                                </button>
                                {AUTHENTICATION_CATEGORIES.map((cat) => {
                                    const isSelected = selectedCategoryTab === cat.name
                                    return (
                                        <button
                                            key={cat.name}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCategoryTab(cat.name)
                                                setDemoSearchQuery('')
                                            }}
                                            className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {cat.name} ({cat.roles.length})
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Scrollable Role Cards Grid */}
                        <div className="p-6 overflow-y-auto max-h-[55vh] bg-[#F8FAFC]">
                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-xs">
                                    No roles found matching "{demoSearchQuery}".
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                    {filteredUsers.map((user) => (
                                        <div
                                            key={user.employeeId}
                                            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <span className="text-xs font-bold text-slate-900 line-clamp-1">
                                                        {user.roleLabel}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 shrink-0">
                                                        {user.employeeId}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-700">
                                                    {user.name}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate">
                                                    {user.department}
                                                </p>
                                                <div className="mt-2 text-[11px] font-mono text-slate-500 truncate bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                    {user.email}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickFill(user)}
                                                    className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer text-center"
                                                >
                                                    Auto Fill
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDirectSignIn(user)}
                                                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                                >
                                                    <LogIn size={13} />
                                                    <span>1-Click</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
                            <span>Default Demo Password: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-semibold text-slate-700">School@123</code></span>
                            <button
                                type="button"
                                onClick={() => setIsDemoDirectoryOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Forgot Password Modal */}
            {isForgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
                                <KeyRound size={18} className="text-blue-600" />
                                <span>Password Reset Assistance</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsForgotModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleForgotPasswordSubmit} className="mt-4 space-y-4">
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Enter your organizational Email Address or Employee ID. A secure credential reset link will be dispatched to your authorized inbox.
                            </p>

                            {forgotStatus && (
                                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-xs font-medium leading-relaxed">
                                    {forgotStatus}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Email Address or Employee ID
                                </label>
                                <input
                                    type="text"
                                    value={forgotInput}
                                    onChange={(e) => setForgotInput(e.target.value)}
                                    placeholder="e.g. name@school.com or EMP-1042"
                                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                />
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
                                <HelpCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                <span>
                                    Lost access to your official email? Contact the Central IT Helpdesk at{' '}
                                    <strong className="text-slate-700">itsupport@school.com</strong> or visit the IT office in Block A.
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsForgotModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
                                >
                                    Send Reset Instructions
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SignIn
