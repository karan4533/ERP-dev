import DriverRoutes from '../Routes/DriverRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'driver',
    RoutesComponent: DriverRoutes,
})

