/**
 * Pure helpers that build audit component / schedule dropdown options from server rows.
 * No fixed lists: options come only from saved components and schedules.
 */

export const componentStream = (row) => String(row?.stream || row?.auditStream || '').trim().toUpperCase()

const isActive = (row) => String(row?.active ?? 'Yes').trim().toLowerCase() !== 'no'

/** Active components that belong to `stream` (unstamped legacy rows are shared). */
export const componentsForStream = (rows, stream) => {
    const wanted = String(stream || '').toUpperCase()
    return (Array.isArray(rows) ? rows : []).filter(
        (row) => row && String(row.component || '').trim() && isActive(row) && ['', wanted].includes(componentStream(row)),
    )
}

export const componentLabel = (row) =>
    row?.subComponent ? `${row.component} / ${row.subComponent}` : String(row?.component || '')

export const findScheduleForReference = (schedules, reference) => {
    const ref = String(reference || '').trim()
    if (!ref) return null
    return (Array.isArray(schedules) ? schedules : []).find(
        (item) => item && (item.auditId === ref || item.scheduleId === ref || item.id === ref),
    ) || null
}

const toOption = (row) => ({ value: String(row.component), label: componentLabel(row), componentId: row.id || '' })

const dedupe = (options) => {
    const seen = new Set()
    return options.filter((option) => {
        const key = `${option.componentId}|${option.value}`
        if (!option.value || seen.has(key)) return false
        seen.add(key)
        return true
    })
}

/**
 * Component options for an observation. When the selected audit reference maps to a schedule that
 * has a component, only that component is offered; otherwise every active component of the stream.
 */
export const componentOptionsFor = ({ components, schedules, auditReference, stream }) => {
    const own = componentsForStream(components, stream)
    const schedule = findScheduleForReference(schedules, auditReference)
    if (schedule && (schedule.componentId || schedule.componentName)) {
        const linked = own.filter(
            (row) => (schedule.componentId && row.id === schedule.componentId) || (!schedule.componentId && row.component === schedule.componentName),
        )
        if (linked.length) return dedupe(linked.map(toOption))
        return schedule.componentName
            ? [{ value: String(schedule.componentName), label: String(schedule.componentName), componentId: schedule.componentId || '' }]
            : []
    }
    return dedupe(own.map(toOption))
}

/** Audit reference options: saved schedules only, plus the current value so an edit never loses it. */
export const auditReferenceOptions = (schedules, current = '') => {
    const values = (Array.isArray(schedules) ? schedules : [])
        .map((item) => ({
            value: String(item?.auditId || item?.scheduleId || ''),
            label: [item?.auditId || item?.scheduleId, item?.auditName, item?.componentName].filter(Boolean).join(' · '),
        }))
        .filter((item) => item.value)
    if (current && !values.some((item) => item.value === current)) values.unshift({ value: current, label: current })
    const seen = new Set()
    return values.filter((item) => (seen.has(item.value) ? false : seen.add(item.value)))
}

/** Rubric-1..4 of a component as four independent values (never joined or split). */
export const rubricsOf = (row) => ({
    rubric1: String(row?.rubric1 ?? ''),
    rubric2: String(row?.rubric2 ?? ''),
    rubric3: String(row?.rubric3 ?? ''),
    rubric4: String(row?.rubric4 ?? ''),
})
