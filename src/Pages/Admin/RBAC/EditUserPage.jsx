import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Save } from 'lucide-react'
import { toast } from 'react-toastify'
import UserCreationForm from '../../../Common/RBAC/Components/UserCreationForm'
import {
    fetchCreatedUserViaApi,
    getCreatedUserByStaffCode,
    isAdminUsersApiActive,
    updateCreatedUser,
    updateUserViaApi,
    userToForm,
} from '../../../Common/RBAC/createdUsersData'
import { listCreatableRolesApi } from '../../../services/adminUsersApi'

const ROUTE_BASE = '/admin/rbac/user-creation'

const EditUserPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const apiMode = isAdminUsersApiActive()
    const [user, setUser] = useState(() => getCreatedUserByStaffCode(id))
    const [form, setForm] = useState(() => (user ? userToForm(user) : null))
    const [loading, setLoading] = useState(apiMode)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [roleOptions, setRoleOptions] = useState(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const [loaded, roles] = await Promise.all([
                    apiMode ? fetchCreatedUserViaApi(id) : Promise.resolve(getCreatedUserByStaffCode(id)),
                    apiMode ? listCreatableRolesApi().catch(() => null) : Promise.resolve(null),
                ])
                if (cancelled) return
                if (Array.isArray(roles) && roles.length) {
                    setRoleOptions(roles.map((row) => ({ role: row.role, label: row.label || row.role })))
                }
                if (!loaded) {
                    setError('User not found.')
                    setUser(null)
                    setForm(null)
                } else {
                    setUser(loaded)
                    setForm(userToForm(loaded))
                    setError('')
                }
            } catch (err) {
                if (!cancelled) setError(err?.message || 'Could not load user.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [apiMode, id])

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async () => {
        if (!form || !user || submitting) return
        setError('')
        setSubmitting(true)
        let result
        try {
            result = apiMode
                ? await updateUserViaApi(user, form)
                : updateCreatedUser(user.id, form)
        } finally {
            setSubmitting(false)
        }
        if (!result.success) {
            setError(result.message)
            return
        }
        toast.success('User updated successfully.')
        navigate(ROUTE_BASE)
    }

    if (loading) {
        return (
            <section className='space-y-6'>
                <p className='text-sm text-[#667085]'>Loading user…</p>
            </section>
        )
    }

    if (!form || !user) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate(ROUTE_BASE)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <p className='text-sm text-[#F44336]'>{error || 'User not found.'}</p>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(ROUTE_BASE)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center gap-3 mb-2'>
                    <div className='p-2 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <Pencil size={20} />
                    </div>
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>Edit User</h1>
                        <p className='text-sm text-[#667085] mt-1'>
                            Update profile, role, email, and status for {user.name} ({user.id}).
                            Use Reset password on the list to change the login password.
                        </p>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <UserCreationForm
                    form={form}
                    onChange={updateField}
                    hidePassword
                    staffCode={user.id}
                    roleOptions={roleOptions}
                />

                {error ? <p className='text-sm text-[#F44336] mt-6'>{error}</p> : null}

                <div className='mt-6 flex flex-wrap gap-3'>
                    <button
                        type='button'
                        onClick={handleSubmit}
                        disabled={submitting}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-6 py-2.5 rounded-md hover:opacity-90 cursor-pointer disabled:opacity-60'
                    >
                        <Save size={16} />
                        {submitting ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                        type='button'
                        onClick={() => navigate(ROUTE_BASE)}
                        className='text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2.5 rounded-md hover:bg-[#515DEF] hover:text-white cursor-pointer'
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </section>
    )
}

export default EditUserPage
