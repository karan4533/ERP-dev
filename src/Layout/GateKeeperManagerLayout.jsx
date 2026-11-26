import GateKeeperManagerRoutes from '../Routes/GateKeeperManagerRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'gatekeepermanager',
    RoutesComponent: GateKeeperManagerRoutes,
})

