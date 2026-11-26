const FEEDBACK_STATES = Object.freeze({
    loading: Object.freeze({
        kind: 'loading',
        role: 'status',
        tone: 'info',
        title: 'Loading information',
        description: 'This may take a moment.',
    }),
    empty: Object.freeze({
        kind: 'empty',
        role: 'status',
        tone: 'neutral',
        title: 'Nothing to show',
        description: 'Change the filters or create the first record if you have permission.',
    }),
    error: Object.freeze({
        kind: 'error',
        role: 'alert',
        tone: 'danger',
        title: 'Information could not be loaded',
        description: 'Check your connection and try again. Your existing changes have not been removed.',
    }),
    permission: Object.freeze({
        kind: 'permission',
        role: 'alert',
        tone: 'warning',
        title: 'Access is restricted',
        description: 'Your current role does not allow this action. Contact an administrator if access is required.',
    }),
})

const INTEGRATION_STATES = Object.freeze({
    demo: Object.freeze({
        state: 'demo',
        tone: 'warning',
        title: 'Demo data',
        description: 'Changes are stored in this browser and are not connected to a production service.',
    }),
    disconnected: Object.freeze({
        state: 'disconnected',
        tone: 'neutral',
        title: 'Service not connected',
        description: 'This workflow is ready for backend integration but is not connected yet.',
    }),
    syncing: Object.freeze({
        state: 'syncing',
        tone: 'info',
        title: 'Sync in progress',
        description: 'Keep this page open while the latest records are checked.',
    }),
    connected: Object.freeze({
        state: 'connected',
        tone: 'success',
        title: 'Service connected',
        description: 'The latest connection check completed successfully.',
    }),
    failed: Object.freeze({
        state: 'failed',
        tone: 'danger',
        title: 'Connection needs attention',
        description: 'The last connection attempt failed. Review the integration before retrying.',
    }),
})

export const getFeedbackState = (kind = 'empty', overrides = {}) => ({
    ...(FEEDBACK_STATES[kind] ?? FEEDBACK_STATES.empty),
    ...overrides,
})

export const getIntegrationState = (state = 'disconnected') => (
    INTEGRATION_STATES[state] ?? INTEGRATION_STATES.disconnected
)
