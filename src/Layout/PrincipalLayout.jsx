import PrincipalRoutes from '../Routes/PrincipalRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'principal',
    RoutesComponent: PrincipalRoutes,
})

