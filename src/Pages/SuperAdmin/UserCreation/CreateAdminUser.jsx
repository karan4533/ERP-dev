import React from 'react'
import CreateUserPage from '../../../Common/RBAC/CreateUserPage'
import { ROLES } from '../../../constants/roles'
import {
    ADMIN_ROLE_LABEL,
    createAdminUser,
    DEFAULT_ADMIN_USER_FORM,
    ROUTE_BASE,
} from './adminUsersData'

const CreateAdminUser = () => (
    <CreateUserPage
        routeBase={ROUTE_BASE}
        defaultForm={DEFAULT_ADMIN_USER_FORM}
        fixedRole={ROLES.ADMIN}
        fixedRoleLabel={ADMIN_ROLE_LABEL}
        pageTitle='Create Admin User'
        pageDescription='Create an Administrator account with the full user profile. Role is fixed to Administrator for Super Admin user creation.'
        submitLabel='Create Admin User'
        successMessage='Admin user created successfully.'
        onSubmit={createAdminUser}
        onSuccess={(result, navigate) => navigate(`${ROUTE_BASE}/view/${result.user.id}`)}
    />
)

export default CreateAdminUser
