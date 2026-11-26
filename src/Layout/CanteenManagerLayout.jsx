import CanteenManagerRoutes from '../Routes/CanteenManagerRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'canteenmanager',
    RoutesComponent: CanteenManagerRoutes,
})

