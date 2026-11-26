import AdminRoutes from '../Routes/AdminRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'admin',
    RoutesComponent: AdminRoutes,
})

