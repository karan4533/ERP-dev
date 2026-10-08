import React from 'react'
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom'
import SignIn from '../Pages/Authentication/SignIn';
import SignUp from '../Pages/Authentication/SignUp';
import SelectProfile from '../Pages/Authentication/SelectProfile';

const AuthLayout = () => {

    const location = useLocation();
    const pathname = location.pathname;

    const authTitleMapping = {
        "/signin": "SignIn",
        "/signup": "SignUp",
        "/select-profile": "SelectProfile",
    };

    const authTitle = authTitleMapping[pathname] || "";

    const authComponents = {
        SignIn: <SignIn />,
        SignUp: <SignUp />,
        SelectProfile: <SelectProfile />,
    }

    return (
        <div>
            <main>
                {authComponents[authTitle]}
            </main>
        </div>
    )
}

export default AuthLayout