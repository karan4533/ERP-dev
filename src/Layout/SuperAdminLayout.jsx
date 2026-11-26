import SuperAdminRoutes from '../Routes/SuperAdminRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'superadmin',
    RoutesComponent: SuperAdminRoutes,
})

