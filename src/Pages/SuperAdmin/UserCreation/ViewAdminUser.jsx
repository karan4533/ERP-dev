import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react'
import AdminPermissionsPanel from './Components/AdminPermissionsPanel'
import {
    ADMIN_PERMISSION_MODULES,
    ADMIN_ROLE_LABEL,
    ADMIN_USER_STATUSES,
    getAdminUserById,
    getPermissionLabels,
    ROUTE_BASE,
    statusBadgeColor,
    updateAdminUser,
} from './adminUsersData'

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] wrap-break-word'>{value || '—'}</span>
    </div>
)

const ViewAdminUser = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [user, setUser] = useState(() => getAdminUserById(id))
    const [isEditing, setIsEditing] = useState(false)
    const [form, setForm] = useState(() => ({
        status: user?.status ?? 'Active',
        permissions: { ...(user?.permissions ?? {}) },
    }))
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const togglePermission = (key) => {
        setForm((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key],
            },
        }))
    }

    const toggleAllPermissions = (enabled) => {
        setForm((prev) => ({
            ...prev,
            permissions: Object.fromEntries(
                ADMIN_PERMISSION_MODULES
                    .filter((module) => !module.alwaysOn)
                    .map((module) => [module.key, enabled]),
            ),
        }))
    }

    const handleSave = () => {
        const result = updateAdminUser(id, {
            status: form.status,
            permissions: form.permissions,
        })

        if (!result.success) {
            setError(result.message)
            setMessage('')
            return
        }

        setUser(result.user)
        setIsEditing(false)
        setMessage('Administrator permissions updated successfully.')
        setError('')
    }

    if (!user) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate(ROUTE_BASE)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-8 text-center text-[#667085]'>
                    Administrator user not found.
                </div>
            </section>
        )
    }

    const permissionLabels = getPermissionLabels(isEditing ? form.permissions : user.permissions)

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(ROUTE_BASE)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-center gap-3'>
                    <div className='p-2 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <ShieldCheck size={20} />
                    </div>
                    <div className='min-w-0 flex-1'>
                        <h1 className='text-2xl font-semibold text-black'>{user.name}</h1>
                        <p className='text-sm text-[#667085] mt-1'>{user.email}</p>
                    </div>
                    <span className='inline-flex px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#515DEF33] text-[#515DEF]'>
                        {ADMIN_ROLE_LABEL}
                    </span>
                    <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-semibold ${statusBadgeColor[user.status]}`}>
                        {user.status}
                    </span>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-lg font-semibold text-black mb-6'>Account Details</h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Admin ID' value={user.id} />
                    <Field label='Employee ID' value={user.employeeId} />
                    <Field label='Department' value={user.department} />
                    <Field label='Username' value={user.username} />
                    <Field label='Mobile Number' value={user.mobileNumber} />
                    <Field label='Created By' value={user.createdBy} />
                    <Field label='Created On' value={user.createdAt} />
                    <Field label='Role' value={ADMIN_ROLE_LABEL} />
                    <Field label='Login Email' value={user.email} />
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
                    <h2 className='text-lg font-semibold text-black'>Module Permissions</h2>
                    {!user.isSystem && (
                        <button
                            type='button'
                            onClick={() => {
                                if (isEditing) {
                                    setForm({
                                        status: user.status,
                                        permissions: { ...user.permissions },
                                    })
                                    setIsEditing(false)
                                    setError('')
                                } else {
                                    setIsEditing(true)
                                    setMessage('')
                                }
                            }}
                            className='text-sm font-semibold text-[#515DEF] hover:underline cursor-pointer'
                        >
                            {isEditing ? 'Cancel Edit' : 'Edit Permissions'}
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <>
                        <div className='mb-6 max-w-xs'>
                            <label htmlFor='status' className='text-sm font-medium text-[#808080] block mb-2'>Status</label>
                            <select
                                id='status'
                                value={form.status}
                                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 w-full bg-white focus:outline-none focus:border-[#515DEF]'
                            >
                                {ADMIN_USER_STATUSES.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <AdminPermissionsPanel
                            permissions={form.permissions}
                            onToggle={togglePermission}
                            onToggleAll={toggleAllPermissions}
                        />
                    </>
                ) : (
                    <div className='flex flex-wrap gap-2'>
                        {permissionLabels.length === 0 ? (
                            <span className='text-sm text-[#667085]'>No module permissions assigned.</span>
                        ) : (
                            permissionLabels.map((label) => (
                                <span
                                    key={label}
                                    className='inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#515DEF33] text-[#515DEF]'
                                >
                                    {label}
                                </span>
                            ))
                        )}
                    </div>
                )}
            </div>

            {message && (
                <div className='rounded-xl border border-[#4CAF5033] bg-[#4CAF500D] px-4 py-3 text-sm text-[#4CAF50]'>
                    {message}
                </div>
            )}

            {error && (
                <div className='rounded-xl border border-[#FF572233] bg-[#FF57220D] px-4 py-3 text-sm text-[#FF5722]'>
                    {error}
                </div>
            )}

            {isEditing && (
                <div className='flex sm:justify-end justify-center'>
                    <button
                        type='button'
                        onClick={handleSave}
                        className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2'
                    >
                        <Save size={16} />
                        Save Permissions
                    </button>
                </div>
            )}
        </section>
    )
}

export default ViewAdminUser
