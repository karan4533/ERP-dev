import React from 'react'
import { useLocation } from 'react-router-dom'
import EscalationListPage from '../../../Common/EscalationManagement/EscalationListPage'

const EscalationList = ({ roleKey }) => {
    const location = useLocation()
    const effectiveRole = roleKey || (location.pathname.startsWith('/parent') ? 'parent' : 'student')
    return <EscalationListPage roleKey={effectiveRole} />
}

export default EscalationList

