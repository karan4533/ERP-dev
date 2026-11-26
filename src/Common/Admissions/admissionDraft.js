const DATE_FIELDS = ['admissionDate', 'dateOfBirth', 'batchStartYear', 'batchEndYear']
const STAGE_KEYS = ['admission', 'student', 'transport', 'parents', 'account', 'fees']

export const getAdmissionDraftKey = (pathname = '', recordId = 'new') => {
    const portal = pathname.startsWith('/front-office') ? 'front-office' : 'admin'
    return `schoolerp-admission-draft:${portal}:${recordId || 'new'}`
}

export const serializeAdmissionDraft = (form, activeStage = 'admission') => JSON.stringify({
    savedAt: new Date().toISOString(),
    activeStage,
    form: {
        ...form,
        parentAccountPassword: '',
    },
})

const reviveDate = (value) => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

export const restoreAdmissionDraft = (serialized) => {
    try {
        const draft = JSON.parse(serialized)
        if (!draft?.form || typeof draft.form !== 'object') return null

        const form = { ...draft.form, parentAccountPassword: '' }
        DATE_FIELDS.forEach((field) => {
            form[field] = reviveDate(form[field])
        })

        return {
            form,
            activeStage: STAGE_KEYS.includes(draft.activeStage) ? draft.activeStage : 'admission',
            savedAt: draft.savedAt || '',
        }
    } catch {
        return null
    }
}

export const loadAdmissionDraft = (key) => {
    try {
        const serialized = localStorage.getItem(key)
        return serialized ? restoreAdmissionDraft(serialized) : null
    } catch {
        return null
    }
}

export const saveAdmissionDraft = (key, form, activeStage) => {
    try {
        localStorage.setItem(key, serializeAdmissionDraft(form, activeStage))
        return { success: true }
    } catch {
        return { success: false }
    }
}

export const clearAdmissionDraft = (key) => {
    try {
        localStorage.removeItem(key)
    } catch {
        /* Storage can be unavailable in hardened browser contexts. */
    }
}
