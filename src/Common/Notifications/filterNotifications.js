export const filterNotifications = (items, filters) =>
    items.filter((item) => {
        const search = filters.search.trim().toLowerCase()
        const matchesSearch =
            !search ||
            item.title.toLowerCase().includes(search) ||
            item.message.toLowerCase().includes(search) ||
            item.postedBy.toLowerCase().includes(search) ||
            (item.meta && item.meta.toLowerCase().includes(search))

        const matchesType = !filters.type || item.type === filters.type

        return matchesSearch && matchesType
    })
