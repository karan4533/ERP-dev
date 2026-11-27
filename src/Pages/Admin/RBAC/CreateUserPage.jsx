import React from 'react'
import CreateUserPage from '../../../Common/RBAC/CreateUserPage'
import {
    DEFAULT_USER_FORM,
    createUser,
    createUserViaApi,
    isAdminUsersApiActive,
} from '../../../Common/RBAC/createdUsersData'

const ROUTE_BASE = '/admin/rbac/user-creation'

const AdminCreateUserPage = () => {
    const apiMode = isAdminUsersApiActive()

    if (!apiMode) {
        return (
            <CreateUserPage
                routeBase={ROUTE_BASE}
                defaultForm={DEFAULT_USER_FORM}
                onSubmit={createUser}
            />
        )
    }

    return (
        <CreateUserPage
            routeBase={ROUTE_BASE}
            defaultForm={DEFAULT_USER_FORM}
            onSubmit={createUserViaApi}
            pageDescription='Create a staff login. The user must change the password at first sign-in.'
            passwordLabel='Password (optional)'
            passwordPlaceholder='Leave blank to generate a temporary password'
            passwordHelp='At least 10 characters with a letter and a number. If left blank, a temporary password is generated and shown once after saving.'
            onSuccess={(result, navigate) => {
                // The temporary password travels in router state only: it is shown once on the
                // list page and is gone after a refresh. It is never stored.
                navigate(ROUTE_BASE, {
                    state: result.temporaryPassword
                        ? {
                            credential: {
                                name: result.user.name,
                                email: result.user.email,
                                staffCode: result.user.id,
                                temporaryPassword: result.temporaryPassword,
                                reason: 'created',
                            },
                        }
                        : null,
                })
            }}
        />
    )
}

export default AdminCreateUserPage
