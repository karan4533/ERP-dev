import { ROLES } from '../../constants/roles.js'

export const ANNOUNCEMENT_AUDIENCE_GROUPS = Object.freeze([
    {
        id: 'all-school',
        label: 'All school roles',
        description: 'Leadership, academic, student, family and operations portals.',
        roles: [...new Set(Object.values(ROLES))],
    },
    {
        id: 'academic-staff',
        label: 'Academic staff',
        description: 'Teaching, coordination, library and academic leadership teams.',
        roles: [ROLES.TEACHER, ROLES.COORDINATOR, ROLES.LIBRARIAN, ROLES.PRINCIPAL, ROLES.DIRECTOR],
    },
    {
        id: 'students-guardians',
        label: 'Students and guardians',
        description: 'Student and parent portals.',
        roles: [ROLES.STUDENT, ROLES.PARENT],
    },
    {
        id: 'operations',
        label: 'Operations teams',
        description: 'Facilities, stores, canteen, transport, IT, security and front office.',
        roles: [
            ROLES.HOUSEKEEPING_MANAGER,
            ROLES.STATIONERY_STORE_MANAGER,
            ROLES.CANTEEN_MANAGER,
            ROLES.TRANSPORT_MANAGER,
            ROLES.DRIVER,
            ROLES.IT_SUPPORT_MANAGER,
            ROLES.GATEKEEPER,
            ROLES.GATEKEEPER_MANAGER,
            ROLES.PRM,
        ],
    },
    {
        id: 'leadership',
        label: 'Leadership and administration',
        description: 'School leadership, administration, audit, HR and finance.',
        roles: [
            ROLES.SUPER_ADMIN,
            ROLES.ADMIN,
            ROLES.DIRECTOR,
            ROLES.PRINCIPAL,
            ROLES.JOINT_DIRECTOR,
            ROLES.JOINT_DIRECTOR_ASSISTANT,
            ROLES.JOINT_DIRECTOR_AUDIT,
            ROLES.PROCESS_AUDITOR,
            ROLES.QUALITY_AUDITOR,
            ROLES.HR,
            ROLES.ACCOUNT_HEAD,
        ],
    },
])

export const createEmptyAnnouncementDraft = ({ sentBy = '', announcementDate = '' } = {}) => ({
    title: '',
    category: '',
    message: '',
    sentBy,
    announcementDate,
    audienceGroup: '',
    priority: 'Normal',
    requireAcknowledgement: true,
    attachmentName: '',
})

export const resolveAnnouncementAudience = (audienceGroup) => (
    ANNOUNCEMENT_AUDIENCE_GROUPS.find((group) => group.id === audienceGroup)?.roles ?? []
)

export const validateAnnouncementDraft = (draft) => {
    const errors = {}
    const title = draft.title?.trim() ?? ''
    const message = draft.message?.trim() ?? ''

    if (!title) errors.title = 'Enter the announcement title.'
    else if (title.length < 5) errors.title = 'Use at least 5 characters for the title.'
    if (!draft.category) errors.category = 'Select an announcement category.'
    if (!message) errors.message = 'Enter the announcement message.'
    else if (message.length < 20) errors.message = 'Use at least 20 characters so readers have enough context.'
    if (!draft.announcementDate) errors.announcementDate = 'Select the publication date.'
    if (!resolveAnnouncementAudience(draft.audienceGroup).length) errors.audienceGroup = 'Select the intended audience.'

    return errors
}

export const getAnnouncementReadiness = (draft) => {
    const required = [draft.title, draft.category, draft.message, draft.announcementDate, draft.audienceGroup]
    if (required.some((value) => String(value ?? '').trim() === '')) return 'Not assessed'
    return Object.keys(validateAnnouncementDraft(draft)).length ? 'Blocked' : 'Ready'
}
