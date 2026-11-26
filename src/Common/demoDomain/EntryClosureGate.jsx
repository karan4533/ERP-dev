import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Lock, Unlock, Clock, AlertTriangle, ShieldCheck } from 'lucide-react'
import { entryBlocked, hasUnlock, isEntryClosed, getReentryRequests, requestReentry, getClosureRules } from './governance'
import Dialog from '../ui/Dialog'

export default function EntryClosureGate({ moduleName, actor, recordId = '', children }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [specificRecord, setSpecificRecord] = useState(recordId || moduleName)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isClosed = isEntryClosed(moduleName)
    const isUnlocked = hasUnlock(moduleName, actor)
    const isBlocked = isClosed && !isUnlocked

    // Check if there is already a pending request
    const existingRequests = getReentryRequests()
    const activeRequest = existingRequests.find(
        (r) => r.module === moduleName && r.requestedBy === actor && r.status === 'Pending'
    )
    const approvedRequest = existingRequests.find(
        (r) => r.module === moduleName && r.requestedBy === actor && r.status === 'Approved'
    )

    const closureRule = getClosureRules().find((r) => r.module === moduleName)

    const handleRequestSubmit = (e) => {
        e.preventDefault()
        if (!reason.trim()) {
            toast.error('A clear justification is required for data re-entry.')
            return
        }

        setIsSubmitting(true)
        requestReentry({
            module: moduleName,
            record: specificRecord.trim() || moduleName,
            reason: reason.trim(),
            requestedBy: actor,
        })
        setIsSubmitting(false)
        setIsDialogOpen(false)
        setReason('')
        toast.success('Re-entry authorization request submitted to Super Admin.')
    }

    return (
        <div className='space-y-4'>
            {isBlocked && (
                <div className='rounded-2xl border border-[#FDBA74] bg-[#FFF7ED] p-4 text-[#9A3412] shadow-sm'>
                    <div className='flex items-start justify-between gap-3 flex-wrap'>
                        <div className='flex items-start gap-3'>
                            <div className='p-2 rounded-xl bg-[#EA580C]/10 text-[#EA580C] shrink-0 mt-0.5'>
                                <Lock size={18} />
                            </div>
                            <div>
                                <h4 className='text-sm font-semibold text-[#9A3412]'>
                                    Data Entry Closed — {moduleName}
                                </h4>
                                <p className='text-xs text-[#C2410C] mt-0.5'>
                                    The scheduled closure deadline ({closureRule?.closureDate ? `${closureRule.closureDate} at ${closureRule?.closureTime || '18:00'}` : 'Monthly DSR Lockout'}) has passed.
                                    New entries and changes are restricted per institutional policy.
                                </p>
                                {activeRequest ? (
                                    <div className='mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFEDD5] text-xs font-medium text-[#9A3412] border border-[#FED7AA]'>
                                        <Clock size={14} />
                                        <span>Re-entry request #{activeRequest.id} is pending Super Admin approval</span>
                                    </div>
                                ) : (
                                    <p className='text-xs text-[#7C2D12] mt-1 font-medium'>
                                        If clerical correction or post-deadline entry is necessary, request formal re-entry permission below.
                                    </p>
                                )}
                            </div>
                        </div>

                        {!activeRequest && (
                            <button
                                type='button'
                                onClick={() => setIsDialogOpen(true)}
                                className='inline-flex items-center gap-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer'
                            >
                                <Unlock size={14} />
                                <span>Request Re-Entry Permission</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {isUnlocked && approvedRequest && (
                <div className='rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-3 text-[#065F46] flex items-center justify-between gap-3 text-xs shadow-sm'>
                    <div className='flex items-center gap-2'>
                        <ShieldCheck size={16} className='text-[#059669]' />
                        <span className='font-semibold'>Re-entry Authorized</span>
                        <span className='text-[#047857]'>
                            Approved by {approvedRequest.approvedBy || 'Super Admin'} for: {approvedRequest.record || moduleName}
                        </span>
                    </div>
                    <span className='text-[10px] text-[#059669] font-medium'>
                        Changes will be audited under request #{approvedRequest.id}
                    </span>
                </div>
            )}

            {/* Re-entry Request Dialog */}
            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={`Request Re-Entry Authorization: ${moduleName}`}
                className='max-w-lg'
            >
                <form onSubmit={handleRequestSubmit} className='space-y-4'>
                    <div className='rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs text-[#475569] space-y-1'>
                        <p className='font-semibold text-[#1E293B]'>Governance Notice (MD Directive #11):</p>
                        <p>
                            Institutional data entries operate under strict monthly closure times. Once closed, re-opening for corrections or omissions requires explicit justification and authorization from the Super Admin.
                        </p>
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-[#334155] mb-1'>
                            Target Record / Grade / Subject
                        </label>
                        <input
                            type='text'
                            value={specificRecord}
                            onChange={(e) => setSpecificRecord(e.target.value)}
                            placeholder='e.g., Grade 10-A Mathematics CA-1 Marks'
                            className='w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#515DEF] focus:outline-none'
                            required
                        />
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-[#334155] mb-1'>
                            Justification / Reason for Re-Entry
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder='Provide detailed explanation for the post-closure modification...'
                            className='w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-sm text-[#1E293B] focus:border-[#515DEF] focus:outline-none'
                            required
                        />
                    </div>

                    <div className='flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]'>
                        <button
                            type='button'
                            onClick={() => setIsDialogOpen(false)}
                            className='rounded-xl border border-[#CBD5E1] px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] cursor-pointer'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={isSubmitting}
                            className='rounded-xl bg-[#515DEF] hover:bg-[#434EBD] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50'
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit to Super Admin'}
                        </button>
                    </div>
                </form>
            </Dialog>

            <div className={isBlocked ? 'pointer-events-none opacity-60' : ''}>
                {children}
            </div>
        </div>
    )
}
