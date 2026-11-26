import TransportManagerRoutes from '../Routes/TransportManagerRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'transportmanager',
    RoutesComponent: TransportManagerRoutes,
})

