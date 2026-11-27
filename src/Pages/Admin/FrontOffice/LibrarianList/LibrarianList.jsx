import React, { useCallback } from 'react'
import AdminLiveDataList from '../../Components/AdminLiveDataList'
import { canUseEmployeeDirectoryApi, loadEmployeeDirectory } from '../../../../services/employeeDirectoryApi'

const COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'email', label: 'Email' },
    { key: 'designation', label: 'Designation' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'status', label: 'Status' },
]

export default function LibrarianList() {
    const loadRows = useCallback(async () => {
        if (!canUseEmployeeDirectoryApi()) throw new Error('Employee directory API is not enabled.')
        const directory = await loadEmployeeDirectory()
        return (directory.records || [])
            .map((item) => {
                const row = item.detail || item.row || item
                return {
                    id: row.id || row.email,
                    name: row.name || '—',
                    employeeId: row.employeeId || row.employee_code || '—',
                    email: row.email || '—',
                    designation: row.designation || row.role || '—',
                    mobile: row.mobile || row.phone || '—',
                    status: row.status || 'Active',
                }
            })
            .filter((row) => /librarian|library/i.test(`${row.designation}`))
    }, [])

    return (
        <AdminLiveDataList
            title='Librarian List'
            description='Live HR directory filtered to librarian designations.'
            columns={COLUMNS}
            loadRows={loadRows}
            searchKeys={['name', 'email', 'employeeId']}
        />
    )
}
