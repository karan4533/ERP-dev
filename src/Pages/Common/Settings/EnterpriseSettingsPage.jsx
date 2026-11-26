import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Sliders,
    Bell,
    Lock,
    Shield,
    Palette,
    Globe,
    Building2,
    Users,
    Cpu,
    Save,
    Check,
    ToggleLeft,
    ToggleRight,
    User,
    ArrowUpRight,
    Mail,
    Phone
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { getProfileLabel } from '../../Authentication/profileOptions'
import { ENTERPRISE_EMPLOYEES } from '../../../Common/AttendanceAndLeave/attendanceLeaveData'

const SETTINGS_SECTIONS = [
    { id: 'account', label: 'Account Settings', icon: Sliders },
    { id: 'preferences', label: 'Personal Preferences', icon: Palette },
    { id: 'notifications', label: 'Notification Alerts', icon: Bell },
    { id: 'password', label: 'Password Management', icon: Lock },
    { id: 'security', label: 'Security & 2FA', icon: Shield },
    { id: 'theme', label: 'Theme & Appearance', icon: Palette },
    { id: 'language', label: 'Language & Locale', icon: Globe },
    { id: 'organization', label: 'Organization Parameters', icon: Building2, adminOnly: true },
    { id: 'rbac', label: 'Role & Permissions (RBAC)', icon: Users, adminOnly: true },
    { id: 'system', label: 'System Configuration', icon: Cpu, adminOnly: true },
]

const EnterpriseSettingsPage = () => {
    const navigate = useNavigate()
    const { role, name: authName, email } = useAuth()
    const roleLabel = getProfileLabel(role)
    const isAdmin = role === 'superadmin' || role === 'admin'
    const displayName = authName || (roleLabel ?? 'Staff User')

    const employee = useMemo(() => {
        const normalized = (email || '').toLowerCase().trim()
        return (
            ENTERPRISE_EMPLOYEES.find((e) => e.email?.toLowerCase() === normalized) ||
            ENTERPRISE_EMPLOYEES.find((e) => e.roleKey === role) ||
            null
        )
    }, [email, role])

    const employeeId = employee?.id || (role === 'student' ? 'STU-2026-104' : role === 'parent' ? 'PAR-2026-088' : 'EMP-2026-042')
    const departmentName = employee?.department || (role === 'student' ? 'Grade 10 - Section A' : role === 'parent' ? 'Parent Community' : 'Academics & Teaching')
    const designation = employee?.designation || roleLabel || 'Senior Staff'

    const [activeSection, setActiveSection] = useState('account')
    const [savedSuccess, setSavedSuccess] = useState(false)

    // Form settings state
    const [settings, setSettings] = useState({
        displayName: 'Dr. Kavita Sharma',
        defaultLanding: 'Dashboard Overview',
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR (₹)',
        emailAlerts: true,
        smsAlerts: false,
        whatsappReceipts: true,
        theme: 'light',
        language: 'en-IN',
        academicYear: '2026–2027',
        dsrCutoffHour: '18:00',
        biometricInterval: '15 Minutes',
    })

    const handleSave = (e) => {
        e?.preventDefault?.()
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 3000)
    }

    const toggleBool = (key) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div className='space-y-6 pb-8 font-inter'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                        Settings & Preferences
                    </h1>
                    <p className='mt-1 text-xs text-slate-500'>
                        Configure your personal workspace, alert preferences, regional parameters, and enterprise system configurations.
                    </p>
                </div>
                <button
                    type='button'
                    onClick={handleSave}
                    className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors self-start sm:self-center cursor-pointer'
                >
                    <Save size={14} />
                    Save Settings
                </button>
            </div>

            {savedSuccess && (
                <div className='flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200'>
                    <Check size={16} />
                    Settings saved successfully and persisted across your active session.
                </div>
            )}

            {/* Main 2-Column Settings Layout */}
            <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
                {/* Navigation Menu */}
                <div className='lg:col-span-1 rounded-[1.25rem] border border-slate-200/80 bg-white p-3 shadow-xs h-fit space-y-1'>
                    {SETTINGS_SECTIONS.filter((s) => !s.adminOnly || isAdmin).map((sec) => {
                        const Icon = sec.icon
                        const isActive = activeSection === sec.id
                        return (
                            <button
                                key={sec.id}
                                type='button'
                                onClick={() => setActiveSection(sec.id)}
                                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700 font-bold'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <Icon size={15} />
                                <span className='truncate'>{sec.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Settings Editor Pane */}
                <div className='lg:col-span-3 rounded-[1.25rem] border border-slate-200/80 bg-white p-6 shadow-xs'>
                    {/* 1. Account Settings */}
                    {activeSection === 'account' && (
                        <div className='space-y-6 text-xs max-w-2xl'>
                            <div>
                                <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                                    Essential Profile & Account Details
                                </h2>
                                <p className='text-xs text-slate-500 mt-1'>
                                    Review your verified identity, institutional designation, and contact credentials.
                                </p>
                            </div>

                            {/* Essential Profile Card */}
                            <div className='rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-4'>
                                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                                    <div className='flex items-center gap-3.5'>
                                        <div className='relative'>
                                            <img
                                                src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'
                                                alt={displayName}
                                                className='size-14 rounded-full object-cover ring-2 ring-blue-100'
                                            />
                                            <span className='absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white' />
                                        </div>
                                        <div>
                                            <div className='flex items-center gap-2'>
                                                <h3 className='text-sm font-bold text-slate-900'>{displayName}</h3>
                                                <span className='rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60'>
                                                    Active
                                                </span>
                                            </div>
                                            <p className='text-xs text-slate-600 mt-0.5 font-medium'>{designation}</p>
                                            <p className='text-[11px] text-slate-500'>{departmentName}</p>
                                        </div>
                                    </div>

                                    <button
                                        type='button'
                                        onClick={() => navigate('/my-profile')}
                                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-200 text-xs shadow-2xs transition-colors self-start sm:self-center cursor-pointer'
                                    >
                                        <User size={13} /> View Complete Profile Vault <ArrowUpRight size={13} />
                                    </button>
                                </div>

                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/60'>
                                    <div className='flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/60'>
                                        <span className='text-[10px] font-bold text-slate-400 uppercase w-20'>Employee ID:</span>
                                        <span className='font-mono font-bold text-slate-800'>{employeeId}</span>
                                    </div>
                                    <div className='flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/60'>
                                        <span className='text-[10px] font-bold text-slate-400 uppercase w-20'>Email:</span>
                                        <span className='font-medium text-slate-800 truncate'>{email || 'user@school.com'}</span>
                                    </div>
                                    <div className='flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/60'>
                                        <span className='text-[10px] font-bold text-slate-400 uppercase w-20'>Phone:</span>
                                        <span className='font-medium text-slate-800'>+91 98401 23456</span>
                                    </div>
                                    <div className='flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/60'>
                                        <span className='text-[10px] font-bold text-slate-400 uppercase w-20'>Role:</span>
                                        <span className='font-bold text-blue-700'>{roleLabel}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Workspace Preferences Form */}
                            <div className='space-y-4 pt-2'>
                                <h3 className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                    Workspace & Personal Preferences
                                </h3>
                                <div>
                                    <label className='block font-medium text-slate-700 mb-1'>Display Name</label>
                                    <input
                                        type='text'
                                        value={settings.displayName}
                                        onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                    />
                                </div>
                                <div>
                                    <label className='block font-medium text-slate-700 mb-1'>Default Landing Page</label>
                                    <select
                                        value={settings.defaultLanding}
                                        onChange={(e) => setSettings({ ...settings, defaultLanding: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                    >
                                        <option>Dashboard Overview</option>
                                        <option>Priority Work Queues</option>
                                        <option>Academic Calendar</option>
                                        <option>Communication Inbox</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Personal Preferences */}
                    {activeSection === 'preferences' && (
                        <div className='space-y-5 text-xs max-w-xl'>
                            <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                                Regional & Display Preferences
                            </h2>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Date Format</label>
                                <select
                                    value={settings.dateFormat}
                                    onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                >
                                    <option>DD/MM/YYYY (Indian Standard)</option>
                                    <option>MM/DD/YYYY (US Standard)</option>
                                    <option>YYYY-MM-DD (ISO)</option>
                                </select>
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Display Currency</label>
                                <select
                                    value={settings.currency}
                                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                >
                                    <option>INR (₹) - Indian Rupee</option>
                                    <option>USD ($) - US Dollar</option>
                                    <option>EUR (€) - Euro</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* 3. Notification Settings */}
                    {activeSection === 'notifications' && (
                        <div className='space-y-4 text-xs max-w-xl'>
                            <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                                Dispatch Channels & Automated Triggers
                            </h2>
                            <div className='flex items-center justify-between p-3 rounded-xl bg-slate-50'>
                                <div>
                                    <p className='font-semibold text-slate-800'>Email Notifications</p>
                                    <p className='text-slate-400 mt-0.5'>Receive daily briefings, circulars, and queue updates.</p>
                                </div>
                                <input
                                    type='checkbox'
                                    checked={settings.emailAlerts}
                                    onChange={() => toggleBool('emailAlerts')}
                                    className='size-4 accent-blue-600 rounded cursor-pointer'
                                />
                            </div>
                            <div className='flex items-center justify-between p-3 rounded-xl bg-slate-50'>
                                <div>
                                    <p className='font-semibold text-slate-800'>SMS Emergency Broadcasts</p>
                                    <p className='text-slate-400 mt-0.5'>Urgent weather closures and bus route delays.</p>
                                </div>
                                <input
                                    type='checkbox'
                                    checked={settings.smsAlerts}
                                    onChange={() => toggleBool('smsAlerts')}
                                    className='size-4 accent-blue-600 rounded cursor-pointer'
                                />
                            </div>
                            <div className='flex items-center justify-between p-3 rounded-xl bg-slate-50'>
                                <div>
                                    <p className='font-semibold text-slate-800'>WhatsApp Fee Receipt Dispatch</p>
                                    <p className='text-slate-400 mt-0.5'>Automatically send digital PDF fee receipts to parents via WhatsApp.</p>
                                </div>
                                <input
                                    type='checkbox'
                                    checked={settings.whatsappReceipts}
                                    onChange={() => toggleBool('whatsappReceipts')}
                                    className='size-4 accent-blue-600 rounded cursor-pointer'
                                />
                            </div>
                        </div>
                    )}

                    {/* 4. Password Management */}
                    {activeSection === 'password' && (
                        <div className='space-y-4 text-xs max-w-xl'>
                            <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                                Password Policy & Updates
                            </h2>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Current Password</label>
                                <input
                                    type='password'
                                    placeholder='••••••••••••'
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>New Password</label>
                                <input
                                    type='password'
                                    placeholder='Minimum 8 characters with numbers & symbols'
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                        </div>
                    )}

                    {/* 5. Theme & Appearance */}
                    {activeSection === 'theme' && (
                        <div className='space-y-4 text-xs max-w-xl'>
                            <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                                Visual Theme Mode
                            </h2>
                            <div className='grid grid-cols-2 gap-4'>
                                <button
                                    type='button'
                                    onClick={() => setSettings({ ...settings, theme: 'light' })}
                                    className={`rounded-2xl border p-4 text-left cursor-pointer transition-all ${
                                        settings.theme === 'light'
                                            ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className='h-16 w-full rounded-lg bg-slate-50 border border-slate-200 mb-2' />
                                    <p className='font-bold text-slate-900'>Clean Enterprise Light</p>
                                    <p className='text-slate-400 text-[11px] mt-0.5'>Pure white cards with soft blue highlights (Recommended).</p>
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setSettings({ ...settings, theme: 'system' })}
                                    className={`rounded-2xl border p-4 text-left cursor-pointer transition-all ${
                                        settings.theme === 'system'
                                            ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className='h-16 w-full rounded-lg bg-slate-900 mb-2' />
                                    <p className='font-bold text-slate-900'>High-Contrast System Mode</p>
                                    <p className='text-slate-400 text-[11px] mt-0.5'>Adapts to OS color scheme.</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 6. Language & Locale */}
                    {activeSection === 'language' && (
                        <div className='space-y-4 text-xs max-w-xl'>
                            <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                                Workspace Language
                            </h2>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Primary Language</label>
                                <select
                                    value={settings.language}
                                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                >
                                    <option value='en-IN'>English (India) - Default</option>
                                    <option value='ta-IN'>Tamil (தமிழ்)</option>
                                    <option value='hi-IN'>Hindi (हिन्दी)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* 7. Organization Parameters (Admin) */}
                    {activeSection === 'organization' && (
                        <div className='space-y-4 text-xs max-w-xl'>
                            <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                                Institutional Group Parameters
                            </h2>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Institution Legal Name</label>
                                <input
                                    type='text'
                                    disabled
                                    value='Queen Mira International School (QMIS)'
                                    className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 cursor-not-allowed'
                                />
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Academic Year Session</label>
                                <input
                                    type='text'
                                    value={settings.academicYear}
                                    onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                        </div>
                    )}

                    {/* 8. RBAC Matrix (Admin) */}
                    {activeSection === 'rbac' && (
                        <div className='space-y-4 text-xs'>
                            <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                                Role-Based Access Control (RBAC) Governance
                            </h2>
                            <p className='text-slate-500'>
                                26 authenticated roles active across 5 operational pillars. Permissions strictly isolate subordinate operational records and enforce immutable audit trails.
                            </p>
                            <div className='rounded-xl border border-slate-200 p-4 bg-slate-50/50'>
                                <p className='font-bold text-slate-800'>Super Admin Re-entry Authority</p>
                                <p className='text-slate-500 mt-1'>Data lock bypass requests require verified auditor justification notes before temporary re-entry access is granted.</p>
                            </div>
                        </div>
                    )}

                    {/* 9. System Configuration (Admin) */}
                    {activeSection === 'system' && (
                        <div className='space-y-4 text-xs max-w-xl'>
                            <h2 className='text-sm font-semibold tracking-tight text-slate-900 border-b border-slate-100 pb-2.5'>
                                System Governance & Biometric Parameters
                            </h2>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>Daily Staff Report (DSR) Entry Cutoff Time</label>
                                <input
                                    type='time'
                                    value={settings.dsrCutoffHour}
                                    onChange={(e) => setSettings({ ...settings, dsrCutoffHour: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                />
                            </div>
                            <div>
                                <label className='block font-medium text-slate-700 mb-1'>ESSL Biometric Server Auto-Sync Cadence</label>
                                <select
                                    value={settings.biometricInterval}
                                    onChange={(e) => setSettings({ ...settings, biometricInterval: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none'
                                >
                                    <option>5 Minutes (High Frequency)</option>
                                    <option>15 Minutes (Standard)</option>
                                    <option>30 Minutes</option>
                                    <option>Hourly</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default EnterpriseSettingsPage

