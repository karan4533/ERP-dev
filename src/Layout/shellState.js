export const DESKTOP_BREAKPOINT = 1024

const viewport = (width) => {
    const numericWidth = Number(width)
    return Number.isFinite(numericWidth) && numericWidth > 0 ? numericWidth : DESKTOP_BREAKPOINT
}

export const getInitialSidebarState = (width) => {
    const isMobile = viewport(width) < DESKTOP_BREAKPOINT
    return {
        isMobile,
        sidebarHidden: isMobile,
    }
}

export const shouldShowMobileBackdrop = (width, sidebarHidden) => (
    viewport(width) < DESKTOP_BREAKPOINT && !sidebarHidden
)

export const shouldCloseSidebarOnEscape = (key, width, sidebarHidden) => (
    key === 'Escape' && shouldShowMobileBackdrop(width, sidebarHidden)
)
