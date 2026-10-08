import {
    addDays,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    isToday,
    isWithinInterval,
    parseISO,
    startOfMonth,
    startOfWeek,
} from 'date-fns'

export const toDateKey = (date) => format(date, 'yyyy-MM-dd')

export const parseDateKey = (key) => parseISO(key)

export const formatDisplayDate = (key) => format(parseDateKey(key), 'dd MMM yyyy')

export const formatRangeLabel = (startDate, endDate) => {
    if (startDate === endDate) return formatDisplayDate(startDate)
    return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
}

export const getMonthCells = (currentDate) => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
}

export const itemCoversDate = (item, date) => {
    const day = typeof date === 'string' ? parseDateKey(date) : date
    const start = parseDateKey(item.startDate)
    const end = parseDateKey(item.endDate)
    return isWithinInterval(day, { start, end })
}

export const getItemsForDate = (items, date) => items.filter((item) => itemCoversDate(item, date))

export const getItemsInMonth = (items, currentDate) => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    return items
        .filter((item) => {
            const start = parseDateKey(item.startDate)
            const end = parseDateKey(item.endDate)
            return start <= monthEnd && end >= monthStart
        })
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export const getUpcomingItems = (items, fromDate = new Date(), limit = 8) => {
    const fromKey = toDateKey(fromDate)
    return items
        .filter((item) => item.endDate >= fromKey)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, limit)
}

export {
    addDays,
    format,
    isSameDay,
    isSameMonth,
    isToday,
    startOfMonth,
}
