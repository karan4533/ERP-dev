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
    },
}

export const getActivityConfig = (activityType) => ACTIVITY_CONFIGS[activityType]

export const getActivityRoutes = (activityType, roleKey) => {
    const config = getActivityConfig(activityType)
    return roleKey === 'admin' ? config.adminRoutes : config.directorRoutes
}

export const getActivityViewPath = (activityType, roleKey, id) => {
    const routes = getActivityRoutes(activityType, roleKey)
    return `${routes.view}/${id}`
}

export const getActivityEditPath = (activityType, roleKey, id) => {
    const routes = getActivityRoutes(activityType, roleKey)
    return `${routes.edit}/${id}`
}
