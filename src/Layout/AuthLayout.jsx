import React from 'react'
import { useLocation } from 'react-router-dom'
import SignIn from '../Pages/Authentication/SignIn'
import SignUp from '../Pages/Authentication/SignUp'
import SkipLink from '../Common/ui/SkipLink'

const AuthLayout = () => {
    const location = useLocation()
    const pathname = location.pathname

    const isSignUp = pathname === '/signup'

    return (
        <div className='min-h-screen bg-[radial-gradient(circle_at_top_left,#EEF0FF_0,transparent_36%),var(--erp-canvas)]'>
            <SkipLink targetId='auth-content' />
            <main id='auth-content' tabIndex={-1}>
                {isSignUp ? <SignUp /> : <SignIn />}
            </main>
        </div>
    )
}

export default AuthLayout
