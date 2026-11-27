import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import EscalationForm from './Components/EscalationForm'
import { createEscalation, emptyEscalationForm, raiseEscalationViaApi } from './escalationData'
import { canUseEscalationsApi } from '../../services/escalationApi'
import { getRoleConfig } from './escalationRoleConfig'
import {
    getEscalationRecipientById,
    getEscalationRecipientSelectOptions,
} from './escalationUsersData'
import { useEscalationContext } from './useEscalationContext'

const AddEscalationPage = ({ roleKey }) => {
    const navigate = useNavigate()
    const roleConfig = getRoleConfig(roleKey)
    const { currentUser } = useEscalationContext(roleKey)

    const apiOn = canUseEscalationsApi()
    const defaultRecipientId = apiOn
        ? ''
        : getEscalationRecipientSelectOptions(roleConfig?.escalatesToRoleKey)?.[0]?.value || ''

    const [form, setForm] = useState(() => emptyEscalationForm(defaultRecipientId))

    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!form.description.trim()) {
            toast.error('Description is required.')
            return
        }

        if (canUseEscalationsApi()) {
            // The server routes it one level up; the recipient is optional (empty = whole role).
            setSaving(true)
            try {
                const created = await raiseEscalationViaApi(form)
                toast.success(`${created.escalationId} routed to ${roleConfig.escalatesTo}. Resolve-by is 24 hours.`)
                navigate(roleConfig.routeBase)
            } catch (error) {
                toast.error(error?.message || 'Could not raise the escalation.')
            } finally {
                setSaving(false)
            }
            return
        }

        const recipientUser = getEscalationRecipientById(
            roleConfig.escalatesToRoleKey,
            form.recipientUserId,
        )

        if (!recipientUser) {
            toast.error(`Please select a ${roleConfig.escalatesTo.toLowerCase()} recipient.`)
            return
        }

        const result = createEscalation(roleKey, form, roleConfig, currentUser, recipientUser)
        if (!result.success) {
            toast.error(result.message)
            return
        }

        toast.success(`Escalation routed to ${roleConfig.escalatesTo} · ${recipientUser.name}.`)
        navigate(roleConfig.routeBase)
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Escalation</h2>
                <EscalationForm form={form} onChange={setForm} roleConfig={roleConfig} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button
                    type='button'
                    onClick={() => navigate(roleConfig.routeBase)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Discard Changes
                </button>
                <button
                    type='button'
                    onClick={handleSave}
                    disabled={saving}
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Save Escalation
                </button>
            </div>
        </section>
    )
}

export default AddEscalationPage
