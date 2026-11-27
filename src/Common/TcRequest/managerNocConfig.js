/** Maps TC NOC UI base path → role code for the manager viewing the inbox. */
export const TC_NOC_MANAGER_CONFIG = [
    { basePath: '/transport-manager/tc-noc', roleCode: 'transportmanager', label: 'Transport Manager' },
    { basePath: '/librarian/tc-noc', roleCode: 'librarian', label: 'Librarian' },
    { basePath: '/stationery-store-manager/tc-noc', roleCode: 'stationerystoremanager', label: 'Store Manager' },
    { basePath: '/account-head/tc-noc', roleCode: 'accounthead', label: 'Accounts / Finance' },
]

export const resolveTcNocManager = (pathname = '') => {
    const path = String(pathname || '')
    const match = TC_NOC_MANAGER_CONFIG.find((item) => path.startsWith(item.basePath))
    return match || TC_NOC_MANAGER_CONFIG[0]
}
