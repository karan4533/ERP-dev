export const ANNOUNCEMENT_ROUTE_CONFIG = {
    admin: {
        list: '/admin/announcement',
        add: '/admin/announcement/add',
        view: '/admin/announcement/view',
        sentByDefault: 'Admin',
    },
    principal: {
        list: '/principal/announcement',
        add: '/principal/announcement/add',
        view: '/principal/announcement/view',
        sentByDefault: 'Principal',
    },
    gatekeepermanager: {
        list: '/gatekeeper-manager/gatekeeper-broadcast-list',
        add: '/gatekeeper-manager/add-gatekeeper-broadcast',
        view: '/gatekeeper-manager/gatekeeper-broadcast-list/view',
        sentByDefault: 'Gate Keeper Manager',
    },
    director: {
        list: '/director/broadcast',
        view: '/director/broadcast/view-broadcast',
        sentByDefault: 'Director',
    },
    teacher: {
        list: '/teacher/announcement',
        view: '/teacher/announcement/view',
        sentByDefault: 'Teacher',
    },
    coordinator: {
        list: '/coordinator/announcement',
        view: '/coordinator/announcement/view',
        sentByDefault: 'Coordinator',
    },
    librarian: {
        list: '/librarian/announcement',
        view: '/librarian/announcement/view',
        sentByDefault: 'Librarian',
    },
    student: {
        list: '/student/announcement',
        view: '/student/announcement/view',
        sentByDefault: 'Student',
    },
    gatekeeper: {
        list: '/gate-keeper/broadcast-list',
        view: '/gate-keeper/view-broadcast',
        sentByDefault: 'Gate Keeper',
    },
    prm: {
        list: '/front-office/announcement',
        view: '/front-office/announcement/view',
        sentByDefault: 'Front Office',
    },
    superadmin: {
        list: '/super-admin/announcement',
        view: '/super-admin/announcement/view',
        sentByDefault: 'Super Admin',
    },
    canteenmanager: {
        list: '/canteen-manager/broadcast',
        view: '/canteen-manager/broadcast/view-broadcast',
        sentByDefault: 'Canteen Manager',
    },
    itsupportmanager: {
        list: '/it-support-manager/broadcast',
        add: '/it-support-manager/broadcast/add-broadcast',
        view: '/it-support-manager/broadcast/view-broadcast',
        sentByDefault: 'IT Support Manager',
    },
    stationerystoremanager: {
        list: '/stationery-store-manager/broadcast',
        view: '/stationery-store-manager/broadcast/view-broadcast',
        sentByDefault: 'Stationery Store Manager',
    },
    housekeepingmanager: {
        list: '/housekeeping-manager/broadcast',
        add: '/housekeeping-manager/broadcast/add-broadcast',
        view: '/housekeeping-manager/broadcast/view-broadcast',
        sentByDefault: 'Housekeeping Manager',
    },
    jointdirector: {
        list: '/joint-director/broadcast',
        view: '/joint-director/broadcast/view-broadcast',
        sentByDefault: 'Joint Director',
    },
    jointdirectorassistant: {
        list: '/joint-director-assistant/broadcast',
        view: '/joint-director-assistant/broadcast/view-broadcast',
        sentByDefault: 'Joint Director Assistant',
    },
    hr: {
        list: '/hr/announcements',
        add: '/hr/announcements/add',
        view: '/hr/announcements/view',
        sentByDefault: 'HR',
    },
    jointdirectoraudit: {
        list: '/joint-director-audit/broadcast',
        view: '/joint-director-audit/broadcast/view-broadcast',
        sentByDefault: 'Joint Director Audit',
    },
}

export const getAnnouncementRoutes = (roleKey) =>
    ANNOUNCEMENT_ROUTE_CONFIG[roleKey] || ANNOUNCEMENT_ROUTE_CONFIG.admin

export const getAnnouncementViewPath = (roleKey, id) =>
    `${getAnnouncementRoutes(roleKey).view}/${id}`
