import EmployeeDatabaseListView from '../../../Common/UserDatabase/EmployeeDatabaseListView'
import { ROUTE_BASE, TEACHER_DEPARTMENT_FILTER } from './teacherDatabaseData'

const TeachersList = () => (
    <EmployeeDatabaseListView
        routeBase={ROUTE_BASE}
        title='Teacher Database'
        subtitle='Teachers created through User Creation appear here automatically.'
        fixedDepartmentFilter={TEACHER_DEPARTMENT_FILTER}
        showDepartmentFilter={false}
    />
)

export default TeachersList
