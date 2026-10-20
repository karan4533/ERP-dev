import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'
import { toast } from 'react-toastify'
import UserCreationForm from './Components/UserCreationForm'
import { canUseAdminUsersApi, listCreatableRolesApi } from '../../services/adminUsersApi'

const CreateUserPage = ({
    routeBase,
    defaultForm,
    onSubmit,
    fixedRole,
    fixedRoleLabel,
    pageTitle = 'Create User',
    pageDescription = 'Complete the user profile and set the login email.',
    submitLabel = 'Create User',
    successMessage = 'User created successfully.',
    onSuccess,
    renderAfterForm,
    passwordLabel,
    passwordPlaceholder,
    passwordHelp,
    hidePassword = false,
    staffCode = '',
    roleOptions = null,
}) => {
    const navigate = useNavigate()
    const [form, setForm] = useState(defaultForm)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [apiRoleOptions, setApiRoleOptions] = useState(roleOptions)

    useEffect(() => {
        if (roleOptions || !canUseAdminUsersApi()) return undefined
        let cancelled = false
        listCreatableRolesApi()
            .then((rows) => {
                if (!cancelled && Array.isArray(rows) && rows.length) {
                    setApiRoleOptions(rows.map((row) => ({ role: row.role, label: row.label || row.role })))
                }
            })
            .catch(() => {})
        return () => { cancelled = true }
    }, [roleOptions])

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async () => {
        if (submitting) return
        setError('')
        setSubmitting(true)
        let result
        try {
            // onSubmit may be synchronous (local store) or return a promise (API).
            result = await onSubmit(form)
        } finally {
            setSubmitting(false)
        }
        if (!result.success) {
            setError(result.message)
            return
        }

        toast.success(successMessage)

        if (onSuccess) {
            onSuccess(result, navigate)
            return
        }

        navigate(routeBase)
    }

    return (
        <section className='space-y-6'>
            <button
                type='button'
                onClick={() => navigate(routeBase)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex items-center gap-3 mb-2'>
                    <div className='p-2 rounded-xl bg-[#515DEF]/10 text-[#515DEF]'>
                        <UserPlus size={20} />
                    </div>
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{pageTitle}</h1>
                        <p className='text-sm text-[#667085] mt-1'>{pageDescription}</p>
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <UserCreationForm
                    form={form}
                    onChange={updateField}
                    fixedRole={fixedRole}
                    fixedRoleLabel={fixedRoleLabel}
                    passwordLabel={passwordLabel}
                    passwordPlaceholder={passwordPlaceholder}
                    passwordHelp={passwordHelp}
                    hidePassword={hidePassword}
                    staffCode={staffCode}
                    roleOptions={apiRoleOptions}
                />

                {renderAfterForm?.({ form, updateField })}

                {error ? <p className='text-sm text-[#F44336] mt-6'>{error}</p> : null}

                <div className='mt-6'>
                    <button
                        type='button'
                        onClick={handleSubmit}
                        disabled={submitting}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-6 py-2.5 rounded-md hover:opacity-90 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
                    >
                        <Save size={16} />
                        {submitting ? 'Saving…' : submitLabel}
                    </button>
                </div>
            </div>
        </section>
    )
}

export default CreateUserPage
