import React, { useState } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ROLE_HOME_PATHS, useAuth } from '../../context/AuthContext'

const ChangePassword = () => {
    const navigate = useNavigate()
    const { isAuthenticated, role, mustChangePassword, completePasswordChange, logout } = useAuth()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (!isAuthenticated) return <Navigate to="/signin" replace />
    if (!mustChangePassword) return <Navigate to={ROLE_HOME_PATHS[role] ?? '/dashboard'} replace />

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters.')
            return
        }
        if (newPassword !== confirmPassword) {
            setError('New password and confirmation do not match.')
            return
        }
        setSubmitting(true)
        try {
            await completePasswordChange(currentPassword, newPassword)
            navigate(ROLE_HOME_PATHS[role] ?? '/dashboard', { replace: true })
        } catch (err) {
            setError(err?.message || 'Unable to change password.')
        } finally {
            setSubmitting(false)
        }
    }

    const fieldClass =
        'w-full rounded-lg border-0 bg-[#F4F7FB] py-3.5 pl-11 pr-4 text-sm text-[#24324A] outline-none transition placeholder:text-[#A0AEC0] focus:ring-2 focus:ring-[#1B2B4B]/15'

    return (
        <div className="relative flex min-h-dvh w-full items-center justify-center bg-[#E8EEF4] px-4 py-8 font-poppins">
            <form onSubmit={handleSubmit} className="w-full max-w-[420px] rounded-3xl bg-white px-5 py-7 shadow-[0_12px_40px_rgba(27,43,75,0.08)] sm:px-7">
                <h1 className="text-2xl font-semibold text-[#1B2B4B]">Change temporary password</h1>
                <p className="mt-2 text-sm text-[#5C6B82]">Your account must set a new password before continuing.</p>
                {error ? <p className="mt-4 rounded-lg bg-[#FEECEC] px-3 py-2 text-sm text-[#B42318]">{error}</p> : null}
                <label className="mt-5 block text-sm text-[#5C6B82]">
                    Current password
                    <div className="relative mt-1">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A0AEC0]" />
                        <input className={fieldClass} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                    </div>
                </label>
                <label className="mt-4 block text-sm text-[#5C6B82]">
                    New password
                    <div className="relative mt-1">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A0AEC0]" />
                        <input className={fieldClass} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                    </div>
                </label>
                <label className="mt-4 block text-sm text-[#5C6B82]">
                    Confirm new password
                    <div className="relative mt-1">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A0AEC0]" />
                        <input className={fieldClass} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                    </div>
                </label>
                <button type="submit" disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B2B4B] px-4 py-3.5 text-sm font-medium text-white disabled:opacity-70">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save new password
                </button>
                <button type="button" onClick={() => logout()} className="mt-3 w-full text-sm text-[#5C6B82]">
                    Sign out
                </button>
            </form>
        </div>
    )
}

export default ChangePassword
