import React, { useState } from 'react'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import booksIllustration from '../../assets/images/login-books-illustration.png'
import { PORTAL_LOGO_ALT, PORTAL_LOGO_ICON } from '../../constants/portalLogo'
import { useLocation, useNavigate } from 'react-router-dom'
import { DEMO_PASSWORD, FAKE_CREDENTIALS, ROLE_HOME_PATHS, useAuth } from '../../context/AuthContext'
import { getProfileLabel } from './profileOptions'

const API_ACCOUNTS = [
    { role: 'admin', label: 'API Admin', email: 'admin@qmis.edu', password: 'admin123' },
    { role: 'hr', label: 'API HR', email: 'hr@qmis.edu', password: 'hr12345' },
]

const DEMO_ACCOUNTS = Object.entries(FAKE_CREDENTIALS).map(([role, creds]) => ({
    role,
    label: getProfileLabel(role),
    email: creds.email,
    password: DEMO_PASSWORD,
}))

const SignIn = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { loginWithCredentials } = useAuth()

    const [email, setEmail] = useState(
        () => location.state?.email || localStorage.getItem('schoolerp_remember_email') || ''
    )
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [remember] = useState(() => Boolean(localStorage.getItem('schoolerp_remember_email')))
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [showDemoAccounts, setShowDemoAccounts] = useState(false)
    const [showResetNote, setShowResetNote] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            const result = await loginWithCredentials(email, password)
            if (!result.success) {
                setError(result.message)
                return
            }

            if (remember) {
                localStorage.setItem('schoolerp_remember_email', email.trim())
            } else {
                localStorage.removeItem('schoolerp_remember_email')
            }

            navigate(ROLE_HOME_PATHS[result.role] ?? '/dashboard', { replace: true })
        } catch (err) {
            setError(err?.message || 'Unable to sign in.')
        } finally {
            setSubmitting(false)
        }
    }

    const fieldClass =
        'w-full rounded-lg border-0 bg-[#F4F7FB] py-3.5 pl-11 pr-4 text-sm text-[#24324A] outline-none transition placeholder:text-[#A0AEC0] focus:ring-2 focus:ring-[#1B2B4B]/15'

    return (
        <div className="relative min-h-dvh w-full overflow-hidden bg-[#E8EEF4] font-poppins lg:bg-white">
            <aside className="pointer-events-none absolute inset-y-0 right-0 hidden w-[62%] lg:block" aria-hidden="true">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M42,0 C18,8 8,28 14,52 C20,76 6,90 0,100 L100,100 L100,0 Z" fill="#E4EBF3" />
                </svg>
                <img
                    src={booksIllustration}
                    alt=""
                    className="absolute left-[6%] top-1/2 w-[92%] max-w-[680px] -translate-y-1/2 object-contain"
                />
            </aside>

            <main className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-8 sm:px-8 lg:w-[46%] lg:justify-start lg:px-16 lg:py-10 xl:px-24">
                <form onSubmit={handleSubmit} className="flex w-full max-w-[420px] flex-col rounded-3xl bg-white px-5 py-7 shadow-[0_12px_40px_rgba(27,43,75,0.08)] sm:px-7 lg:max-w-[380px] lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none" noValidate>
                    <div className="mb-8 flex items-center justify-center gap-3 lg:mb-10 lg:justify-start">
                        <img src={PORTAL_LOGO_ICON} alt="" className="h-20 w-auto object-contain" />
                        <div className="leading-tight">
                            <p className="text-xl font-semibold tracking-wide text-[#1B2B4B]">Queen Mira</p>
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#5C6B82]">
                                International School
                            </p>
                        </div>
                        <span className="sr-only">{PORTAL_LOGO_ALT}</span>
                    </div>

                    <h1 className="text-center text-2xl font-semibold tracking-tight text-[#1B2B4B] lg:text-left lg:text-[22px]">Login to your account</h1>
                    <p className="mt-1.5 text-center text-sm text-[#5C6B82] lg:hidden">Sign in with your school email</p>

                    {error && (
                        <p id="signin-error" role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <label htmlFor="signin-email" className="sr-only">Email</label>
                    <div className="relative mt-7">
                        <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                        <input
                            type="email"
                            id="signin-email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="username"
                            placeholder="Username or Email"
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? 'signin-error' : undefined}
                            className={fieldClass}
                            required
                        />
                    </div>

                    <label htmlFor="signin-password" className="sr-only">Password</label>
                    <div className="relative mt-4">
                        <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="signin-password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            placeholder="Password"
                            aria-invalid={Boolean(error)}
                            className={`${fieldClass} pr-11`}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((open) => !open)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#98A2B3] hover:text-[#515DEF]"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowResetNote((open) => !open)}
                        className="mt-4 w-full cursor-pointer text-center text-sm text-[#1B2B4B] hover:underline lg:w-fit lg:text-left"
                    >
                        Forgot password?
                    </button>

                    {showResetNote && (
                        <p className="mt-3 text-xs leading-relaxed text-[#5C6B82]">
                            Password reset opens when the server is connected. Demo accounts use{' '}
                            <span className="font-semibold text-[#1B2B4B]">{DEMO_PASSWORD}</span>.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1B2B4B] px-8 py-3.5 text-sm font-medium text-white transition hover:bg-[#152238] disabled:cursor-wait disabled:opacity-70 lg:w-fit lg:rounded-lg lg:py-2.5"
                    >
                        {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                        {submitting ? 'Signing in…' : 'Login'}
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowDemoAccounts((open) => !open)}
                        className="mt-5 w-full cursor-pointer text-center text-sm text-[#515DEF] hover:underline lg:w-fit lg:text-left"
                        aria-expanded={showDemoAccounts}
                    >
                        {showDemoAccounts ? 'Hide demo accounts' : 'Use a demo account'}
                    </button>

                    {showDemoAccounts && (
                        <div className="mt-3 rounded-xl bg-[#F3F6FB] p-3">
                            <p className="mb-2 px-1 text-xs font-medium text-[#1B2B4B]">Backend API accounts (password admin123)</p>
                            <ul className="mb-3 flex flex-col gap-0.5">
                                {API_ACCOUNTS.map((account) => (
                                    <li key={`api-${account.role}`}>
                                        <button
                                            type="button"
                                            className="w-full cursor-pointer rounded-lg px-2 py-1.5 text-left hover:bg-white"
                                            onClick={() => {
                                                setEmail(account.email)
                                                setPassword(account.password)
                                                setError('')
                                            }}
                                        >
                                            <span className="text-sm font-medium text-[#1B2B4B]">{account.label}</span>
                                            <span className="block break-all text-xs text-[#5C6B82]">{account.email}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <p className="mb-2 px-1 text-xs text-[#5C6B82]">
                                Local demo fallback password <span className="font-semibold text-[#1B2B4B]">{DEMO_PASSWORD}</span>
                            </p>
                            <ul className="flex max-h-40 flex-col gap-0.5 overflow-y-auto">
                                {DEMO_ACCOUNTS.map((account) => (
                                    <li key={account.role}>
                                        <button
                                            type="button"
                                            className="w-full cursor-pointer rounded-lg px-2 py-1.5 text-left hover:bg-white"
                                            onClick={() => {
                                                setEmail(account.email)
                                                setPassword(account.password)
                                                setError('')
                                            }}
                                        >
                                            <span className="text-sm font-medium text-[#1B2B4B]">{account.label}</span>
                                            <span className="block break-all text-xs text-[#5C6B82]">{account.email}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </form>
            </main>
        </div>
    )
}

export default SignIn
