import DirectorRoutes from '../Routes/DirectorRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'director',
    RoutesComponent: DirectorRoutes,
})

