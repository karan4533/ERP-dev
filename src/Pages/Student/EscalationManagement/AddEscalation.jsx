import React from 'react'
import { useLocation } from 'react-router-dom'
import AddEscalationPage from '../../../Common/EscalationManagement/AddEscalationPage'

const AddEscalation = ({ roleKey }) => {
    const location = useLocation()
    const effectiveRole = roleKey || (location.pathname.startsWith('/parent') ? 'parent' : 'student')
    return <AddEscalationPage roleKey={effectiveRole} />
}

export default AddEscalation

