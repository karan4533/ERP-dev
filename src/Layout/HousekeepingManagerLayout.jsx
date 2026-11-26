import HousekeepingManagerRoutes from '../Routes/HousekeepingManagerRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'housekeepingmanager',
    RoutesComponent: HousekeepingManagerRoutes,
})

