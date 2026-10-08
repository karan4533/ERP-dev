export const SECURITY_LABELS = [
    { currentLabel: 'Security Manager', route: '', role: 'Not a distinct login role', requiredNewLabel: '' },
    { currentLabel: 'Gate Keeper Manager', route: '/gatekeeper-manager', role: 'gatekeeper-manager', requiredNewLabel: '' },
    { currentLabel: 'Gate Keeper', route: '/gate-keeper', role: 'gate-keeper', requiredNewLabel: '' },
    { currentLabel: 'CSO / Gate Keeper', route: '/gate-keeper/incidents', role: 'gate-keeper', requiredNewLabel: 'Applied for incident entry only (row 97)' },
    { currentLabel: 'Incidents Management List', route: '/gatekeeper-manager/incidents-list', role: 'gatekeeper-manager', requiredNewLabel: '' },
    { currentLabel: 'Gate Pass', route: '/gate-keeper/gate-pass-list', role: 'gate-keeper', requiredNewLabel: '' },
    { currentLabel: 'Hostel Gate Pass', route: '/gate-keeper/hostel-gate-pass', role: 'gate-keeper', requiredNewLabel: '' },
]
