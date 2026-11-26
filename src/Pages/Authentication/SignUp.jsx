import React from 'react'
import signin_img from "../../assets/images/signin-img.png"
import { NavLink } from 'react-router-dom'
import AuthHeader from './AuthHeader'
import FeedbackState from '../../Common/ui/FeedbackState'

const SignUp = () => {
    return (
        <div className="relative w-full min-h-screen font-poppins flex flex-col">
            <AuthHeader />

            <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2">
                <div className="flex justify-center items-center md:p-6 p-2">
                    <FeedbackState
                        kind='permission'
                        title='Self-service registration is unavailable'
                        description='ERP accounts are created through authorized administration and admission workflows. Public sign-up is intentionally disabled.'
                        className='w-full max-w-lg'
                        action={<NavLink to='/signin' className='inline-flex min-h-10 items-center rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'>Return to Sign In</NavLink>}
                    />
                </div>
                <div className='hidden md:flex justify-center items-center p-6'>
                    <img src={signin_img} className='w-full max-w-md' alt='School workspace account access' />
                </div>
            </div>

        </div>
    )
}

export default SignUp
