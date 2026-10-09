import { apiRequest, getAccessToken, isApiFinanceEnabled } from './apiClient'
import { apiLogin } from './authApi'

export async function connectFinanceApi() {
    if (!isApiFinanceEnabled()) return false
    if (getAccessToken()) return true
    try {
        await apiLogin('accounthead@qmis.edu', 'accounts123')
        return true
    } catch {
        try {
            await apiLogin('admin@qmis.edu', 'admin123')
            return true
        } catch {
            return false
        }
    }
}

export async function pullFinanceState() {
    const connected = await connectFinanceApi()
    if (!connected) throw new Error('Finance API is not available')
    return apiRequest('/finance/state')
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
export const settleChequeApi = (body) => postAction('settle-cheque', body)
export const sendReceiptApi = (body) => postAction('send-receipt', body)
export const gatewayIntentApi = (body) => postAction('gateway-intent', body)
export const applyHrConcessionsApi = () => postAction('apply-hr-concessions', {})
export const postPayrollVoucherApi = (body) => postAction('post-payroll-voucher', body)
export const decideApprovalApi = (body) => postAction('decide-approval', body)
