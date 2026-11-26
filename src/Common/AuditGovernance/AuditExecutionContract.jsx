import { FileCheck2, Scale, ShieldAlert } from 'lucide-react'
import { IntegrationNotice, StatusBadge, Surface } from '../ui'
import { getAuditSubmissionGaps, getAuditSubmissionReadiness, summarizeAuditSubmissionGaps } from './auditGovernanceState.js'

const ContractLine = ({ icon, title, children }) => (
    <div className='grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-t border-[var(--erp-line)] py-4 first:border-t-0 first:pt-0 last:pb-0'>
        <span className='inline-flex size-9 items-center justify-center rounded-lg bg-[var(--erp-canvas)] text-[var(--erp-primary)]'>{icon}</span>
        <div><h3 className='text-sm font-semibold text-[var(--erp-ink)]'>{title}</h3><div className='mt-1 text-sm leading-6 text-[var(--erp-slate)]'>{children}</div></div>
    </div>
)

const AuditExecutionContract = ({ header, sections, responses, observations, auditMode = 'process' }) => {
    const audit = { header, sections, responses, observations }
    const readiness = getAuditSubmissionReadiness(audit)
    const summary = summarizeAuditSubmissionGaps(getAuditSubmissionGaps(audit))
    const rubric = auditMode === 'quality'
        ? 'Ratings 4–5 are conforming, 3 is partial, and 1–2 require a governed finding.'
        : 'Yes is conforming. No or Error requires a governed finding before submission.'

    return (
        <Surface className='overflow-hidden'>
            <div className='grid xl:grid-cols-[minmax(0,0.75fr)_minmax(20rem,0.25fr)]'>
                <div className='p-4 sm:p-6'>
                    <div className='mb-4 flex flex-wrap items-start justify-between gap-3'><div><h2 className='text-base font-semibold text-[var(--erp-ink)]'>Audit execution contract</h2><p className='mt-1 text-sm text-[var(--erp-muted)]'>The template, rubric and evidence rules that govern this audit submission.</p></div><StatusBadge status={readiness} /></div>
                    <ContractLine icon={<FileCheck2 aria-hidden='true' size={18} />} title='Template identity'><span className='font-semibold text-[var(--erp-ink)]'>{header.templateName || 'Template not recorded'}</span> · version {header.templateVersion || 'missing'}. The checklist structure is read-only during execution.</ContractLine>
                    <ContractLine icon={<Scale aria-hidden='true' size={18} />} title='Scoring rubric'>{rubric}</ContractLine>
                    <ContractLine icon={<ShieldAlert aria-hidden='true' size={18} />} title='Evidence and finding policy'>Every non-conforming check needs a comment, evidence, finding title and description, accountable owner, due date, and submitted finding record.</ContractLine>
                </div>
                <div className='border-t border-[var(--erp-line)] bg-[var(--erp-canvas)] p-4 sm:p-6 xl:border-l xl:border-t-0'>
                    <IntegrationNotice state='demo' title='Browser audit draft' description='Responses and evidence filenames are browser-stored demonstration data. Authoritative evidence files, immutable audit logs, assignment notifications and reviewer verification require backend services.' />
                    <dl className='mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm'><div><dt className='text-xs text-[var(--erp-muted)]'>Checklist sections</dt><dd className='mt-1 font-semibold text-[var(--erp-ink)]'>{sections.length}</dd></div><div><dt className='text-xs text-[var(--erp-muted)]'>Submission blockers</dt><dd className='mt-1 font-semibold text-[var(--erp-ink)]'>{summary.total}</dd></div></dl>
                </div>
            </div>
        </Surface>
    )
}

export default AuditExecutionContract
