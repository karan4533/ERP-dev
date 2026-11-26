import GateKeeperRoutes from '../Routes/GateKeeperRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'gatekeeper',
    RoutesComponent: GateKeeperRoutes,
})

