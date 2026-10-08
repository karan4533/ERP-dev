import React from 'react'
import { Navigate } from 'react-router-dom'
import { canAssignTasks, getTaskManagementPaths } from './taskManagementConfig'
import { useTaskRole } from './useTaskRole'

const TaskManagementRedirect = () => {
    const roleKey = useTaskRole()
    const paths = getTaskManagementPaths(roleKey)
    const target = canAssignTasks(roleKey) ? paths.assignTasks : paths.myTasks
    return <Navigate to={target} replace />
}

export default TaskManagementRedirect
