import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import {
    getEscalations,
    updateEscalationStatus,
    statusBadgeColor,
    priorityBadgeColor,
    sourceTypeLabel,
} from './escalationData'

const Section = ({ title, children }) => (
    <div className='bg-white rounded-2xl shadow-md p-4'>
        <h2 className='text-xl font-semibold text-black mb-6'>{title}</h2>
        {children}
    </div>
)

const Field = ({ label, value }) => (
    <div className='flex flex-col gap-y-1'>
        <span className='text-base font-medium text-[#808080]'>{label}</span>
        <span className='text-sm text-[#1E1E1E] whitespace-pre-wrap wrap-break-word'>{value}</span>
    </div>
)

const ViewEscalation = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [escalation, setEscalation] = useState(() => {
        const list = getEscalations()
        return list.find((item) => item.id === id) ?? list[0]
    })
    const [actionNote, setActionNote] = useState('')

    const canEscalateToAdmin = !escalation.escalatedToAdmin
        && escalation.status !== 'Resolved'
        && escalation.status !== 'Closed'

    const handleEscalate = () => {
        if (!escalation) return
        const note = actionNote.trim() || 'Forwarded to Admin by Joint Director for administrative resolution.'
        const updated = updateEscalationStatus(escalation.id, 'Escalated to Admin', { adminEscalationNote: note })
        if (updated) {
            setEscalation({ ...updated })
            setActionNote('')
            toast.success(`Escalation ${escalation.id} forwarded to Admin.`)
        }
    }

    const handleResolve = () => {
        if (!escalation) return
        const remarks = actionNote.trim() || 'Resolved by Joint Director.'
        const updated = updateEscalationStatus(escalation.id, 'Resolved', { remarks })
        if (updated) {
            setEscalation({ ...updated })
            setActionNote('')
            toast.success(`Escalation ${escalation.id} marked as resolved.`)
        }
    }

    return (
        <section className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
                <button
                    type='button'
                    onClick={() => navigate('/joint-director/escalations')}
                    className='inline-flex items-center gap-2 text-sm text-[#515DEF] border border-[#515DEF] rounded-md px-4 py-2 hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <ArrowLeft size={18} />
                    Back to list
                </button>

                <div className='flex flex-wrap gap-2'>
                    {canEscalateToAdmin && (
                        <button
                            type='button'
                            onClick={handleEscalate}
                            className='bg-[#515DEF] text-white text-sm px-5 py-2 rounded-lg hover:opacity-90 transition-all cursor-pointer'
                        >
                            Escalate to Admin
                        </button>
                    )}
                    {(escalation.status === 'Open' || escalation.status === 'In Review') && (
                        <button
                            type='button'
                            onClick={handleResolve}
                            className='bg-[#4CAF50] text-white text-sm px-5 py-2 rounded-lg hover:opacity-90 transition-all cursor-pointer'
                        >
                            Mark Resolved
                        </button>
                    )}
                </div>
            </div>

            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <p className='text-xs font-medium text-[#515DEF] uppercase tracking-wide mb-1'>
                            Received from lower hierarchy
                        </p>
                        <h1 className='text-2xl font-semibold text-black'>{escalation.id}</h1>
                        <p className='text-sm text-[#667085] mt-1'>{sourceTypeLabel[escalation.sourceType]}</p>
                    </div>
                    <div className='flex flex-wrap gap-2 self-start'>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusBadgeColor[escalation.status]}`}>
                            {escalation.status}
                        </span>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${priorityBadgeColor[escalation.priority]}`}>
                            {escalation.priority} Priority
                        </span>
                    </div>
                </div>
            </div>

            {(canEscalateToAdmin || escalation.status === 'Open' || escalation.status === 'In Review') && (
                <div className='bg-white rounded-2xl shadow-md p-4 space-y-3'>
                    <h2 className='text-lg font-semibold text-black'>Action & Remarks</h2>
                    <div className='flex flex-col gap-2'>
                        <label className='text-sm font-medium text-[#808080]'>Add resolution remarks or note for Admin escalation:</label>
                        <textarea
                            value={actionNote}
                            onChange={(e) => setActionNote(e.target.value)}
                            placeholder='Enter remarks or reason for action...'
                            rows={3}
                            className='w-full text-sm text-[#1E1E1E] border border-[#D9D9D9] rounded-lg p-3 focus:outline-none focus:border-[#515DEF]'
                        />
                    </div>
                    <div className='flex flex-wrap gap-2 pt-1'>
                        {canEscalateToAdmin && (
                            <button
                                type='button'
                                onClick={handleEscalate}
                                className='bg-[#515DEF] text-white text-sm px-5 py-2 rounded-lg hover:opacity-90 transition-all cursor-pointer'
                            >
                                Escalate to Admin
                            </button>
                        )}
                        {(escalation.status === 'Open' || escalation.status === 'In Review') && (
                            <button
                                type='button'
                                onClick={handleResolve}
                                className='bg-[#4CAF50] text-white text-sm px-5 py-2 rounded-lg hover:opacity-90 transition-all cursor-pointer'
                            >
                                Mark Resolved
                            </button>
                        )}
                    </div>
                </div>
            )}

            <Section title='Escalation information'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    <Field label='Escalation ID' value={escalation.id} />
                    <Field label='Escalation date' value={escalation.escalationDate} />
                    <Field label='Department' value={escalation.escalatedDepartment} />
                    <Field label='Escalated by' value={escalation.escalatedBy} />
                    <Field label='Role' value={escalation.escalatedByRole} />
                    <Field label='Employee ID' value={escalation.escalatedById} />
                    <Field label='Source' value={sourceTypeLabel[escalation.sourceType]} />
                    <Field label='Escalated to Admin' value={escalation.escalatedToAdmin ? 'Yes' : 'No'} />
                    {escalation.escalatedToAdmin && (
                        <Field label='Admin escalation date' value={escalation.adminEscalationDate} />
                    )}
                    <div className='lg:col-span-3'>
                        <Field label='Description' value={escalation.description} />
                    </div>
                    <div className='lg:col-span-3'>
                        <Field label='Full details' value={escalation.fullDescription} />
                    </div>
                    <div className='lg:col-span-3'>
                        <Field label='Remarks' value={escalation.remarks} />
                    </div>
                </div>
            </Section>

            {escalation.escalatedToAdmin && (
                <Section title='Admin escalation details'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <Field label='Forwarded to' value='Admin' />
                        <Field label='Escalation date' value={escalation.adminEscalationDate} />
                        <div className='lg:col-span-3'>
                            <Field label='Escalation note' value={escalation.adminEscalationNote} />
                        </div>
                    </div>
                </Section>
            )}
        </section>
    )
}

export default ViewEscalation
