import { ApiError, getAccessToken } from '../../services/apiClient'
import { uploadFileWithProgress } from '../../services/filesApi'
import {
    canUseTasksApi,
    createTaskApi,
    listTaskAssigneesApi,
    listTasksApi,
    setTaskStatusApi,
} from '../../services/taskApi'
import {
    canAssignToRole,
    DEMO_USER_ID_BY_ROLE,
    getRoleLabel,
    getUsersByRole,
} from './taskManagementConfig'

export const STORAGE_KEY = 'school-erp-task-management'
export const TASKS_UPDATED_EVENT = 'schoolerp-tasks-updated'

/** True when tasks come from the backend (flag on + signed in). Otherwise the local-storage mode is used. */
export const isTasksApiMode = () => canUseTasksApi()

const formatDate = (date) => {
    const d = date instanceof Date ? date : new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
}

/** 'YYYY-MM-DD' (as sent by the API) -> 'DD-MM-YYYY' without any timezone shift. */
const formatIsoDay = (iso) => {
    const [year, month, day] = String(iso || '').split('-')
    return year && month && day ? `${day}-${month}-${year}` : ''
}

/** Local calendar day as 'YYYY-MM-DD' (what the API expects for dueDate). */
export const toIsoDay = (date) => {
    const d = date instanceof Date ? date : new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ------------------------------------------------------------------ local mode

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

// -------------------------------------------------------------------- API mode

/**
 * In-memory copy of the caller's tasks, tagged with the session it belongs to so a different user
 * signing in never sees the previous user's rows. It is never written to local storage, so local mode
 * data stays untouched.
 */
let apiCache = { owner: null, tasks: [] }

const apiTasks = () => (apiCache.owner && apiCache.owner === getAccessToken() ? apiCache.tasks : [])

const notifyTasksUpdated = () => {
    try {
        window.dispatchEvent(new CustomEvent(TASKS_UPDATED_EVENT))
    } catch {
        /* ignore */
    }
}

/** Backend role codes are lowercase; compare and store them in one normalised form. */
export const normalizeRoleKey = (role) => String(role || '').trim().toLowerCase()

/** Backend status values vs the labels the screens already use. Backend values are never altered. */
const API_TO_DISPLAY_STATUS = { Incomplete: 'Pending' }
const DISPLAY_TO_API_STATUS = { Pending: 'Incomplete' }
export const toDisplayStatus = (apiStatus) => API_TO_DISPLAY_STATUS[apiStatus] ?? apiStatus
export const toApiStatus = (displayStatus) => DISPLAY_TO_API_STATUS[displayStatus] ?? displayStatus

export const mapApiTask = (raw, { mine = false, assignedByMe = false } = {}) => {
    const assigneeRole = normalizeRoleKey(raw.assigneeRole)
    const assignedByRole = normalizeRoleKey(raw.assignedByRole)
    return {
        id: raw.id,
        taskId: raw.taskId,
        title: raw.title,
        description: raw.description || '',
        assigneeRole,
        assigneeUserIds: raw.assigneeId ? [raw.assigneeId] : [],
        assigneeNames: raw.assignee ? [raw.assignee] : [],
        assignedByRole,
        assignedBy: raw.assignedBy ? `${getRoleLabel(assignedByRole)} · ${raw.assignedBy}` : getRoleLabel(assignedByRole),
        priority: raw.priority,
        assignedDate: raw.assignedAt ? formatDate(raw.assignedAt) : '',
        dueDate: formatIsoDay(raw.dueDate),
        dueDateIso: raw.dueDate,
        status: toDisplayStatus(raw.status),
        apiStatus: raw.status,
        overdue: Boolean(raw.overdue),
        remark: raw.remark || '',
        completedAt: raw.completedAt || null,
        history: Array.isArray(raw.history) ? raw.history : undefined,
        attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
        fromApi: true,
        mine,
        assignedByMe,
    }
}

/** Reads both boxes and replaces the cache. Returns { ok, error } and never throws. */
export const hydrateTasksFromApi = async () => {
    if (!canUseTasksApi()) return { ok: false, skipped: true }
    const owner = getAccessToken()
    try {
        const [mine, assigned] = await Promise.all([listTasksApi('mine'), listTasksApi('assigned')])
        if (owner !== getAccessToken()) return { ok: false, skipped: true } // session changed while loading
        const merged = new Map()
        for (const raw of mine) merged.set(raw.id, mapApiTask(raw, { mine: true }))
        for (const raw of assigned) {
            const existing = merged.get(raw.id)
            merged.set(raw.id, existing ? { ...existing, assignedByMe: true } : mapApiTask(raw, { assignedByMe: true }))
        }
        const tasks = [...merged.values()].sort((a, b) => String(b.taskId).localeCompare(String(a.taskId)))
        apiCache = { owner, tasks }
        notifyTasksUpdated()
        return { ok: true }
    } catch (error) {
        return { ok: false, error: error?.message || 'Could not load tasks.' }
    }
}

/** Assignable staff for one role, from the backend. Throws ApiError on failure. */
export const loadAssignableUsers = async (roleKey) => {
    const people = await listTaskAssigneesApi(roleKey)
    return people
        .filter((person) => normalizeRoleKey(person.role) === normalizeRoleKey(roleKey))
        .map((person) => ({
            id: person.id,
            name: person.email,
            hint: getRoleLabel(normalizeRoleKey(person.role)),
        }))
}

const describeFailure = (error) => {
    if (error instanceof ApiError) return { message: error.message, unknown: false }
    return {
        message: 'Could not reach the server, so it is unknown whether this task was created. Retrying is safe.',
        unknown: true,
    }
}

/**
 * Creates one task per selected user (the API allows exactly one assignee per task), one after the other so
 * numbering stays ordered. `clientRefs` maps userId -> a stable key: sending the same key again returns the task
 * that already exists instead of creating a duplicate, so retrying the failed users is always safe.
 * Returns { created: [...], failed: [...] } and never throws.
 */
export const assignTasksViaApi = async ({ title, description, priority, dueDate, assignees, clientRefs }) => {
    const created = []
    const failed = []
    for (const person of assignees) {
        try {
            const task = await createTaskApi({
                assigneeId: person.id,
                title,
                description,
                priority,
                dueDate,
                clientRef: clientRefs[person.id],
            })
            created.push({
                userId: person.id,
                name: person.name,
                id: task.id,
                taskId: task.taskId,
                replayed: Boolean(task.idempotentReplay),
            })
        } catch (error) {
            failed.push({ userId: person.id, name: person.name, ...describeFailure(error) })
        }
    }
    if (created.length) await hydrateTasksFromApi()
    return { created, failed }
}

export const TASK_ATTACHMENT_RESOURCE = 'task-attachment'

/**
 * Uploads every chosen file to every created task (the server links one stored file to one task).
 * `done` maps task id -> Set of file positions already stored, so a retry never uploads a file twice.
 * Returns the failures [{ id, taskId, name, fileName, message }] and never throws.
 */
export const uploadTaskAttachmentsViaApi = async (createdTasks, files, done) => {
    const failures = []
    for (const item of createdTasks) {
        if (!item.id) continue
        const stored = done[item.id] || (done[item.id] = new Set())
        for (const [index, file] of files.entries()) {
            if (stored.has(index)) continue
            try {
                await uploadFileWithProgress(file, { resourceType: TASK_ATTACHMENT_RESOURCE, resourceId: item.id })
                stored.add(index)
            } catch (error) {
                failures.push({
                    id: item.id,
                    taskId: item.taskId,
                    name: item.name,
                    fileName: file.name,
                    message: error?.message || 'Upload failed.',
                })
            }
        }
    }
    if (files.length && createdTasks.length) await hydrateTasksFromApi()
    return failures
}

/** Moves a task to 'In Progress' or 'Completed' (display labels accepted). Returns { ok, error } and never throws. */
export const setTaskStatusViaApi = async (taskId, status, remark) => {
    const apiStatus = toApiStatus(status)
    if (apiStatus === 'Incomplete') {
        return { ok: false, error: 'A task cannot be moved back to Pending.' }
    }
    try {
        await setTaskStatusApi(taskId, apiStatus, (remark || '').trim() || undefined)
    } catch (error) {
        return { ok: false, error: error?.message || 'Could not update the task.' }
    }
    await hydrateTasksFromApi()
    return { ok: true }
}

// ------------------------------------------------------------------- selectors
// Both modes read through these, so screens do not care where the rows come from.

const readSource = () => (canUseTasksApi() ? apiTasks() : readTasks())

export const getAllTasks = () => readSource()

export const getTasksAssignedByRole = (assignerRole) =>
    canUseTasksApi()
        ? apiTasks().filter((task) => task.assignedByMe)
        : readTasks().filter((task) => task.assignedByRole === assignerRole)

export const isTaskAssignedToUser = (task, roleKey, userId) => {
    if (task.assigneeRole !== roleKey) return false
    if (!userId) return true
    return task.assigneeUserIds?.includes(userId)
}

export const getMyTasks = (roleKey, userId) =>
    canUseTasksApi()
        ? apiTasks().filter((task) => task.mine)
        : readTasks().filter((task) => isTaskAssignedToUser(task, roleKey, userId))

export const getTaskById = (taskId) => readSource().find((task) => task.id === taskId)

// ------------------------------------------------------------ local-mode writes

export const addTask = (payload) => {
    if (canUseTasksApi()) return null // API mode creates tasks through assignTasksViaApi
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
    notifyTasksUpdated()
    return task
}

export const updateTaskStatus = (taskId, status, remark) => {
    if (canUseTasksApi()) return null // API mode uses setTaskStatusViaApi
    const tasks = readTasks()
    const index = tasks.findIndex((task) => task.id === taskId)
    if (index === -1) return null
    tasks[index] = {
        ...tasks[index],
        status,
        remark: remark === undefined ? (tasks[index].remark || '') : remark,
    }
    writeTasks(tasks)
    notifyTasksUpdated()
    return tasks[index]
}

export const deleteTask = (taskId) => {
    if (canUseTasksApi()) return // the API has no delete: tasks are immutable
    const tasks = readTasks().filter((task) => task.id !== taskId)
    writeTasks(tasks)
    notifyTasksUpdated()
}

export const getDemoUserId = (roleKey) => DEMO_USER_ID_BY_ROLE[roleKey] ?? null

export const getAssignedByLabel = (roleKey) => getRoleLabel(roleKey)
