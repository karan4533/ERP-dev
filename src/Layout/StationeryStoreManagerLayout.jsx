import StationeryStoreManagerRoutes from '../Routes/StationeryStoreManagerRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'stationerystoremanager',
    RoutesComponent: StationeryStoreManagerRoutes,
})

