import React from 'react'
import CreateUserPage from '../../../Common/RBAC/CreateUserPage'
import {
    DEFAULT_USER_FORM,
    createUser,
} from '../../../Common/RBAC/createdUsersData'

const ROUTE_BASE = '/admin/rbac/user-creation'

const AdminCreateUserPage = () => (
    <CreateUserPage
        routeBase={ROUTE_BASE}
        defaultForm={DEFAULT_USER_FORM}
        onSubmit={createUser}
    />
)

export default AdminCreateUserPage
