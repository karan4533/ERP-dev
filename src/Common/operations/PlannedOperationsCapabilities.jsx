import { Archive, Building2, Camera, Wrench } from 'lucide-react'
import { IntegrationNotice, StatusBadge } from '../ui'

const capabilities = [
    {
        title: 'File Room',
        owner: 'Administration / Records Officer',
        icon: Archive,
        scope: ['File classification and accession', 'Issue, return and custody chain', 'Retention, archival and disposal approval', 'Search, barcode and audit history'],
        contracts: ['File, classification and retention models', 'Custodian and requester permissions', 'Document storage and barcode service', 'Immutable circulation and disposal audit'],
    },
    {
        title: 'CCTV',
        owner: 'Security / IT',
        icon: Camera,
        scope: ['Camera and zone registry', 'Health, outage and maintenance state', 'Incident-linked footage requests', 'Retention, access review and evidence export'],
        contracts: ['Video management system integration', 'Privacy and evidence-access policy', 'Storage/retention configuration', 'Security approval and access audit'],
    },
    {
        title: 'Public Relations (PRO)',
        owner: 'Public Relations Officer',
        icon: Building2,
        scope: ['Public inquiry and visit pipeline', 'Campaign, media and event calendar', 'Content and consent approvals', 'Stakeholder follow-up and outcome reporting'],
        contracts: ['PRO role and permission matrix', 'Contact, campaign and approval models', 'Consent-aware media repository', 'Email/SMS and publishing integrations'],
    },
    {
        title: 'Unified Maintenance',
        owner: 'Facilities / Operations',
        icon: Wrench,
        scope: ['Asset and location work orders', 'Priority, SLA, technician and vendor assignment', 'Spares, downtime and cost capture', 'Inspection, approval, evidence and closure'],
        contracts: ['Unified asset/location registry', 'Work-order state machine and SLA policy', 'Technician/vendor RBAC and scheduling', 'Procurement, inventory and finance integration'],
    },
]

const PlannedOperationsCapabilities = () => (
    <section className='space-y-5'>
        <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
            <div className='flex flex-wrap items-start gap-3'>
                <div className='min-w-0 flex-1'>
                    <h2 className='text-xl font-semibold text-[var(--erp-ink)]'>Planned operations capabilities</h2>
                    <p className='mt-1 text-sm text-[var(--erp-slate)]'>These documented capabilities are not implemented as complete frontend workflows. This roadmap defines the minimum product and backend boundary required before navigation, forms or approvals are activated.</p>
                </div>
                <StatusBadge status='Specification required' />
            </div>
            <IntegrationNotice state='disconnected' className='mt-4' title='Implementation intentionally gated' description='Do not treat existing asset, visitor, ticket or maintenance fragments as substitutes for these modules. Product ownership, role permissions, authoritative models, retention rules and integrations must be approved first.' />
        </div>

        <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
            {capabilities.map((capability) => {
                const Icon = capability.icon
                return (
                    <article key={capability.title} className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
                        <div className='flex items-start gap-3'>
                            <span className='inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F2FF] text-[var(--erp-indigo)]'><Icon aria-hidden='true' size={20} /></span>
                            <div className='min-w-0 flex-1'><h3 className='font-semibold text-[var(--erp-ink)]'>{capability.title}</h3><p className='mt-0.5 text-xs text-[var(--erp-muted)]'>Proposed owner: {capability.owner}</p></div>
                            <StatusBadge status='Planned' />
                        </div>
                        <div className='mt-5 grid gap-5 sm:grid-cols-2'>
                            <div><h4 className='text-xs font-semibold uppercase tracking-wide text-[var(--erp-muted)]'>Required workflow scope</h4><ul className='mt-2 space-y-2 text-sm text-[var(--erp-slate)]'>{capability.scope.map((item) => <li key={item} className='flex gap-2'><span aria-hidden='true'>•</span><span>{item}</span></li>)}</ul></div>
                            <div><h4 className='text-xs font-semibold uppercase tracking-wide text-[var(--erp-muted)]'>Required contracts</h4><ul className='mt-2 space-y-2 text-sm text-[var(--erp-slate)]'>{capability.contracts.map((item) => <li key={item} className='flex gap-2'><span aria-hidden='true'>•</span><span>{item}</span></li>)}</ul></div>
                        </div>
                    </article>
                )
            })}
        </div>
    </section>
)

export default PlannedOperationsCapabilities
