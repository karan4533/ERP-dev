import React, { useCallback } from 'react'
import AdminLiveDataList from '../Components/AdminLiveDataList'
import { listExamsApi } from '../../../services/examsApi'

const COLUMNS = [
    { key: 'name', label: 'Exam' },
    { key: 'examType', label: 'Type' },
    { key: 'className', label: 'Class' },
    { key: 'section', label: 'Section' },
    { key: 'status', label: 'Status' },
    { key: 'startDate', label: 'Start' },
]

export default function ExamDetailsList() {
    const loadRows = useCallback(async () => {
        const rows = await listExamsApi()
        return (Array.isArray(rows) ? rows : []).map((row) => ({
            id: row.id || row.examId,
            name: row.name || row.title || row.examName || '—',
            examType: row.examType || row.type || '—',
            className: row.className || row.class_name || row.grade || '—',
            section: row.section || row.sectionName || '—',
            status: row.status || row.approvalStatus || '—',
            startDate: row.startDate || row.examDate || row.schedule?.start || '—',
        }))
    }, [])

    return (
        <AdminLiveDataList
            title='Exam Details'
            description='Live exams from the academics API.'
            columns={COLUMNS}
            loadRows={loadRows}
            searchKeys={['name', 'examType', 'className', 'section']}
        />
    )
}
