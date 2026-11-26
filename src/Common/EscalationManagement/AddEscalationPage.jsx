import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import EscalationForm from './Components/EscalationForm'
import { createEscalation, emptyEscalationForm } from './escalationData'
import { getRoleConfig } from './escalationRoleConfig'
import {
    getEscalationRecipientById,
    getEscalationRecipientSelectOptions,
} from './escalationUsersData'
import { useEscalationContext } from './useEscalationContext'
import IntegrationNotice from '../ui/IntegrationNotice'
import PageHeader from '../ui/PageHeader'
import Surface from '../ui/Surface'
import UnavailableWorkflowPage from '../ui/UnavailableWorkflowPage'

const AddEscalationPage = ({ roleKey }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { pathname } = location
    const effectiveRoleKey = roleKey || (pathname.startsWith('/parent') ? 'parent' : (pathname.startsWith('/student') ? 'student' : null))
    const roleConfig = getRoleConfig(effectiveRoleKey || roleKey)
    const { currentUser } = useEscalationContext(effectiveRoleKey || roleKey)

    const defaultRecipientId = useMemo(
        () => getEscalationRecipientSelectOptions(roleConfig?.escalatesToRoleKey)?.[0]?.value || '',
        [roleConfig?.escalatesToRoleKey],
    )

    const [form, setForm] = useState(() => emptyEscalationForm(defaultRecipientId))

    if (!roleConfig?.escalatesToRoleKey) {
        return <UnavailableWorkflowPage title='Escalation creation is unavailable' description='This role does not have a configured escalation destination.' alternateHref={roleConfig?.routeBase} alternateLabel='Open escalations' />
    }

    const handleSubmit = (e) => {
        if (e) e.preventDefault()
        if (!form.description.trim()) {
            toast.error('Description is required.')
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

        const result = createEscalation(effectiveRoleKey || roleKey, form, roleConfig, currentUser, recipientUser)
        if (!result.success) {
            toast.error(result.message)
            return
        }

        toast.success(`Escalation routed to ${roleConfig.escalatesTo} · ${recipientUser.name}.`)
        navigate(roleConfig.routeBase)
    }

    return (
        <form onSubmit={handleSubmit} noValidate className='space-y-5'>
            <PageHeader title='Raise escalation' description={`Route an issue through ${roleConfig.hierarchyLabel}.`} />
            <IntegrationNotice state='demo' title='Local escalation routing' description='This escalation is stored in this browser. Recipient notification, evidence upload and the production audit trail are not connected.' />
            <Surface title='Escalation information' description='Choose the responsible recipient and provide enough context for a 24-hour response.' contentClassName='p-4 sm:p-5'>
                <EscalationForm form={form} onChange={setForm} roleConfig={roleConfig} />
            </Surface>

            <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
                <button
                    type='button'
                    onClick={() => navigate(roleConfig.routeBase)}
                    className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Cancel
                </button>
                <button
                    type='submit'
                    className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'
                >
                    Raise escalation
                </button>
            </div>
        </form>
    )
}

export default AddEscalationPage
