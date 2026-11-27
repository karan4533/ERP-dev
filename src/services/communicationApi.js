import { apiRequest, getAccessToken, isApiCommunicationEnabled } from './apiClient'

export const canUseCommunicationApi = () => isApiCommunicationEnabled() && Boolean(getAccessToken())

export const listDirectoryApi = () => apiRequest('/communication/directory')

export const listConversationsApi = () => apiRequest('/communication/conversations')

export const getConversationApi = (id) => apiRequest(`/communication/conversations/${id}`)

export const startConversationApi = (userId) =>
    apiRequest('/communication/conversations', { method: 'POST', body: { userId } })

export const createGroupConversationApi = (userIds, title) =>
    apiRequest('/communication/conversations/groups', {
        method: 'POST',
        body: { userIds, title: title || null },
    })

export const sendMessageApi = (conversationId, { body, file }) => {
    const form = new FormData()
    if (body) form.append('body', body)
    if (file) form.append('file', file)
    return apiRequest(`/communication/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: form,
        formData: true,
    })
}

export const sendNewMessageApi = (userId, { body, file }) => {
    const form = new FormData()
    form.append('userId', userId)
    if (body) form.append('body', body)
    if (file) form.append('file', file)
    return apiRequest('/communication/messages', { method: 'POST', body: form, formData: true })
}

export const patchConversationApi = (id, flags) =>
    apiRequest(`/communication/conversations/${id}`, { method: 'PATCH', body: flags })
