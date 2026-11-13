import TeacherRoutes from '../Routes/TeacherRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'teacher',
    RoutesComponent: TeacherRoutes,
})

