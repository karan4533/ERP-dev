import EmployeeDatabaseListView from '../../../Common/UserDatabase/EmployeeDatabaseListView'
import { ROUTE_BASE, isTeacherDatabaseRecord } from './teacherDatabaseData'

const TeachersList = () => (
    <EmployeeDatabaseListView
        routeBase={ROUTE_BASE}
        title='Staff Database'
        subtitle='All teaching and non-teaching staff from HR and User Creation. Filter by staff type or role.'
        isTeachingStaff={isTeacherDatabaseRecord}
    />
)

export default TeachersList
