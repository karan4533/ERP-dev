import { apiRequest, getAccessToken, isApiFinanceEnabled } from './apiClient'

/**
 * Finance calls always run as the signed-in user. There is no fallback login: with no token the
 * request fails closed, and the backend's role permissions decide what the user may do.
 */
export async function connectFinanceApi() {
    if (!isApiFinanceEnabled()) return false
    return Boolean(getAccessToken())
}

export async function pullFinanceState() {
    const connected = await connectFinanceApi()
    if (!connected) throw new Error('Finance API is not available')
    return apiRequest('/finance/state')
}

/** Parent/student scoped fees (linked children / self only). */
export async function pullMyFeesState() {
    const connected = await connectFinanceApi()
    if (!connected) throw new Error('Finance API is not available')
    return apiRequest('/finance/my-fees')
}

export async function pushFinanceState(data) {
    const connected = await connectFinanceApi()
    if (!connected) throw new Error('Finance API is not available')
    return apiRequest('/finance/state', {
        method: 'PUT',
        body: { data },
    })
}

export async function resetFinanceStateApi() {
    const connected = await connectFinanceApi()
    if (!connected) throw new Error('Finance API is not available')
    return apiRequest('/finance/state/reset', { method: 'POST' })
}

export async function putFinanceCollection(collection, items) {
    const connected = await connectFinanceApi()
    if (!connected) throw new Error('Finance API is not available')
    return apiRequest(`/finance/${collection}`, { method: 'PUT', body: items })
}

const postAction = async (path, body = {}) => {
    const connected = await connectFinanceApi()
    if (!connected) throw new Error('Finance API is not available')
    return apiRequest(`/finance/actions/${path}`, { method: 'POST', body })
}

export const collectPaymentApi = (body) => postAction('collect-payment', body)
/** Parent/student self-pay (linked children / self only). */
export const payMyFeesApi = (body) => postAction('pay-my-fees', body)
export const settleChequeApi = (body) => postAction('settle-cheque', body)
export const sendReceiptApi = (body) => postAction('send-receipt', body)
export const gatewayIntentApi = (body) => postAction('gateway-intent', body)
export const gatewayConfirmApi = (body) => postAction('gateway-confirm', body)
export const applyHrConcessionsApi = () => postAction('apply-hr-concessions', {})
export const postPayrollVoucherApi = (body) => postAction('post-payroll-voucher', body)
export const decideApprovalApi = (body) => postAction('decide-approval', body)
export const postTransportEnrollmentFeeApi = (body) => postAction('post-transport-enrollment-fee', body)
