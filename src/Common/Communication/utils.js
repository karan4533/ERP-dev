import {
    format,
    isToday,
    isYesterday,
    isThisWeek,
    parseISO,
    differenceInMinutes,
} from 'date-fns'

export const parseDate = (value) => {
    if (!value) return new Date()
    return typeof value === 'string' ? parseISO(value) : new Date(value)
}

export const formatConversationTime = (value) => {
    const date = parseDate(value)
    if (isToday(date)) return format(date, 'h:mm a')
    if (isYesterday(date)) return 'Yesterday'
    if (isThisWeek(date)) return format(date, 'EEE')
    return format(date, 'dd MMM yyyy')
}

export const formatMessageTime = (value) => format(parseDate(value), 'h:mm a')

export const getDateSeparatorLabel = (value) => {
    const date = parseDate(value)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'dd MMMM yyyy')
}

export const groupMessagesByDate = (messages = []) => {
    const groups = []
    let currentKey = null

    messages.forEach((message) => {
        const label = getDateSeparatorLabel(message.createdAt)
        if (label !== currentKey) {
            currentKey = label
            groups.push({ type: 'separator', id: `sep-${label}-${message.id}`, label })
        }
        groups.push({ type: 'message', id: message.id, message })
    })

    return groups
}

export const isRecentConversation = (value) => differenceInMinutes(new Date(), parseDate(value)) <= 60 * 24 * 2
