import LibrarianRoutes from '../Routes/LibrarianRoutes'
import createPortalLayout from './createPortalLayout'

export default createPortalLayout({
    roleKey: 'librarian',
    RoutesComponent: LibrarianRoutes,
})

