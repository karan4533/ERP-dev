import { ensureSeed, saveJson } from '../../../Common/demoDomain/storage'

const KEY = 'schoolerp-activity-fees-v1'

export const ACTIVITY_TYPES = ['Rifle', 'ASA', 'Other']
export const PARTICIPANT_TYPES = ['Insider', 'Outsider']

const empty = { fees: [], assignments: [] }

export const getActivityFeeState = () => ensureSeed(KEY, empty)

const save = (state) => {
    saveJson(KEY, state)
    return state
}

export const payableAmount = (assignment) => {
    const gross = Number(assignment.gross) || 0
    if (assignment.concessionMode === 'Percentage') return Math.max(0, gross - gross * (Number(assignment.concessionValue) || 0) / 100)
    if (assignment.concessionMode === 'Fixed Amount') return Math.max(0, gross - (Number(assignment.concessionValue) || 0))
    return gross
}

export const addActivityFee = (payload) => {
    const state = getActivityFeeState()
    const fee = {
        id: `ACT-${Date.now()}`,
        activityName: payload.activityType === 'Other' ? payload.customName : payload.activityType,
        activityType: payload.activityType,
        insiderAmount: Number(payload.insiderAmount) || 0,
        outsiderAmount: Number(payload.outsiderAmount) || 0,
        academicYear: payload.academicYear,
        attendanceRequired: payload.attendanceRequired === 'yes',
        concessionApplicable: payload.concessionApplicable === 'yes',
        status: 'Active',
        remarks: payload.remarks || '',
    }
    return save({ ...state, fees: [fee, ...state.fees] }).fees[0]
}

export const assignActivityFee = (payload) => {
    const state = getActivityFeeState()
    const fee = state.fees.find((item) => item.id === payload.feeId)
    if (!fee) return null
    const gross = payload.participantType === 'Outsider' ? fee.outsiderAmount : fee.insiderAmount
    const assignment = {
        id: `ASN-${Date.now()}`,
        feeId: fee.id,
        activityName: fee.activityName,
        participantType: payload.participantType,
        participantName: payload.participantName,
        studentId: payload.participantType === 'Insider' ? payload.studentId : '',
        gross,
        concessionMode: fee.concessionApplicable ? payload.concessionMode : 'No Concession',
        concessionValue: fee.concessionApplicable ? Number(payload.concessionValue) || 0 : 0,
        attendance: payload.attendance || '',
        paymentStatus: 'Unpaid',
        receiptNo: '',
    }
    assignment.payable = payableAmount(assignment)
    return save({ ...state, assignments: [assignment, ...state.assignments] })
}

export const recordParticipation = (assignmentId, attendance) => {
    const state = getActivityFeeState()
    return save({
        ...state,
        assignments: state.assignments.map((item) => item.id === assignmentId ? { ...item, attendance } : item),
    })
}

export const markActivityPaid = (assignmentId, receiptNo) => {
    const state = getActivityFeeState()
    return save({
        ...state,
        assignments: state.assignments.map((item) => item.id === assignmentId ? { ...item, paymentStatus: 'Paid', receiptNo } : item),
    })
}
