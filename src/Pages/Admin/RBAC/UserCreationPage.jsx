import React, { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Copy, KeyRound, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    CREATABLE_ROLE_LABELS,
    getAllCreatedUsers,
    isAdminUsersApiActive,
    resetUserPasswordViaApi,
    syncCreatedUsersFromApi,
    updateUserStatus,
    updateUserStatusViaApi,
    deleteCreatedUser,
} from '../../../Common/RBAC/createdUsersData'

const ROUTE_BASE = '/admin/rbac/user-creation'

const statusBadgeColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    Inactive: 'bg-[#66708533] text-[#667085]',
}

/** One-time display of a server-generated temporary password. Never stored. */
const CredentialNotice = ({ credential, onDismiss }) => {
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(credential.temporaryPassword)
            toast.success('Temporary password copied.')
        } catch {
            toast.error('Could not copy. Select the password and copy it manually.')
        }
    }

    return (
        <div
            role='alert'
            className='bg-[#FFF8E1] border border-[#F5C242] rounded-2xl p-4 flex items-start justify-between gap-4'
        >
            <div className='space-y-2'>
                <p className='text-sm font-semibold text-[#7A5B00]'>
                    {credential.reason === 'reset' ? 'Password reset' : 'User created'}: share these sign-in details securely
                </p>
                <p className='text-sm text-[#1E1E1E]'>
                    {credential.name} ({credential.staffCode}) &middot; {credential.email}
                </p>
                <p className='text-sm text-[#1E1E1E] flex items-center gap-2 flex-wrap'>
                    Temporary password:
                    <code
                        data-testid='temporary-password'
                        className='bg-white border border-[#E5E7EB] rounded px-2 py-1 font-mono select-all'
                    >
                        {credential.temporaryPassword}
                    </code>
                    <button
                        type='button'
                        onClick={copy}
                        className='inline-flex items-center gap-1 text-xs text-[#515DEF] hover:underline cursor-pointer'
                    >
                        <Copy size={14} /> Copy
                    </button>
                </p>
                <p className='text-xs text-[#7A5B00]'>
                    This is shown only once and cannot be viewed again. The user must change it at first sign-in.
                </p>
            </div>
            <button
                type='button'
                onClick={onDismiss}
                aria-label='Dismiss'
                className='text-[#7A5B00] cursor-pointer'
            >
                <X size={18} />
            </button>
        </div>
    )
}

const UserCreationPage = () => {
    const apiMode = isAdminUsersApiActive()
    const location = useLocation()
    const navigate = useNavigate()
    const [users, setUsers] = useState(() => getAllCreatedUsers())
    const [loading, setLoading] = useState(apiMode)
    const [loadError, setLoadError] = useState('')
    const [busyId, setBusyId] = useState('')
    const [credential, setCredential] = useState(() => location.state?.credential ?? null)

    // Show the one-time password, then wipe it from the history entry so a refresh cannot show it again.
    useEffect(() => {
        if (location.state?.credential) {
            navigate(location.pathname, { replace: true, state: null })
        }
    }, [location.pathname, location.state, navigate])

    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        if (!apiMode) return undefined
        let cancelled = false
        syncCreatedUsersFromApi()
            .then((mapped) => {
                if (cancelled) return
                if (mapped) setUsers(getAllCreatedUsers())
                setLoadError('')
            })
            .catch((error) => {
                if (!cancelled) setLoadError(error?.message || 'Could not load users.')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [apiMode, reloadKey])

    const retryLoad = () => {
        setLoading(true)
        setReloadKey((key) => key + 1)
    }

    const refreshUsers = () => setUsers(getAllCreatedUsers())

    const handleToggleStatus = async (user) => {
        const next = user.status === 'Active' ? 'Inactive' : 'Active'
        if (!apiMode) {
            updateUserStatus(user.id, next)
            refreshUsers()
            toast.success(`User marked as ${next}.`)
            return
        }
        setBusyId(user.id)
        const result = await updateUserStatusViaApi(user, next)
        setBusyId('')
        if (!result.success) {
            toast.error(result.message)
            return
        }
        refreshUsers()
        toast.success(`User marked as ${next}.`)
    }

    const handleResetPassword = async (user) => {
        setBusyId(user.id)
        const result = await resetUserPasswordViaApi(user)
        setBusyId('')
        if (!result.success) {
            toast.error(result.message)
            return
        }
        setCredential({
            name: user.name,
            email: user.email,
            staffCode: user.id,
            temporaryPassword: result.temporaryPassword,
            reason: 'reset',
        })
    }

    const handleDeleteUser = (user) => {
        deleteCreatedUser(user.id)
        refreshUsers()
        toast.success('User removed.')
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-start gap-3'>
                    <div className='p-2.5 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <UserPlus size={22} />
                    </div>
                    <div>
                        <h1 className='text-xl font-semibold text-black'>User Creation</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            Create staff logins for academics, gate, transport, canteen, IT, stationery, and housekeeping.
                            Student accounts are created through Admission enrollment. HR / Account Head / Admin are seeded separately.
                        </p>
                    </div>
                </div>
            </div>

            {credential ? (
                <CredentialNotice credential={credential} onDismiss={() => setCredential(null)} />
            ) : null}

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex justify-between items-center gap-3 mb-4 flex-wrap'>
                    <h2 className='text-lg font-semibold text-black'>Created Users</h2>
                    <NavLink
                        to={`${ROUTE_BASE}/add`}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90'
                    >
                        <Plus size={16} />
                        Create User
                    </NavLink>
                </div>

                {loadError ? (
                    <div className='mb-4 text-sm text-[#F44336] flex items-center gap-3'>
                        <span>{loadError}</span>
                        <button
                            type='button'
                            onClick={retryLoad}
                            className='text-[#515DEF] hover:underline cursor-pointer'
                        >
                            Retry
                        </button>
                    </div>
                ) : null}

                {loading ? (
                    <p className='py-12 text-center text-sm text-[#667085]'>Loading users…</p>
                ) : users.filter((user) => user.role !== 'student').length === 0 ? (
                    <div className='py-12 text-center'>
                        <p className='text-[#0C1E5B] font-semibold'>No users created yet</p>
                        <p className='text-sm text-[#667085] mt-2'>Create staff accounts for ERP login and role-based access.</p>
                    </div>
                ) : (
                    <div className='relative overflow-x-auto'>
                        <table className='w-full text-sm text-left'>
                            <thead className='text-xs bg-[#EDEEF5]'>
                                <tr>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>ID</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Name</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Email</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Role</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Class</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Status</th>
                                    <th className='px-3 py-3 text-[#0C1E5B] font-medium uppercase'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.filter((user) => user.role !== 'student').map((user) => (
                                    <tr key={user.id} className='border-b border-[#f2f4f7]'>
                                        <td className='px-3 py-3'>{user.id}</td>
                                        <td className='px-3 py-3 font-medium text-[#1E1E1E]'>{user.name}</td>
                                        <td className='px-3 py-3'>{user.email}</td>
                                        <td className='px-3 py-3'>{CREATABLE_ROLE_LABELS[user.role] || user.role}</td>
                                        <td className='px-3 py-3'>
                                            {user.className && user.section ? `${user.className}-${user.section}` : '—'}
                                        </td>
                                        <td className='px-3 py-3'>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusBadgeColor[user.status]}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className='px-3 py-3'>
                                            <div className='flex items-center gap-3 flex-wrap'>
                                                <NavLink
                                                    to={`${ROUTE_BASE}/edit/${encodeURIComponent(user.id)}`}
                                                    className='inline-flex items-center gap-1 text-xs text-[#515DEF] hover:underline'
                                                >
                                                    <Pencil size={14} /> Edit
                                                </NavLink>
                                                <button
                                                    type='button'
                                                    onClick={() => handleToggleStatus(user)}
                                                    disabled={busyId === user.id}
                                                    className='text-xs text-[#515DEF] hover:underline cursor-pointer disabled:opacity-50'
                                                >
                                                    {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                                {apiMode ? (
                                                    <button
                                                        type='button'
                                                        onClick={() => handleResetPassword(user)}
                                                        disabled={busyId === user.id}
                                                        className='inline-flex items-center gap-1 text-xs text-[#515DEF] hover:underline cursor-pointer disabled:opacity-50'
                                                    >
                                                        <KeyRound size={14} /> Reset password
                                                    </button>
                                                ) : (
                                                    <button
                                                        type='button'
                                                        onClick={() => handleDeleteUser(user)}
                                                        className='text-[#F44336] cursor-pointer'
                                                        aria-label='Delete user'
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    )
}

export default UserCreationPage
