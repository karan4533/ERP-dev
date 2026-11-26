export const ADMISSION_STAGES = [
    {
        key: 'admission',
        label: 'Admission',
        description: 'Intake, class and academic batch',
        requiredFields: ['admissionDate', 'className'],
    },
    {
        key: 'student',
        label: 'Student',
        description: 'Identity and contact information',
        requiredFields: ['firstName', 'mobileNumber'],
    },
    {
        key: 'transport',
        label: 'Transport',
        description: 'Travel mode, route and stop',
        requiredFields: ['modeOfTransport'],
    },
    {
        key: 'parents',
        label: 'Parents',
        description: 'Guardian identity and contact',
        requiredFields: ['fatherName', 'motherName', 'parentMobileNumber'],
    },
    {
        key: 'account',
        label: 'Account',
        description: 'Guardian portal access',
        requiredFields: ['parentAccountEmail'],
    },
    {
        key: 'fees',
        label: 'Fees',
        description: 'Fee group and collection plan',
        requiredFields: ['feesGroup'],
    },
]

const hasValue = (value) => {
    if (value instanceof Date) return !Number.isNaN(value.getTime())
    return value !== null && value !== undefined && String(value).trim() !== ''
}

export const isAdmissionStageComplete = (form, stage) =>
    stage.requiredFields.every((field) => hasValue(form?.[field]))

export const getAdmissionStageProgress = (form = {}) => {
    const stages = ADMISSION_STAGES.map((stage) => ({
        ...stage,
        complete: isAdmissionStageComplete(form, stage),
    }))
    const completed = stages.filter((stage) => stage.complete).length
    const firstIncomplete = stages.find((stage) => !stage.complete)

    return {
        stages,
        completed,
        total: stages.length,
        currentStage: firstIncomplete?.key ?? stages.at(-1)?.key ?? '',
        percent: stages.length ? Math.round((completed / stages.length) * 100) : 0,
    }
}

export const summarizePermissionChanges = (previous = {}, next = {}, modules = []) => {
    const mutableModules = modules.filter((module) => !module.alwaysOn)
    const granted = []
    const revoked = []

    mutableModules.forEach((module) => {
        const hadAccess = Boolean(previous[module.key])
        const willHaveAccess = Boolean(next[module.key])
        if (!hadAccess && willHaveAccess) granted.push(module.label)
        if (hadAccess && !willHaveAccess) revoked.push(module.label)
    })

    return {
        granted,
        revoked,
        changedCount: granted.length + revoked.length,
        unchangedCount: mutableModules.length - granted.length - revoked.length,
    }
}
