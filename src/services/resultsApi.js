import { apiRequest, getAccessToken, isApiAuthEnabled } from './apiClient'

export const canUseResultsApi = () => isApiAuthEnabled() && Boolean(getAccessToken())

export const getStudentResultsApi = (studentId) =>
    apiRequest(`/results/students/${encodeURIComponent(studentId)}`)

const query = (params) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            if (value.length) qs.set(key, value.join(','))
        } else if (value != null && String(value).trim() !== '') {
            qs.set(key, String(value).trim())
        }
    })
    const text = qs.toString()
    return text ? `?${text}` : ''
}

/** Term report card from published marks. examTypes = the exam types that make up the term. */
export const getReportCardApi = (studentId, { academicYear, examTypes, term } = {}) =>
    apiRequest(`/report-cards/students/${encodeURIComponent(studentId)}${query({ academicYear, examTypes, term })}`)

/** Grade-wise analytics over published marks, scoped server-side to the caller's classes. */
export const getClassAnalyticsApi = ({ className, section, examId, academicYear, examTypes } = {}) =>
    apiRequest(`/results/analytics${query({ className, section, examId, academicYear, examTypes })}`)
