/**
 * Ranking for header page search. Pure (no React) so it can be unit-tested with node:test.
 * Every query word must appear in the page title or its menu section; title matches rank first.
 */
/** Flat list of real destinations in a menu: { title, section, to }. Group headers ('#…') are skipped. */
export const flattenSidebarLinks = (links, section = '') =>
    (links || []).flatMap((link) => {
        const own = link?.to && !String(link.to).startsWith('#') ? [{ title: link.title, section, to: link.to }] : []
        return [...own, ...flattenSidebarLinks(link?.subLinks, link?.title || section)]
    })

export const searchPages = (pages = [], query = '', limit = 8) => {
    const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return []
    const seen = new Set()
    return pages
        .filter((page) => {
            if (!page?.to || seen.has(page.to)) return false
            seen.add(page.to)
            const text = `${page.title || ''} ${page.section || ''}`.toLowerCase()
            return words.every((word) => text.includes(word))
        })
        .map((page) => {
            const title = String(page.title || '').toLowerCase()
            const score = (title.startsWith(words[0]) ? 0 : title.includes(words[0]) ? 1 : 2)
            return { page, score }
        })
        .sort((a, b) => a.score - b.score || String(a.page.title).localeCompare(String(b.page.title)))
        .slice(0, limit)
        .map(({ page }) => page)
}
