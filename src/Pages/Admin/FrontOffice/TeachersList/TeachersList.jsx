import React, { useCallback } from 'react'
import AdminLiveDataList from '../../Components/AdminLiveDataList'
import { canUseEmployeeDirectoryApi, loadEmployeeDirectory } from '../../../../services/employeeDirectoryApi'

const COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'status', label: 'Status' },
]

const isTeacherLike = (row) => {
    const blob = `${row.designation || ''} ${row.role || ''} ${row.department || ''}`.toLowerCase()
    return blob.includes('teacher') || blob.includes('faculty') || blob.includes('academic')
}

export default function TeachersList() {
    const loadRows = useCallback(async () => {
        if (!canUseEmployeeDirectoryApi()) throw new Error('Employee directory API is not enabled.')
        const directory = await loadEmployeeDirectory()
        const records = directory.records || []
        return records
            .map((item) => {
                const row = item.detail || item.row || item
                return {
                    id: row.id || row.employeeId || row.email,
                    name: row.name || row.full_name || '—',
                    employeeId: row.employeeId || row.employee_code || row.id || '—',
                    email: row.email || row.contact?.email || '—',
                    department: row.department || row.departmentName || '—',
                    designation: row.designation || row.role || '—',
                    mobile: row.mobile || row.phone || row.contact?.phone || '—',
                    status: row.status || 'Active',
                    role: row.role || row.designation || '',
                }
            })
            .filter(isTeacherLike)
    }, [])

    return (
        <AdminLiveDataList
            title='Teachers List'
            description='Live HR employee directory filtered to teacher/faculty designations.'
            columns={COLUMNS}
            loadRows={loadRows}
            searchKeys={['name', 'employeeId', 'email', 'department']}
        />
    )
}
