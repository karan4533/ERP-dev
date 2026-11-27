import React from 'react'

/**
 * Prevents a child render/chunk failure from leaving the PRO shell as a blank screen.
 */
export default class ProPortalErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { message: '' }
    }

    static getDerivedStateFromError(error) {
        return { message: error?.message || 'The PRO portal could not render this screen.' }
    }

    componentDidCatch(error) {
        // Keep console evidence for local diagnosis; do not invent recovery APIs.
        console.error('PRO portal render failure', error)
    }

    render() {
        if (this.state.message) {
            return (
                <section className='bg-white rounded-2xl shadow-md p-6 max-w-3xl'>
                    <h2 className='text-xl font-semibold text-black'>PRO portal error</h2>
                    <p className='mt-3 text-sm text-[#667085] leading-relaxed'>{this.state.message}</p>
                    <p className='mt-4 text-sm text-[#667085]'>
                        Try refreshing the page. If this continues, sign out and sign in again as PRO.
                    </p>
                </section>
            )
        }
        return this.props.children
    }
}
