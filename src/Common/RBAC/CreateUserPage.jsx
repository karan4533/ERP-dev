import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'react-toastify'
import UserCreationForm from './Components/UserCreationForm'
import { ConfirmAction, IntegrationNotice, PageHeader, Surface } from '../ui'
import { CREATABLE_ROLE_LABELS } from './createdUsersData'

const CreateUserPage = ({
    routeBase,
    defaultForm,
    onSubmit,
    fixedRole,
    fixedRoleLabel,
    pageTitle = 'Create User',
    pageDescription = 'Complete the user profile and set the login email. OTP remains any 6-digit code at sign-in.',
    submitLabel = 'Create User',
    successMessage = 'User created successfully.',
    onSuccess,
    renderAfterForm,
}) => {
    const navigate = useNavigate()
    const [form, setForm] = useState(defaultForm)
    const [error, setError] = useState('')
    const [confirmOpen, setConfirmOpen] = useState(false)

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = () => {
        setError('')
        const result = onSubmit(form)
        if (!result.success) {
            setError(result.message)
            setConfirmOpen(false)
            return
        }

        setConfirmOpen(false)
        toast.success(successMessage)

        if (onSuccess) {
            onSuccess(result, navigate)
            return
        }

        navigate(routeBase)
    }

    return (
        <section className='space-y-5'>
            <button
                type='button'
                onClick={() => navigate(routeBase)}
                className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
            >
                <ArrowLeft size={18} />
                Back to list
            </button>

            <PageHeader title={pageTitle} description={pageDescription} context='Identity and access provisioning' />

            <IntegrationNotice
                state='demo'
                title='Local provisioning only'
                description='This creates a browser-local profile. The production identity service must issue invitations, establish credentials and record the provisioning audit event.'
            />

            <Surface title='User profile' description='Required identity fields are validated when you review the account.' contentClassName='p-4 sm:p-5'>
                <UserCreationForm
                    form={form}
                    onChange={updateField}
                    fixedRole={fixedRole}
                    fixedRoleLabel={fixedRoleLabel}
                />

                {renderAfterForm?.({ form, updateField })}

                {error ? <p className='text-sm text-[#F44336] mt-6'>{error}</p> : null}

                <div className='mt-6'>
                    <button
                        type='button'
                        onClick={() => setConfirmOpen(true)}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-6 py-2.5 rounded-md hover:opacity-90 cursor-pointer'
                    >
                        <Save size={16} />
                        Review {submitLabel.toLowerCase()}
                    </button>
                </div>
            </Surface>

            <ConfirmAction
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleSubmit}
                title={`Create ${fixedRoleLabel || CREATABLE_ROLE_LABELS[form.role] || form.role} account?`}
                description='Review the identity and access consequences before provisioning.'
                confirmLabel={submitLabel}
            >
                <div className='space-y-2'>
                    <p><strong>Identity:</strong> {[form.firstName, form.lastName].filter(Boolean).join(' ') || 'Name not entered'} · {form.email || 'Email not entered'}</p>
                    <p><strong>Role:</strong> {fixedRoleLabel || CREATABLE_ROLE_LABELS[form.role] || form.role}</p>
                    <p><strong>Status:</strong> {form.status}. Inactive accounts cannot sign in.</p>
                    {fixedRole && <p>New administrators start with dashboard access only. A Super Admin must explicitly grant optional modules after creation.</p>}
                </div>
            </ConfirmAction>
        </section>
    )
}

export default CreateUserPage
