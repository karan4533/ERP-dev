import React from 'react'
import StudentDatabaseListView from '../../../Common/UserDatabase/StudentDatabaseListView'

const ROUTE_BASE = '/coordinator/user-management/students-list'

const StudentsList = () => (
    <StudentDatabaseListView
        routeBase={ROUTE_BASE}
        title='Students List'
        emptyMessage='No students in your grade band or classes yet. Ask the Principal to set your grade band or allocate classes.'
    />
)

export default StudentsList
