import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { getOverlayA11yProps, getWrappedFocusIndex, shouldDismissOverlay } from './overlay'

const FOCUSABLE_SELECTOR = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',')

const SIZE_CLASSES = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-[calc(100vw-2rem)]',
}

const Dialog = ({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    placement = 'center',
    closeOnEscape = true,
    closeOnBackdrop = true,
    showCloseButton = true,
    initialFocusRef,
    className = '',
    contentClassName = '',
}) => {
    const dialogRef = useRef(null)
    const panelRef = useRef(null)
    const lastFocusedRef = useRef(null)
    const generatedId = useId().replace(/:/g, '')
    const a11y = getOverlayA11yProps(`overlay-${generatedId}`, Boolean(description))

    useEffect(() => {
        const dialog = dialogRef.current
        if (!open || !dialog) return undefined

        lastFocusedRef.current = document.activeElement
        if (!dialog.open) dialog.showModal()

        const focusFrame = window.requestAnimationFrame(() => {
            const preferred = initialFocusRef?.current
                || panelRef.current?.querySelector('[data-autofocus]')
                || panelRef.current?.querySelector(FOCUSABLE_SELECTOR)
                || panelRef.current
            preferred?.focus()
        })

        return () => {
            window.cancelAnimationFrame(focusFrame)
            if (dialog.open) dialog.close()
            const previous = lastFocusedRef.current
            window.requestAnimationFrame(() => previous?.isConnected && previous.focus())
        }
    }, [initialFocusRef, open])

    if (!open) return null

    const requestClose = (reason) => {
        if (shouldDismissOverlay({ reason, closeOnEscape, closeOnBackdrop })) onClose?.(reason)
    }

    const handleCancel = (event) => {
        event.preventDefault()
        requestClose('escape')
    }

    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget) requestClose('backdrop')
    }

    const handleKeyDown = (event) => {
        if (event.key !== 'Tab') return
        const focusable = [...(panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || [])]
        if (!focusable.length) {
            event.preventDefault()
            panelRef.current?.focus()
            return
        }

        const currentIndex = focusable.indexOf(document.activeElement)
        const direction = event.shiftKey ? -1 : 1
        const atBoundary = direction > 0
            ? currentIndex === focusable.length - 1
            : currentIndex <= 0

        if (currentIndex === -1 || atBoundary) {
            event.preventDefault()
            focusable[getWrappedFocusIndex({ currentIndex, count: focusable.length, direction })]?.focus()
        }
    }

    const isDrawer = placement === 'right'

    return (
        <dialog
            ref={dialogRef}
            className={`erp-overlay ${isDrawer ? 'erp-overlay--right' : 'erp-overlay--center'} ${className}`}
            aria-modal='true'
            {...a11y.dialog}
            onCancel={handleCancel}
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
        >
            <div
                ref={panelRef}
                tabIndex={-1}
                role='document'
                className={`erp-overlay__panel ${isDrawer ? 'erp-overlay__panel--drawer' : `erp-overlay__panel--dialog ${SIZE_CLASSES[size] || SIZE_CLASSES.md}`}`}
            >
                <header className='flex items-start justify-between gap-4 border-b border-[var(--erp-line)] px-5 py-4 sm:px-6'>
                    <div className='min-w-0'>
                        <h2 id={a11y.titleId} className='text-lg font-semibold text-[var(--erp-ink)]'>{title}</h2>
                        {description && <p id={a11y.descriptionId} className='mt-1 text-sm text-[var(--erp-slate)]'>{description}</p>}
                    </div>
                    {showCloseButton && (
                        <button
                            type='button'
                            onClick={() => onClose?.('close-button')}
                            className='-mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[var(--erp-slate)] hover:bg-[var(--erp-canvas)] hover:text-[var(--erp-red)]'
                            aria-label={`Close ${title}`}
                        >
                            <X aria-hidden='true' size={20} />
                        </button>
                    )}
                </header>
                <div className={`min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 ${contentClassName}`}>
                    {children}
                </div>
                {footer && <footer className='flex flex-wrap justify-end gap-2 border-t border-[var(--erp-line)] px-5 py-4 sm:px-6'>{footer}</footer>}
            </div>
        </dialog>
    )
}

export default Dialog
