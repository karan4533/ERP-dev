import { RESPONSE_TYPES_LIST } from '../ResponseTypes/responseTypesData'

export const SCORING_RULE_STATUS_OPTIONS = ['Active', 'Inactive']

export const scoringRuleStatusBadgeColor = {
    Active: 'bg-[#4CAF501A] text-[#4CAF50]',
    Inactive: 'bg-[#6670851A] text-[#667085]',
}

export const DEFAULT_SCORING_RULE_FORM = {
    responseTypeId: '',
    yesScore: '10',
    noScore: '0',
    naScore: '',
    passPercentage: '70',
    active: true,
}

export const supportsNaScoring = (responseTypeLabel) => (
    responseTypeLabel === 'Yes / No / NA'
)

export const formatNaScore = (naScore, responseTypeLabel) => {
    if (!supportsNaScoring(responseTypeLabel)) return '—'
    if (naScore === null || naScore === '' || naScore === undefined) return 'Ignore'
    return String(naScore)
}

export const formatYesNoScore = (score, responseTypeLabel, field) => {
    if (field === 'yes' || field === 'no') {
        if (responseTypeLabel === 'Yes / No' || responseTypeLabel === 'Yes / No / NA') {
            return score ?? 0
        }
        return '—'
    }
    return score ?? '—'
}

export const getScoringRuleStatus = (active) => (active ? 'Active' : 'Inactive')

export const getResponseTypeOptions = () => (
    RESPONSE_TYPES_LIST.filter((item) => item.active)
)

export const getResponseTypeLabel = (responseTypeId) => (
    RESPONSE_TYPES_LIST.find((item) => item.id === responseTypeId)?.type ?? ''
)

export const SCORING_RULES = [
    {
        id: 'SR-001',
        responseTypeId: 'RT-001',
        rule: 'Yes / No',
        yesScore: 10,
        noScore: 0,
        naScore: null,
        weightage: 10,
        passPercentage: 70,
        active: true,
    },
    {
        id: 'SR-002',
        responseTypeId: 'RT-002',
        rule: 'Yes / No / NA',
        yesScore: 10,
        noScore: 0,
        naScore: null,
        weightage: 10,
        passPercentage: 75,
        active: true,
    },
    {
        id: 'SR-003',
        responseTypeId: 'RT-003',
        rule: 'Star Rating',
        yesScore: null,
        noScore: null,
        naScore: null,
        weightage: 5,
        passPercentage: 60,
        active: true,
    },
    {
        id: 'SR-004',
        responseTypeId: 'RT-007',
        rule: 'Dropdown',
        yesScore: 8,
        noScore: 0,
        naScore: null,
        weightage: 8,
        passPercentage: 65,
        active: true,
    },
    {
        id: 'SR-005',
        responseTypeId: 'RT-011',
        rule: 'File Upload',
        yesScore: 5,
        noScore: 0,
        naScore: null,
        weightage: 5,
        passPercentage: 50,
        active: false,
    },
]

export const createScoringRuleId = (rules) => {
    const max = rules.reduce((current, rule) => {
        const match = rule.id.match(/SR-(\d+)/)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)
    return `SR-${String(max + 1).padStart(3, '0')}`
}

export const buildScoringRulePayload = (formData) => {
    const rule = getResponseTypeLabel(formData.responseTypeId)
    const yesScore = formData.yesScore === '' ? null : Number(formData.yesScore)
    const noScore = formData.noScore === '' ? null : Number(formData.noScore)
    const naScore = formData.naScore === '' ? null : Number(formData.naScore)
    const passPercentage = Number(formData.passPercentage) || 0
    const weightage = yesScore ?? passPercentage

    return {
        responseTypeId: formData.responseTypeId,
        rule,
        yesScore,
        noScore,
        naScore: supportsNaScoring(rule) ? naScore : null,
        weightage,
        passPercentage,
        active: formData.active,
    }
}

export const toScoringRuleForm = (rule) => ({
    responseTypeId: rule.responseTypeId,
    yesScore: rule.yesScore === null || rule.yesScore === undefined ? '' : String(rule.yesScore),
    noScore: rule.noScore === null || rule.noScore === undefined ? '' : String(rule.noScore),
    naScore: rule.naScore === null || rule.naScore === undefined ? '' : String(rule.naScore),
    passPercentage: String(rule.passPercentage),
    active: rule.active,
})

export const getTableYesValue = (rule) => {
    if (rule.rule === 'Yes / No' || rule.rule === 'Yes / No / NA') return rule.yesScore ?? 0
    if (rule.rule === 'Star Rating') return '1–5 scale'
    return rule.yesScore ?? '—'
}

export const getTableNoValue = (rule) => {
    if (rule.rule === 'Yes / No' || rule.rule === 'Yes / No / NA') return rule.noScore ?? 0
    return '—'
}

export const getTableNaValue = (rule) => formatNaScore(rule.naScore, rule.rule)
