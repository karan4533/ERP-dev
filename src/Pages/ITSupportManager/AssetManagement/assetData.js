export const ASSET_CATEGORIES = [
    'Laptop',
    'Desktop',
    'Printer',
    'Projector',
    'Network Device',
    'Software',
    'Server',
    'Mobile Device',
    'Accessories',
    'Others',
]

export const BRAND_OPTIONS = [
    'Dell',
    'HP',
    'Lenovo',
    'Cisco',
    'Apple',
    'Microsoft',
    'Epson',
    'Samsung',
]

export const STATUS_OPTIONS = ['Active', 'Available', 'Assigned', 'Damaged', 'Under Repair', 'Retired']
export const ADD_ASSET_STATUSES = ['Active', 'Available', 'Assigned']
const ASSET_KEY = 'school-erp-it-assets-v1'
const SERVICE_KEY = 'school-erp-it-asset-service-v1'
const TRANSFER_KEY = 'school-erp-it-asset-transfers-v1'

export const ASSETS = [
    {
        assetId: 'AST-2026-0142',
        assetName: 'Staff Laptop — Mathematics Dept',
        category: 'Laptop',
        brand: 'Dell',
        model: 'Latitude 5540',
        serialNumber: 'DL5540-XK9281',
        assetTagNumber: 'TAG-IT-0142',
        purchaseDate: '15-03-2024',
        warrantyExpiry: '14-03-2027',
        status: 'Active',
        department: 'Mathematics',
        custodian: 'Priya Nair',
        vendorName: 'Dell Authorized Partner',
        purchaseCost: '₹68,500',
        invoiceNumber: 'INV-DL-8821',
        warrantyStartDate: '15-03-2024',
        warrantyEndDate: '14-03-2027',
    },
    {
        assetId: 'AST-2026-0138',
        assetName: 'Admin Block Printer',
        category: 'Printer',
        brand: 'HP',
        model: 'LaserJet Pro M404dn',
        serialNumber: 'HP404-CN7720',
        assetTagNumber: 'TAG-IT-0138',
        purchaseDate: '02-11-2023',
        warrantyExpiry: '01-11-2026',
        status: 'Active',
        vendorName: 'HP India Store',
        purchaseCost: '₹24,800',
        invoiceNumber: 'INV-HP-4412',
        warrantyStartDate: '02-11-2023',
        warrantyEndDate: '01-11-2026',
    },
    {
        assetId: 'AST-2026-0125',
        assetName: 'Science Lab Projector',
        category: 'Projector',
        brand: 'Epson',
        model: 'EB-X06',
        serialNumber: 'EPX06-991204',
        assetTagNumber: 'TAG-IT-0125',
        purchaseDate: '20-06-2022',
        warrantyExpiry: '19-06-2025',
        status: 'Under Repair',
        vendorName: 'Epson Service Hub',
        purchaseCost: '₹42,000',
        invoiceNumber: 'INV-EP-3301',
        warrantyStartDate: '20-06-2022',
        warrantyEndDate: '19-06-2025',
    },
    {
        assetId: 'AST-2026-0098',
        assetName: 'Core Switch — Server Room',
        category: 'Network Device',
        brand: 'Cisco',
        model: 'Catalyst 2960-X',
        serialNumber: 'CS2960-FA8821',
        assetTagNumber: 'TAG-IT-0098',
        purchaseDate: '10-01-2023',
        warrantyExpiry: '09-01-2028',
        status: 'Active',
        vendorName: 'Cisco Partner Network',
        purchaseCost: '₹1,85,000',
        invoiceNumber: 'INV-CS-1109',
        warrantyStartDate: '10-01-2023',
        warrantyEndDate: '09-01-2028',
    },
    {
        assetId: 'AST-2026-0071',
        assetName: 'Library Desktop PC',
        category: 'Desktop',
        brand: 'Lenovo',
        model: 'ThinkCentre M70q',
        serialNumber: 'LNM70Q-772019',
        assetTagNumber: 'TAG-IT-0071',
        purchaseDate: '05-09-2021',
        warrantyExpiry: '04-09-2024',
        status: 'Damaged',
        vendorName: 'Lenovo Direct',
        purchaseCost: '₹38,200',
        invoiceNumber: 'INV-LN-2290',
        warrantyStartDate: '05-09-2021',
        warrantyEndDate: '04-09-2024',
    },
    {
        assetId: 'AST-2026-0044',
        assetName: 'Microsoft Office 365 License',
        category: 'Software',
        brand: 'Microsoft',
        model: 'Office 365 E3',
        serialNumber: 'MS-O365-2024-044',
        assetTagNumber: 'TAG-IT-0044',
        purchaseDate: '01-04-2024',
        warrantyExpiry: '31-03-2025',
        status: 'Active',
        vendorName: 'Microsoft Volume Licensing',
        purchaseCost: '₹2,40,000',
        invoiceNumber: 'INV-MS-7701',
        warrantyStartDate: '01-04-2024',
        warrantyEndDate: '31-03-2025',
    },
    {
        assetId: 'AST-2025-0312',
        assetName: 'Old Staff Laptop',
        category: 'Laptop',
        brand: 'HP',
        model: 'ProBook 450 G7',
        serialNumber: 'HP450-661902',
        assetTagNumber: 'TAG-IT-0312',
        purchaseDate: '12-08-2019',
        warrantyExpiry: '11-08-2022',
        status: 'Retired',
        vendorName: 'HP India Store',
        purchaseCost: '₹52,000',
        invoiceNumber: 'INV-HP-1198',
        warrantyStartDate: '12-08-2019',
        warrantyEndDate: '11-08-2022',
    },
]

export const statusBadgeColor = {
    Active: 'bg-[#4CAF5033] text-[#4CAF50]',
    Available: 'bg-[#2196F333] text-[#2196F3]',
    Assigned: 'bg-[#515DEF33] text-[#515DEF]',
    Damaged: 'bg-[#FF572233] text-[#FF5722]',
    'Under Repair': 'bg-[#FF980033] text-[#FF9800]',
    Retired: 'bg-[#9E9E9E33] text-[#616161]',
}

const readList = (key, seed) => {
    try {
        const raw = localStorage.getItem(key)
        if (raw) return JSON.parse(raw)
    } catch {
        /* seed */
    }
    localStorage.setItem(key, JSON.stringify(seed))
    return seed
}

const SERVICE_SEED = [
    { id: 'SRV-2026-001', assetId: 'AST-2026-0142', serviceDate: '12-01-2026', serviceType: 'Battery check', issue: 'Battery warning', provider: 'Dell Authorized Partner', location: 'Outside', cost: '₹1,200', status: 'Completed', completedDate: '13-01-2026', remarks: 'Battery replaced', createdBy: 'IT Support', createdAt: '12-01-2026' },
    { id: 'SRV-2026-002', assetId: 'AST-2026-0142', serviceDate: '02-06-2026', serviceType: 'Cleaning', issue: 'Keyboard dust', provider: 'IT Support', location: 'Internal', cost: '₹0', status: 'Completed', completedDate: '02-06-2026', remarks: 'In-house service', createdBy: 'IT Support', createdAt: '02-06-2026' },
]

const TRANSFER_SEED = [
    { id: 'TRF-2026-001', assetId: 'AST-2026-0142', fromDepartment: 'IT Support', fromCustodian: 'IT Store', toDepartment: 'Mathematics', toCustodian: 'Priya Nair', transferDate: '20-03-2024', reason: 'Staff issue', remarks: '', transferredBy: 'IT Support', status: 'Completed' },
]

export const getAssets = () => readList(ASSET_KEY, ASSETS)
export const saveAssets = (rows) => localStorage.setItem(ASSET_KEY, JSON.stringify(rows))
export const getAssetById = (id) => getAssets().find((entry) => entry.assetId === id) ?? null

export const addAsset = (asset) => {
    const rows = getAssets()
    const record = { ...asset, assetId: asset.assetId || `AST-${Date.now()}` }
    saveAssets([record, ...rows])
    return record
}

export const updateAsset = (assetId, patch) => {
    const rows = getAssets().map((item) => item.assetId === assetId ? { ...item, ...patch } : item)
    saveAssets(rows)
    return rows.find((item) => item.assetId === assetId)
}

export const getServiceHistory = (assetId) => readList(SERVICE_KEY, SERVICE_SEED)
    .filter((item) => item.assetId === assetId)
    .sort((a, b) => String(b.serviceDate).localeCompare(String(a.serviceDate)))

export const addServiceRecord = (record) => {
    const rows = readList(SERVICE_KEY, SERVICE_SEED)
    const next = { ...record, id: `SRV-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }
    localStorage.setItem(SERVICE_KEY, JSON.stringify([next, ...rows]))
    return next
}

export const getTransfers = (assetId) => readList(TRANSFER_KEY, TRANSFER_SEED)
    .filter((item) => item.assetId === assetId)

export const transferAsset = (asset, payload) => {
    const history = readList(TRANSFER_KEY, TRANSFER_SEED)
    const entry = {
        id: `TRF-${Date.now()}`,
        assetId: asset.assetId,
        fromDepartment: asset.department || '',
        fromCustodian: asset.custodian || '',
        toDepartment: payload.toDepartment,
        toCustodian: payload.toCustodian,
        transferDate: payload.transferDate,
        reason: payload.reason,
        remarks: payload.remarks,
        transferredBy: 'IT Support',
        status: 'Completed',
    }
    localStorage.setItem(TRANSFER_KEY, JSON.stringify([entry, ...history]))
    return updateAsset(asset.assetId, { department: payload.toDepartment, custodian: payload.toCustodian, status: 'Assigned' })
}
