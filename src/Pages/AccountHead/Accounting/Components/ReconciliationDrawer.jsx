import { useState } from 'react'
import { Check } from 'lucide-react'
import { ConfirmAction, Drawer, StatusBadge } from '../../../../Common/ui'

const SectionLabel = ({ children }) => (
    <p className='mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--erp-muted)]'>{children}</p>
)

const DetailRow = ({ label, value }) => (
    <div className='flex justify-between gap-4 border-b border-[var(--erp-line)] py-2 text-sm last:border-b-0'>
        <span className='shrink-0 text-[var(--erp-muted)]'>{label}</span>
        <span className='text-right font-medium text-[var(--erp-ink)]'>{value || 'Not recorded'}</span>
    </div>
)

const EntryPanel = ({ title, entry, emptyMessage }) => (
    <div>
        <SectionLabel>{title}</SectionLabel>
        {!entry ? (
            <p className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] px-3 py-3 text-sm text-[var(--erp-slate)]'>{emptyMessage}</p>
        ) : (
            <div className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] px-3 py-1'>
                <DetailRow label='Date' value={entry.date} />
                <DetailRow label={entry.voucher ? 'Voucher' : 'Reference'} value={entry.voucher ?? entry.reference} />
                <DetailRow label='Description' value={entry.description} />
                <DetailRow label='Amount' value={entry.amount} />
            </div>
        )}
    </div>
)

const confidenceTone = {
    High: 'text-[var(--erp-green)] bg-[#EAF7EE]',
    Medium: 'text-[#9A5B00] bg-[#FFF4D6]',
    Low: 'text-[var(--erp-slate)] bg-[var(--erp-canvas)]',
}

const ReconciliationDrawer = ({
    isOpen,
    onClose,
    entry,
    onReconcile,
    selectedSuggestionId,
    onSelectSuggestion,
}) => {
    const [confirmOpen, setConfirmOpen] = useState(false)
    if (!entry) return null

    const { detail } = entry
    const canReconcile = entry.status !== 'Matched'
    const suggestions = detail.suggestions ?? []
    const selectionRequired = suggestions.length > 0 && !selectedSuggestionId

    const confirmReconciliation = () => {
        onReconcile(entry.id, selectedSuggestionId)
        setConfirmOpen(false)
    }

    const closeDrawer = () => {
        setConfirmOpen(false)
        onClose()
    }

    return (
        <>
            <Drawer
                open={isOpen}
                onClose={closeDrawer}
                title='Reconciliation review'
                description={`${entry.voucher !== '—' ? entry.voucher : entry.date} · ${entry.bank}`}
                footer={canReconcile ? (
                    <button type='button' onClick={() => setConfirmOpen(true)} disabled={selectionRequired} className='inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50'>
                        <Check aria-hidden='true' size={16} /> Review and confirm match
                    </button>
                ) : <span className='text-sm font-semibold text-[var(--erp-green)]'>This entry is already matched.</span>}
            >
                <div className='space-y-6'>
                    <div className='flex items-center justify-between gap-3'>
                        <div>
                            <p className='text-base font-semibold text-[var(--erp-ink)]'>{entry.bank}</p>
                            <p className='mt-0.5 text-sm text-[var(--erp-muted)]'>{entry.date}</p>
                        </div>
                        <StatusBadge status={entry.status} />
                    </div>

                    <dl className='grid grid-cols-3 gap-3'>
                        <div className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] px-3 py-2.5 text-center'><dt className='text-[10px] uppercase text-[var(--erp-muted)]'>ERP</dt><dd className='mt-1 text-sm font-semibold text-[var(--erp-ink)]'>{entry.erpAmount}</dd></div>
                        <div className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] px-3 py-2.5 text-center'><dt className='text-[10px] uppercase text-[var(--erp-muted)]'>Bank</dt><dd className='mt-1 text-sm font-semibold text-[var(--erp-ink)]'>{entry.bankAmount}</dd></div>
                        <div className='rounded-lg border border-[#F6C9BD] bg-[#FFF5F2] px-3 py-2.5 text-center'><dt className='text-[10px] uppercase text-[var(--erp-red)]'>Difference</dt><dd className='mt-1 text-sm font-semibold text-[var(--erp-red)]'>{entry.difference}</dd></div>
                    </dl>

                    <EntryPanel title='ERP entry' entry={detail.erpEntry} emptyMessage='No matching ERP entry is recorded. Select an available suggestion before confirming a match.' />
                    <EntryPanel title='Bank entry' entry={detail.bankEntry} emptyMessage='No bank statement line is available. Statement import remains unavailable until a bank feed or approved parser is connected.' />

                    <div>
                        <SectionLabel>Matching suggestions</SectionLabel>
                        {suggestions.length === 0 ? (
                            <p className='rounded-lg border border-[var(--erp-line)] bg-[var(--erp-canvas)] px-3 py-3 text-sm text-[var(--erp-slate)]'>No local matching suggestions are available for this entry.</p>
                        ) : (
                            <div className='space-y-2'>
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion.id}
                                        type='button'
                                        onClick={() => onSelectSuggestion(suggestion.id)}
                                        aria-pressed={selectedSuggestionId === suggestion.id}
                                        className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${selectedSuggestionId === suggestion.id ? 'border-[var(--erp-indigo)] bg-[#F4F4FF]' : 'border-[var(--erp-line)] bg-[var(--erp-canvas)] hover:border-[var(--erp-indigo)]'}`}
                                    >
                                        <div className='flex items-start justify-between gap-2'>
                                            <p className='text-sm font-medium text-[var(--erp-ink)]'>{suggestion.label}</p>
                                            <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${confidenceTone[suggestion.confidence] || confidenceTone.Low}`}>{suggestion.confidence}</span>
                                        </div>
                                        <p className='mt-1.5 text-xs text-[var(--erp-muted)]'>ERP {suggestion.erpAmount} · Bank {suggestion.bankAmount}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Drawer>

            <ConfirmAction
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmReconciliation}
                title='Confirm reconciliation match?'
                description='This marks the browser-stored entry as matched. Production must validate the accounting period, bank evidence, permissions and immutable audit trail.'
                confirmLabel='Confirm match'
                confirmDisabled={!canReconcile || selectionRequired}
            />
        </>
    )
}

export default ReconciliationDrawer
