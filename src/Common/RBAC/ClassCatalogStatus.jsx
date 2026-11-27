import React from 'react'

/** Compact inline alert for forms that use useClassCatalogOptions. */
const ClassCatalogStatus = ({ status, error, onRetry }) => {
    if (status === 'loading') {
        return <p className='text-sm text-[#667085]'>Loading classes and sections…</p>
    }
    if (status !== 'error') return null
    return (
        <p role='alert' className='text-sm text-[#B42318]'>
            {error || 'Could not load classes and sections.'}{' '}
            {typeof onRetry === 'function' ? (
                <button type='button' onClick={onRetry} className='underline cursor-pointer'>
                    Retry
                </button>
            ) : null}
        </p>
    )
}

export default ClassCatalogStatus
