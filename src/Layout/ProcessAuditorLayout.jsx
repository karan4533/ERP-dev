import ProcessAuditorRoutes from '../Routes/ProcessAuditorRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'processauditor',
    RoutesComponent: ProcessAuditorRoutes,
})

