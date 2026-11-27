import AuditorObservationsList from '../../../Common/Observations/AuditorObservationsList'
import {
    getObservations,
    hydrateFromApi,
    DEPARTMENTS,
    PRIORITIES,
    CATEGORIES,
    OPEN_STATUSES,
    CLOSED_STATUSES,
    statusBadgeColor,
    priorityBadgeColor,
} from './observationsData'

const ObservationsList = ({ variant = 'open' }) => (
    <AuditorObservationsList
        variant={variant}
        routeBase='/process-auditor/observations'
        getObservations={getObservations}
        hydrateFromApi={hydrateFromApi}
        DEPARTMENTS={DEPARTMENTS}
        PRIORITIES={PRIORITIES}
        CATEGORIES={CATEGORIES}
        OPEN_STATUSES={OPEN_STATUSES}
        CLOSED_STATUSES={CLOSED_STATUSES}
        statusBadgeColor={statusBadgeColor}
        priorityBadgeColor={priorityBadgeColor}
    />
)

export default ObservationsList
