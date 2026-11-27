import { getActivityCalendarItems, CALENDAR_UPDATED_EVENT } from '../Activities/activitiesData'
import {
    canUseCalendarApi,
    createCalendarApi,
    listCalendarApi,
} from '../../services/calendarApi'
import { isApiCalendarEnabled } from '../../services/apiClient'

/** Roles that hold calendar.write on the backend (admin, principal, director; superadmin has all). */
export const CALENDAR_WRITE_ROLE_KEYS = new Set(['admin', 'principal', 'director', 'superAdmin', 'superadmin'])

export const canWriteCalendar = (roleKey) => CALENDAR_WRITE_ROLE_KEYS.has(roleKey)

export const ACADEMIC_EVENT_TYPES = {
    holiday: {
        key: 'holiday',
        label: 'Holiday',
        color: '#DC2626',
        soft: '#FEE2E2',
        border: '#FECACA',
    },
    exam: {
        key: 'exam',
        label: 'Exam Timeline',
        color: '#515DEF',
        soft: '#EEF0FF',
        border: '#C7CBFF',
    },
    event: {
        key: 'event',
        label: 'Event',
        color: '#059669',
        soft: '#D1FAE5',
        border: '#A7F3D0',
    },
}

export const ACADEMIC_CALENDAR_ITEMS = [
    {
        id: 'hol-1',
        type: 'holiday',
        title: 'Republic Day',
        startDate: '2026-01-26',
        endDate: '2026-01-26',
        description: 'National holiday. School remains closed.',
    },
    {
        id: 'hol-2',
        type: 'holiday',
        title: 'Holi',
        startDate: '2026-03-14',
        endDate: '2026-03-14',
        description: 'Festival holiday.',
    },
    {
        id: 'hol-3',
        type: 'holiday',
        title: 'Good Friday',
        startDate: '2026-04-03',
        endDate: '2026-04-03',
        description: 'School holiday.',
    },
    {
        id: 'hol-4',
        type: 'holiday',
        title: 'Summer Break',
        startDate: '2026-05-15',
        endDate: '2026-06-15',
        description: 'Summer vacation for all classes.',
    },
    {
        id: 'hol-5',
        type: 'holiday',
        title: 'Independence Day',
        startDate: '2026-08-15',
        endDate: '2026-08-15',
        description: 'National holiday. Flag hoisting ceremony on campus.',
    },
    {
        id: 'hol-6',
        type: 'holiday',
        title: 'Gandhi Jayanti',
        startDate: '2026-10-02',
        endDate: '2026-10-02',
        description: 'National holiday.',
    },
    {
        id: 'hol-7',
        type: 'holiday',
        title: 'Diwali Break',
        startDate: '2026-11-08',
        endDate: '2026-11-12',
        description: 'Festival holidays.',
    },
    {
        id: 'hol-8',
        type: 'holiday',
        title: 'Christmas',
        startDate: '2026-12-25',
        endDate: '2026-12-25',
        description: 'Christmas holiday.',
    },
    {
        id: 'exam-1',
        type: 'exam',
        title: 'Unit Test – I',
        startDate: '2026-07-20',
        endDate: '2026-07-25',
        description: 'Unit Test I for Classes VI–XII.',
    },
    {
        id: 'exam-2',
        type: 'exam',
        title: 'Mid Term Examinations',
        startDate: '2026-09-14',
        endDate: '2026-09-26',
        description: 'Mid-term exam timeline across all grades. Not a period timetable — date range only.',
    },
    {
        id: 'exam-3',
        type: 'exam',
        title: 'Unit Test – II',
        startDate: '2026-11-16',
        endDate: '2026-11-21',
        description: 'Unit Test II for Classes VI–XII.',
    },
    {
        id: 'exam-4',
        type: 'exam',
        title: 'Final Term Examinations',
        startDate: '2027-02-16',
        endDate: '2027-03-05',
        description: 'Final / annual examination timeline.',
    },
    {
        id: 'evt-1',
        type: 'event',
        title: 'Academic Year Begins',
        startDate: '2026-04-06',
        endDate: '2026-04-06',
        description: 'First day of the academic session 2026–27.',
    },
    {
        id: 'evt-2',
        type: 'event',
        title: 'Parent–Teacher Meeting',
        startDate: '2026-08-08',
        endDate: '2026-08-08',
        description: 'PTM for all classes (morning & afternoon slots).',
    },
    {
        id: 'evt-3',
        type: 'event',
        title: 'Annual Sports Day',
        startDate: '2026-10-17',
        endDate: '2026-10-18',
        description: 'Inter-house sports meet.',
    },
    {
        id: 'evt-4',
        type: 'event',
        title: 'Annual Day Celebration',
        startDate: '2026-12-12',
        endDate: '2026-12-12',
        description: 'Cultural performances and prize distribution.',
    },
    {
        id: 'evt-5',
        type: 'event',
        title: 'Science Exhibition',
        startDate: '2026-11-28',
        endDate: '2026-11-28',
        description: 'School-wide science fair and project showcase.',
    },
]

let apiItems = []

export const hydrateCalendarFromApi = async () => {
    apiItems = await listCalendarApi()
    return apiItems
}

/** Create via API when signed in; refreshes in-memory list and notifies listeners. */
export const createCalendarEventViaApi = async ({ type, title, startDate, endDate, description }) => {
    if (!canUseCalendarApi()) {
        throw new Error('Calendar API is not available.')
    }
    await createCalendarApi({
        type,
        title: title?.trim() || '',
        startDate,
        endDate: endDate || undefined,
        description: description?.trim() || '',
    })
    const rows = await hydrateCalendarFromApi()
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(CALENDAR_UPDATED_EVENT))
    }
    return rows
}

export const clearCalendarMemory = () => {
    apiItems = []
}

/** Server events when calendar API flag is on; never fall back to ACADEMIC_CALENDAR_ITEMS seed in API mode. */
export const getAllCalendarItems = () => {
    if (canUseCalendarApi() || isApiCalendarEnabled()) return [...apiItems]
    return [...ACADEMIC_CALENDAR_ITEMS, ...getActivityCalendarItems()]
}

export const ACADEMIC_CALENDAR_ROLE_CONFIG = {
    superAdmin: { roleLabel: 'Super Admin', routeBase: '/super-admin/academic-calendar' },
    admin: { roleLabel: 'Admin', routeBase: '/admin/academic-calendar' },
    director: { roleLabel: 'Director', routeBase: '/director/academic-calendar', pageTitle: 'Calendar' },
    prm: { roleLabel: 'Front Office', routeBase: '/front-office/academic-calendar', pageTitle: 'Calendar' },
    gateKeeper: { roleLabel: 'Gate Keeper', routeBase: '/gate-keeper/academic-calendar' },
    gateKeeperManager: { roleLabel: 'Gate Keeper Manager', routeBase: '/gatekeeper-manager/academic-calendar' },
    librarian: { roleLabel: 'Librarian', routeBase: '/librarian/academic-calendar' },
    principal: { roleLabel: 'Principal', routeBase: '/principal/academic-calendar' },
    student: { roleLabel: 'Student', routeBase: '/student/academic-calendar', pageTitle: 'Calendar' },
    parent: { roleLabel: 'Parent', routeBase: '/parent/academic-calendar', pageTitle: 'Calendar' },
    teacher: { roleLabel: 'Teacher', routeBase: '/teacher/academic-calendar', pageTitle: 'Calendar' },
    coordinator: { roleLabel: 'Coordinator', routeBase: '/coordinator/academic-calendar', pageTitle: 'Calendar' },
    canteenManager: { roleLabel: 'Canteen Manager', routeBase: '/canteen-manager/academic-calendar', pageTitle: 'Calendar' },
    itSupportManager: { roleLabel: 'IT Support Manager', routeBase: '/it-support-manager/academic-calendar', pageTitle: 'Calendar' },
    stationeryStoreManager: { roleLabel: 'Store', routeBase: '/stationery-store-manager/academic-calendar', pageTitle: 'Calendar' },
    housekeepingManager: { roleLabel: 'Housekeeping Manager', routeBase: '/housekeeping-manager/academic-calendar', pageTitle: 'Calendar' },
    maintenanceManager: { roleLabel: 'Maintenance Manager', routeBase: '/maintenance-manager/academic-calendar', pageTitle: 'Calendar' },
    transportManager: { roleLabel: 'Transport Manager', routeBase: '/transport-manager/academic-calendar', pageTitle: 'Calendar' },
    jointDirector: { roleLabel: 'Joint Director', routeBase: '/joint-director/academic-calendar', pageTitle: 'Calendar' },
    jointDirectorAssistant: { roleLabel: 'Joint Director Assistant', routeBase: '/joint-director-assistant/academic-calendar', pageTitle: 'Calendar' },
    jointDirectorAudit: { roleLabel: 'Joint Director Audit', routeBase: '/joint-director-audit/academic-calendar', pageTitle: 'Calendar' },
    processAuditor: { roleLabel: 'Process Auditor', routeBase: '/process-auditor/academic-calendar', pageTitle: 'Calendar' },
    qualityAuditor: { roleLabel: 'Quality Auditor', routeBase: '/quality-auditor/academic-calendar', pageTitle: 'Calendar' },
    hr: { roleLabel: 'HR', routeBase: '/hr/academic-calendar', pageTitle: 'Calendar' },
    accountHead: { roleLabel: 'Finance', routeBase: '/account-head/academic-calendar', pageTitle: 'Calendar' },
    fileRoom: { roleLabel: 'File Room', routeBase: '/file-room/academic-calendar', pageTitle: 'Calendar' },
    cctvRoom: { roleLabel: 'CCTV Room', routeBase: '/cctv-room/academic-calendar', pageTitle: 'Calendar' },
    driver: { roleLabel: 'Driver', routeBase: '/driver/academic-calendar', pageTitle: 'Calendar' },
    pro: { roleLabel: 'PRO', routeBase: '/pro/academic-calendar', pageTitle: 'Calendar' },
}

export const getAcademicCalendarRoleConfig = (roleKey) =>
    ACADEMIC_CALENDAR_ROLE_CONFIG[roleKey] || ACADEMIC_CALENDAR_ROLE_CONFIG.student
