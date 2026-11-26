import React from 'react'
import { useLocation } from 'react-router-dom'
import ViewEscalationPage from '../../../Common/EscalationManagement/ViewEscalationPage'

const ViewEscalation = ({ roleKey }) => {
    const location = useLocation()
    const effectiveRole = roleKey || (location.pathname.startsWith('/parent') ? 'parent' : 'student')
    return <ViewEscalationPage roleKey={effectiveRole} />
}

export default ViewEscalation

