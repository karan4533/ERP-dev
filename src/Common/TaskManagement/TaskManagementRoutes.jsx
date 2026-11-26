import React from 'react'
import { Route } from 'react-router-dom'
import EnterpriseTaskWorkspace from './EnterpriseTaskWorkspace'

export const TaskManagementRoutes = ({ basePath }) => (
    <>
        <Route path={`${basePath}/task-management`} element={<EnterpriseTaskWorkspace defaultTab="received" />} />
        <Route path={`${basePath}/task-management/workspace`} element={<EnterpriseTaskWorkspace defaultTab="received" />} />
        <Route path={`${basePath}/task-management/assign-tasks`} element={<EnterpriseTaskWorkspace defaultTab="created" />} />
        <Route path={`${basePath}/task-management/assign-tasks/add`} element={<EnterpriseTaskWorkspace defaultTab="created" initialCreateOpen={true} />} />
        <Route path={`${basePath}/task-management/my-tasks`} element={<EnterpriseTaskWorkspace defaultTab="received" />} />
        <Route path={`${basePath}/task-management/assigned-tasks`} element={<EnterpriseTaskWorkspace defaultTab="received" />} />
        <Route path={`${basePath}/task-management/add-task`} element={<EnterpriseTaskWorkspace defaultTab="created" initialCreateOpen={true} />} />
        <Route path={`${basePath}/tasks`} element={<EnterpriseTaskWorkspace defaultTab="received" />} />
    </>
)

export default TaskManagementRoutes

