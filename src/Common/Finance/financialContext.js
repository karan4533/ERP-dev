const valueOr = (value, fallback) => String(value || '').trim() || fallback

export const createFinancialContext = ({ period, lockState, source, integration } = {}) => ({
    period: valueOr(period, 'Period not selected'),
    lockState: valueOr(lockState, 'Unknown lock state'),
    source: valueOr(source, 'Source not connected'),
    integration: valueOr(integration, 'Disconnected'),
})
