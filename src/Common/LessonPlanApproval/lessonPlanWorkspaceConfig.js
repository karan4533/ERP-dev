const CONFIG = {
    teacher: {
        submitterName: 'Mr. Anil Kumar',
        routePrefix: '/teacher',
        createRoute: '/teacher/lesson-plan-approval/add',
    },
    coordinator: {
        submitterName: 'Ms. Priya Nair',
        routePrefix: '/coordinator',
        createRoute: '/coordinator/lesson-plan-approval/add',
    },
}

export const getLessonPlanWorkspaceConfig = (role) => CONFIG[role] ?? null

