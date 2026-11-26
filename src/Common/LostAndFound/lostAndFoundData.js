/**
 * Centralized Organization-Wide Lost & Found Data Engine
 * Single Source of Truth for:
 * - Lost Property Reporting across All Institutional Roles & Departments
 * - Found Property Intake & Custodial Storage Location Tracking
 * - Automated Keyword & Category Matchmaking Algorithm
 * - Ownership Claim Verification & Formal Custodial Handover Register
 * - Unclaimed Article Disposal & Cross-Department Security Audit Trails
 */

import { recordAuditLog, dispatchNotification } from '../AuditAndNotifications/centralAuditEngine.js'

export const LOST_ITEMS_STORAGE_KEY = 'schoolerp-lost-items-v1'
export const FOUND_ITEMS_STORAGE_KEY = 'schoolerp-found-items-v1'

let _memoryLostItems = null
let _memoryFoundItems = null

export const ITEM_CATEGORIES = [
    'Electronics & Gadgets',
    'Books & Study Material',
    'Clothing, Badges & Uniforms',
    'Water Bottles & Lunchboxes',
    'ID Cards, Badges & Keys',
    'Valuables & Wallets',
    'Sports & Athletic Equipment'
]

export const CUSTODIAL_LOCATIONS = [
    'Campus Security Main Gate Locker (Gate 1)',
    'Front Office / PRM Reception Safe (Admin Wing)',
    'Physical Education Department Staff Room',
    'Central Stores Vault (Stationery Wing)',
    'Senior Secondary Library Helpdesk'
]

// Initial Lost Items
export const INITIAL_LOST_ITEMS = [
    {
        id: 'LF-LOST-001',
        reportDate: '30-10-2026',
        itemName: 'Titan Neo Silver Dial Chronograph Watch',
        category: 'Valuables & Wallets',
        description: 'Stainless steel mesh strap watch with minor scratch on the 2 o clock bezel.',
        distinguishingMarks: 'Name initials "A.R." engraved on back casing.',
        lastSeenLocation: 'Senior Secondary Chemistry Laboratory, Table 4',
        lastSeenDateTime: '30-10-2026 01:30 PM',
        reportedById: 'EMP-TCH-006',
        reportedByName: 'Ananya Roy',
        department: 'Academics & Teaching',
        contactNumber: '+91 98402 33411',
        photoUrl: 'titan_watch_sample.jpg',
        status: 'Active Search',
        matchedFoundItemId: null
    },
    {
        id: 'LF-LOST-002',
        reportDate: '29-10-2026',
        itemName: 'Casio Scientific Calculator fx-991CW',
        category: 'Electronics & Gadgets',
        description: 'Black dual-power high-resolution natural textbook display calculator.',
        distinguishingMarks: 'Grade 10-A sticker on battery lid.',
        lastSeenLocation: 'Auditorium Central Seating Row J',
        lastSeenDateTime: '29-10-2026 11:45 AM',
        reportedById: 'EMP-TCH-014',
        reportedByName: 'Priya Menon (on behalf of student)',
        department: 'Academics & Teaching',
        contactNumber: '+91 98410 77231',
        photoUrl: 'casio_calc.jpg',
        status: 'Potential Match Found',
        matchedFoundItemId: 'LF-FND-002'
    }
]

// Initial Found Items in Custody
export const INITIAL_FOUND_ITEMS = [
    {
        id: 'LF-FND-001',
        foundDate: '30-10-2026',
        itemName: 'Milton Thermosteel Flip Lid 1000ml Bottle (Matte Blue)',
        category: 'Water Bottles & Lunchboxes',
        description: 'Double-walled vacuum insulated steel water bottle in matte navy blue finish.',
        foundLocation: 'Junior Play Area Bench near Basketball Court',
        foundDateTime: '30-10-2026 03:45 PM',
        foundById: 'EMP-HK-001',
        foundByName: 'Savitri Devi',
        department: 'Facilities & Campus Sanitation',
        storageLocation: 'Campus Security Main Gate Locker (Gate 1)',
        responsibleCustodianId: 'EMP-GKM-001',
        responsibleCustodianName: 'Bhawani Singh (Security Manager)',
        photoUrl: 'blue_milton_bottle.jpg',
        status: 'In Custody',
        claims: [],
        handoverDetails: null
    },
    {
        id: 'LF-FND-002',
        foundDate: '29-10-2026',
        itemName: 'Casio fx-991 Series Scientific Calculator with Slide Case',
        category: 'Electronics & Gadgets',
        description: 'Black Casio scientific calculator found on auditorium stage steps after rehearsal.',
        foundLocation: 'Main Auditorium Front Stage',
        foundDateTime: '29-10-2026 04:30 PM',
        foundById: 'EMP-GKM-001',
        foundByName: 'Ram Singh (Gatekeeper)',
        department: 'Campus Security & Access Control',
        storageLocation: 'Front Office / PRM Reception Safe (Admin Wing)',
        responsibleCustodianId: 'EMP-FO-001',
        responsibleCustodianName: 'Anita Desai (PRM)',
        photoUrl: 'casio_found_pic.jpg',
        status: 'Claim Under Review',
        claims: [
            {
                claimId: 'CLM-2026-001',
                claimantId: 'EMP-TCH-014',
                claimantName: 'Priya Menon',
                claimantDept: 'Academics & Teaching',
                claimDate: '30-10-2026 10:00 AM',
                proofDescription: 'Belongs to Master Aarav Sharma (Grade 10-A). Has class sticker on reverse.',
                status: 'Under Review'
            }
        ],
        handoverDetails: null
    },
    {
        id: 'LF-FND-003',
        foundDate: '25-10-2026',
        itemName: 'Quechua Windproof Navy Blue Sports Jacket (Size M)',
        category: 'Clothing, Badges & Uniforms',
        description: 'Lightweight zip-up sports jacket with reflective piping on sleeves.',
        foundLocation: 'Athletic Track Pavilion Bleachers',
        foundDateTime: '25-10-2026 05:15 PM',
        foundById: 'EMP-DRV-001',
        foundByName: 'Jaswant Singh',
        department: 'Transport & Fleet Logistics',
        storageLocation: 'Physical Education Department Staff Room',
        responsibleCustodianId: 'EMP-PRN-001',
        responsibleCustodianName: 'Dr. Ramanathan K',
        photoUrl: 'sports_jacket.jpg',
        status: 'Handed Over',
        claims: [],
        handoverDetails: {
            claimedById: 'EMP-TCH-007',
            claimedByName: 'Dr. Subramanian',
            proofType: 'Staff ID Card Verification',
            proofNo: 'EMP-TCH-007',
            handoverDate: '28-10-2026 11:30 AM',
            verifiedByCustodian: 'Physical Education Lead',
            recipientSignatureNotes: 'Identity confirmed. Jacket returned to faculty member.'
        }
    }
]

// Storage Accessors
export const getLostItems = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOST_ITEMS_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryLostItems && Array.isArray(_memoryLostItems) && _memoryLostItems.length > 0) {
        return _memoryLostItems
    }
    _memoryLostItems = [...INITIAL_LOST_ITEMS]
    saveLostItems(_memoryLostItems)
    return _memoryLostItems
}

export const saveLostItems = (items) => {
    _memoryLostItems = items
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LOST_ITEMS_STORAGE_KEY, JSON.stringify(items))
        }
    } catch {
        /* ignore */
    }
}

export const getFoundItems = () => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(FOUND_ITEMS_STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed) && parsed.length > 0) return parsed
            }
        }
    } catch {
        /* ignore */
    }
    if (_memoryFoundItems && Array.isArray(_memoryFoundItems) && _memoryFoundItems.length > 0) {
        return _memoryFoundItems
    }
    _memoryFoundItems = [...INITIAL_FOUND_ITEMS]
    saveFoundItems(_memoryFoundItems)
    return _memoryFoundItems
}

export const saveFoundItems = (items) => {
    _memoryFoundItems = items
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(FOUND_ITEMS_STORAGE_KEY, JSON.stringify(items))
        }
    } catch {
        /* ignore */
    }
}

// Matchmaking Logic
export const findPotentialMatches = (item, type = 'lost') => {
    const targetCategory = item.category
    const targetKeywords = (item.itemName + ' ' + (item.description || ''))
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)

    if (type === 'lost') {
        const foundItems = getFoundItems().filter((f) => f.status === 'In Custody' || f.status === 'Claim Under Review')
        return foundItems.filter((f) => {
            if (f.category !== targetCategory) return false
            const text = (f.itemName + ' ' + f.description).toLowerCase()
            return targetKeywords.some((kw) => text.includes(kw))
        })
    } else {
        const lostItems = getLostItems().filter((l) => l.status === 'Active Search' || l.status === 'Potential Match Found')
        return lostItems.filter((l) => {
            if (l.category !== targetCategory) return false
            const text = (l.itemName + ' ' + l.description).toLowerCase()
            return targetKeywords.some((kw) => text.includes(kw))
        })
    }
}

// Workflows

/**
 * 1. Report Lost Item
 */
export const reportLostItem = ({
    itemName,
    category,
    description,
    distinguishingMarks = '',
    lastSeenLocation,
    lastSeenDateTime,
    reportedById,
    reportedByName,
    department,
    contactNumber,
    photoUrl = null
}) => {
    const lostList = getLostItems()
    const nextSeq = lostList.length + 1
    const newId = `LF-LOST-${String(nextSeq).padStart(3, '0')}`

    const newReport = {
        id: newId,
        reportDate: new Date().toLocaleDateString('en-GB'),
        itemName,
        category,
        description,
        distinguishingMarks,
        lastSeenLocation,
        lastSeenDateTime: lastSeenDateTime || new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        reportedById,
        reportedByName,
        department,
        contactNumber,
        photoUrl,
        status: 'Active Search',
        matchedFoundItemId: null
    }

    // Check for auto-matches
    const matches = findPotentialMatches(newReport, 'lost')
    if (matches.length > 0) {
        newReport.status = 'Potential Match Found'
        newReport.matchedFoundItemId = matches[0].id
    }

    const updated = [newReport, ...lostList]
    saveLostItems(updated)

    recordAuditLog({
        actorId: reportedById,
        actorName: reportedByName,
        module: 'Lost and Found',
        action: 'REPORT_LOST_ITEM',
        entityId: newId,
        previousState: 'None',
        newState: newReport.status,
        remarks: `Lost item '${itemName}' reported in ${lastSeenLocation}`
    })

    dispatchNotification({
        recipientRole: 'gatekeeper-manager',
        title: 'New Lost Item Reported',
        message: `'${itemName}' reported lost by ${reportedByName} (${department}).`,
        link: '/lost-and-found?tab=lost',
        type: 'LOST_AND_FOUND'
    })

    return newReport
}

/**
 * 2. Report Found Item
 */
export const reportFoundItem = ({
    itemName,
    category,
    description,
    foundLocation,
    foundDateTime,
    foundById,
    foundByName,
    department,
    storageLocation = 'Campus Security Main Gate Locker (Gate 1)',
    responsibleCustodianId = 'EMP-GKM-001',
    responsibleCustodianName = 'Bhawani Singh',
    photoUrl = null
}) => {
    const foundList = getFoundItems()
    const nextSeq = foundList.length + 1
    const newId = `LF-FND-${String(nextSeq).padStart(3, '0')}`

    const newFound = {
        id: newId,
        foundDate: new Date().toLocaleDateString('en-GB'),
        itemName,
        category,
        description,
        foundLocation,
        foundDateTime: foundDateTime || new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        foundById,
        foundByName,
        department,
        storageLocation,
        responsibleCustodianId,
        responsibleCustodianName,
        photoUrl,
        status: 'In Custody',
        claims: [],
        handoverDetails: null
    }

    const updated = [newFound, ...foundList]
    saveFoundItems(updated)

    // Check if any active lost report matches
    const matches = findPotentialMatches(newFound, 'found')
    if (matches.length > 0) {
        const lostItems = getLostItems()
        matches.forEach((m) => {
            const l = lostItems.find((li) => li.id === m.id)
            if (l) {
                l.status = 'Potential Match Found'
                l.matchedFoundItemId = newId
            }
        })
        saveLostItems(lostItems)
    }

    recordAuditLog({
        actorId: foundById,
        actorName: foundByName,
        module: 'Lost and Found',
        action: 'REPORT_FOUND_ITEM',
        entityId: newId,
        previousState: 'None',
        newState: 'In Custody',
        remarks: `Found item '${itemName}' deposited in ${storageLocation}`
    })

    dispatchNotification({
        recipientRole: 'gatekeeper-manager',
        title: 'New Found Item Deposited in Custody',
        message: `'${itemName}' found at ${foundLocation} deposited with ${responsibleCustodianName}.`,
        link: '/lost-and-found?tab=found',
        type: 'LOST_AND_FOUND'
    })

    return newFound
}

/**
 * 3. Submit Claim for Found Item
 */
export const submitItemClaim = ({
    foundItemId,
    claimantId,
    claimantName,
    claimantDept,
    proofDescription,
    proofPhotoUrl = null
}) => {
    const foundList = getFoundItems()
    const target = foundList.find((f) => f.id === foundItemId)
    if (!target) throw new Error('Found item not found in custody.')

    const claimSeq = (target.claims || []).length + 1
    const newClaim = {
        claimId: `CLM-2026-${String(claimSeq).padStart(3, '0')}`,
        claimantId,
        claimantName,
        claimantDept,
        claimDate: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        proofDescription,
        proofPhotoUrl,
        status: 'Under Review'
    }

    target.claims = [newClaim, ...(target.claims || [])]
    target.status = 'Claim Under Review'

    saveFoundItems(foundList)

    recordAuditLog({
        actorId: claimantId,
        actorName: claimantName,
        module: 'Lost and Found',
        action: 'SUBMIT_ITEM_CLAIM',
        entityId: foundItemId,
        previousState: 'In Custody',
        newState: 'Claim Under Review',
        remarks: `Ownership claim submitted by ${claimantName} (${claimantDept})`
    })

    dispatchNotification({
        recipientId: target.responsibleCustodianId,
        title: `Claim Submitted for Found Item ${foundItemId}`,
        message: `${claimantName} has staked ownership claim on '${target.itemName}'. Verification required.`,
        link: '/lost-and-found?tab=claims',
        priority: 'High',
        type: 'LOST_AND_FOUND'
    })

    return { target, newClaim }
}

/**
 * 4. Verify Ownership & Handover Found Item
 */
export const verifyAndHandoverItem = ({
    foundItemId,
    claimantId,
    claimantName,
    proofType = 'Identity Verification & Serial Check',
    proofNo = 'ID-VERIFIED',
    custodianName = 'Bhawani Singh',
    signatureNotes = 'Physical ownership verified. Handover confirmed.'
}) => {
    const foundList = getFoundItems()
    const target = foundList.find((f) => f.id === foundItemId)
    if (!target) throw new Error('Found item not found.')

    const nowStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    target.status = 'Handed Over'
    target.handoverDetails = {
        claimedById: claimantId,
        claimedByName: claimantName,
        proofType,
        proofNo,
        handoverDate: nowStr,
        verifiedByCustodian: custodianName,
        recipientSignatureNotes: signatureNotes
    }

    // Resolve matching claim
    if (target.claims && target.claims.length > 0) {
        target.claims = target.claims.map((c) => ({
            ...c,
            status: c.claimantId === claimantId ? 'Approved & Handed Over' : 'Rejected'
        }))
    }

    saveFoundItems(foundList)

    // Also close any linked lost report
    const lostList = getLostItems()
    const linkedLost = lostList.find((l) => l.matchedFoundItemId === foundItemId || (l.reportedById === claimantId && l.category === target.category))
    if (linkedLost) {
        linkedLost.status = 'Claimed & Verified'
        saveLostItems(lostList)
    }

    recordAuditLog({
        actorName: custodianName,
        module: 'Lost and Found',
        action: 'HANDOVER_FOUND_ITEM',
        entityId: foundItemId,
        previousState: 'In Custody',
        newState: 'Handed Over',
        remarks: `Item '${target.itemName}' successfully handed over to ${claimantName}. Verified by ${custodianName}.`
    })

    dispatchNotification({
        recipientId: claimantId,
        title: 'Lost Item Handover Confirmed',
        message: `Your claimed item '${target.itemName}' has been handed over. Transaction closed.`,
        link: '/lost-and-found?tab=found',
        type: 'LOST_AND_FOUND'
    })

    return target
}

