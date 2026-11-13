import JointDirectorAuditRoutes from '../Routes/JointDirectorAuditRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'jointdirectoraudit',
    RoutesComponent: JointDirectorAuditRoutes,
})

