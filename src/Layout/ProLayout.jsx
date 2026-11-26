import ProRoutes from '../Routes/ProRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'pro',
    RoutesComponent: ProRoutes,
    showBreadcrumb: true,
})
