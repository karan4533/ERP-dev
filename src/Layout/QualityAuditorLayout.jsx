import QualityAuditorRoutes from '../Routes/QualityAuditorRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'qualityauditor',
    RoutesComponent: QualityAuditorRoutes,
})

