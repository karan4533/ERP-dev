import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../../context/AuthContext'
import ExamSchedulePanel from '../../../../Common/ExamSchedule/ExamSchedulePanel'
import {
    filterCoordinatorInbox,
    loadMergedExamRecords,
    toScheduleRow,
} from '../../../../Common/ExamSchedule/examScheduleData'
import { getMyGradeBandApi } from '../../../../services/placementApi'
import { canUseExamsApi } from '../../../../services/examsApi'

/**
 * Coordinator exam inbox: approved (or awaiting-forward) timetables for their grade band.
 * View Timetable opens the same modal as Principal/Director with live day/subject rows.
 */
const ExamSchedule = () => {
    const { email, name } = useAuth()
    const api = canUseExamsApi()
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const refresh = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            let band = null
            if (api) {
                try {
                    band = await getMyGradeBandApi()
                } catch {
                    band = null
                }
            }
            const records = await loadMergedExamRecords()
            const inbox = filterCoordinatorInbox(records, {
                email,
                name,
                gradeFrom: band?.gradeFrom ?? band?.grade_from ?? null,
                gradeTo: band?.gradeTo ?? band?.grade_to ?? null,
            })
            // Also show already-forwarded / visible exams for this coordinator's classes
            // so View Timetable stays available after forwarding.
            const visibleIds = new Set(inbox.map((row) => String(row.id)))
            const extras = records.filter((row) => {
                if (visibleIds.has(String(row.id))) return false
                const status = String(row.status || row.approvalStatus || '').toLowerCase()
                if (!(status.includes('approv') || status.includes('publish') || status === 'published')) {
                    return false
                }
                if (band?.gradeFrom != null && band?.gradeTo != null) {
                    const grade = Number(String(row.className || '').match(/(\d{1,2})/)?.[1])
                    if (!Number.isFinite(grade)) return false
                    return grade >= Number(band.gradeFrom) && grade <= Number(band.gradeTo)
                }
                return true
            })
            setRows([...inbox, ...extras].map(toScheduleRow))
        } catch (err) {
            setRows([])
            setError(err?.message || 'Could not load exam timetables.')
        } finally {
            setLoading(false)
        }
    }, [api, email, name])

    useEffect(() => {
        refresh()
    }, [refresh])

    return (
        <ExamSchedulePanel
            title='Exam Schedule'
            description='Approved examination timetables for your grade band. Open View Timetable to see day, subject, and timing details, then forward to the class when ready.'
            rows={rows}
            loading={loading}
            error={error}
            mode='forward'
            onForwarded={() => refresh()}
            emptyMessage='No exam timetables waiting in your inbox yet.'
        />
    )
}

export default ExamSchedule
