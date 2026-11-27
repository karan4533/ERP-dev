import React from 'react'
import signin_img from "../../assets/images/signin-img.png"
import AuthHeader from './AuthHeader'

const SignUp = () => {
    return (
        <div className="relative w-full min-h-screen font-poppins flex flex-col">
            <AuthHeader />

            <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2">
                <div className="flex justify-center items-center md:p-6 p-2">
                    <div className="w-full max-w-lg flex flex-col gap-y-8 py-8">
                        {/* <div>
                            <h1 className='text-4xl font-semibold text-[#313131] md:text-left text-center'>Profile</h1>
                            <p className='text-base font-medium text-[#313131]/70 mt-4 md:text-left text-center'>Select your correct profile</p>
                        </div> */}

                    </div>
                </div>
                <div className='hidden md:flex justify-center items-center p-6'>
                    <img src={signin_img} className='w-full max-w-md' alt='signin_img' />
                </div>
            </div>

        </div>
    )
}

export default SignUp