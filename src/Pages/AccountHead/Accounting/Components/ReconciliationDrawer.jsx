import React, { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { reconciliationStatusBadgeColor } from '../accountingData'

const SectionLabel = ({ children }) => (
    <p className='text-[10px] font-semibold text-[#808080] uppercase tracking-wide mb-2'>{children}</p>
)

const DetailRow = ({ label, value }) => (
    <div className='flex justify-between gap-4 py-2 border-b border-[#F2F4F7] last:border-b-0 text-sm'>
        <span className='text-[#667085] shrink-0'>{label}</span>
        <span className='text-[#1E1E1E] font-medium text-right'>{value}</span>
    </div>
)

const EntryPanel = ({ title, entry, emptyMessage }) => (
    <div>
        <SectionLabel>{title}</SectionLabel>
        {!entry ? (
            <p className='text-sm text-[#667085] bg-[#F9F9F9] border border-[#F2F4F7] rounded-lg px-3 py-3'>
                {emptyMessage}
            </p>
        ) : (
            <div className='bg-[#F9F9F9] border border-[#F2F4F7] rounded-lg px-3 py-1'>
                <DetailRow label='Date' value={entry.date} />
                <DetailRow label={entry.voucher ? 'Voucher' : 'Reference'} value={entry.voucher ?? entry.reference} />
                <DetailRow label='Description' value={entry.description} />
                <DetailRow label='Amount' value={entry.amount} />
            </div>
        )}
    </div>
)

const TRANSITION_MS = 300

const confidenceTone = {
    High: 'text-[#4CAF50] bg-[#4CAF501A]',
    Medium: 'text-[#FF9800] bg-[#FF98001A]',
    Low: 'text-[#667085] bg-[#6670851A]',
}

const ReconciliationDrawer = ({
    isOpen,
    onClose,
    entry,
    onReconcile,
    selectedSuggestionId,
    onSelectSuggestion,
}) => {
    const [mounted, setMounted] = useState(false)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (isOpen && entry) {
            setMounted(true)
            const frame = requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true))
            })
            return () => cancelAnimationFrame(frame)
        }

        setVisible(false)
        const timer = window.setTimeout(() => setMounted(false), TRANSITION_MS)
        return () => window.clearTimeout(timer)
    }, [isOpen, entry])

    useEffect(() => {
        if (!mounted) return undefined

        const handleEscape = (event) => {
            if (event.key === 'Escape') onClose()
        }

        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', handleEscape)

        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', handleEscape)
        }
    }, [mounted, onClose])

    if (!mounted || !entry) return null

    const { detail } = entry
    const canReconcile = entry.status !== 'Matched'
    const suggestions = detail.suggestions ?? []

    return (
        <div className='fixed inset-0 z-[100] flex justify-end'>
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${
                    visible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
                aria-hidden='true'
            />

            <aside
                className={`relative z-10 w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
                    visible ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className='flex items-center justify-between px-5 py-4 border-b border-[#F2F4F7] shrink-0'>
                    <div>
                        <h2 className='text-lg font-semibold text-[#1E1E1E]'>Reconciliation</h2>
                        <p className='text-xs text-[#667085] mt-0.5'>{entry.voucher !== '—' ? entry.voucher : entry.date}</p>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer'
                        aria-label='Close reconciliation drawer'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='flex-1 overflow-y-auto px-5 py-5 space-y-6'>
                    <div className='flex items-center justify-between gap-3'>
                        <div>
                            <p className='text-base font-semibold text-[#1E1E1E]'>{entry.bank}</p>
                            <p className='text-sm text-[#667085] mt-0.5'>{entry.date}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${reconciliationStatusBadgeColor[entry.status]}`}>
                            {entry.status}
                        </span>
                    </div>

                    <div className='grid grid-cols-3 gap-3'>
                        <div className='bg-[#F9F9F9] border border-[#F2F4F7] rounded-lg px-3 py-2.5 text-center'>
                            <p className='text-[10px] text-[#808080] uppercase'>ERP</p>
                            <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{entry.erpAmount}</p>
                        </div>
                        <div className='bg-[#F9F9F9] border border-[#F2F4F7] rounded-lg px-3 py-2.5 text-center'>
                            <p className='text-[10px] text-[#808080] uppercase'>Bank</p>
                            <p className='text-sm font-semibold text-[#1E1E1E] mt-1'>{entry.bankAmount}</p>
                        </div>
                        <div className='bg-[#FF57220D] border border-[#FF572233] rounded-lg px-3 py-2.5 text-center'>
                            <p className='text-[10px] text-[#FF5722] uppercase'>Diff</p>
                            <p className='text-sm font-semibold text-[#FF5722] mt-1'>{entry.difference}</p>
                        </div>
                    </div>

                    <EntryPanel
                        title='ERP Entry'
                        entry={detail.erpEntry}
                        emptyMessage='No matching ERP entry found. Select a suggestion below or post a journal voucher.'
                    />

                    <EntryPanel
                        title='Bank Entry'
                        entry={detail.bankEntry}
                        emptyMessage='No bank statement line found. Import the statement or wait for cheque clearance.'
                    />

                    <div>
                        <SectionLabel>Matching Suggestions</SectionLabel>
                        {suggestions.length === 0 ? (
                            <p className='text-sm text-[#667085] bg-[#F9F9F9] border border-[#F2F4F7] rounded-lg px-3 py-3'>
                                No automatic suggestions available for this entry.
                            </p>
                        ) : (
                            <div className='space-y-2'>
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion.id}
                                        type='button'
                                        onClick={() => onSelectSuggestion(suggestion.id)}
                                        className={`w-full text-left rounded-lg border px-3 py-3 transition-colors cursor-pointer ${
                                            selectedSuggestionId === suggestion.id
                                                ? 'border-[#515DEF] bg-[#515DEF0D]'
                                                : 'border-[#F2F4F7] bg-[#F9F9F9] hover:border-[#515DEF66]'
                                        }`}
                                    >
                                        <div className='flex items-start justify-between gap-2'>
                                            <p className='text-sm font-medium text-[#1E1E1E]'>{suggestion.label}</p>
                                            <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold ${confidenceTone[suggestion.confidence]}`}>
                                                {suggestion.confidence}
                                            </span>
                                        </div>
                                        <p className='text-xs text-[#667085] mt-1.5'>
                                            ERP {suggestion.erpAmount} · Bank {suggestion.bankAmount}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className='px-5 py-4 border-t border-[#F2F4F7] shrink-0'>
                    <button
                        type='button'
                        onClick={() => onReconcile(entry.id, selectedSuggestionId)}
                        disabled={!canReconcile}
                        className='w-full inline-flex items-center justify-center gap-2 bg-[#515DEF] text-white text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <Check size={16} />
                        Reconcile
                    </button>
                </div>
            </aside>
        </div>
    )
}

export default ReconciliationDrawer
