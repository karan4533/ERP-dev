import FileRoomRoutes from '../Routes/FileRoomRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'fileroom',
    RoutesComponent: FileRoomRoutes,
    showBreadcrumb: true,
})
