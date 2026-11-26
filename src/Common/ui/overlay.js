export const getOverlayA11yProps = (id, hasDescription = false) => {
    const titleId = `${id}-title`
    const descriptionId = `${id}-description`

    return {
        dialog: {
            'aria-labelledby': titleId,
            'aria-describedby': hasDescription ? descriptionId : undefined,
        },
        titleId,
        descriptionId,
    }
}

export const shouldDismissOverlay = ({
    reason,
    closeOnEscape = true,
    closeOnBackdrop = true,
}) => {
    if (reason === 'escape') return closeOnEscape
    if (reason === 'backdrop') return closeOnBackdrop
    return false
}

export const getWrappedFocusIndex = ({ currentIndex, count, direction }) => {
    if (count <= 0) return -1
    if (currentIndex < 0) return direction < 0 ? count - 1 : 0
    return (currentIndex + direction + count) % count
}
