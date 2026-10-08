import {
    canAssignToRole,
    DEMO_USER_ID_BY_ROLE,
    getRoleLabel,
    getUsersByRole,
} from './taskManagementConfig'

export const STORAGE_KEY = 'school-erp-task-management'

const formatDate = (date) => {
    const d = date instanceof Date ? date : new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
}

const readTasks = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) return parsed
        }
    } catch {
        // ignore invalid storage
    }
    return []
}

const writeTasks = (tasks) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export const getAllTasks = () => readTasks()

export const getTasksAssignedByRole = (assignerRole) =>
    readTasks().filter((task) => task.assignedByRole === assignerRole)

export const isTaskAssignedToUser = (task, roleKey, userId) => {
    if (task.assigneeRole !== roleKey) return false
    if (!userId) return true
    return task.assigneeUserIds?.includes(userId)
}

export const getMyTasks = (roleKey, userId) =>
    readTasks().filter((task) => isTaskAssignedToUser(task, roleKey, userId))

export const getTaskById = (taskId) => readTasks().find((task) => task.id === taskId)

export const addTask = (payload) => {
    if (!canAssignToRole(payload.assignedByRole, payload.assigneeRole)) {
        return null
    }

    const allowedUsers = getUsersByRole(payload.assigneeRole)
    const allowedUserIds = new Set(allowedUsers.map((user) => user.id))
    const validAssigneeIds = (payload.assigneeUserIds ?? []).filter((id) => allowedUserIds.has(id))
    if (!validAssigneeIds.length) {
        return null
    }

    const tasks = readTasks()
    const prefix = payload.assignedByRole?.slice(0, 3).toUpperCase() ?? 'TSK'
    const nextNum = tasks.length + 1
    const id = `${prefix}-TASK-${String(nextNum).padStart(3, '0')}`

    const users = getUsersByRole(payload.assigneeRole)
    const allSelected =
        users.length > 0 && users.every((user) => payload.assigneeUserIds.includes(user.id))
    const assigneeNames = allSelected
        ? ['All']
        : users.filter((user) => payload.assigneeUserIds.includes(user.id)).map((user) => user.name)

    const task = {
        id,
        taskId: id,
        title: payload.title,
        description: payload.description,
        assigneeRole: payload.assigneeRole,
        assigneeUserIds: validAssigneeIds,
        assigneeNames,
        assignedByRole: payload.assignedByRole,
        assignedBy: payload.assignedBy,
        priority: payload.priority,
        assignedDate: payload.assignedDate ? formatDate(payload.assignedDate) : formatDate(new Date()),
        dueDate: payload.dueDate ? formatDate(payload.dueDate) : formatDate(new Date()),
        status: payload.status ?? 'Pending',
    }

    tasks.unshift(task)
    writeTasks(tasks)
    return task
}

export const updateTaskStatus = (taskId, status, remark) => {
    const tasks = readTasks()
    const index = tasks.findIndex((task) => task.id === taskId)
    if (index === -1) return null
    tasks[index] = {
        ...tasks[index],
        status,
        remark: remark === undefined ? (tasks[index].remark || '') : remark,
    }
    writeTasks(tasks)
    return tasks[index]
}

export const deleteTask = (taskId) => {
    const tasks = readTasks().filter((task) => task.id !== taskId)
    writeTasks(tasks)
}

export const getDemoUserId = (roleKey) => DEMO_USER_ID_BY_ROLE[roleKey] ?? null

export const getAssignedByLabel = (roleKey) => getRoleLabel(roleKey)
