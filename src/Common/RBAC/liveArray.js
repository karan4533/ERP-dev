/** Live array proxy so existing `.map` / `.length` imports stay in sync with stores. */
export const liveArray = (getter) =>
    new Proxy([], {
        get(_, prop) {
            const list = getter()
            if (prop === 'length') return list.length
            if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list)
            if (typeof prop === 'string' && prop in Array.prototype) {
                const value = list[prop]
                return typeof value === 'function' ? value.bind(list) : value
            }
            return list[prop]
        },
    })
