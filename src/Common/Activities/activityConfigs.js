export const ACTIVITY_CONFIGS = {
    cultural: {
        type: 'cultural',
        listTitle: 'Cultural List',
        formTitle: 'Cultural Information',
        addButtonLabel: 'Add New Cultural Activity',
        personLabel: 'Coordinator',
        personField: 'coordinator',
        adminRoutes: {
            list: '/admin/activities/cultural-list',
            add: '/admin/activities/add-cultural',
            view: '/admin/activities/view-cultural',
            edit: '/admin/activities/edit-cultural',
        },
        directorRoutes: {
            list: '/director/activities/cultural-list',
            add: '/director/activities/add-cultural',
            view: '/director/activities/view-cultural',
            edit: '/director/activities/edit-cultural',
        },
        superAdminRoutes: {
            list: '/super-admin/activities/cultural-list',
            add: '/super-admin/activities/cultural-list',
            view: '/super-admin/activities/view-cultural',
            edit: '/super-admin/activities/cultural-list',
        },
        proRoutes: {
            list: '/pro/events/cultural',
            add: '/pro/events/cultural',
            view: '/pro/events/cultural/view',
            edit: '/pro/events/cultural',
        },
    },
    sports: {
        type: 'sports',
        listTitle: 'Sports List',
        formTitle: 'Sports Information',
        addButtonLabel: 'Add New Sports Activity',
        personLabel: 'Coach',
        personField: 'coach',
        adminRoutes: {
            list: '/admin/activities/sports-list',
            add: '/admin/activities/add-sports',
            view: '/admin/activities/view-sports',
            edit: '/admin/activities/edit-sports',
        },
        directorRoutes: {
            list: '/director/activities/sports-list',
            add: '/director/activities/add-sports',
            view: '/director/activities/view-sports',
            edit: '/director/activities/edit-sports',
        },
        superAdminRoutes: {
            list: '/super-admin/activities/sports-list',
            add: '/super-admin/activities/sports-list',
            view: '/super-admin/activities/view-sports',
            edit: '/super-admin/activities/sports-list',
        },
        proRoutes: {
            list: '/pro/events/sports',
            add: '/pro/events/sports',
            view: '/pro/events/sports/view',
            edit: '/pro/events/sports',
        },
    },
    competition: {
        type: 'competition',
        listTitle: 'Competitions List',
        formTitle: 'Competition Information',
        addButtonLabel: 'Add New Competition',
        personLabel: 'Coordinator',
        personField: 'coordinator',
        adminRoutes: {
            list: '/admin/activities/competitions-list',
            add: '/admin/activities/add-competition',
            view: '/admin/activities/view-competition',
            edit: '/admin/activities/edit-competition',
        },
        directorRoutes: {
            list: '/director/activities/competitions-list',
            add: '/director/activities/add-competition',
            view: '/director/activities/view-competition',
            edit: '/director/activities/edit-competition',
        },
        superAdminRoutes: {
            list: '/super-admin/activities/competitions-list',
            add: '/super-admin/activities/competitions-list',
            view: '/super-admin/activities/view-competition',
            edit: '/super-admin/activities/competitions-list',
        },
        proRoutes: {
            list: '/pro/events/competitions',
            add: '/pro/events/competitions',
            view: '/pro/events/competitions/view',
            edit: '/pro/events/competitions',
        },
    },
}

export const getActivityConfig = (activityType) => ACTIVITY_CONFIGS[activityType]

export const getActivityRoutes = (activityType, roleKey) => {
    const config = getActivityConfig(activityType)
    if (roleKey === 'admin') return config.adminRoutes
    if (roleKey === 'superadmin') return config.superAdminRoutes
    if (roleKey === 'pro') return config.proRoutes
    return config.directorRoutes
}

export const getActivityViewPath = (activityType, roleKey, id) => {
    const routes = getActivityRoutes(activityType, roleKey)
    return `${routes.view}/${id}`
}

export const getActivityEditPath = (activityType, roleKey, id) => {
    const routes = getActivityRoutes(activityType, roleKey)
    return `${routes.edit}/${id}`
}
