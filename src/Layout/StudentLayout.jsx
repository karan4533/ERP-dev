import StudentRoutes from '../Routes/StudentRoutes'
import { ActiveStudentProvider } from '../context/ActiveStudentContext'
import { DEFAULT_STUDENT_PROFILE } from '../Pages/Student/studentPortalConfig'
import AppShell from './AppShell'

const StudentLayout = () => (
    <ActiveStudentProvider student={DEFAULT_STUDENT_PROFILE} portalMode='student' routePrefix='/student'>
        <AppShell roleKey='student'>
            <StudentRoutes />
        </AppShell>
    </ActiveStudentProvider>
)

export default StudentLayout

