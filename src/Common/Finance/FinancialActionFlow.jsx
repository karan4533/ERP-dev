import { Check, CircleDot, RotateCcw } from 'lucide-react'

const STAGES = [
    { name: 'Calculate', description: 'Create working values from approved source records.' },
    { name: 'Review', description: 'Validate totals, exceptions and supporting evidence.' },
    { name: 'Approve', description: 'Record the authorized business decision.' },
    { name: 'Post', description: 'Commit approved entries to the accounting ledger.' },
    { name: 'Pay', description: 'Send or record the settlement after posting.' },
    { name: 'Reverse', description: 'Correct a posted item through a governed reversal.', exceptional: true },
]

const FinancialActionFlow = ({ current = 'Review', completed = [], title = 'Transaction lifecycle' }) => (
    <section className='rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white p-4' aria-labelledby='financial-action-flow-title'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
            <div>
                <h2 id='financial-action-flow-title' className='text-base font-semibold text-[var(--erp-ink)]'>{title}</h2>
                <p className='text-sm text-[var(--erp-slate)]'>Each action has a distinct permission, audit event and integration boundary.</p>
            </div>
            <p className='text-xs font-medium text-[var(--erp-muted)]'>Current stage: {current}</p>
        </div>
        <ol className='mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6'>
            {STAGES.map((stage, index) => {
                const isComplete = completed.includes(stage.name)
                const isCurrent = current === stage.name
                const Icon = stage.exceptional ? RotateCcw : (isComplete ? Check : CircleDot)
                return (
                    <li key={stage.name} aria-current={isCurrent ? 'step' : undefined} className={`rounded-lg border p-3 ${isCurrent ? 'border-[var(--erp-indigo)] bg-[var(--erp-indigo-soft)]' : 'border-[var(--erp-line)] bg-white'}`}>
                        <div className='flex items-center gap-2'>
                            <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${isComplete ? 'bg-[var(--erp-green)] text-white' : 'bg-[var(--erp-canvas)] text-[var(--erp-indigo)]'}`}>
                                <Icon aria-hidden='true' size={13} />
                            </span>
                            <span className='text-sm font-semibold text-[var(--erp-ink)]'>{index + 1}. {stage.name}</span>
                        </div>
                        <p className='mt-2 text-xs leading-5 text-[var(--erp-slate)]'>{stage.description}</p>
                    </li>
                )
            })}
        </ol>
    </section>
)

export default FinancialActionFlow
