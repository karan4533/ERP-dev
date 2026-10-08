import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'
import { toast } from 'react-toastify'
import UserCreationForm from './Components/UserCreationForm'

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

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = () => {
        setError('')
        const result = onSubmit(form)
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
                />

                {renderAfterForm?.({ form, updateField })}

                {error ? <p className='text-sm text-[#F44336] mt-6'>{error}</p> : null}

                <div className='mt-6'>
                    <button
                        type='button'
                        onClick={handleSubmit}
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-6 py-2.5 rounded-md hover:opacity-90 cursor-pointer'
                    >
                        <Save size={16} />
                        {submitLabel}
                    </button>
                </div>
            </div>
        </section>
    )
}

export default CreateUserPage
