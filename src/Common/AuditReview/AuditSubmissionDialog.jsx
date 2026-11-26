import { AlertTriangle } from 'lucide-react'
import Dialog from '../ui/Dialog'
import { summarizeAuditSubmissionGaps } from '../AuditGovernance/auditGovernanceState.js'

const AuditSubmissionDialog = ({ open, gaps = [], onReview, onClose }) => {
    const summary = summarizeAuditSubmissionGaps(gaps)
    return (
        <Dialog open={open} onClose={onClose} title='Audit not ready for submission' description={`${summary.total} governance blocker${summary.total === 1 ? '' : 's'} must be resolved.`} size='lg' footer={<button type='button' onClick={onReview} className='min-h-10 rounded-lg bg-[var(--erp-primary)] px-4 text-sm font-semibold text-white'>Review blockers</button>}>
            <div className='flex items-start gap-3 rounded-lg border border-[#F0D2AD] bg-[#FFF8EF] p-3 text-sm text-[#77400D]'><AlertTriangle aria-hidden='true' className='mt-0.5 shrink-0' size={18} /><p>Submission cannot bypass missing answers, evidence, ownership, due dates, or template identity. Verification remains a separate reviewer action.</p></div>
            <dl className='mt-4 grid gap-3 sm:grid-cols-4'><div className='rounded-lg bg-[var(--erp-canvas)] p-3'><dt className='text-xs text-[var(--erp-muted)]'>Unanswered</dt><dd className='mt-1 text-lg font-semibold text-[var(--erp-ink)]'>{summary.unanswered}</dd></div><div className='rounded-lg bg-[var(--erp-canvas)] p-3'><dt className='text-xs text-[var(--erp-muted)]'>Evidence gaps</dt><dd className='mt-1 text-lg font-semibold text-[var(--erp-ink)]'>{summary.evidence}</dd></div><div className='rounded-lg bg-[var(--erp-canvas)] p-3'><dt className='text-xs text-[var(--erp-muted)]'>Finding gaps</dt><dd className='mt-1 text-lg font-semibold text-[var(--erp-ink)]'>{summary.findings}</dd></div><div className='rounded-lg bg-[var(--erp-canvas)] p-3'><dt className='text-xs text-[var(--erp-muted)]'>Configuration</dt><dd className='mt-1 text-lg font-semibold text-[var(--erp-ink)]'>{summary.configuration}</dd></div></dl>
            <ol className='mt-4 max-h-64 space-y-2 overflow-y-auto'>{gaps.slice(0, 8).map((item, index) => <li key={`${item.code}-${item.parameterId || index}`} className='rounded-lg border border-[var(--erp-line)] px-3 py-2 text-sm text-[var(--erp-slate)]'>{item.message}</li>)}</ol>
            {gaps.length > 8 && <p className='mt-3 text-xs text-[var(--erp-muted)]'>Plus {gaps.length - 8} additional blockers.</p>}
        </Dialog>
    )
}

export default AuditSubmissionDialog
