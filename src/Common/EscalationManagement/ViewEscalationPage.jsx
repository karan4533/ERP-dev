import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import EscalationForm from './Components/EscalationForm'
import {
    formatDateTime,
    getEscalationById,
    getResolveByDate,
    isReceivedEscalation,
    isResolutionOverdue,
    RECEIVED_RESOLUTION_STATUSES,
    RESOLUTION_SLA_HOURS,
    statusBadgeColor,
    updateEscalation,
} from './escalationData'
import { getRoleConfig } from './escalationRoleConfig'
import { formatEscalatedToDisplay } from './escalationUsersData'
import { useEscalationContext } from './useEscalationContext'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value || '—'}</span>
    </div>
)

const ViewEscalationPage = ({ roleKey }) => {
    const navigate = useNavigate()
    const { id } = useParams()
    const roleConfig = getRoleConfig(roleKey)
    const { currentUser } = useEscalationContext(roleKey)
    const [escalation, setEscalation] = useState(() => getEscalationById(roleKey, id))

    useEffect(() => {
        setEscalation(getEscalationById(roleKey, id))
    }, [roleKey, id])

    const isReceived = useMemo(
        () => (escalation ? isReceivedEscalation(escalation, roleKey, currentUser) : false),
        [escalation, roleKey, currentUser],
    )

    const resolveByDate = useMemo(
        () => (escalation ? getResolveByDate(escalation) : null),
        [escalation],
    )

    const isOverdue = useMemo(
        () => (escalation ? isResolutionOverdue(escalation) : false),
        [escalation],
    )

    const handleResolutionChange = (event) => {
        const status = event.target.value
        const updates = {
            status,
            resolvedAt: ['Resolved', 'Rejected'].includes(status) ? new Date().toISOString() : null,
        }
        const updated = updateEscalation(roleKey, id, updates)
        if (updated) setEscalation(updated)
    }

    if (!escalation) {
        return (
            <section className='space-y-6'>
                <button
                    type='button'
                    onClick={() => navigate(roleConfig.routeBase)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
                <div className='bg-white rounded-2xl shadow-md p-6 text-[#667085]'>Escalation not found.</div>
            </section>
        )
    }

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => navigate(roleConfig.routeBase)}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-semibold text-black'>{escalation.id}</h1>
                        {isReceived ? (
                            <p className='text-xs text-[#515DEF] mt-1 font-medium'>Received escalation</p>
                        ) : (
                            <p className='text-xs text-[#808080] mt-1'>
                                Routed to {escalation.escalatedTo} — track status below
                            </p>
                        )}
                    </div>
                    <div className='flex flex-wrap gap-2 self-start'>
                        <span
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[escalation.status]}`}
                        >
                            {escalation.status}
                        </span>
                    </div>
                </div>
            </div>

            {isReceived && (
                <Section title='Resolution'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-base font-medium text-[#808080]'>Resolution status</label>
                            <select
                                value={escalation.status}
                                onChange={handleResolutionChange}
                                className='text-sm font-normal text-[#808080] border border-[#D9D9D9] rounded-md px-2 py-2 w-full'
                            >
                                {RECEIVED_RESOLUTION_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                            <span className='text-xs text-[#667085]'>
                                Update status as you review this escalation. Select Resolved or Rejected when complete.
                            </span>
                        </div>
                        <Field
                            label='Resolution SLA'
                            value={`Must be resolved within ${RESOLUTION_SLA_HOURS} hours`}
                        />
                        <Field label='Resolve by' value={resolveByDate ? formatDateTime(resolveByDate) : '—'} />
                        {escalation.resolvedAt && (
                            <Field label='Resolved at' value={formatDateTime(escalation.resolvedAt)} />
                        )}
                    </div>

                    {isOverdue && (
                        <div className='mt-6 flex items-start gap-3 rounded-xl border border-[#FF000033] bg-[#FF00000D] p-4'>
                            <Clock size={18} className='text-[#FF0000] shrink-0 mt-0.5' />
                            <div>
                                <p className='text-sm font-semibold text-[#FF0000]'>Resolution overdue</p>
                                <p className='text-sm text-[#667085] mt-1'>
                                    This escalation was due by {formatDateTime(resolveByDate)} and is still unresolved.
                                </p>
                            </div>
                        </div>
                    )}

                    {!isOverdue && escalation.status !== 'Resolved' && resolveByDate && (
                        <div className='mt-6 flex items-start gap-3 rounded-xl border border-[#515DEF33] bg-[#F8F9FF] p-4'>
                            <Clock size={18} className='text-[#515DEF] shrink-0 mt-0.5' />
                            <div>
                                <p className='text-sm font-semibold text-[#515DEF]'>24-hour resolution window</p>
                                <p className='text-sm text-[#667085] mt-1'>
                                    Please resolve this escalation by {formatDateTime(resolveByDate)}.
                                </p>
                            </div>
                        </div>
                    )}
                </Section>
            )}

            <Section title='Escalation information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Escalation ID' value={escalation.id} />
                    <Field label='Escalation date' value={escalation.escalationDate} />
                    <Field label='Escalated by' value={escalation.escalatedBy} />
                    <Field label='Role' value={escalation.escalatedByRole} />
                    <Field label='Escalated to' value={formatEscalatedToDisplay(escalation)} />
                </div>
            </Section>

            <Section title='Details'>
                <EscalationForm form={escalation} roleConfig={roleConfig} readOnly />
            </Section>
        </section>
    )
}

export default ViewEscalationPage
