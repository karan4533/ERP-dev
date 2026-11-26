export const STATUS_TONES = Object.freeze({
    neutral: Object.freeze({
        key: 'neutral',
        foreground: '#334155',
        background: '#F1F5F9',
        border: '#CBD5E1',
    }),
    info: Object.freeze({
        key: 'info',
        foreground: '#2441A8',
        background: '#EEF2FF',
        border: '#C7D2FE',
    }),
    success: Object.freeze({
        key: 'success',
        foreground: '#176B3A',
        background: '#EAF7EF',
        border: '#B7E4C7',
    }),
    warning: Object.freeze({
        key: 'warning',
        foreground: '#7A3E00',
        background: '#FFF4D6',
        border: '#F4D38A',
    }),
    danger: Object.freeze({
        key: 'danger',
        foreground: '#A51D35',
        background: '#FDECEF',
        border: '#F3B8C2',
    }),
})

const STATUS_GROUPS = Object.freeze({
    success: new Set([
        'accepted',
        'active',
        'approved',
        'cleared',
        'closed',
        'complete',
        'completed',
        'paid',
        'present',
        'published',
        'resolved',
        'verified',
    ]),
    warning: new Set([
        'awaiting approval',
        'due soon',
        'on hold',
        'pending',
        'pending approval',
        'pending review',
        'submitted',
        'under review',
    ]),
    danger: new Set([
        'absent',
        'blocked',
        'cancelled',
        'declined',
        'failed',
        'overdue',
        'rejected',
        'suspended',
    ]),
    info: new Set([
        'assigned',
        'coordinator reviewed',
        'in progress',
        'principal approved',
        'processing',
        'scheduled',
        'syncing',
    ]),
})

const normalizeStatus = (status) => String(status ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ')

export const getStatusTone = (status) => {
    const normalized = normalizeStatus(status)
    if (STATUS_TONES[normalized]) return STATUS_TONES[normalized]

    for (const [tone, values] of Object.entries(STATUS_GROUPS)) {
        if (values.has(normalized)) return STATUS_TONES[tone]
    }

    return STATUS_TONES.neutral
}

export const UI_COLORS = Object.freeze({
    ink: '#172033',
    indigo: '#3F46C7',
    teal: '#087E8B',
    canvas: '#F4F6FA',
    paper: '#FFFFFF',
    slate: '#5B6475',
    amber: '#C56A16',
    red: '#C43D4D',
})
