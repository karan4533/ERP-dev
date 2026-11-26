import JointDirectorRoutes from '../Routes/JointDirectorRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'jointdirector',
    RoutesComponent: JointDirectorRoutes,
})

