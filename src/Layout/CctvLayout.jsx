import CctvRoutes from '../Routes/CctvRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'cctv',
    RoutesComponent: CctvRoutes,
    showBreadcrumb: true,
})
