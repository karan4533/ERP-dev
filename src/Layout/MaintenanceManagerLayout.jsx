import MaintenanceManagerRoutes from '../Routes/MaintenanceManagerRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'maintenancemanager',
    RoutesComponent: MaintenanceManagerRoutes,
})

