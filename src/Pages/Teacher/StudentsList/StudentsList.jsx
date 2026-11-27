import React from 'react'
import StudentDatabaseListView from '../../../Common/UserDatabase/StudentDatabaseListView'

const ROUTE_BASE = '/teacher/user-management/students-list'

const StudentsList = () => (
    <StudentDatabaseListView
        routeBase={ROUTE_BASE}
        title='Students List'
        emptyMessage='No students in your classes yet. Students appear once the Principal allocates your classes and students are placed in them.'
    />
)

export default StudentsList
