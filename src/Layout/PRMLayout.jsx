import FrontOfficeRoutes from '../Routes/FrontOfficeRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'prm',
    RoutesComponent: FrontOfficeRoutes,
})

