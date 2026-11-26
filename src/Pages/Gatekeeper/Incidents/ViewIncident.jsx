import React from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { getIncidentById } from '../../../Common/demoDomain/securityIncidents'
import { deriveIncidentSla } from '../../../Common/operations/incidentState'
import { FeedbackState, IntegrationNotice, StatusBadge } from '../../../Common/ui'

const formatTimestamp = (value) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'Timestamp unavailable' : date.toLocaleString('en-IN')
}

const ViewIncident = () => {
    const { id } = useParams()
    const incident = getIncidentById(id)
    if (!incident) return <FeedbackState kind='empty' title='Incident not found' description='The incident may have been removed from browser storage or the link is invalid.' action={<NavLink className='text-[var(--erp-indigo)]' to='/gate-keeper/incidents'>Back to incidents</NavLink>} />
    const slaState = deriveIncidentSla(incident)
    return (
        <section className='space-y-5'>
            <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
                <NavLink to='/gate-keeper/incidents' className='text-sm font-semibold text-[var(--erp-indigo)]'>← Back to incidents</NavLink>
                <div className='mt-4 flex flex-wrap items-center gap-2'><h2 className='mr-auto text-xl font-semibold text-[var(--erp-ink)]'>{incident.id} · {incident.incidentType}</h2><StatusBadge status={incident.priority} /><StatusBadge status={slaState} /><StatusBadge status={incident.status} /></div>
                <p className='mt-2 text-sm text-[var(--erp-slate)]'>{incident.description}</p>
                <IntegrationNotice state='demo' className='mt-4' title='Browser-stored safety record' description='This detail view is suitable for frontend workflow review, not authoritative legal, safety or compliance evidence.' />
            </div>
            <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
                <h3 className='font-semibold text-[var(--erp-ink)]'>Response context</h3>
                <dl className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {[['Occurred', `${incident.date} · ${incident.time}`], ['Location', incident.location], ['Reported by', incident.reportedBy], ['Assigned to', incident.assignedTo], ['SLA target', formatTimestamp(incident.dueAt)], ['Response window', `${incident.slaHours} hour${incident.slaHours === 1 ? '' : 's'}`]].map(([label, value]) => <div key={label} className='rounded-xl border border-[var(--erp-line)] p-3'><dt className='text-xs font-semibold uppercase tracking-wide text-[var(--erp-muted)]'>{label}</dt><dd className='mt-1 text-sm font-medium text-[var(--erp-ink)]'>{value}</dd></div>)}
                </dl>
            </div>
            <div className='rounded-2xl bg-white p-4 shadow-md sm:p-5'>
                <h3 className='font-semibold text-[var(--erp-ink)]'>Incident timeline</h3>
                <ol className='mt-4 space-y-4'>{incident.history.map((entry, index) => <li key={`${entry.at}-${index}`} className='border-l-2 border-[var(--erp-line-strong)] pl-4'><div className='flex flex-wrap items-center gap-2'><StatusBadge status={entry.status} /><span className='text-xs text-[var(--erp-muted)]'>{formatTimestamp(entry.at)}</span></div><p className='mt-2 text-sm font-medium text-[var(--erp-ink)]'>{entry.note}</p><p className='mt-0.5 text-xs text-[var(--erp-slate)]'>Actor: {entry.actor}</p></li>)}</ol>
            </div>
        </section>
    )
}

export default ViewIncident
