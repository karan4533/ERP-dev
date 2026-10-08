import React from 'react'
import { Navigate, Route } from 'react-router-dom'
import AssignTasksPage from './AssignTasksPage'
import MyTasksPage from './MyTasksPage'
import AddAssignTaskPage from './AddAssignTaskPage'
import TaskManagementRedirect from './TaskManagementRedirect'

export const TaskManagementRoutes = ({ basePath }) => (
    <>
        <Route path={`${basePath}/task-management/assign-tasks`} element={<AssignTasksPage />} />
        <Route path={`${basePath}/task-management/assign-tasks/add`} element={<AddAssignTaskPage />} />
        <Route path={`${basePath}/task-management/my-tasks`} element={<MyTasksPage />} />
        <Route path={`${basePath}/task-management/assigned-tasks`} element={<MyTasksPage />} />
        <Route path={`${basePath}/task-management`} element={<TaskManagementRedirect />} />
        <Route path={`${basePath}/task-management/add-task`} element={<Navigate to={`${basePath}/task-management/assign-tasks/add`} replace />} />
    </>
)
