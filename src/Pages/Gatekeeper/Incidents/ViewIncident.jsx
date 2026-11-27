import React from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { getIncidentById } from '../../../Common/demoDomain/securityIncidents'

const ViewIncident = () => {
    const { id } = useParams()
    const incident = getIncidentById(id)
    if (!incident) return <p className='text-sm text-[#667085]'>Incident not found. <NavLink className='text-[#515DEF]' to='/gate-keeper/incidents'>Back to list</NavLink></p>
    return (
        <section className='bg-white rounded-2xl shadow-md p-4 space-y-3'>
            <NavLink to='/gate-keeper/incidents' className='text-sm text-[#515DEF]'>Back to CSO / Gate Keeper list</NavLink>
            <h2 className='text-xl font-semibold'>{incident.id}</h2>
            {[['Type', incident.incidentType], ['Date', incident.date], ['Time', incident.time], ['Location', incident.location], ['Description', incident.description], ['Report To', incident.reportTo], ['Reported By', incident.reportedBy], ['Priority', incident.priority], ['Status', incident.status]].map(([label, value]) => (
                <p key={label} className='text-sm'><span className='text-[#808080]'>{label}: </span>{value}</p>
            ))}
        </section>
    )
}

export default ViewIncident
