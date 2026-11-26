import CoordinatorRoutes from '../Routes/CoordinatorRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'coordinator',
    RoutesComponent: CoordinatorRoutes,
})

