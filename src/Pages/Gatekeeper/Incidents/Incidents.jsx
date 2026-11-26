import SecurityIncidentRegister from '../../../Common/operations/SecurityIncidentRegister'

const Incidents = () => (
    <SecurityIncidentRegister
        actor='CSO / Gate Keeper'
        createPath='/gate-keeper/add-incident'
        viewPath={(incident) => `/gate-keeper/incidents/${incident.id}`}
    />
)

export default Incidents
