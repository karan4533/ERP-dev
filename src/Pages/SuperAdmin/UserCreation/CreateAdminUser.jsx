import React from 'react'
import CreateUserPage from '../../../Common/RBAC/CreateUserPage'
import {
    createAdminUserViaApi,
    DEFAULT_ADMIN_USER_FORM,
    ROUTE_BASE,
} from './adminUsersData'

const CreateAdminUser = () => (
    <CreateUserPage
        routeBase={ROUTE_BASE}
        defaultForm={DEFAULT_ADMIN_USER_FORM}
        pageTitle='Create User'
        pageDescription='Create a campus login. Available roles come from the server for your Super Admin account (Administrator, staff portals, File Room, CCTV, Managing Director).'
        submitLabel='Create User'
        successMessage='User created successfully.'
        onSubmit={createAdminUserViaApi}
        onSuccess={(result, navigate) => navigate(`${ROUTE_BASE}/view/${result.user.id}`)}
    />
)

export default CreateAdminUser
