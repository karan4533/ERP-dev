/**
 * Stores, Inventory & Procurement Data Engine
 * Single Source of Truth for:
 * - Product Master & Multi-Category Inventory Catalog
 * - Multi-item Material Requisitions & HOD Approval
 * - Stock Issues (Returnable vs Non-Returnable) & Inventory Decrement
 * - Purchase Requirements & Multi-Vendor Quote Comparison
 * - Purchase Order (PO) Builder & Lifecycle State Machine
 * - Goods Receipt Notes (GRN) & Automated Stock Intake
 * - Cross-Department Synchronization with Finance & Audit
 */

import { recordAuditLog, dispatchNotification } from '../AuditAndNotifications/centralAuditEngine.js'
import { addAnnouncement } from '../Announcement/announcementData.js'

export const INVENTORY_STORAGE_KEY = 'schoolerp-inventory-catalog-v1'
export const REQUISITIONS_STORAGE_KEY = 'schoolerp-material-requisitions-v1'
export const PO_STORAGE_KEY = 'schoolerp-purchase-orders-v1'
export const GRN_STORAGE_KEY = 'schoolerp-goods-receipts-v1'
export const STOCK_ISSUE_STORAGE_KEY = 'schoolerp-stock-issues-v1'
export const VENDORS_STORAGE_KEY = 'schoolerp-procurement-vendors-v1'

let _memoryInventory = null
let _memoryRequisitions = null
let _memoryPOs = null
let _memoryGRNs = null
let _memoryStockIssues = null
let _memoryVendors = null

// 1. Initial Vendor Directory
export const INITIAL_VENDORS = [
    {
        id: 'VEN-001',
        name: 'Apex Educational Supplies Pvt Ltd',
        contactPerson: 'Rajiv Malhotra',
        phone: '+91 98112 34567',
        email: 'sales@apexedu.in',
        address: '42, Industrial Area Phase II, Okhla, New Delhi 110020',
        gstin: '07AAAAA1234A1Z5',
        category: 'Stationery & Printing',
        rating: 4.8,
        paymentTerms: 'Net 30 Days'
    },
    {
        id: 'VEN-002',
        name: 'TechMatrix Digital Solutions',
        contactPerson: 'Sandeep Varma',
        phone: '+91 98450 88214',
        email: 'orders@techmatrix.co.in',
        address: '108, Koramangala 4th Block, Bengaluru, Karnataka 560034',
        gstin: '29BBBBB5678B1Z2',
        category: 'IT Hardware & Audio-Visual',
        rating: 4.9,
        paymentTerms: '50% Advance, 50% on Delivery'
    },
    {
        id: 'VEN-003',
        name: 'ChemiScientific Instruments',
        contactPerson: 'Dr. Anita Sen',
        phone: '+91 93310 99452',
        email: 'laborders@chemsci.org',
        address: '15, College Street Chemical Hub, Kolkata, West Bengal 700073',
        gstin: '19CCCCC9012C1Z8',
        category: 'Science Laboratory Consumables',
        rating: 4.7,
        paymentTerms: 'Net 15 Days'
    },
    {
        id: 'VEN-004',
        name: 'GreenClean Hygiene & Chemicals',
        contactPerson: 'Mohan Kumar',
        phone: '+91 94441 55678',
        email: 'supplies@greenclean.in',
        address: '88, Ambattur Industrial Estate, Chennai, Tamil Nadu 600058',
        gstin: '33DDDDD3456D1Z1',
        category: 'Housekeeping & Facility Consumables',
        rating: 4.6,
        paymentTerms: 'Net 30 Days'
    }
]

// 2. Initial Product Catalog
export const INITIAL_PRODUCTS = [
    {
        id: 'PRD-001',
        itemCode: 'STN-PPR-A4',
        itemName: 'JK Copier A4 Paper Ream (75 GSM, 500 Sheets)',
        category: 'Stationery & Printing',
        uom: 'Reams',
        openingStock: 120,
        currentStock: 95,
        allocatedStock: 15,
        reorderLevel: 30,
        unitCost: 285.00,
        binLocation: 'Rack A-01, Shelf 2',
        status: 'Adequate'
    },
    {
        id: 'PRD-002',
        itemCode: 'STN-MRK-WB',
        itemName: 'Camlin Whiteboard Marker (Assorted Pack of 4)',
        category: 'Stationery & Printing',
        uom: 'Packs',
        openingStock: 80,
        currentStock: 18,
        allocatedStock: 5,
        reorderLevel: 25,
        unitCost: 140.00,
        binLocation: 'Rack A-02, Shelf 1',
        status: 'Low Stock'
    },
    {
        id: 'PRD-003',
        itemCode: 'IT-PRJ-DL',
        itemName: 'Dell 4K Laser Classroom Projector (4000 Lumens)',
        category: 'IT Hardware & Audio-Visual',
        uom: 'Units',
        openingStock: 10,
        currentStock: 6,
        allocatedStock: 2,
        reorderLevel: 3,
        unitCost: 48500.00,
        binLocation: 'Secure Tech Vault 01',
        status: 'Adequate'
    },
    {
        id: 'PRD-004',
        itemCode: 'IT-TNR-88A',
        itemName: 'HP LaserJet 88A Black Toner Cartridge',
        category: 'IT Hardware & Audio-Visual',
        uom: 'Units',
        openingStock: 25,
        currentStock: 8,
        allocatedStock: 4,
        reorderLevel: 10,
        unitCost: 3450.00,
        binLocation: 'Rack C-03, Shelf 2',
        status: 'Low Stock'
    },
    {
        id: 'PRD-005',
        itemCode: 'LAB-BKR-500',
        itemName: 'Borosil 500ml Glass Beakers (Pack of 6)',
        category: 'Science Laboratory Consumables',
        uom: 'Packs',
        openingStock: 35,
        currentStock: 28,
        allocatedStock: 0,
        reorderLevel: 10,
        unitCost: 920.00,
        binLocation: 'Science Store B-02',
        status: 'Adequate'
    },
    {
        id: 'PRD-006',
        itemCode: 'HK-CLN-5L',
        itemName: 'Lizol Floral Surface Disinfectant Liquid 5L Can',
        category: 'Housekeeping & Facility Consumables',
        uom: 'Cans',
        openingStock: 40,
        currentStock: 12,
        allocatedStock: 2,
        reorderLevel: 15,
        unitCost: 750.00,
        binLocation: 'Chemical Storage Shed 01',
        status: 'Low Stock'
    },
    {
        id: 'PRD-007',
        itemCode: 'SPT-FTB-05',
        itemName: 'Nivia Premier Carbonite Football Size 5',
        category: 'Sports & Athletics',
        uom: 'Units',
        openingStock: 20,
        currentStock: 16,
        allocatedStock: 0,
        reorderLevel: 5,
        unitCost: 890.00,
        binLocation: 'Sports Complex Locker 4',
        status: 'Adequate'
    },
    {
        id: 'PRD-008',
        itemCode: 'MED-FAK-01',
        itemName: 'Institutional First Aid Refill Kit Deluxe',
        category: 'Medical & Healthcare',
        uom: 'Kits',
        openingStock: 15,
        currentStock: 11,
        allocatedStock: 1,
        reorderLevel: 5,
        unitCost: 1250.00,
        binLocation: 'Infirmary Supply Cabinet',
        status: 'Adequate'
    }
]

// 3. Initial Material Requisitions
export const INITIAL_REQUISITIONS = [
    {
        id: 'MR-2026-001',
        requestDate: '30-10-2026',
        requesterId: 'EMP-TCH-006',
        requesterName: 'Ananya Roy',
        department: 'Academics & Teaching',
        reportingManager: 'Kavita Menon (Coordinator)',
        priority: 'High',
        requiredDate: '02-11-2026',
        purpose: 'Grade 11-A Chemistry Term Examination Question Papers printing and practicals.',
        items: [
            { itemCode: 'STN-PPR-A4', itemName: 'JK Copier A4 Paper Ream (75 GSM)', requestedQty: 5, uom: 'Reams' },
            { itemCode: 'STN-MRK-WB', itemName: 'Camlin Whiteboard Marker Pack', requestedQty: 2, uom: 'Packs' }
        ],
        status: 'HOD Approved',
        stockAvailable: true,
        stockIssueId: null,
        approvalHistory: [
            { actor: 'Ananya Roy', role: 'Teacher', action: 'Submitted', timestamp: '30-10-2026 10:15 AM', remarks: 'Exam papers required.' },
            { actor: 'Kavita Menon', role: 'Coordinator', action: 'Approved', timestamp: '30-10-2026 11:30 AM', remarks: 'Recommended for examination schedule.' }
        ]
    },
    {
        id: 'MR-2026-002',
        requestDate: '31-10-2026',
        requesterId: 'EMP-HK-001',
        requesterName: 'Savitri Devi',
        department: 'Facilities & Campus Sanitation',
        reportingManager: 'Arunachalam S (Super Admin)',
        priority: 'Urgent',
        requiredDate: '31-10-2026',
        purpose: 'Deep sanitization of Senior Secondary Academic Block before inspection.',
        items: [
            { itemCode: 'HK-CLN-5L', itemName: 'Lizol Floral Surface Disinfectant Liquid 5L Can', requestedQty: 8, uom: 'Cans' }
        ],
        status: 'Submitted',
        stockAvailable: true,
        stockIssueId: null,
        approvalHistory: [
            { actor: 'Savitri Devi', role: 'Housekeeping Lead', action: 'Submitted', timestamp: '31-10-2026 08:30 AM', remarks: 'Stock needed urgently.' }
        ]
    }
]

// 4. Initial Purchase Orders (POs)
export const INITIAL_POS = [
    {
        id: 'PO-2026-001',
        poDate: '28-10-2026',
        requisitionRefId: 'MR-2026-001',
        department: 'Academics & Teaching',
        vendor: INITIAL_VENDORS[0],
        quotationRef: 'APEX-QT-2026-894',
        items: [
            {
                itemCode: 'STN-PPR-A4',
                description: 'JK Copier A4 Paper Ream (75 GSM, 500 Sheets)',
                qty: 50,
                uom: 'Reams',
                previousPrice: 290.00,
                unitPrice: 285.00,
                discountPercent: 5,
                taxPercent: 12,
                lineTotal: 15161.25
            },
            {
                itemCode: 'STN-MRK-WB',
                description: 'Camlin Whiteboard Marker (Pack of 4 Assorted)',
                qty: 40,
                uom: 'Packs',
                previousPrice: 145.00,
                unitPrice: 140.00,
                discountPercent: 0,
                taxPercent: 18,
                lineTotal: 6608.00
            }
        ],
        subTotal: 19135.00,
        totalTax: 2634.25,
        grandTotal: 21769.25,
        paymentTerms: 'Net 30 Days upon GRN and Invoice verification',
        expectedDeliveryDate: '02-11-2026',
        deliveryLocation: 'Central Receiving Stores, Main Academic Campus Gate 2',
        termsAndConditions: '1. Damaged goods shall be replaced within 48 hours.\n2. Invoice and Delivery Challan mandatory upon delivery.',
        status: 'Sent to Vendor',
        approvedBy: 'Dr. Kavita Sharma (Director)',
        approvalDate: '29-10-2026',
        vendorComparison: [
            { vendorName: 'Apex Educational Supplies', quotedPrice: 21769.25, deliveryDays: 3, isSelected: true, justification: 'Lowest quoted rate with certified ISO grade paper.' },
            { vendorName: 'Classmate Wholesale India', quotedPrice: 23150.00, deliveryDays: 5, isSelected: false, justification: 'Higher price per ream.' },
            { vendorName: 'National Paper Trading Co.', quotedPrice: 22800.00, deliveryDays: 7, isSelected: false, justification: 'Delayed delivery timeline.' }
        ]
    },
    {
        id: 'PO-2026-002',
        poDate: '24-10-2026',
        requisitionRefId: 'MR-2026-PRV',
        department: 'IT Support & Systems',
        vendor: INITIAL_VENDORS[1],
        quotationRef: 'TM-QT-8812',
        items: [
            {
                itemCode: 'IT-TNR-88A',
                description: 'HP LaserJet 88A Black Toner Cartridge',
                qty: 10,
                uom: 'Units',
                previousPrice: 3500.00,
                unitPrice: 3450.00,
                discountPercent: 2,
                taxPercent: 18,
                lineTotal: 39895.80
            }
        ],
        subTotal: 33810.00,
        totalTax: 6085.80,
        grandTotal: 39895.80,
        paymentTerms: '50% Advance, 50% Post GRN',
        expectedDeliveryDate: '30-10-2026',
        deliveryLocation: 'IT Server Room / Hardware Store',
        termsAndConditions: 'Genuine OEM cartridges with serial verification.',
        status: 'Fully Received',
        approvedBy: 'Arunachalam S (Super Admin)',
        approvalDate: '25-10-2026',
        vendorComparison: []
    }
]

// 5. Initial Goods Receipt Notes (GRNs)
export const INITIAL_GRNS = [
    {
        id: 'GRN-2026-001',
        grnDate: '30-10-2026',
        poNumber: 'PO-2026-002',
        vendorName: 'TechMatrix Digital Solutions',
        deliveryChallanNo: 'DC-TM-2026-904',
        invoiceNo: 'INV-TM-8821',
        invoiceDate: '29-10-2026',
        receivedBy: 'Gurpreet Singh',
        inspectedBy: 'Rakesh Nair (IT Support)',
        inspectionStatus: 'Passed',
        receivedItems: [
            {
                itemCode: 'IT-TNR-88A',
                description: 'HP LaserJet 88A Black Toner Cartridge',
                orderedQty: 10,
                receivedQty: 10,
                acceptedQty: 10,
                damagedQty: 0,
                batchNo: 'BAT-HP88A-OCT26'
            }
        ],
        remarks: 'All 10 OEM toner packs verified with holographic seals.',
        stockUpdated: true,
        financeVoucherRef: 'VOUCH-2026-118'
    }
]

// 6. Initial Stock Issues
export const INITIAL_STOCK_ISSUES = [
    {
        id: 'ISS-2026-001',
        requisitionId: 'MR-2026-000',
        issueDate: '29-10-2026',
        issuedToId: 'EMP-TCH-014',
        issuedToName: 'Priya Menon',
        department: 'Academics & Teaching',
        isReturnable: true,
        expectedReturnDate: '05-11-2026',
        items: [
            { itemCode: 'IT-PRJ-DL', itemName: 'Dell 4K Laser Classroom Projector', qtyIssued: 1, uom: 'Units', serialNo: 'DL-PRJ-99214' }
        ],
        issuedBy: 'Gurpreet Singh',
        recipientSignatureDate: '29-10-2026 02:15 PM',
        status: 'Issued',
        remarks: 'Issued for Grade 10 Science Exhibition demo in Auditorium.'
    }
]

// Storage Accessors
export const getInventoryCatalog = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(INVENTORY_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryInventory && Array.isArray(_memoryInventory) && _memoryInventory.length > 0) {
        return _memoryInventory
    }
    _memoryInventory = [...INITIAL_PRODUCTS]
    saveInventoryCatalog(_memoryInventory)
    return _memoryInventory
}

export const saveInventoryCatalog = (catalog) => {
    _memoryInventory = catalog
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(catalog))
        }
    } catch {
        /* ignore */
    }
}

export const getMaterialRequisitions = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(REQUISITIONS_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryRequisitions && Array.isArray(_memoryRequisitions) && _memoryRequisitions.length > 0) {
        return _memoryRequisitions
    }
    _memoryRequisitions = [...INITIAL_REQUISITIONS]
    saveMaterialRequisitions(_memoryRequisitions)
    return _memoryRequisitions
}

export const saveMaterialRequisitions = (reqs) => {
    _memoryRequisitions = reqs
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(REQUISITIONS_STORAGE_KEY, JSON.stringify(reqs))
        }
    } catch {
        /* ignore */
    }
}

export const getPurchaseOrders = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(PO_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryPOs && Array.isArray(_memoryPOs) && _memoryPOs.length > 0) {
        return _memoryPOs
    }
    _memoryPOs = [...INITIAL_POS]
    savePurchaseOrders(_memoryPOs)
    return _memoryPOs
}

export const savePurchaseOrders = (pos) => {
    _memoryPOs = pos
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(pos))
        }
    } catch {
        /* ignore */
    }
}

export const getGoodsReceiptNotes = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(GRN_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryGRNs && Array.isArray(_memoryGRNs) && _memoryGRNs.length > 0) {
        return _memoryGRNs
    }
    _memoryGRNs = [...INITIAL_GRNS]
    saveGoodsReceiptNotes(_memoryGRNs)
    return _memoryGRNs
}

export const saveGoodsReceiptNotes = (grns) => {
    _memoryGRNs = grns
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(GRN_STORAGE_KEY, JSON.stringify(grns))
        }
    } catch {
        /* ignore */
    }
}

export const getStockIssues = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(STOCK_ISSUE_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryStockIssues && Array.isArray(_memoryStockIssues) && _memoryStockIssues.length > 0) {
        return _memoryStockIssues
    }
    _memoryStockIssues = [...INITIAL_STOCK_ISSUES]
    saveStockIssues(_memoryStockIssues)
    return _memoryStockIssues
}

export const saveStockIssues = (issues) => {
    _memoryStockIssues = issues
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STOCK_ISSUE_STORAGE_KEY, JSON.stringify(issues))
        }
    } catch {
        /* ignore */
    }
}

export const getVendors = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(VENDORS_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryVendors && Array.isArray(_memoryVendors) && _memoryVendors.length > 0) {
        return _memoryVendors
    }
    _memoryVendors = [...INITIAL_VENDORS]
    saveVendors(_memoryVendors)
    return _memoryVendors
}

export const saveVendors = (vendors) => {
    _memoryVendors = vendors
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(VENDORS_STORAGE_KEY, JSON.stringify(vendors))
        }
    } catch {
        /* ignore */
    }
}

// Transactional Workflows

/**
 * 1. Submit Material Requisition
 */
export const submitMaterialRequisition = (payload) => {
    const items = payload.items || payload.requestedItems || []
    if (!items.length) {
        throw new Error('At least one material item must be included in the request.')
    }

    const requesterId = payload.requesterId || payload.requestingEmployeeId || 'EMP-SEC-012'
    const requesterName = payload.requesterName || payload.requestingEmployeeName || 'Sunita Verma'
    const department = payload.department || 'Academic - Secondary'
    const reportingManager = payload.reportingManager || 'Dr. Kavita Sharma'
    const priority = payload.priority || payload.urgency || 'Medium'
    const requiredDate = payload.requiredDate || payload.requiredByDate || new Date().toLocaleDateString('en-GB')
    const purpose = payload.purpose || 'Classroom / Lab supplies'

    const requisitions = getMaterialRequisitions()
    const nextSeq = requisitions.length + 1
    const newId = `MR-2026-${String(nextSeq).padStart(3, '0')}`

    const catalog = getInventoryCatalog()
    // Verify current stock
    const processedItems = items.map((item) => {
        if (item.isCustomItem || item.isNewProduct) {
            return {
                itemCode: item.itemCode || `NEW-${Date.now().toString().slice(-4)}`,
                itemName: item.itemName,
                requestedQty: Number(item.requestedQty || item.requestedQuantity || 1),
                requestedQuantity: Number(item.requestedQty || item.requestedQuantity || 1),
                uom: item.uom || item.unit || 'Units',
                availableStock: 0,
                isCustomItem: true,
                specification: item.specification || item.specifications || '',
                estimatedCost: item.estimatedCost || null,
                category: item.category || 'General Store'
            }
        }
        const prod = catalog.find((p) => p.itemCode === item.itemCode)
        const qty = Number(item.requestedQty || item.requestedQuantity || 1)
        return {
            ...item,
            itemCode: item.itemCode,
            itemName: prod ? prod.itemName || prod.name : item.itemName,
            requestedQty: qty,
            requestedQuantity: qty,
            availableStock: prod ? prod.currentStock : 0,
            uom: prod ? prod.uom || prod.unit : item.uom || item.unit || 'Units',
        }
    })

    const isAllAvailable = processedItems.every((item) => item.availableStock >= Number(item.requestedQty))

    const newReq = {
        id: newId,
        requestDate: new Date().toLocaleDateString('en-GB'),
        requesterId,
        requestingEmployeeId: requesterId,
        requesterName,
        requestingEmployeeName: requesterName,
        department,
        reportingManager,
        priority,
        urgency: priority,
        requiredDate,
        requiredByDate: requiredDate,
        purpose,
        items: processedItems,
        status: payload.status || 'Submitted',
        stockAvailable: isAllAvailable,
        stockIssueId: null,
        approvalHistory: [
            {
                actor: requesterName,
                role: 'Requester',
                action: 'Submitted',
                timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                remarks: purpose
            }
        ]
    }

    const updated = [newReq, ...requisitions]
    saveMaterialRequisitions(updated)

    recordAuditLog({
        actorId: requesterId,
        actorName: requesterName,
        module: 'Stores & Procurement',
        action: 'SUBMIT_MATERIAL_REQ',
        entityId: newId,
        previousState: 'None',
        newState: 'Submitted',
        remarks: `Requisition for ${items.length} items submitted by ${requesterName} (${department})`
    })

    dispatchNotification({
        recipientRole: 'coordinator',
        title: 'New Material Requisition Submitted',
        message: `${requesterName} submitted requisition ${newId} for ${department}.`,
        link: '/stores-procurement?tab=requisitions',
        priority: priority === 'Urgent' ? 'Critical' : 'Normal',
        type: 'STORES_REQUISITION'
    })

    return newReq
}

/**
 * 2. Approve Material Requisition (HOD / Management)
 */
export const updateRequisitionApproval = (requisitionId, decision, approverName, approverRole, remarks = '') => {
    const requisitions = getMaterialRequisitions()
    const target = requisitions.find((r) => r.id === requisitionId)
    if (!target) throw new Error('Requisition not found.')

    const oldStatus = target.status
    target.status = decision === 'Approved' ? 'HOD Approved' : 'Rejected'
    target.approvalHistory.push({
        actor: approverName,
        role: approverRole,
        action: decision,
        timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        remarks: remarks || (decision === 'Approved' ? 'Sanctioned by department authority.' : 'Rejected.')
    })

    saveMaterialRequisitions(requisitions)

    recordAuditLog({
        actorName: approverName,
        actorRole: approverRole,
        module: 'Stores & Procurement',
        action: decision === 'Approved' ? 'APPROVE_MATERIAL_REQ' : 'REJECT_MATERIAL_REQ',
        entityId: requisitionId,
        previousState: oldStatus,
        newState: target.status,
        remarks
    })

    dispatchNotification({
        recipientId: target.requesterId,
        title: `Material Requisition ${decision}`,
        message: `Your requisition ${requisitionId} has been ${decision.toLowerCase()} by ${approverName}.`,
        link: '/stores-procurement?tab=requisitions',
        type: 'STORES_REQUISITION'
    })

    return target
}

/**
 * 3. Issue Material from Stores (Decrements Inventory)
 */
export const issueMaterialFromStore = ({
    requisitionId,
    issuedById = 'EMP-STR-001',
    issuedByName = 'Gurpreet Singh',
    isReturnable = false,
    expectedReturnDate = null,
    remarks = ''
}) => {
    const requisitions = getMaterialRequisitions()
    const req = requisitions.find((r) => r.id === requisitionId)
    if (!req) throw new Error('Requisition not found.')

    const catalog = getInventoryCatalog()
    const stockIssues = getStockIssues()
    const nextSeq = stockIssues.length + 1
    const issueId = `ISS-2026-${String(nextSeq).padStart(3, '0')}`

    // Deduct stock item by item
    const updatedCatalog = catalog.map((prod) => {
        const reqItem = req.items.find((i) => i.itemCode === prod.itemCode)
        if (reqItem) {
            const qty = Number(reqItem.requestedQty)
            const remaining = Math.max(0, prod.currentStock - qty)
            return {
                ...prod,
                currentStock: remaining,
                allocatedStock: Math.max(0, (prod.allocatedStock || 0) - qty),
                status: remaining <= prod.reorderLevel ? 'Low Stock' : 'Adequate'
            }
        }
        return prod
    })

    saveInventoryCatalog(updatedCatalog)

    const issueRecord = {
        id: issueId,
        requisitionId,
        issueDate: new Date().toLocaleDateString('en-GB'),
        issuedToId: req.requesterId,
        issuedToName: req.requesterName,
        department: req.department,
        isReturnable: Boolean(isReturnable),
        expectedReturnDate: isReturnable ? (expectedReturnDate || new Date().toLocaleDateString('en-GB')) : null,
        items: req.items.map((i) => ({
            itemCode: i.itemCode,
            itemName: i.itemName,
            qtyIssued: Number(i.requestedQty),
            uom: i.uom
        })),
        issuedBy: issuedByName,
        recipientSignatureDate: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'Issued',
        remarks
    }

    const updatedIssues = [issueRecord, ...stockIssues]
    saveStockIssues(updatedIssues)

    req.status = 'Stock Issued'
    req.stockIssueId = issueId
    req.approvalHistory.push({
        actor: issuedByName,
        role: 'Store Officer',
        action: 'Material Issued',
        timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        remarks: `Voucher ${issueId} generated. Material handed over.`
    })
    saveMaterialRequisitions(requisitions)

    recordAuditLog({
        actorId: issuedById,
        actorName: issuedByName,
        actorRole: 'stationery-store-manager',
        module: 'Stores & Procurement',
        action: 'ISSUE_STOCK',
        entityId: issueId,
        previousState: 'Inventory Reserved',
        newState: 'Issued',
        remarks: `Issued material for requisition ${requisitionId} to ${req.requesterName}`
    })

    return { issueRecord, updatedCatalog, req }
}

/**
 * 3.1 Mark Requisition Ready for Collection (Stores packs items & dispatches announcement)
 */
export const markRequisitionReadyForCollection = ({
    requisitionId,
    storeOfficerName = 'Gurpreet Singh',
    pickupLocation = 'Main Stores Desk, Academic Block Ground Floor',
    remarks = 'Items packed and verified. Ready for collection.'
}) => {
    const requisitions = getMaterialRequisitions()
    const target = requisitions.find((r) => r.id === requisitionId)
    if (!target) throw new Error('Requisition not found.')

    const oldStatus = target.status
    target.status = 'Ready to Collect'
    target.pickupLocation = pickupLocation
    target.readyDetails = {
        storeOfficerName,
        pickupLocation,
        timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        remarks
    }

    target.approvalHistory.push({
        actor: storeOfficerName,
        role: 'Store Officer',
        action: 'Ready to Collect',
        timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        remarks: `Marked ready for pickup at ${pickupLocation}. ${remarks}`
    })

    saveMaterialRequisitions(requisitions)

    // Automatically create and post Announcement to collect!
    try {
        const itemsList = (target.items || []).map(i => `${i.requestedQty || i.requestedQuantity || 1}x ${i.itemName}`).join(', ')
        addAnnouncement({
            title: `[Store Collection Notice] Requisition ${target.id} Ready for Pickup`,
            category: 'Stores & Material Collection',
            priority: 'Important',
            message: `Materials requested under Requisition ${target.id} (${itemsList}) have been verified, packed, and are ready for pickup at: ${pickupLocation}. Requested by: ${target.requesterName} (${target.department}). Please collect during store distribution hours.`,
            sentBy: `${storeOfficerName} (Stores Desk)`,
            announcementDate: new Date(),
            audience: [target.requesterRole || 'teacher', 'coordinator', 'stationery-store-manager', 'admin'],
            audienceLabel: `${target.department} / Staff Collection`,
            requireAcknowledgement: true
        }, 'stationery-store-manager')
    } catch (e) {
        console.warn('Could not post store collection announcement:', e)
    }

    recordAuditLog({
        actorName: storeOfficerName,
        module: 'Stores & Procurement',
        action: 'MARK_READY_TO_COLLECT',
        entityId: requisitionId,
        previousState: oldStatus,
        newState: 'Ready to Collect',
        remarks: `Ready for collection at ${pickupLocation}`
    })

    dispatchNotification({
        recipientId: target.requesterId,
        recipientRole: target.requesterRole || 'teacher',
        title: `Requisition ${requisitionId} Ready for Collection!`,
        message: `Your requested materials are packed and ready for pickup at ${pickupLocation}.`,
        link: '/stores-procurement?tab=requisitions',
        priority: 'High',
        type: 'STORES_COLLECTION'
    })

    return target
}

/**
 * 3.2 Confirm Requisition Collection (Handover completed)
 */
export const markRequisitionCollected = ({
    requisitionId,
    collectedByName,
    remarks = 'Items received in full and verified.'
}) => {
    const requisitions = getMaterialRequisitions()
    const target = requisitions.find((r) => r.id === requisitionId)
    if (!target) throw new Error('Requisition not found.')

    if (!target.stockIssueId) {
        try {
            issueMaterialFromStore({
                requisitionId,
                issuedByName: 'Gurpreet Singh',
                remarks: remarks || `Collected by ${collectedByName}`
            })
        } catch {
            /* best effort stock deduction */
        }
    }

    const updatedReqs = getMaterialRequisitions()
    const req = updatedReqs.find((r) => r.id === requisitionId)
    if (req) {
        req.status = 'Collected / Closed'
        req.collectedDetails = {
            collectedByName,
            timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            remarks
        }
        req.approvalHistory.push({
            actor: collectedByName,
            role: 'Recipient',
            action: 'Collected',
            timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            remarks
        })
        saveMaterialRequisitions(updatedReqs)
    }

    return req
}

/**
 * 4. Generate Purchase Order (PO)
 */
export const createPurchaseOrder = ({
    requisitionRefId = null,
    department,
    vendorId,
    items = [],
    paymentTerms = 'Net 30 Days',
    expectedDeliveryDate,
    deliveryLocation = 'Central School Stores, Gate 2',
    termsAndConditions = '1. Material must conform strictly to technical specifications.\n2. Invoices without PO number will be rejected.',
    vendorComparison = []
}) => {
    if (!items.length) {
        throw new Error('PO must contain at least one line item.')
    }

    const vendors = getVendors()
    const vendor = vendors.find((v) => v.id === vendorId) || vendors[0]

    const purchaseOrders = getPurchaseOrders()
    const nextSeq = purchaseOrders.length + 1
    const poNumber = `PO-2026-${String(nextSeq).padStart(3, '0')}`

    let subTotal = 0
    let totalTax = 0

    const processedItems = items.map((item) => {
        const qty = Number(item.qty || 1)
        const unitPrice = Number(item.unitPrice || 0)
        const discountPercent = Number(item.discountPercent || 0)
        const taxPercent = Number(item.taxPercent || 18)

        const discountedPrice = unitPrice * (1 - discountPercent / 100)
        const lineBase = qty * discountedPrice
        const lineTax = lineBase * (taxPercent / 100)
        const lineTotal = lineBase + lineTax

        subTotal += lineBase
        totalTax += lineTax

        return {
            ...item,
            qty,
            unitPrice,
            discountPercent,
            taxPercent,
            lineTotal: Number(lineTotal.toFixed(2))
        }
    })

    const grandTotal = Number((subTotal + totalTax).toFixed(2))

    const newPO = {
        id: poNumber,
        poNumber,
        poDate: new Date().toLocaleDateString('en-GB'),
        requisitionRefId: requisitionRefId || 'Direct CAPEX / Store Restock',
        department,
        vendor,
        items: processedItems,
        subTotal: Number(subTotal.toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        grandTotal,
        paymentTerms,
        expectedDeliveryDate: expectedDeliveryDate || new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB'),
        deliveryLocation,
        termsAndConditions,
        status: 'Pending Approval',
        approvedBy: null,
        approvalDate: null,
        vendorComparison: vendorComparison.length ? vendorComparison : [
            { vendorName: vendor.name, quotedPrice: grandTotal, deliveryDays: 5, isSelected: true, justification: 'Approved empanelled institutional vendor.' }
        ]
    }

    const updated = [newPO, ...purchaseOrders]
    savePurchaseOrders(updated)

    recordAuditLog({
        actorName: 'Store Officer',
        actorRole: 'stationery-store-manager',
        module: 'Stores & Procurement',
        action: 'DRAFT_PO',
        entityId: poNumber,
        previousState: 'None',
        newState: 'Pending Approval',
        remarks: `PO created for vendor ${vendor.name} with value ₹${grandTotal.toLocaleString('en-IN')}`
    })

    dispatchNotification({
        recipientRole: 'director',
        title: 'New Purchase Order Awaiting Approval',
        message: `${poNumber} for ₹${grandTotal.toLocaleString('en-IN')} submitted by Stores.`,
        link: '/stores-procurement?tab=po',
        priority: 'High',
        type: 'PURCHASE_ORDER'
    })

    return newPO
}

/**
 * 5. Approve Purchase Order
 */
export const updatePurchaseOrderApproval = (poNumber, decision, approverName = 'Dr. Kavita Sharma (Director)', remarks = '') => {
    const pos = getPurchaseOrders()
    const target = pos.find((p) => p.id === poNumber || p.poNumber === poNumber)
    if (!target) throw new Error('Purchase Order not found.')

    const oldStatus = target.status
    if (decision === 'Approved') {
        target.status = 'Approved'
        target.approvedBy = approverName
        target.approvalDate = new Date().toLocaleDateString('en-GB')
    } else {
        target.status = 'Rejected'
        target.approvedBy = approverName
    }

    savePurchaseOrders(pos)

    recordAuditLog({
        actorName: approverName,
        actorRole: 'director',
        module: 'Stores & Procurement',
        action: decision === 'Approved' ? 'APPROVE_PO' : 'REJECT_PO',
        entityId: poNumber,
        previousState: oldStatus,
        newState: target.status,
        remarks: remarks || `Purchase order ${decision.toLowerCase()} by executive authority.`
    })

    dispatchNotification({
        recipientRole: 'stationery-store-manager',
        title: `PO ${poNumber} ${decision}`,
        message: `Purchase Order ${poNumber} has been ${decision.toLowerCase()} by ${approverName}. Ready for dispatch.`,
        link: '/stores-procurement?tab=po',
        priority: 'High',
        type: 'PURCHASE_ORDER'
    })

    return target
}

/**
 * 6. Dispatch PO to Vendor
 */
export const markPODispatched = (poNumber) => {
    const pos = getPurchaseOrders()
    const target = pos.find((p) => p.id === poNumber)
    if (!target) throw new Error('Purchase Order not found.')

    target.status = 'Sent to Vendor'
    savePurchaseOrders(pos)

    recordAuditLog({
        actorName: 'Store Officer',
        actorRole: 'stationery-store-manager',
        module: 'Stores & Procurement',
        action: 'DISPATCH_PO',
        entityId: poNumber,
        previousState: 'Approved',
        newState: 'Sent to Vendor',
        remarks: `PO officially communicated to vendor ${target.vendor.name}. Delivery expected by ${target.expectedDeliveryDate}`
    })

    return target
}

/**
 * 7. Process Goods Receipt Note (GRN) & Automatically Increment Inventory Stock
 */
export const processGoodsReceiptNote = ({
    poNumber,
    deliveryChallanNo,
    invoiceNo,
    receivedById = 'EMP-STR-001',
    receivedByName = 'Gurpreet Singh',
    inspectedBy = 'Store Quality Inspection Team',
    receivedItems = [],
    remarks = ''
}) => {
    const pos = getPurchaseOrders()
    const po = pos.find((p) => p.id === poNumber)
    if (!po) throw new Error(`Referenced PO ${poNumber} does not exist.`)

    const grns = getGoodsReceiptNotes()
    const nextSeq = grns.length + 1
    const grnId = `GRN-2026-${String(nextSeq).padStart(3, '0')}`

    const catalog = getInventoryCatalog()

    // 1. Update Inventory for Accepted Quantities
    const updatedCatalog = catalog.map((prod) => {
        const itemReceipt = receivedItems.find((i) => i.itemCode === prod.itemCode)
        if (itemReceipt) {
            const accepted = Number(itemReceipt.acceptedQty || 0)
            const newStock = prod.currentStock + accepted
            return {
                ...prod,
                currentStock: newStock,
                status: newStock <= prod.reorderLevel ? 'Low Stock' : 'Adequate'
            }
        }
        return prod
    })
    saveInventoryCatalog(updatedCatalog)

    // 2. Create GRN Record
    const newGRN = {
        id: grnId,
        grnDate: new Date().toLocaleDateString('en-GB'),
        poNumber,
        vendorName: po.vendor.name,
        deliveryChallanNo: deliveryChallanNo || 'DC-PENDING',
        invoiceNo: invoiceNo || 'INV-PENDING',
        invoiceDate: new Date().toLocaleDateString('en-GB'),
        receivedBy: receivedByName,
        inspectedBy,
        inspectionStatus: receivedItems.some((i) => Number(i.damagedQty) > 0) ? 'Conditional' : 'Passed',
        receivedItems,
        remarks,
        stockUpdated: true,
        financeVoucherRef: `VOUCH-2026-${String(nextSeq + 200).padStart(3, '0')}`
    }

    const updatedGRNs = [newGRN, ...grns]
    saveGoodsReceiptNotes(updatedGRNs)

    // 3. Update PO status (Fully Received or Partially Received)
    const allAccepted = receivedItems.every((ri) => {
        const poItem = po.items.find((pi) => pi.itemCode === ri.itemCode)
        return poItem && Number(ri.acceptedQty) >= poItem.qty
    })

    po.status = allAccepted ? 'Fully Received' : 'Partially Received'
    savePurchaseOrders(pos)

    recordAuditLog({
        actorId: receivedById,
        actorName: receivedByName,
        actorRole: 'stationery-store-manager',
        module: 'Stores & Procurement',
        action: 'PROCESS_GRN',
        entityId: grnId,
        previousState: 'Goods in Transit',
        newState: 'Stock Updated',
        remarks: `GRN ${grnId} posted against ${poNumber}. Inventory increased. Forwarded to Finance/AP.`
    })

    dispatchNotification({
        recipientRole: 'account-head',
        title: 'New GRN Posted for AP Processing',
        message: `${grnId} posted for ${po.vendor.name} (${poNumber}). Invoice ${invoiceNo} ready for 3-way matching.`,
        link: '/stores-procurement?tab=grn',
        priority: 'Normal',
        type: 'FINANCE_AP'
    })

    return { grn: newGRN, po, updatedCatalog }
}

// ==========================================
// 8. AUDIT QUANTITIES RECONCILIATION ENGINE
// ==========================================
export const AUDIT_QUANTITIES_STORAGE_KEY = 'schoolerp-audit-quantities-v1'

const DEFAULT_AUDIT_QUANTITIES = [
    {
        id: 'AUD-QTY-2026-001',
        auditRef: 'AUD-PROC-2026-042',
        itemCode: 'STN-PPR-A4',
        itemName: 'JK Copier A4 Paper Ream (75 GSM, 500 Sheets)',
        auditedBy: 'Process Auditor (Anita Deshmukh)',
        actionType: 'Given', // 'Given' | 'Receiving'
        quantity: 15,
        status: 'Given to Audit', // 'Given to Audit' | 'Received & Reconciled'
        date: '2026-11-04',
        remarks: 'Sample batch taken for paper GSM and ream weight physical verification.'
    },
    {
        id: 'AUD-QTY-2026-002',
        auditRef: 'AUD-QUAL-2026-019',
        itemCode: 'IT-PRJ-DL',
        itemName: 'Dell 4K Laser Classroom Projector (4000 Lumens)',
        auditedBy: 'Quality Auditor (Rajesh Kumar)',
        actionType: 'Receiving',
        quantity: 2,
        status: 'Received & Reconciled',
        date: '2026-11-06',
        remarks: 'Projectors returned to Central Stores after audio-visual clarity and lumen compliance test.'
    },
    {
        id: 'AUD-QTY-2026-003',
        auditRef: 'AUD-PROC-2026-048',
        itemCode: 'STN-MRK-WB',
        itemName: 'Camlin Whiteboard Marker (Assorted Pack of 4)',
        auditedBy: 'Process Auditor (Anita Deshmukh)',
        actionType: 'Given',
        quantity: 10,
        status: 'Pending Receiving',
        date: '2026-11-08',
        remarks: 'Issued for campus-wide classroom inventory audit verification.'
    }
]

let _memoryAuditQuantities = null

export const getAuditQuantities = () => {
    if (_memoryAuditQuantities) return _memoryAuditQuantities
    if (typeof localStorage === 'undefined') return DEFAULT_AUDIT_QUANTITIES
    try {
        const stored = localStorage.getItem(AUDIT_QUANTITIES_STORAGE_KEY)
        if (stored) {
            _memoryAuditQuantities = JSON.parse(stored)
            return _memoryAuditQuantities
        }
    } catch {
        // fallback
    }
    _memoryAuditQuantities = DEFAULT_AUDIT_QUANTITIES
    saveAuditQuantities(_memoryAuditQuantities)
    return _memoryAuditQuantities
}

export const saveAuditQuantities = (records) => {
    _memoryAuditQuantities = records
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem(AUDIT_QUANTITIES_STORAGE_KEY, JSON.stringify(records))
        } catch {
            // ignore quota
        }
    }
}

/**
 * Receive quantities raised from Audit back into available store inventory.
 */
export const receiveAuditQuantities = ({
    auditRecordId = null,
    auditRef = 'AUD-RECON-2026',
    itemCode,
    qty,
    remarks = 'Quantities received back from Audit inspection.',
    receivedBy = 'Store Manager'
}) => {
    const catalog = getInventoryCatalog()
    const product = catalog.find((p) => p.itemCode === itemCode)
    if (!product) throw new Error(`Product with item code ${itemCode} not found in inventory catalog.`)

    const quantityNum = Math.max(1, parseInt(qty, 10) || 1)
    product.currentStock += quantityNum
    saveInventoryCatalog(catalog)

    const auditRecords = [...getAuditQuantities()]
    let updatedRecord = null

    if (auditRecordId) {
        const idx = auditRecords.findIndex((r) => r.id === auditRecordId)
        if (idx !== -1) {
            auditRecords[idx] = {
                ...auditRecords[idx],
                status: 'Received & Reconciled',
                actionType: 'Receiving',
                remarks: `${auditRecords[idx].remarks} | Received: ${remarks}`,
                receivedDate: new Date().toISOString().split('T')[0],
                receivedBy
            }
            updatedRecord = auditRecords[idx]
        }
    }

    if (!updatedRecord) {
        updatedRecord = {
            id: `AUD-QTY-2026-${String(auditRecords.length + 1).padStart(3, '0')}`,
            auditRef,
            itemCode,
            itemName: product.itemName,
            auditedBy: 'Audit Team',
            actionType: 'Receiving',
            quantity: quantityNum,
            status: 'Received & Reconciled',
            date: new Date().toISOString().split('T')[0],
            receivedDate: new Date().toISOString().split('T')[0],
            receivedBy,
            remarks
        }
        auditRecords.unshift(updatedRecord)
    }

    saveAuditQuantities(auditRecords)

    recordAuditLog({
        actorName: receivedBy,
        actorRole: 'stationery-store-manager',
        module: 'Stores & Procurement',
        action: 'RECEIVE_AUDIT_QUANTITIES',
        entityId: updatedRecord.id,
        remarks: `Received ${quantityNum} units of ${product.itemName} back from Audit. Stock increased to ${product.currentStock}.`
    })

    return { record: updatedRecord, product, catalog }
}

/**
 * Record quantities Given to Audit team for physical verification / testing.
 */
export const giveAuditQuantities = ({
    auditRef = 'AUD-PHYS-2026',
    itemCode,
    qty,
    auditedBy = 'Process Auditor',
    remarks = 'Sample quantities given to audit inspection.',
    givenBy = 'Store Manager'
}) => {
    const catalog = getInventoryCatalog()
    const product = catalog.find((p) => p.itemCode === itemCode)
    if (!product) throw new Error(`Product with item code ${itemCode} not found in inventory catalog.`)

    const quantityNum = Math.max(1, parseInt(qty, 10) || 1)
    if (product.currentStock < quantityNum) {
        throw new Error(`Insufficient stock. Current stock is ${product.currentStock}, requested ${quantityNum}.`)
    }

    product.currentStock -= quantityNum
    saveInventoryCatalog(catalog)

    const auditRecords = [...getAuditQuantities()]
    const newRecord = {
        id: `AUD-QTY-2026-${String(auditRecords.length + 1).padStart(3, '0')}`,
        auditRef,
        itemCode,
        itemName: product.itemName,
        auditedBy,
        actionType: 'Given',
        quantity: quantityNum,
        status: 'Pending Receiving',
        date: new Date().toISOString().split('T')[0],
        givenBy,
        remarks
    }

    auditRecords.unshift(newRecord)
    saveAuditQuantities(auditRecords)

    recordAuditLog({
        actorName: givenBy,
        actorRole: 'stationery-store-manager',
        module: 'Stores & Procurement',
        action: 'GIVE_AUDIT_QUANTITIES',
        entityId: newRecord.id,
        remarks: `Given ${quantityNum} units of ${product.itemName} to ${auditedBy} (${auditRef}). Stock reduced to ${product.currentStock}.`
    })

    return { record: newRecord, product, catalog }
}


