import { useEffect, useMemo, useState } from 'react'
import { AUDIT_COMPONENTS_KEY, COMPONENT_SEED } from '../demoDomain/auditSeeds'
import { ensureSeed } from '../demoDomain/storage'
import { getCampusLoadState, hydrateCampusKey } from '../../services/campusJsonStore'
import { auditReferenceOptions, componentOptionsFor } from './auditComponentOptions'

const failedState = (key) => {
    const state = getCampusLoadState(key)
    return state.api && state.status === 'failed' ? state.error || 'Could not load from the server.' : ''
}

/**
 * Loads saved audit components + the stream's schedules from the server before building the
 * Component / Audit Reference dropdowns. `scheduleKey` is the stream's schedule storage key.
 */
export default function useAuditObservationOptions({ stream, scheduleKey, getSchedules, hydrateSchedules, auditReference }) {
    const [components, setComponents] = useState([])
    const [schedules, setSchedules] = useState([])
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        Promise.all([hydrateCampusKey(AUDIT_COMPONENTS_KEY), hydrateSchedules()]).finally(() => {
            if (!active) return
            const problem = failedState(AUDIT_COMPONENTS_KEY) || failedState(scheduleKey)
            setComponents(ensureSeed(AUDIT_COMPONENTS_KEY, COMPONENT_SEED) || [])
            setSchedules(getSchedules() || [])
            setError(problem)
            setStatus(problem ? 'failed' : 'loaded')
        })
        return () => {
            active = false
        }
    }, [scheduleKey, getSchedules, hydrateSchedules])

    const componentOptions = useMemo(
        () => componentOptionsFor({ components, schedules, auditReference, stream }),
        [components, schedules, auditReference, stream],
    )
    const referenceOptions = useMemo(() => auditReferenceOptions(schedules, auditReference), [schedules, auditReference])

    return { status, error, componentOptions, referenceOptions }
}
