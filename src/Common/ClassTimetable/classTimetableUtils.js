export const getPeriodSubject = (period) => {
    if (!period) return ''
    if (typeof period === 'string') return period
    return period.subject ?? ''
}

export const getPeriodTeacher = (period) => {
    if (!period || typeof period === 'string') return ''
    return period.teacher ?? ''
}

export const getPeriodDate = (period) => {
    if (!period || typeof period === 'string') return ''
    return period.date ?? ''
}
