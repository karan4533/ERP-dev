export const SECURITY_REGISTERS_KEY = 'schoolerp-security-registers-v1'
export const SECURITY_VENDORS_KEY = 'schoolerp-security-vendors-v1'
export const SECURITY_HANDOVER_KEY = 'schoolerp-security-handover-v1'

export const REGISTER_SEED = [
    { id: 'SEC-2026-0001', type: 'INWARD', date: '2026-09-22', time: '09:15', party: 'City Courier', purpose: 'Document delivery', item: 'Sealed envelope', quantity: 1, reference: 'AWB-441', handledBy: 'Gate Keeper', remarks: '' },
    { id: 'SEC-2026-0002', type: 'OUTWARD', date: '2026-09-22', time: '16:40', party: 'Parent of Grade 6', purpose: 'Return of found item', item: 'ID card', quantity: 1, reference: 'LF-2026-0001', handledBy: 'Gate Keeper', remarks: '' },
]

export const HANDOVER_SEED = [
    { id: 'HO-2026-0001', shift: 'Morning', outgoingStaff: 'Ramesh K.', incomingStaff: 'Suresh M.', dateTime: '2026-09-22 14:00', pendingIncidents: 'None', keysAssets: 'Main gate keys, visitor register', notes: 'Visitor peak expected at 16:00', status: 'Completed' },
]

export const VENDOR_SEED = [
    { id: 'VND-2026-0001', vendorName: 'SecureLine Services', company: 'SecureLine Pvt Ltd', contact: '9840011122', purpose: 'CCTV AMC', imageName: 'vendor-id.jpg', documentName: 'amc-agreement.pdf', status: 'Active' },
]

export const VISITOR_SEED = [
    { id: 'VIS-2026-0001', visitorName: 'Anita Rao', purpose: 'Admission enquiry', host: 'Front Office', inTime: '10:05', outTime: '', date: '2026-09-23', status: 'Inside' },
]
