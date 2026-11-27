/**
 * Department heads that can receive an audit observation (recipient workflow).
 * Keep in sync with RECIPIENT_ROLES in backend/app/services/campus_audit_collections.py.
 */
export const AUDIT_RECIPIENTS = [
    { role: 'housekeepingmanager', department: 'Housekeeping', label: 'Housekeeping Manager' },
    { role: 'maintenancemanager', department: 'Maintenance', label: 'Maintenance Manager' },
    { role: 'itsupportmanager', department: 'IT Support', label: 'IT Support Manager' },
    { role: 'transportmanager', department: 'Transport', label: 'Transport Manager' },
    { role: 'canteenmanager', department: 'Canteen', label: 'Canteen Manager' },
    { role: 'stationerystoremanager', department: 'Store', label: 'Stationery Store Manager' },
    { role: 'librarian', department: 'Library', label: 'Librarian' },
    { role: 'gatekeepermanager', department: 'Security', label: 'Gate Keeper Manager' },
    { role: 'accounthead', department: 'Finance', label: 'Account Head' },
    { role: 'hr', department: 'HR', label: 'HR' },
    { role: 'prm', department: 'Front Office', label: 'PRM (Front Office)' },
    { role: 'fileroom', department: 'File Room', label: 'File Room' },
    { role: 'principal', department: 'Academic', label: 'Principal' },
    { role: 'coordinator', department: 'Academic', label: 'Coordinator' },
]

export const recipientForRole = (role) => {
    const code = String(role || '').trim().toLowerCase()
    return AUDIT_RECIPIENTS.find((item) => item.role === code) || null
}

/** Display text for an observation's recipient; legacy rows only have a free-text name. */
export const recipientDisplay = (observation) => {
    const match = recipientForRole(observation?.recipientRole)
    if (match) return `${match.label} (${match.department})`
    return observation?.recipient || observation?.responsiblePerson || ''
}

/** Fields to merge into an observation form when a recipient role is chosen ('' clears it). */
export const recipientFields = (role) => {
    const match = recipientForRole(role)
    if (!match) {
        return { recipientRole: '', recipientDepartment: '', recipient: '', responsiblePerson: '', responsibleDepartment: '' }
    }
    return {
        recipientRole: match.role,
        recipientDepartment: match.department,
        recipient: match.label,
        responsiblePerson: match.label,
        responsibleDepartment: match.department,
    }
}
