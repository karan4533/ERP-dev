import React, { useState, useMemo, useEffect } from 'react'
import {
    Package,
    ShoppingCart,
    FileText,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    ChevronRight,
    Building2,
    Truck,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Layers,
    DollarSign,
    RefreshCw,
    X,
    ClipboardList,
    Archive,
    Check,
    Send,
    Tag,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
    Store
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { purchaseService } from '../../services/modules/purchaseService'
import { inventoryService } from '../../services/modules/inventoryService'
import { getProfileLabel } from '../../Pages/Authentication/profileOptions'
import {
    getInventoryCatalog,
    saveInventoryCatalog,
    getMaterialRequisitions,
    saveMaterialRequisitions,
    getPurchaseOrders,
    getGoodsReceiptNotes,
    getStockIssues,
    getVendors,
    saveVendors,
    submitMaterialRequisition,
    updateRequisitionApproval,
    issueMaterialFromStore,
    createPurchaseOrder,
    updatePurchaseOrderApproval,
    markPODispatched,
    processGoodsReceiptNote,
    markRequisitionReadyForCollection,
    markRequisitionCollected,
    getAuditQuantities,
    receiveAuditQuantities,
    giveAuditQuantities
} from './storesProcurementData'
import {
    getGoodsReceivedPasses,
    updateGoodsReceivedPass
} from '../../Pages/FrontOffice/GoodsReceivedPass/goodsReceivedPassData'
import {
    getMaterialGatePasses,
    updateMaterialGatePass
} from '../../Pages/FrontOffice/MaterialGatePass/materialGatePassData'

export default function StoresProcurementWorkspace({ defaultTab = 'overview', roleOverride = null }) {
    const { role: authRole, email: authEmail, name: authName } = useAuth()
    const activeRole = roleOverride || authRole || 'stationery-store-manager'
    const roleLabel = getProfileLabel(activeRole)

    // Role Capabilities
    const isExecutiveOrAdmin = ['director', 'principal', 'super-admin', 'admin'].includes(activeRole)
    const isStoreManager = ['stationery-store-manager', 'admin', 'super-admin'].includes(activeRole)
    const isAccounts = ['account-head', 'director', 'admin'].includes(activeRole)
    const isDepartmentHead = [
        'stationery-store-manager',
        'transport-manager',
        'it-support-manager',
        'gatekeeper-manager',
        'housekeeping-manager',
        'maintenance-manager',
        'maintenancemanager',
        'canteen-manager',
        'coordinator',
        'account-head'
    ].includes(activeRole)

    // Active Tab & Feedback State
    const [activeTab, setActiveTab] = useState(defaultTab)
    const [actionMessage, setActionMessage] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)

    const notify = (msg) => {
        setActionMessage(msg)
        setTimeout(() => setActionMessage(''), 4000)
    }

    // Live Queries
    const catalog = useMemo(() => {
        void refreshKey
        return getInventoryCatalog()
    }, [refreshKey])

    const requisitions = useMemo(() => {
        void refreshKey
        return getMaterialRequisitions()
    }, [refreshKey])

    const purchaseOrders = useMemo(() => {
        void refreshKey
        return getPurchaseOrders()
    }, [refreshKey])

    const grns = useMemo(() => {
        void refreshKey
        return getGoodsReceiptNotes()
    }, [refreshKey])

    const stockIssues = useMemo(() => {
        void refreshKey
        return getStockIssues()
    }, [refreshKey])

    const vendors = useMemo(() => {
        void refreshKey
        return getVendors()
    }, [refreshKey])

    const goodsReceivedPasses = useMemo(() => {
        void refreshKey
        return getGoodsReceivedPasses()
    }, [refreshKey])

    const materialGatePasses = useMemo(() => {
        void refreshKey
        return getMaterialGatePasses()
    }, [refreshKey])

    const auditQuantities = useMemo(() => {
        void refreshKey
        return getAuditQuantities()
    }, [refreshKey])

    // Tabs List - Role Based Scoping (Don't expose internal procurement to regular users)
    const availableTabs = useMemo(() => {
        if (!isStoreManager && !isExecutiveOrAdmin) {
            const regularTabs = [
                { id: 'inventory', label: 'Store Stocks', icon: Package },
                { id: 'requisitions', label: 'My Material Requests', icon: ClipboardList }
            ]
            if (isDepartmentHead) {
                regularTabs.push({ id: 'approvals', label: 'Department Approvals', icon: CheckCircle2 })
            }
            return regularTabs
        }

        return [
            { id: 'overview', label: 'Stores Overview', icon: BarChart3 },
            { id: 'inventory', label: 'Inventory Catalog', icon: Package },
            { id: 'requisitions', label: 'Requests & Issues', icon: ClipboardList },
            { id: 'audit-quantities', label: 'Audit Quantities (Given & Receiving)', icon: ShieldAlert },
            { id: 'goods-received-passes', label: 'Goods Received Passes', icon: Truck },
            { id: 'material-gate-passes', label: 'Store Gate Passes', icon: Store },
            { id: 'requirements', label: 'Purchase Needs & RFQ', icon: ShoppingCart },
            { id: 'purchase-orders', label: 'Purchase Orders (PO)', icon: FileText },
            { id: 'grn', label: 'Goods Receipt (GRN)', icon: Archive },
            { id: 'vendors', label: 'Vendor Directory', icon: Building2 },
            { id: 'reports', label: 'Stock Reports', icon: Layers }
        ]
    }, [isStoreManager, isExecutiveOrAdmin, isDepartmentHead])

    useEffect(() => {
        if (defaultTab && availableTabs.some((t) => t.id === defaultTab)) {
            setActiveTab(defaultTab)
        } else if (!availableTabs.some((t) => t.id === activeTab)) {
            setActiveTab(availableTabs[0]?.id || 'inventory')
        }
    }, [defaultTab, availableTabs, activeTab])

    // ==========================================
    // METRICS / KPIS
    // ==========================================
    const kpis = useMemo(() => {
        const totalSkus = catalog.length
        const lowStockItems = catalog.filter((i) => i.currentStock <= i.minStockLevel)
        const totalValuation = catalog.reduce((acc, curr) => acc + (curr.currentStock * curr.unitPrice), 0)
        const pendingRequisitions = requisitions.filter((r) => r.status === 'Pending HOD Approval' || r.status === 'Approved by HOD')
        const activePOs = purchaseOrders.filter((po) => ['Pending Approval', 'Approved', 'Dispatched', 'Partially Received'].includes(po.status))
        const completedGRNsThisMonth = grns.length

        return {
            totalSkus,
            lowStockCount: lowStockItems.length,
            totalValuation,
            pendingRequisitionsCount: pendingRequisitions.length,
            activePOsCount: activePOs.length,
            completedGRNsCount: completedGRNsThisMonth
        }
    }, [catalog, requisitions, purchaseOrders, grns])

    // ==========================================
    // MODAL STATES
    // ==========================================
    const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false)
    const [reqFormData, setReqFormData] = useState({
        department: 'Academic - Secondary',
        requiredByDate: '2026-11-10',
        urgency: 'Medium',
        purpose: '',
        selectedItems: []
    })

    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
    const [selectedReqForIssue, setSelectedReqForIssue] = useState(null)
    const [issueFormData, setIssueFormData] = useState({
        isReturnable: false,
        expectedReturnDate: '2026-11-15',
        remarks: ''
    })

    const [isPOModalOpen, setIsPOModalOpen] = useState(false)
    const [poFormData, setPOFormData] = useState({
        vendorId: 'VEN-001',
        paymentTerms: 'Net 30 Days',
        deliveryDueDate: '2026-11-20',
        shippingAddress: 'Campus Main Stores, Central Academic Block, Ground Floor',
        discountAmount: 0,
        remarks: '',
        lineItems: [
            { itemCode: 'STA-PAP-A4', itemName: 'A4 Copier Paper 75 GSM', orderedQuantity: 50, unitPrice: 280, gstPercentage: 12 }
        ]
    })

    const [isGRNModalOpen, setIsGRNModalOpen] = useState(false)
    const [selectedPOForGRN, setSelectedPOForGRN] = useState(null)
    const [grnFormData, setGRNFormData] = useState({
        invoiceNumber: '',
        deliveryChallanNumber: '',
        receivedItems: []
    })

    const [viewPODetail, setViewPODetail] = useState(null)
    const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false)

    // Ready to Collect Modal States
    const [isReadyModalOpen, setIsReadyModalOpen] = useState(false)
    const [selectedReqForReady, setSelectedReqForReady] = useState(null)
    const [readyPickupLocation, setReadyPickupLocation] = useState('Main Stores Desk, Academic Block Ground Floor')
    const [readyRemarks, setReadyRemarks] = useState('Items verified and packed. Ready for collection.')

    // Requisition Mode: 'STOCK' | 'NEW_PRODUCT'
    const [requisitionMode, setRequisitionMode] = useState('STOCK')
    const [customItemForm, setCustomItemForm] = useState({
        itemName: '',
        category: 'Stationery & Printing',
        requestedQuantity: 1,
        unit: 'Pieces',
        specifications: '',
        purpose: ''
    })

    // Audit Quantities Reconciliation Modal States
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
    const [auditModalMode, setAuditModalMode] = useState('RECEIVE') // 'RECEIVE' | 'GIVE'
    const [auditFormData, setAuditFormData] = useState({
        itemCode: 'STN-PPR-A4',
        quantity: 1,
        auditRef: 'AUD-PROC-2026',
        remarks: ''
    })

    // Stock Adjustment & Inter-Department Transfer States
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
    const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null)
    const [adjustFormData, setAdjustFormData] = useState({
        adjustmentType: 'Physical Count Variance',
        direction: 'DECREASE',
        quantity: 1,
        remarks: 'Discrepancy verified during physical count stocktake.'
    })

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
    const [transferFormData, setTransferFormData] = useState({
        itemCode: '',
        targetDepartment: 'Science Laboratory',
        quantity: 1,
        recipientName: 'Dr. V. Raman (Lab In-Charge)',
        remarks: 'Departmental operational requirement.'
    })

    const handleConfirmStockAdjust = async (e) => {
        e.preventDefault()
        if (!selectedItemForAdjust) return
        const qty = Number(adjustFormData.quantity) || 0
        if (qty <= 0) {
            alert('Quantity must be greater than zero.')
            return
        }

        try {
            const delta = adjustFormData.direction === 'INCREASE' ? qty : -qty
            await inventoryService.recordStockMovement({
                itemId: selectedItemForAdjust.itemCode || selectedItemForAdjust.id,
                transactionType: 'ADJUSTMENT',
                quantity: qty,
                referenceNo: `ADJ-${Date.now().toString().slice(-6)}`,
                performedBy: authName || 'Store Manager',
                notes: `${adjustFormData.adjustmentType}: ${adjustFormData.remarks} (Direction: ${adjustFormData.direction})`
            }).catch(() => {})

            const updatedCatalog = catalog.map((cat) => {
                if (cat.itemCode === selectedItemForAdjust.itemCode || cat.id === selectedItemForAdjust.id) {
                    const nextStock = Math.max(0, (cat.currentStock || 0) + delta)
                    return { ...cat, currentStock: nextStock }
                }
                return cat
            })
            saveInventoryCatalog(updatedCatalog)
            notify(`✓ Stock adjusted for ${selectedItemForAdjust.name || selectedItemForAdjust.itemName} (${delta > 0 ? '+' : ''}${delta} units)!`)
            setIsAdjustModalOpen(false)
            setSelectedItemForAdjust(null)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message || 'Error recording stock adjustment.')
        }
    }

    const handleConfirmTransfer = async (e) => {
        e.preventDefault()
        const targetItem = catalog.find(i => i.itemCode === transferFormData.itemCode)
        if (!targetItem) {
            alert('Please select an inventory item.')
            return
        }
        const qty = Number(transferFormData.quantity) || 0
        if (qty <= 0 || qty > (targetItem.currentStock || 0)) {
            alert(`Transfer quantity must be between 1 and available stock (${targetItem.currentStock || 0}).`)
            return
        }

        try {
            await inventoryService.recordStockMovement({
                itemId: targetItem.itemCode,
                transactionType: 'OUT',
                quantity: qty,
                referenceNo: `TRF-${Date.now().toString().slice(-6)}`,
                performedBy: authName || 'Store Manager',
                notes: `Transfer to ${transferFormData.targetDepartment} received by ${transferFormData.recipientName}`
            }).catch(() => {})

            const updatedCatalog = catalog.map((cat) => {
                if (cat.itemCode === targetItem.itemCode) {
                    return { ...cat, currentStock: Math.max(0, (cat.currentStock || 0) - qty) }
                }
                return cat
            })
            saveInventoryCatalog(updatedCatalog)
            notify(`✓ Transferred ${qty} units of ${targetItem.name || targetItem.itemName} to ${transferFormData.targetDepartment}!`)
            setIsTransferModalOpen(false)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message || 'Error processing transfer.')
        }
    }

    const handleReturnIssuedItem = async (req) => {
        try {
            await inventoryService.returnItem(req.id, {
                returnCondition: 'Good',
                notes: `Checked in by ${authName || 'Store Manager'}`
            }).catch(() => {})

            const updatedCatalog = [...catalog]
            const itemsToRestore = req.selectedItems || (req.lineItems ? req.lineItems : [])
            itemsToRestore.forEach((it) => {
                const found = updatedCatalog.find(c => c.itemCode === it.itemCode)
                if (found) {
                    found.currentStock = (found.currentStock || 0) + (Number(it.requestedQuantity || it.quantity) || 1)
                }
            })
            saveInventoryCatalog(updatedCatalog)

            const allReqs = getMaterialRequisitions()
            const targetReq = allReqs.find(r => r.id === req.id)
            if (targetReq) {
                targetReq.status = 'Returned & Checked In'
                targetReq.actualReturnDate = new Date().toLocaleDateString('en-GB')
                saveMaterialRequisitions(allReqs)
            }
            notify(`✓ Returnable item for requisition ${req.id} successfully checked in! Stock restored.`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message || 'Error checking in returnable item.')
        }
    }

    const handleReceiveAuditQuantity = (record) => {
        try {
            receiveAuditQuantities({
                auditRecordId: record.id,
                itemCode: record.itemCode,
                qty: record.quantity,
                auditRef: record.auditRef,
                remarks: 'Verified and received back into inventory by Store Manager',
                receivedBy: authName || 'Store Manager'
            })
            notify(`Received ${record.quantity} units of ${record.itemName} back into stock from Audit!`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleOpenAuditModal = (mode = 'RECEIVE') => {
        setAuditModalMode(mode)
        setAuditFormData({
            itemCode: catalog[0]?.itemCode || 'STN-PPR-A4',
            quantity: 5,
            auditRef: `AUD-${mode === 'RECEIVE' ? 'RECON' : 'PHYS'}-2026-${Math.floor(100 + Math.random() * 900)}`,
            remarks: mode === 'RECEIVE' ? 'Quantities returned from audit verification.' : 'Sample units issued for audit testing.'
        })
        setIsAuditModalOpen(true)
    }

    const handleSubmitAuditModal = (e) => {
        e.preventDefault()
        try {
            if (auditModalMode === 'RECEIVE') {
                receiveAuditQuantities({
                    itemCode: auditFormData.itemCode,
                    qty: auditFormData.quantity,
                    auditRef: auditFormData.auditRef,
                    remarks: auditFormData.remarks,
                    receivedBy: authName || 'Store Manager'
                })
                notify(`Successfully received ${auditFormData.quantity} units back into store stock!`)
            } else {
                giveAuditQuantities({
                    itemCode: auditFormData.itemCode,
                    qty: auditFormData.quantity,
                    auditRef: auditFormData.auditRef,
                    remarks: auditFormData.remarks,
                    givenBy: authName || 'Store Manager'
                })
                notify(`Successfully issued ${auditFormData.quantity} units to Audit!`)
            }
            setIsAuditModalOpen(false)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleApproveGoodsPass = (passId) => {
        try {
            const pass = goodsReceivedPasses.find((p) => p.id === passId)
            if (!pass) return
            const updated = updateGoodsReceivedPass(passId, {
                signatories: {
                    ...pass.signatories,
                    storeKeeper: { role: 'Store Keeper', name: authName || 'Selvam R.' },
                }
            })
            notify(`Goods Received Pass ${updated.grNo} signed and approved by Store!`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleApproveMaterialGatePass = (passId) => {
        try {
            const pass = materialGatePasses.find((p) => p.id === passId)
            if (!pass) return
            const updated = updateMaterialGatePass(passId, {
                approvals: {
                    ...pass.approvals,
                    storeKeeper: { role: 'Store Keeper', name: authName || 'Selvam R.' }
                }
            })
            notify(`Material Gate Pass ${updated.mgpNo} signed and approved by Store!`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleMarkReadySubmit = (e) => {
        e.preventDefault()
        if (!selectedReqForReady) return
        try {
            markRequisitionReadyForCollection({
                requisitionId: selectedReqForReady.id,
                storeOfficerName: authName || 'Gurpreet Singh',
                pickupLocation: readyPickupLocation,
                remarks: readyRemarks
            })
            notify(`Requisition ${selectedReqForReady.id} marked Ready for Collection! Announcement dispatched to employee/department.`)
            setIsReadyModalOpen(false)
            setSelectedReqForReady(null)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleMarkCollected = (reqId, collectedByName) => {
        try {
            markRequisitionCollected({
                requisitionId: reqId,
                collectedByName: collectedByName || authName || 'Staff Member',
                remarks: 'Verified and collected at stores desk.'
            })
            notify(`Requisition ${reqId} collection acknowledged and marked closed!`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleQuickAddProductToRequisition = (product) => {
        setReqFormData((prev) => {
            const existing = prev.selectedItems.find((i) => i.itemCode === product.itemCode)
            if (existing) {
                return {
                    ...prev,
                    selectedItems: prev.selectedItems.map((i) =>
                        i.itemCode === product.itemCode ? { ...i, requestedQuantity: i.requestedQuantity + 1 } : i
                    )
                }
            }
            return {
                ...prev,
                selectedItems: [
                    ...prev.selectedItems,
                    {
                        itemCode: product.itemCode,
                        itemName: product.name,
                        requestedQuantity: 1,
                        unit: product.unit,
                        availableStock: product.currentStock
                    }
                ]
            }
        })
        notify(`Added "${product.name}" to Requisition draft!`)
    }
    const [vendorFormData, setVendorFormData] = useState({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        gstin: '',
        category: 'General Supplies',
        paymentTerms: 'Net 30 Days'
    })

    // Filter states
    const [inventorySearch, setInventorySearch] = useState('')
    const [inventoryCatFilter, setInventoryCatFilter] = useState('ALL')
    const [inventoryStockFilter, setInventoryStockFilter] = useState('ALL')

    const filteredInventory = useMemo(() => {
        return catalog.filter((item) => {
            if (inventoryCatFilter !== 'ALL' && item.category !== inventoryCatFilter) return false
            if (inventoryStockFilter === 'LOW' && item.currentStock > item.minStockLevel) return false
            if (inventoryStockFilter === 'OUT' && item.currentStock > 0) return false
            if (inventorySearch.trim()) {
                const q = inventorySearch.toLowerCase().trim()
                const match = `${item.itemCode} ${item.name} ${item.category} ${item.location}`.toLowerCase()
                if (!match.includes(q)) return false
            }
            return true
        })
    }, [catalog, inventoryCatFilter, inventoryStockFilter, inventorySearch])

    // ==========================================
    // ACTION HANDLERS
    // ==========================================
    const handleRequisitionSubmit = (e) => {
        e.preventDefault()
        if (reqFormData.selectedItems.length === 0) {
            alert('Please select at least one item to request.')
            return
        }
        try {
            const result = submitMaterialRequisition({
                requestingEmployeeId: 'EMP-SEC-012',
                requestingEmployeeName: authName || 'Sunita Verma',
                requestingEmployeeEmail: authEmail || 'sunita.verma@school.edu',
                department: reqFormData.department,
                reportingManager: 'Dr. Kavita Sharma',
                urgency: reqFormData.urgency,
                requiredByDate: reqFormData.requiredByDate,
                purpose: reqFormData.purpose || 'Classroom / Lab instructional supplies',
                requestedItems: reqFormData.selectedItems
            })
            notify(`Requisition ${result.id} submitted successfully!`)
            setIsRequisitionModalOpen(false)
            setReqFormData({
                department: 'Academic - Secondary',
                requiredByDate: '2026-11-10',
                urgency: 'Medium',
                purpose: '',
                selectedItems: []
            })
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleApproveRequisition = (reqId, decision) => {
        try {
            updateRequisitionApproval(reqId, decision, authName || 'Admin / HOD', activeRole, 'Standard department validation')
            notify(`Requisition ${reqId} ${decision.toLowerCase()} successfully!`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleIssueStockSubmit = (e) => {
        e.preventDefault()
        if (!selectedReqForIssue) return
        try {
            const result = issueMaterialFromStore({
                requisitionId: selectedReqForIssue.id,
                issuedToId: selectedReqForIssue.requestingEmployeeId,
                issuedToName: selectedReqForIssue.requestingEmployeeName,
                department: selectedReqForIssue.department,
                issuedById: 'EMP-ST-001',
                issuedByName: authName || 'Ramesh Kumar (Store Manager)',
                isReturnable: issueFormData.isReturnable,
                expectedReturnDate: issueFormData.isReturnable ? issueFormData.expectedReturnDate : null,
                items: selectedReqForIssue.items.map((i) => ({
                    itemCode: i.itemCode,
                    issuedQuantity: i.requestedQuantity
                })),
                remarks: issueFormData.remarks || 'Issued from Main Central Stores'
            })
            notify(`Stock issued successfully under Issue Voucher ${result.stockIssue.id}! ${result.gatePass ? `(Gate Pass ${result.gatePass.id} created)` : ''}`)
            setIsIssueModalOpen(false)
            setSelectedReqForIssue(null)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleCreatePOSubmit = (e) => {
        e.preventDefault()
        if (poFormData.lineItems.length === 0) {
            alert('Please add at least one line item to the PO.')
            return
        }
        try {
            const result = createPurchaseOrder({
                vendorId: poFormData.vendorId,
                createdByEmployeeId: 'EMP-ST-001',
                createdByEmployeeName: authName || 'Ramesh Kumar (Store Manager)',
                paymentTerms: poFormData.paymentTerms,
                deliveryDueDate: poFormData.deliveryDueDate,
                shippingAddress: poFormData.shippingAddress,
                items: poFormData.lineItems,
                discountAmount: Number(poFormData.discountAmount) || 0,
                remarks: poFormData.remarks || 'Annual inventory replenishment'
            })
            notify(`Purchase Order ${result.poNumber} generated successfully!`)
            setIsPOModalOpen(false)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleApprovePO = async (poNum, decision) => {
        try {
            updatePurchaseOrderApproval(poNum, decision, authName || 'Dr. Kavita Sharma (Director)', 'Approved per budgetary allocation.')
            if (decision === 'Approved') {
                try {
                    await purchaseService.approvePurchaseOrder(poNum, {
                        approvedBy: authName || 'Dr. Kavita Sharma (Director)',
                    })
                } catch (serviceErr) {
                    console.warn('purchaseService approve sync notice:', serviceErr)
                }
            }
            notify(`Purchase Order ${poNum} ${decision.toLowerCase()}!`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleDispatchPO = (poNum) => {
        try {
            markPODispatched(poNum)
            notify(`Purchase Order ${poNum} marked as Dispatched to Vendor!`)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const openGRNModalForPO = (po) => {
        setSelectedPOForGRN(po)
        setGRNFormData({
            invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
            deliveryChallanNumber: `DC-${Math.floor(1000 + Math.random() * 9000)}`,
            receivedItems: (po.items || []).map((it) => {
                const orderedQty = it.orderedQuantity ?? it.qty ?? 0
                return {
                    itemCode: it.itemCode,
                    itemName: it.itemName || it.description || 'Inventory Item',
                    orderedQuantity: orderedQty,
                    receivedQuantity: orderedQty,
                    acceptedQuantity: orderedQty,
                    rejectedQuantity: 0,
                    damagedQuantity: 0,
                    qualityStatus: 'Passed',
                    storageLocation: 'Shelf A-01 / Rack 02',
                    batchNumber: `BATCH-2026-${Math.floor(100 + Math.random() * 900)}`
                }
            })
        })
        setIsGRNModalOpen(true)
    }

    const handleGRNSubmit = (e) => {
        e.preventDefault()
        if (!selectedPOForGRN) return
        try {
            const mappedReceivedItems = (grnFormData.receivedItems || []).map((it) => ({
                itemCode: it.itemCode,
                itemName: it.itemName,
                orderedQty: Number(it.orderedQuantity || 0),
                receivedQty: Number(it.receivedQuantity || 0),
                acceptedQty: Number(it.acceptedQuantity || 0),
                damagedQty: Number(it.damagedQuantity || 0),
                rejectedQty: Number(it.rejectedQuantity || 0),
                qualityStatus: it.qualityStatus || 'Passed',
                storageLocation: it.storageLocation || 'Main Store Shelf',
                batchNumber: it.batchNumber || ''
            }))

            const result = processGoodsReceiptNote({
                poNumber: selectedPOForGRN.id || selectedPOForGRN.poNumber,
                invoiceNo: grnFormData.invoiceNumber,
                deliveryChallanNo: grnFormData.deliveryChallanNumber,
                receivedById: 'EMP-ST-001',
                receivedByName: authName || 'Ramesh Kumar (Store Manager)',
                receivedItems: mappedReceivedItems,
                inspectedBy: 'Store Quality Inspection Team',
                remarks: 'Inspected and verified against specifications.'
            })
            const grnRef = result?.grn?.id || result?.grn?.grnNumber || 'GRN'
            notify(`GRN ${grnRef} processed! Inventory updated and PO state adjusted.`)
            setIsGRNModalOpen(false)
            setSelectedPOForGRN(null)
            setRefreshKey((k) => k + 1)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleAddVendorSubmit = (e) => {
        e.preventDefault()
        if (!vendorFormData.name || !vendorFormData.email) {
            alert('Please fill in vendor name and email.')
            return
        }
        const newVendor = {
            id: `VEN-${String(vendors.length + 1).padStart(3, '0')}`,
            name: vendorFormData.name,
            contactPerson: vendorFormData.contactPerson,
            phone: vendorFormData.phone,
            email: vendorFormData.email,
            address: vendorFormData.address,
            gstin: vendorFormData.gstin || '29ABCDE1234F1Z5',
            category: vendorFormData.category,
            rating: 5.0,
            paymentTerms: vendorFormData.paymentTerms
        }
        const updated = [...vendors, newVendor]
        saveVendors(updated)
        notify(`Vendor ${newVendor.name} added successfully!`)
        setIsAddVendorModalOpen(false)
        setVendorFormData({
            name: '',
            contactPerson: '',
            phone: '',
            email: '',
            address: '',
            gstin: '',
            category: 'General Supplies',
            paymentTerms: 'Net 30 Days'
        })
        setRefreshKey((k) => k + 1)
    }

    return (
        <div className='space-y-6 p-4 md:p-6 bg-slate-50/50 min-h-screen'>
            {/* Feedback Alert Toast */}
            {actionMessage && (
                <div className='flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs'>
                    <CheckCircle2 size={16} className='text-emerald-600 shrink-0' />
                    <span>{actionMessage}</span>
                </div>
            )}

            {/* Header: Title, Role Badge, Primary Action */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs'>
                        <Store size={22} />
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
                                Stores, Inventory & Procurement
                            </h1>
                            <span className='rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100'>
                                {roleLabel}
                            </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-0.5'>
                            Complete procurement lifecycle: multi-department requisitions, multi-vendor quote comparison, PO builder, and GRN inventory updates.
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2.5'>
                    <button
                        onClick={() => setIsRequisitionModalOpen(true)}
                        className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition'
                    >
                        <Plus size={14} /> Request Product from Store
                    </button>
                    {(isStoreManager || isExecutiveOrAdmin) && (
                        <button
                            onClick={() => setIsPOModalOpen(true)}
                            className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition'
                        >
                            <FileText size={14} className='text-blue-600' /> Generate PO
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className='border-b border-slate-200/80 pb-px'>
                <div className='flex items-center gap-2 overflow-x-auto scrollbar-none'>
                    {availableTabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition whitespace-nowrap ${
                                    isActive
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                <span>{tab.label}</span>
                                {tab.id === 'requisitions' && kpis.pendingRequisitionsCount > 0 && (
                                    <span className='rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2'>
                                        {kpis.pendingRequisitionsCount}
                                    </span>
                                )}
                                {tab.id === 'inventory' && kpis.lowStockCount > 0 && (
                                    <span className='rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2'>
                                        {kpis.lowStockCount} low
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: OVERVIEW                                                           */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
                <div className='space-y-6'>
                    {/* 6 Enterprise KPI Cards */}
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
                        <div className='rounded-[1.25rem] border border-blue-100 bg-[#E8F1FD]/60 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Total SKUs</span>
                                <Package size={16} className='text-blue-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-slate-900'>{kpis.totalSkus}</span>
                                <span className='text-[11px] font-medium text-blue-700'>Active Items</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-rose-100 bg-rose-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Low Stock Alerts</span>
                                <AlertTriangle size={16} className='text-rose-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-rose-600'>{kpis.lowStockCount}</span>
                                <span className='text-[11px] font-medium text-rose-700'>Needs Restock</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Stock Valuation</span>
                                <DollarSign size={16} className='text-emerald-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-1'>
                                <span className='text-2xl font-bold text-slate-900'>₹{kpis.totalValuation.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-amber-100 bg-amber-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Pending Requests</span>
                                <Clock size={16} className='text-amber-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-amber-700'>{kpis.pendingRequisitionsCount}</span>
                                <span className='text-[11px] font-medium text-amber-800'>Awaiting Action</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-slate-200/80 bg-white p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Active POs</span>
                                <FileText size={16} className='text-indigo-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-slate-900'>{kpis.activePOsCount}</span>
                                <span className='text-[11px] font-medium text-indigo-700'>In Pipeline</span>
                            </div>
                        </div>

                        <div className='rounded-[1.25rem] border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-600'>Completed GRNs</span>
                                <Truck size={16} className='text-emerald-600' />
                            </div>
                            <div className='mt-2 flex items-baseline gap-2'>
                                <span className='text-2xl font-bold text-emerald-700'>{kpis.completedGRNsCount}</span>
                                <span className='text-[11px] font-medium text-emerald-800'>Verified Inward</span>
                            </div>
                        </div>
                    </div>

                    {/* Operational Highlights & Low Stock Grid */}
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                        {/* Critical Low Stock Items */}
                        <div className='lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <div className='flex items-center justify-between mb-4 border-b border-slate-100 pb-3'>
                                <div>
                                    <h3 className='text-sm font-semibold text-slate-900'>Critical Stock Threshold Alerts</h3>
                                    <p className='text-xs text-slate-500'>Items where current stock is equal to or below minimum threshold</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('requirements')}
                                    className='text-xs font-semibold text-blue-600 hover:text-blue-700'
                                >
                                    View Restock RFQ →
                                </button>
                            </div>
                            <div className='overflow-x-auto'>
                                <table className='w-full text-left text-xs'>
                                    <thead>
                                        <tr className='border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                            <th className='py-2.5 px-3'>Item Code & Name</th>
                                            <th className='py-2.5 px-3'>Category</th>
                                            <th className='py-2.5 px-3 text-center'>Current Stock</th>
                                            <th className='py-2.5 px-3 text-center'>Min Threshold</th>
                                            <th className='py-2.5 px-3'>Storage Location</th>
                                            <th className='py-2.5 px-3 text-right'>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-slate-100 text-slate-700'>
                                        {catalog.filter((i) => i.currentStock <= i.minStockLevel).map((item) => (
                                            <tr key={item.itemCode} className='hover:bg-slate-50/70'>
                                                <td className='py-2.5 px-3'>
                                                    <span className='font-mono font-semibold text-slate-900'>{item.itemCode}</span>
                                                    <div className='text-slate-600'>{item.name}</div>
                                                </td>
                                                <td className='py-2.5 px-3 text-slate-500'>{item.category}</td>
                                                <td className='py-2.5 px-3 text-center'>
                                                    <span className='rounded bg-rose-50 px-2 py-0.5 font-bold text-rose-700'>
                                                        {item.currentStock} {item.unit}
                                                    </span>
                                                </td>
                                                <td className='py-2.5 px-3 text-center font-medium text-slate-500'>
                                                    {item.minStockLevel} {item.unit}
                                                </td>
                                                <td className='py-2.5 px-3 text-slate-500'>{item.location}</td>
                                                <td className='py-2.5 px-3 text-right'>
                                                    <button
                                                        onClick={() => {
                                                            setPOFormData((prev) => ({
                                                                ...prev,
                                                                lineItems: [
                                                                    {
                                                                        itemCode: item.itemCode,
                                                                        itemName: item.name,
                                                                        orderedQuantity: item.reorderQuantity,
                                                                        unitPrice: item.unitPrice,
                                                                        gstPercentage: 18
                                                                    }
                                                                ]
                                                            }))
                                                            setIsPOModalOpen(true)
                                                        }}
                                                        className='rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition'
                                                    >
                                                        Procure +
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Requisitions Stream */}
                        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <div className='flex items-center justify-between mb-4 border-b border-slate-100 pb-3'>
                                <div>
                                    <h3 className='text-sm font-semibold text-slate-900'>Recent Requisitions</h3>
                                    <p className='text-xs text-slate-500'>Department requests awaiting dispatch</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('requisitions')}
                                    className='text-xs font-semibold text-blue-600 hover:text-blue-700'
                                >
                                    All ({requisitions.length})
                                </button>
                            </div>
                            <div className='space-y-3'>
                                {requisitions.slice(0, 5).map((req) => (
                                    <div key={req.id} className='rounded-xl border border-slate-100 p-3 hover:bg-slate-50/70 transition'>
                                        <div className='flex items-center justify-between text-xs'>
                                            <span className='font-mono font-bold text-slate-900'>{req.id}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                req.status === 'Issued'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : req.status === 'Approved by HOD'
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'bg-amber-50 text-amber-700'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <div className='mt-1 text-xs text-slate-600 font-medium'>
                                            {req.requestingEmployeeName} • {req.department}
                                        </div>
                                        <div className='mt-1 flex items-center justify-between text-[11px] text-slate-400'>
                                            <span>{req.items.length} item(s)</span>
                                            <span>Required by: {req.requiredByDate}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: INVENTORY CATALOG                                                  */}
            {/* ========================================================================= */}
            {activeTab === 'inventory' && (
                <div className='space-y-4'>
                    {/* Filters Bar */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                        <div className='relative flex-1 min-w-[220px]'>
                            <Search className='absolute left-3 top-2.5 text-slate-400' size={14} />
                            <input
                                type='text'
                                placeholder='Search SKU code, name, category, or storage rack...'
                                value={inventorySearch}
                                onChange={(e) => setInventorySearch(e.target.value)}
                                className='w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden'
                            />
                        </div>

                        <div className='flex items-center gap-2 flex-wrap'>
                            <select
                                value={inventoryCatFilter}
                                onChange={(e) => setInventoryCatFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden'
                            >
                                <option value='ALL'>All Categories</option>
                                <option value='Stationery & Printing'>Stationery & Printing</option>
                                <option value='Science Laboratory'>Science Laboratory</option>
                                <option value='IT & Electronics'>IT & Electronics</option>
                                <option value='Housekeeping & Sanitation'>Housekeeping & Sanitation</option>
                                <option value='Sports & Physical Education'>Sports & Physical Education</option>
                            </select>

                            <select
                                value={inventoryStockFilter}
                                onChange={(e) => setInventoryStockFilter(e.target.value)}
                                className='rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden'
                            >
                                <option value='ALL'>All Stock Levels</option>
                                <option value='LOW'>Low Stock Only</option>
                                <option value='OUT'>Out of Stock (Zero)</option>
                            </select>

                            <span className='rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'>
                                {filteredInventory.length} of {catalog.length} SKUs
                            </span>
                        </div>
                    </div>

                    
                    {/* User Guidance Banner */}
                    <div className='rounded-xl border border-blue-100 bg-[#E8F1FD]/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5'>
                        <div>
                            <h4 className='text-xs font-bold text-blue-950'>Central Store Stocks</h4>
                            <p className='text-[11px] text-blue-800'>
                                Browse available stationery, laboratory and facility stock. Click <b>+ Add to Request</b> to build your requisition, or click <b>+ Request New Product</b> if an item is unlisted.
                            </p>
                        </div>
                        <div className='flex items-center gap-2 flex-wrap'>
                            <a
                                href='/stationery-store-manager/inventory/add-item'
                                className='inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs'
                            >
                                <Plus size={13} /> Add New SKU
                            </a>
                            <button
                                type='button'
                                onClick={() => setIsTransferModalOpen(true)}
                                className='inline-flex items-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs cursor-pointer'
                            >
                                <Truck size={13} /> Transfer Stock
                            </button>
                            <button
                                onClick={() => {
                                    setRequisitionMode('NEW_PRODUCT')
                                    setIsRequisitionModalOpen(true)
                                }}
                                className='inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs'
                            >
                                <Plus size={13} /> Request New Product
                            </button>
                            {reqFormData.selectedItems.length > 0 && (
                                <button
                                    onClick={() => {
                                        setRequisitionMode('STOCK')
                                        setIsRequisitionModalOpen(true)
                                    }}
                                    className='inline-flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs'
                                >
                                    Review Request ({reqFormData.selectedItems.length} items) →
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>Item Code</th>
                                        <th className='py-3 px-4'>Item Description</th>
                                        <th className='py-3 px-4'>Category</th>
                                        <th className='py-3 px-4 text-center'>Stock on Hand</th>
                                        {(isStoreManager || isExecutiveOrAdmin) && <th className='py-3 px-4 text-center'>Min Level</th>}
                                        {(isStoreManager || isExecutiveOrAdmin) && <th className='py-3 px-4 text-right'>Unit Price</th>}
                                        {(isStoreManager || isExecutiveOrAdmin) && <th className='py-3 px-4 text-right'>Total Value</th>}
                                        <th className='py-3 px-4'>Storage Location</th>
                                        <th className='py-3 px-4 text-center'>Status</th>
                                        <th className='py-3 px-4 text-right'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {filteredInventory.map((item) => {
                                        const isLow = item.currentStock <= item.minStockLevel
                                        const isOut = item.currentStock === 0
                                        return (
                                            <tr key={item.itemCode} className='hover:bg-slate-50/70'>
                                                <td className='py-3 px-4 font-mono font-bold text-slate-900'>{item.itemCode}</td>
                                                <td className='py-3 px-4'>
                                                    <div className='font-semibold text-slate-900'>{item.name}</div>
                                                    <div className='text-[11px] text-slate-400'>UOM: {item.unit}</div>
                                                </td>
                                                <td className='py-3 px-4 text-slate-600'>{item.category}</td>
                                                <td className='py-3 px-4 text-center font-bold text-slate-900'>
                                                    {item.currentStock} {item.unit}
                                                </td>
                                                {(isStoreManager || isExecutiveOrAdmin) && <td className='py-3 px-4 text-center text-slate-500'>{item.minStockLevel} {item.unit}</td>}
                                                {(isStoreManager || isExecutiveOrAdmin) && <td className='py-3 px-4 text-right font-mono text-slate-900'>₹{item.unitPrice.toFixed(2)}</td>}
                                                {(isStoreManager || isExecutiveOrAdmin) && (
                                                    <td className='py-3 px-4 text-right font-mono font-bold text-slate-900'>
                                                        ₹{(item.currentStock * item.unitPrice).toLocaleString('en-IN')}
                                                    </td>
                                                )}
                                                <td className='py-3 px-4 text-slate-500'>{item.location}</td>
                                                <td className='py-3 px-4 text-center'>
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                        isOut
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : isLow
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-emerald-50 text-emerald-700'
                                                    }`}>
                                                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Adequate'}
                                                    </span>
                                                </td>
                                                <td className='py-3 px-4 text-right'>
                                                    <div className='flex items-center justify-end gap-1.5'>
                                                        <button
                                                            onClick={() => handleQuickAddProductToRequisition(item)}
                                                            className='inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 text-xs font-semibold transition shadow-2xs'
                                                        >
                                                            <Plus size={12} /> Add to Request
                                                        </button>
                                                        {(isStoreManager || isExecutiveOrAdmin) && (
                                                            <button
                                                                type='button'
                                                                onClick={() => {
                                                                    setSelectedItemForAdjust(item)
                                                                    setIsAdjustModalOpen(true)
                                                                }}
                                                                className='inline-flex items-center gap-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 text-xs font-semibold transition cursor-pointer'
                                                            >
                                                                Adjust
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: REQUESTS & ISSUES                                                  */}
            {/* ========================================================================= */}
            {activeTab === 'requisitions' && (
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-900'>Material Requisitions & Issue Vouchers</h2>
                            <p className='text-xs text-slate-500'>
                                Review departmental requisitions, authorize approvals, and generate Returnable or Non-Returnable stock issues.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsRequisitionModalOpen(true)}
                            className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition'
                        >
                            <Plus size={14} /> Raise New Request
                        </button>
                    </div>

                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>Requisition ID</th>
                                        <th className='py-3 px-4'>Request Date</th>
                                        <th className='py-3 px-4'>Employee & Dept</th>
                                        <th className='py-3 px-4'>Requested Items</th>
                                        <th className='py-3 px-4'>Required Date</th>
                                        <th className='py-3 px-4'>Urgency</th>
                                        <th className='py-3 px-4 text-center'>Status</th>
                                        <th className='py-3 px-4 text-right'>Workflow Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {((isStoreManager || isExecutiveOrAdmin) ? requisitions : requisitions.filter(r => 
    r.requestingEmployeeName === (authName || 'Sunita Verma') || 
    r.requestingEmployeeEmail === authEmail || 
    r.department.toLowerCase().includes('academic') || 
    r.department.toLowerCase().includes((activeRole || '').toLowerCase())
)).map((req) => (
                                        <tr key={req.id} className='hover:bg-slate-50/70'>
                                            <td className='py-3 px-4 font-mono font-bold text-slate-900'>{req.id}</td>
                                            <td className='py-3 px-4 text-slate-500'>{req.requestDate}</td>
                                            <td className='py-3 px-4'>
                                                <div className='font-semibold text-slate-900'>{req.requestingEmployeeName}</div>
                                                <div className='text-[11px] text-slate-400'>{req.department}</div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <div className='space-y-1'>
                                                    {req.items.map((it, idx) => (
                                                        <div key={idx} className='text-slate-600 text-[11px]'>
                                                            • <span className='font-medium text-slate-900'>{it.itemName}</span>: {it.requestedQuantity} pcs
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className='py-3 px-4 text-slate-600'>{req.requiredByDate}</td>
                                            <td className='py-3 px-4'>
                                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                                    req.urgency === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {req.urgency}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 text-center'>
                                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                    req.status === 'Ready to Collect'
                                                        ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                                                        : req.status === 'Issued' || req.status === 'Stock Issued' || req.status === 'Collected / Closed'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : req.status === 'Approved by HOD' || req.status === 'HOD Approved'
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : req.status === 'Rejected by HOD' || req.status === 'Rejected'
                                                        ? 'bg-rose-50 text-rose-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                                {req.status === 'Ready to Collect' && (
                                                    <div className='text-[10px] text-emerald-700 font-semibold mt-0.5'>
                                                        📍 {req.pickupLocation || 'Main Stores Desk'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className='py-3 px-4 text-right'>
                                                <div className='flex items-center justify-end gap-1.5'>
                                                    {(req.status === 'Pending HOD Approval' || req.status === 'Submitted') && (isDepartmentHead || isExecutiveOrAdmin) && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveRequisition(req.id, 'Approved')}
                                                                className='rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100'
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleApproveRequisition(req.id, 'Rejected')}
                                                                className='rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100'
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {(req.status === 'Approved by HOD' || req.status === 'HOD Approved') && isStoreManager && (
                                                        <div className='flex items-center gap-1.5'>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedReqForReady(req)
                                                                    setIsReadyModalOpen(true)
                                                                }}
                                                                className='rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 shadow-2xs'
                                                            >
                                                                Mark Ready to Collect 📦
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedReqForIssue(req)
                                                                    setIsIssueModalOpen(true)
                                                                }}
                                                                className='rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700'
                                                            >
                                                                Issue Stock →
                                                            </button>
                                                        </div>
                                                    )}
                                                    {req.status === 'Ready to Collect' && (
                                                        <div className='flex items-center gap-1.5'>
                                                            {isStoreManager ? (
                                                                <button
                                                                    onClick={() => handleMarkCollected(req.id, req.requestingEmployeeName)}
                                                                    className='rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700'
                                                                >
                                                                    Confirm Handover ✓
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleMarkCollected(req.id, authName || req.requestingEmployeeName)}
                                                                    className='rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700'
                                                                >
                                                                    Acknowledge Collection ✓
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    {(req.status === 'Issued' || req.status === 'Stock Issued' || req.status === 'Collected / Closed') && (
                                                        <div className='flex items-center gap-1.5 justify-end'>
                                                            {req.isReturnable && req.status !== 'Returned & Checked In' && (
                                                                <button
                                                                    type='button'
                                                                    onClick={() => handleReturnIssuedItem(req)}
                                                                    className='rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer'
                                                                >
                                                                    Return Item / Check-In
                                                                </button>
                                                            )}
                                                            <span className='text-[11px] font-semibold text-emerald-600 flex items-center gap-1 justify-end'>
                                                                <Check size={12} /> {req.status === 'Returned & Checked In' ? 'Returned & Restocked' : 'Collected & Closed'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: PURCHASE REQUIREMENTS & RFQ                                        */}
            {/* ========================================================================= */}
            {activeTab === 'requirements' && (
                <div className='space-y-4'>
                    <div className='rounded-2xl border border-blue-100 bg-[#E8F1FD]/40 p-4 shadow-xs flex items-center justify-between'>
                        <div>
                            <h3 className='text-sm font-bold text-blue-950'>Procurement Reorder Requirements & Quotation Analyzer</h3>
                            <p className='text-xs text-blue-800'>
                                Multi-vendor quote comparative engine identifies the lowest compliant bidder (L1) across registered vendors.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsPOModalOpen(true)}
                            className='rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700'
                        >
                            Draft PO for Lowest Bidders
                        </button>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {catalog.filter((i) => i.currentStock <= i.minStockLevel).map((item) => (
                            <div key={item.itemCode} className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3'>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <span className='font-mono text-xs font-bold text-slate-900'>{item.itemCode}</span>
                                        <h4 className='text-sm font-semibold text-slate-900'>{item.name}</h4>
                                        <p className='text-xs text-slate-500'>Category: {item.category} • UOM: {item.unit}</p>
                                    </div>
                                    <span className='rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700'>
                                        Stock: {item.currentStock} (Min: {item.minStockLevel})
                                    </span>
                                </div>

                                <div className='rounded-xl border border-slate-100 bg-slate-50/50 p-3'>
                                    <div className='text-[11px] font-semibold text-slate-700 mb-2'>
                                        Multi-Vendor Comparative Quotes (L1 Lowest Bidder Highlighted):
                                    </div>
                                    <div className='space-y-1.5 text-xs'>
                                        <div className='flex items-center justify-between p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium'>
                                            <span>Apex Educational Supplies (L1 Bidder)</span>
                                            <span className='font-bold'>₹{item.unitPrice.toFixed(2)} / unit • 2 Days Delivery</span>
                                        </div>
                                        <div className='flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700'>
                                            <span>Modern Lab Instruments</span>
                                            <span>₹{(item.unitPrice * 1.08).toFixed(2)} / unit • 5 Days Delivery</span>
                                        </div>
                                        <div className='flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700'>
                                            <span>Shree Balaji Sports & Books</span>
                                            <span>₹{(item.unitPrice * 1.12).toFixed(2)} / unit • 4 Days Delivery</span>
                                        </div>
                                    </div>
                                </div>

                                <div className='flex items-center justify-between pt-1'>
                                    <span className='text-xs text-slate-500'>Suggested Reorder Qty: <b>{item.reorderQuantity} {item.unit}</b></span>
                                    <button
                                        onClick={() => {
                                            setPOFormData((prev) => ({
                                                ...prev,
                                                lineItems: [
                                                    {
                                                        itemCode: item.itemCode,
                                                        itemName: item.name,
                                                        orderedQuantity: item.reorderQuantity,
                                                        unitPrice: item.unitPrice,
                                                        gstPercentage: 18
                                                    }
                                                ]
                                            }))
                                            setIsPOModalOpen(true)
                                        }}
                                        className='rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700'
                                    >
                                        Create PO for {item.itemCode}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: PURCHASE ORDERS (PO)                                               */}
            {/* ========================================================================= */}
            {activeTab === 'purchase-orders' && (
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-900'>Enterprise Purchase Orders</h2>
                            <p className='text-xs text-slate-500'>
                                Generated POs with status tracking, multi-tier approvals, vendor dispatch, and GRN linkage.
                            </p>
                        </div>
                        {(isStoreManager || isExecutiveOrAdmin) && (
                            <button
                                onClick={() => setIsPOModalOpen(true)}
                                className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700'
                            >
                                <Plus size={14} /> New Purchase Order
                            </button>
                        )}
                    </div>

                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>PO Number</th>
                                        <th className='py-3 px-4'>PO Date</th>
                                        <th className='py-3 px-4'>Vendor Details</th>
                                        <th className='py-3 px-4'>Line Items</th>
                                        <th className='py-3 px-4 text-right'>Total Amount</th>
                                        <th className='py-3 px-4'>Due Date</th>
                                        <th className='py-3 px-4 text-center'>Status</th>
                                        <th className='py-3 px-4 text-right'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {purchaseOrders.map((po) => (
                                        <tr key={po.poNumber} className='hover:bg-slate-50/70'>
                                            <td className='py-3 px-4 font-mono font-bold text-slate-900'>{po.poNumber}</td>
                                            <td className='py-3 px-4 text-slate-500'>{po.poDate}</td>
                                            <td className='py-3 px-4'>
                                                <div className='font-semibold text-slate-900'>{po.vendorName}</div>
                                                <div className='text-[11px] text-slate-400'>GSTIN: {po.vendorGstin}</div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <div className='text-slate-600'>
                                                    {po.items.map((i) => `${i.itemName} (${i.orderedQuantity})`).join(', ')}
                                                </div>
                                            </td>
                                            <td className='py-3 px-4 text-right font-mono font-bold text-slate-900'>
                                                ₹{po.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className='py-3 px-4 text-slate-500'>{po.deliveryDueDate}</td>
                                            <td className='py-3 px-4 text-center'>
                                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                    po.status === 'Completed'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : po.status === 'Dispatched'
                                                        ? 'bg-indigo-50 text-indigo-700'
                                                        : po.status === 'Approved'
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : po.status === 'Pending Approval'
                                                        ? 'bg-amber-50 text-amber-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {po.status}
                                                </span>
                                            </td>
                                            <td className='py-3 px-4 text-right'>
                                                <div className='flex items-center justify-end gap-1.5'>
                                                    <button
                                                        onClick={() => setViewPODetail(po)}
                                                        className='rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200'
                                                    >
                                                        View Details
                                                    </button>
                                                    {po.status === 'Pending Approval' && (isExecutiveOrAdmin || isAccounts) && (
                                                        <button
                                                            onClick={() => handleApprovePO(po.poNumber || po.id, 'Approved')}
                                                            className='rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700'
                                                        >
                                                            Approve PO
                                                        </button>
                                                    )}
                                                    {po.status === 'Approved' && isStoreManager && (
                                                        <button
                                                            onClick={() => handleDispatchPO(po.poNumber || po.id)}
                                                            className='rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700'
                                                        >
                                                            Mark Dispatched
                                                        </button>
                                                    )}
                                                    {(po.status === 'Dispatched' || po.status === 'Partially Received') && isStoreManager && (
                                                        <button
                                                            onClick={() => openGRNModalForPO(po)}
                                                            className='rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700'
                                                        >
                                                            Process GRN →
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: GOODS RECEIPT NOTES (GRN)                                          */}
            {/* ========================================================================= */}
            {activeTab === 'grn' && (
                <div className='space-y-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-900'>Goods Receipt Notes (Inward Register)</h2>
                            <p className='text-xs text-slate-500'>
                                Quality inspection verification and automatic stock replenishment on receiving.
                            </p>
                        </div>
                        {isStoreManager && (
                            <button
                                type='button'
                                onClick={() => {
                                    const availablePO = purchaseOrders.find((p) => p.status === 'Dispatched' || p.status === 'Partially Received' || p.status === 'Approved') || purchaseOrders[0]
                                    if (availablePO) {
                                        openGRNModalForPO(availablePO)
                                    } else {
                                        alert('No purchase orders currently pending goods receipt.')
                                    }
                                }}
                                className='inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs'
                            >
                                <Package size={14} /> Receive & Confirm Incoming Products
                            </button>
                        )}
                    </div>

                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>GRN Number</th>
                                        <th className='py-3 px-4'>Receipt Date</th>
                                        <th className='py-3 px-4'>PO Number</th>
                                        <th className='py-3 px-4'>Vendor Name</th>
                                        <th className='py-3 px-4'>Invoice & DC</th>
                                        <th className='py-3 px-4'>Accepted Items</th>
                                        <th className='py-3 px-4'>Inspection Remarks</th>
                                        <th className='py-3 px-4 text-center'>Status</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {grns.map((grn) => (
                                        <tr key={grn.grnNumber} className='hover:bg-slate-50/70'>
                                            <td className='py-3 px-4 font-mono font-bold text-slate-900'>{grn.grnNumber}</td>
                                            <td className='py-3 px-4 text-slate-500'>{grn.receiptDate}</td>
                                            <td className='py-3 px-4 font-mono text-blue-600 font-semibold'>{grn.poNumber}</td>
                                            <td className='py-3 px-4 font-semibold text-slate-900'>{grn.vendorName}</td>
                                            <td className='py-3 px-4 text-slate-600'>
                                                <div>Inv: {grn.invoiceNumber}</div>
                                                <div className='text-[11px] text-slate-400'>DC: {grn.deliveryChallanNumber}</div>
                                            </td>
                                            <td className='py-3 px-4'>
                                                <div className='space-y-1'>
                                                    {grn.items.map((it, idx) => (
                                                        <div key={idx} className='text-[11px] text-slate-700'>
                                                            • {it.itemName}: <span className='font-bold text-emerald-700'>{it.acceptedQuantity} accepted</span>
                                                            {it.damagedQuantity > 0 && <span className='text-rose-600 font-bold'> ({it.damagedQuantity} damaged)</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className='py-3 px-4 text-slate-500'>{grn.inspectionRemarks}</td>
                                            <td className='py-3 px-4 text-center'>
                                                <span className='rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700'>
                                                    {grn.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 7: VENDOR DIRECTORY                                                   */}
            {/* ========================================================================= */}
            {activeTab === 'vendors' && (
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-900'>Approved Vendor Directory</h2>
                            <p className='text-xs text-slate-500'>
                                Registered suppliers, payment terms, GSTIN compliance, and performance ratings.
                            </p>
                        </div>
                        {(isStoreManager || isExecutiveOrAdmin) && (
                            <button
                                onClick={() => setIsAddVendorModalOpen(true)}
                                className='inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700'
                            >
                                <Plus size={14} /> Add New Vendor
                            </button>
                        )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {vendors.map((v) => (
                            <div key={v.id} className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3'>
                                <div className='flex items-start justify-between'>
                                    <div>
                                        <span className='font-mono text-xs font-bold text-blue-600'>{v.id}</span>
                                        <h3 className='text-sm font-bold text-slate-900'>{v.name}</h3>
                                        <p className='text-xs text-slate-500'>{v.category}</p>
                                    </div>
                                    <span className='rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700'>
                                        ★ {v.rating}
                                    </span>
                                </div>

                                <div className='space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3'>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-slate-400'>Contact Person:</span>
                                        <span className='font-semibold text-slate-800'>{v.contactPerson}</span>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-slate-400'>Phone:</span>
                                        <span className='text-slate-800'>{v.phone}</span>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-slate-400'>Email:</span>
                                        <span className='text-blue-600'>{v.email}</span>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-slate-400'>GSTIN:</span>
                                        <span className='font-mono font-medium text-slate-800'>{v.gstin}</span>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-slate-400'>Payment Terms:</span>
                                        <span className='font-semibold text-slate-800'>{v.paymentTerms}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 8: STOCK REPORTS                                                      */}
            {/* ========================================================================= */}
            {activeTab === 'reports' && (
                <div className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <h3 className='text-sm font-semibold text-slate-900 mb-1'>Category-wise Stock Valuation</h3>
                            <p className='text-xs text-slate-500 mb-3'>Capital invested in current inventory</p>
                            <div className='space-y-2 text-xs'>
                                {['Stationery & Printing', 'Science Laboratory', 'IT & Electronics', 'Housekeeping & Sanitation'].map((cat) => {
                                    const itemsInCat = catalog.filter((i) => i.category === cat)
                                    const val = itemsInCat.reduce((sum, c) => sum + (c.currentStock * c.unitPrice), 0)
                                    return (
                                        <div key={cat} className='flex items-center justify-between p-2 rounded-lg bg-slate-50'>
                                            <span className='text-slate-700 font-medium'>{cat}</span>
                                            <span className='font-mono font-bold text-slate-900'>₹{val.toLocaleString('en-IN')}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <h3 className='text-sm font-semibold text-slate-900 mb-1'>Stock Issue Distribution</h3>
                            <p className='text-xs text-slate-500 mb-3'>Issued items by category</p>
                            <div className='space-y-2 text-xs'>
                                <div className='flex items-center justify-between p-2 rounded-lg bg-slate-50'>
                                    <span className='text-slate-700 font-medium'>Returnable Assets Issued</span>
                                    <span className='font-bold text-indigo-700'>
                                        {stockIssues.filter((s) => s.isReturnable).length} issues
                                    </span>
                                </div>
                                <div className='flex items-center justify-between p-2 rounded-lg bg-slate-50'>
                                    <span className='text-slate-700 font-medium'>Consumables (Non-Returnable)</span>
                                    <span className='font-bold text-slate-900'>
                                        {stockIssues.filter((s) => !s.isReturnable).length} issues
                                    </span>
                                </div>
                                <div className='flex items-center justify-between p-2 rounded-lg bg-slate-50'>
                                    <span className='text-slate-700 font-medium'>Total Dispatched Requisitions</span>
                                    <span className='font-bold text-emerald-700'>
                                        {requisitions.filter((r) => r.status === 'Issued').length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs'>
                            <h3 className='text-sm font-semibold text-slate-900 mb-1'>Export Master Ledgers</h3>
                            <p className='text-xs text-slate-500 mb-3'>Download structured financial & stores logs</p>
                            <div className='space-y-2 pt-1'>
                                <button
                                    onClick={() => notify('Inventory Stock Ledger exported to PDF & Excel.')}
                                    className='w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5'
                                >
                                    <Download size={14} /> Export Inventory Master (PDF & Excel)
                                </button>
                                <button
                                    onClick={() => notify('Purchase Orders Ledger exported to PDF & Excel.')}
                                    className='w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5'
                                >
                                    <Download size={14} /> Export PO Ledger (PDF & Excel)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: AUDIT QUANTITIES (GIVEN & RECEIVING)                                 */}
            {/* ========================================================================= */}
            {activeTab === 'audit-quantities' && (
                <div className='space-y-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-900'>Audit Quantities Reconciliation (Given vs Receiving)</h2>
                            <p className='text-xs text-slate-500'>
                                Two-way tracking for quantities raised and physical stock issued to Audit ('Given') and inventory verified/returned ('Receiving').
                            </p>
                        </div>
                        {(isStoreManager || isExecutiveOrAdmin) && (
                            <div className='flex items-center gap-2'>
                                <button
                                    onClick={() => handleOpenAuditModal('RECEIVE')}
                                    className='inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs'
                                >
                                    <ArrowDownRight size={14} /> + Receive Quantities
                                </button>
                                <button
                                    onClick={() => handleOpenAuditModal('GIVE')}
                                    className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs'
                                >
                                    <ArrowUpRight size={14} className='text-blue-600' /> + Given to Audit
                                </button>
                            </div>
                        )}
                    </div>

                    {/* KPI Cards */}
                    <div className='grid grid-cols-1 sm:grid-cols-4 gap-3'>
                        <div className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs'>
                            <p className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>Total Audit Records</p>
                            <p className='text-xl font-bold text-slate-900 mt-1'>{auditQuantities.length}</p>
                        </div>
                        <div className='rounded-2xl border border-blue-100 bg-blue-50/30 p-4 shadow-xs'>
                            <p className='text-[11px] font-semibold text-blue-600 uppercase tracking-wider'>Total Given to Audit</p>
                            <p className='text-xl font-bold text-blue-700 mt-1'>
                                {auditQuantities.filter((a) => a.actionType === 'Given').reduce((s, a) => s + a.quantity, 0)} units
                            </p>
                        </div>
                        <div className='rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 shadow-xs'>
                            <p className='text-[11px] font-semibold text-emerald-600 uppercase tracking-wider'>Received & Reconciled</p>
                            <p className='text-xl font-bold text-emerald-700 mt-1'>
                                {auditQuantities.filter((a) => a.actionType === 'Receiving' || a.status === 'Received & Reconciled').reduce((s, a) => s + a.quantity, 0)} units
                            </p>
                        </div>
                        <div className='rounded-2xl border border-amber-100 bg-amber-50/30 p-4 shadow-xs'>
                            <p className='text-[11px] font-semibold text-amber-600 uppercase tracking-wider'>Pending Receiving</p>
                            <p className='text-xl font-bold text-amber-700 mt-1'>
                                {auditQuantities.filter((a) => a.status === 'Pending Receiving' || a.status === 'Given to Audit').reduce((s, a) => s + a.quantity, 0)} units
                            </p>
                        </div>
                    </div>

                    {/* Audit Quantities Register Table */}
                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>Record ID</th>
                                        <th className='py-3 px-4'>Audit Reference</th>
                                        <th className='py-3 px-4'>Item Description</th>
                                        <th className='py-3 px-4'>Audited By</th>
                                        <th className='py-3 px-4 text-center'>Operation</th>
                                        <th className='py-3 px-4 text-right'>Quantity</th>
                                        <th className='py-3 px-4 text-center'>Reconciliation Status</th>
                                        <th className='py-3 px-4'>Date</th>
                                        <th className='py-3 px-4'>Remarks</th>
                                        <th className='py-3 px-4 text-center'>Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {auditQuantities.map((row) => {
                                        const isPending = row.status === 'Pending Receiving' || (row.actionType === 'Given' && row.status !== 'Received & Reconciled')
                                        return (
                                            <tr key={row.id} className='hover:bg-slate-50/70'>
                                                <td className='py-3 px-4 font-mono font-bold text-slate-900'>{row.id}</td>
                                                <td className='py-3 px-4 font-mono text-blue-600 font-semibold'>{row.auditRef}</td>
                                                <td className='py-3 px-4'>
                                                    <div className='font-semibold text-slate-800'>{row.itemName}</div>
                                                    <div className='text-[11px] text-slate-400 font-mono'>{row.itemCode}</div>
                                                </td>
                                                <td className='py-3 px-4 text-slate-600'>{row.auditedBy}</td>
                                                <td className='py-3 px-4 text-center'>
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                        row.actionType === 'Receiving'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {row.actionType === 'Receiving' ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
                                                        {row.actionType}
                                                    </span>
                                                </td>
                                                <td className='py-3 px-4 text-right font-bold text-slate-900 text-sm'>
                                                    {row.quantity}
                                                </td>
                                                <td className='py-3 px-4 text-center'>
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        row.status === 'Received & Reconciled'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className='py-3 px-4 text-slate-500 whitespace-nowrap'>{row.date}</td>
                                                <td className='py-3 px-4 text-slate-600 max-w-xs truncate' title={row.remarks}>{row.remarks}</td>
                                                <td className='py-3 px-4 text-center'>
                                                    {isPending && isStoreManager ? (
                                                        <button
                                                            onClick={() => handleReceiveAuditQuantity(row)}
                                                            className='inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs'
                                                        >
                                                            <Check size={12} /> Receive Stock
                                                        </button>
                                                    ) : (
                                                        <span className='text-[11px] text-slate-400 font-medium'>Reconciled</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: PRM GOODS RECEIVED PASSES (CONNECTED TO STORES)                      */}
            {/* ========================================================================= */}
            {activeTab === 'goods-received-passes' && (
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-900'>Connected PRM Goods Received Passes</h2>
                            <p className='text-xs text-slate-500'>
                                Front Office / PRM material inward passes connected to Stores for storekeeper sign-off and verification.
                            </p>
                        </div>
                    </div>

                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>GR Pass #</th>
                                        <th className='py-3 px-4'>Date & Time</th>
                                        <th className='py-3 px-4'>Supplier Name</th>
                                        <th className='py-3 px-4'>PO & Invoice #</th>
                                        <th className='py-3 px-4'>Vehicle No</th>
                                        <th className='py-3 px-4'>Materials Summary</th>
                                        <th className='py-3 px-4'>Store Keeper Sign-off</th>
                                        <th className='py-3 px-4 text-center'>Status</th>
                                        <th className='py-3 px-4 text-center'>Store Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {goodsReceivedPasses.map((pass) => {
                                        const hasStoreKeeper = Boolean(pass.signatories?.storeKeeper?.name)
                                        return (
                                            <tr key={pass.id} className='hover:bg-slate-50/70'>
                                                <td className='py-3 px-4 font-mono font-bold text-blue-700'>{pass.grNo}</td>
                                                <td className='py-3 px-4 text-slate-500 whitespace-nowrap'>{pass.date} {pass.time} {pass.timePeriod}</td>
                                                <td className='py-3 px-4 font-semibold text-slate-800'>{pass.supplierName}</td>
                                                <td className='py-3 px-4'>
                                                    <div className='font-mono text-slate-700'>{pass.poNo}</div>
                                                    <div className='text-[11px] text-slate-400'>Inv: {pass.invoiceNo}</div>
                                                </td>
                                                <td className='py-3 px-4 font-mono text-slate-600'>{pass.vehicleNo || '—'}</td>
                                                <td className='py-3 px-4'>
                                                    <div className='font-semibold text-slate-800'>{pass.materials?.length || 0} item lines</div>
                                                    <div className='text-[11px] text-slate-500'>
                                                        {pass.materials?.map((m) => `${m.description} (${m.quantity})`).join(', ')}
                                                    </div>
                                                </td>
                                                <td className='py-3 px-4'>
                                                    {hasStoreKeeper ? (
                                                        <span className='font-semibold text-emerald-700 flex items-center gap-1'>
                                                            <CheckCircle2 size={13} className='text-emerald-600' />
                                                            {pass.signatories.storeKeeper.name}
                                                        </span>
                                                    ) : (
                                                        <span className='text-amber-600 font-semibold'>Awaiting Store Sign</span>
                                                    )}
                                                </td>
                                                <td className='py-3 px-4 text-center'>
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        pass.status === 'Approved'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : pass.status === 'Partially Approved'
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {pass.status}
                                                    </span>
                                                </td>
                                                <td className='py-3 px-4 text-center'>
                                                    {!hasStoreKeeper && isStoreManager ? (
                                                        <button
                                                            onClick={() => handleApproveGoodsPass(pass.id)}
                                                            className='rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition'
                                                        >
                                                            Sign as Store Keeper
                                                        </button>
                                                    ) : (
                                                        <span className='text-[11px] text-emerald-700 font-semibold'>✓ Verified</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: STORE MATERIAL GATE PASSES                                           */}
            {/* ========================================================================= */}
            {activeTab === 'material-gate-passes' && (
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-900'>Store & Material Gate Passes</h2>
                            <p className='text-xs text-slate-500'>
                                Returnable and Non-Returnable material outward movements originating from or verified by Stores.
                            </p>
                        </div>
                    </div>

                    <div className='rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden'>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-left text-xs'>
                                <thead>
                                    <tr className='border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500'>
                                        <th className='py-3 px-4'>Pass #</th>
                                        <th className='py-3 px-4'>Type</th>
                                        <th className='py-3 px-4'>Date & Time</th>
                                        <th className='py-3 px-4'>Vendor / Destination</th>
                                        <th className='py-3 px-4'>Materials & Purpose</th>
                                        <th className='py-3 px-4'>Expected Return</th>
                                        <th className='py-3 px-4'>Store Approval</th>
                                        <th className='py-3 px-4 text-center'>Status</th>
                                        <th className='py-3 px-4 text-center'>Store Action</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100 text-slate-700'>
                                    {materialGatePasses.map((pass) => {
                                        const hasStoreKeeper = Boolean(pass.approvals?.storeKeeper?.name)
                                        return (
                                            <tr key={pass.id} className='hover:bg-slate-50/70'>
                                                <td className='py-3 px-4 font-mono font-bold text-slate-900'>{pass.mgpNo}</td>
                                                <td className='py-3 px-4'>
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        pass.passType === 'Returnable'
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {pass.passType}
                                                    </span>
                                                </td>
                                                <td className='py-3 px-4 text-slate-500 whitespace-nowrap'>{pass.date} {pass.time} {pass.timePeriod}</td>
                                                <td className='py-3 px-4'>
                                                    <div className='font-semibold text-slate-800'>{pass.vendorDepartment}</div>
                                                    <div className='text-[11px] text-slate-400'>{pass.destination}</div>
                                                </td>
                                                <td className='py-3 px-4'>
                                                    <div className='text-slate-800 font-medium'>
                                                        {pass.materials?.map((m) => `${m.description} (${m.quantity})`).join(', ')}
                                                    </div>
                                                    <div className='text-[11px] text-slate-500 italic mt-0.5'>{pass.reason}</div>
                                                </td>
                                                <td className='py-3 px-4 text-slate-600'>{pass.expectedReturnDate || 'N/A'}</td>
                                                <td className='py-3 px-4'>
                                                    {hasStoreKeeper ? (
                                                        <span className='font-semibold text-emerald-700 flex items-center gap-1'>
                                                            <CheckCircle2 size={13} className='text-emerald-600' />
                                                            {pass.approvals.storeKeeper.name}
                                                        </span>
                                                    ) : (
                                                        <span className='text-amber-600 font-semibold'>Pending Store</span>
                                                    )}
                                                </td>
                                                <td className='py-3 px-4 text-center'>
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        pass.status === 'Approved'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : pass.status === 'Partially Approved'
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {pass.status}
                                                    </span>
                                                </td>
                                                <td className='py-3 px-4 text-center'>
                                                    {!hasStoreKeeper && isStoreManager ? (
                                                        <button
                                                            onClick={() => handleApproveMaterialGatePass(pass.id)}
                                                            className='rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition'
                                                        >
                                                            Sign Store Approval
                                                        </button>
                                                    ) : (
                                                        <span className='text-[11px] text-emerald-700 font-semibold'>✓ Approved</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: SUBMIT REQUISITION                                                 */}
            {/* ========================================================================= */}
            {isRequisitionModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900'>Raise Material Requisition</h3>
                            <button onClick={() => setIsRequisitionModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleRequisitionSubmit} className='space-y-4 text-xs'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Department</label>
                                    <select
                                        value={reqFormData.department}
                                        onChange={(e) => setReqFormData({ ...reqFormData, department: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                    >
                                        <option value='Academic - Secondary'>Academic - Secondary</option>
                                        <option value='Academic - Primary'>Academic - Primary</option>
                                        <option value='Science Laboratory'>Science Laboratory</option>
                                        <option value='IT Department'>IT Department</option>
                                        <option value='Administration'>Administration</option>
                                        <option value='Housekeeping'>Housekeeping</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Required By Date</label>
                                    <input
                                        type='date'
                                        value={reqFormData.requiredByDate}
                                        onChange={(e) => setReqFormData({ ...reqFormData, requiredByDate: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                        required
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Urgency Priority</label>
                                    <select
                                        value={reqFormData.urgency}
                                        onChange={(e) => setReqFormData({ ...reqFormData, urgency: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                    >
                                        <option value='Low'>Low Priority</option>
                                        <option value='Medium'>Medium Priority</option>
                                        <option value='High'>High Priority (Immediate)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Purpose / Subject</label>
                                    <input
                                        type='text'
                                        placeholder='e.g., Mid-term examination answer sheets'
                                        value={reqFormData.purpose}
                                        onChange={(e) => setReqFormData({ ...reqFormData, purpose: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                        required
                                    />
                                </div>
                            </div>

                            {/* Item Selector with Stock vs New Product Toggle */}
                            <div>
                                <div className='flex items-center justify-between mb-2'>
                                    <label className='font-semibold text-slate-700'>Material Items</label>
                                    <div className='flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-medium'>
                                        <button
                                            type='button'
                                            onClick={() => setRequisitionMode('STOCK')}
                                            className={`px-2.5 py-1 rounded-md transition ${requisitionMode === 'STOCK' ? 'bg-white text-blue-700 font-bold shadow-2xs' : 'text-slate-600'}`}
                                        >
                                            Select from Store Stock
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => setRequisitionMode('NEW_PRODUCT')}
                                            className={`px-2.5 py-1 rounded-md transition ${requisitionMode === 'NEW_PRODUCT' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600'}`}
                                        >
                                            + Request New Product
                                        </button>
                                    </div>
                                </div>

                                {requisitionMode === 'NEW_PRODUCT' ? (
                                    <div className='p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2 mb-3'>
                                        <div className='text-[11px] font-bold text-indigo-900'>New / Unlisted Product Details</div>
                                        <div className='grid grid-cols-2 gap-2'>
                                            <div>
                                                <label className='text-[10px] font-semibold text-slate-600'>Product Name *</label>
                                                <input
                                                    type='text'
                                                    placeholder='e.g. Digital Thermometer / Drawing Paper'
                                                    value={customItemForm.itemName}
                                                    onChange={(e) => setCustomItemForm({ ...customItemForm, itemName: e.target.value })}
                                                    className='w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white'
                                                />
                                            </div>
                                            <div>
                                                <label className='text-[10px] font-semibold text-slate-600'>Category</label>
                                                <select
                                                    value={customItemForm.category}
                                                    onChange={(e) => setCustomItemForm({ ...customItemForm, category: e.target.value })}
                                                    className='w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white'
                                                >
                                                    <option value='Stationery & Printing'>Stationery & Printing</option>
                                                    <option value='Science Laboratory'>Science Laboratory</option>
                                                    <option value='IT & Electronics'>IT & Electronics</option>
                                                    <option value='Sports & Physical Education'>Sports & Physical Education</option>
                                                    <option value='Housekeeping & Sanitation'>Housekeeping & Sanitation</option>
                                                    <option value='Other Department Supplies'>Other Department Supplies</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className='grid grid-cols-3 gap-2'>
                                            <div>
                                                <label className='text-[10px] font-semibold text-slate-600'>Quantity</label>
                                                <input
                                                    type='number'
                                                    min={1}
                                                    value={customItemForm.requestedQuantity}
                                                    onChange={(e) => setCustomItemForm({ ...customItemForm, requestedQuantity: Number(e.target.value) || 1 })}
                                                    className='w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white'
                                                />
                                            </div>
                                            <div>
                                                <label className='text-[10px] font-semibold text-slate-600'>Unit (UOM)</label>
                                                <select
                                                    value={customItemForm.unit}
                                                    onChange={(e) => setCustomItemForm({ ...customItemForm, unit: e.target.value })}
                                                    className='w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white'
                                                >
                                                    <option value='Pieces'>Pieces</option>
                                                    <option value='Boxes'>Boxes</option>
                                                    <option value='Packs'>Packs</option>
                                                    <option value='Reams'>Reams</option>
                                                    <option value='Sets'>Sets</option>
                                                </select>
                                            </div>
                                            <div className='flex items-end'>
                                                <button
                                                    type='button'
                                                    onClick={() => {
                                                        if (!customItemForm.itemName.trim()) {
                                                            alert('Please enter a product name');
                                                            return;
                                                        }
                                                        setReqFormData((prev) => ({
                                                            ...prev,
                                                            selectedItems: [
                                                                ...prev.selectedItems,
                                                                {
                                                                    itemCode: `NEW-${Date.now().toString().slice(-4)}`,
                                                                    itemName: customItemForm.itemName,
                                                                    requestedQuantity: Number(customItemForm.requestedQuantity) || 1,
                                                                    unit: customItemForm.unit,
                                                                    isCustomItem: true,
                                                                    category: customItemForm.category
                                                                }
                                                            ]
                                                        }));
                                                        setCustomItemForm({
                                                            itemName: '',
                                                            category: 'Stationery & Printing',
                                                            requestedQuantity: 1,
                                                            unit: 'Pieces',
                                                            specifications: '',
                                                            purpose: ''
                                                        });
                                                    }}
                                                    className='w-full rounded-lg bg-indigo-600 px-3 py-1.5 font-bold text-white hover:bg-indigo-700 text-xs shadow-2xs'
                                                >
                                                    + Add to List
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                                <div className='flex gap-2'>
                                    <select
                                        id='requisitionItemSelect'
                                        className='flex-1 rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                    >
                                        {catalog.map((i) => (
                                            <option key={i.itemCode} value={i.itemCode}>
                                                {i.name} ({i.itemCode}) - In Stock: {i.currentStock} {i.unit}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        id='requisitionItemQty'
                                        type='number'
                                        defaultValue={5}
                                        min={1}
                                        className='w-20 rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                    />
                                    <button
                                        type='button'
                                        onClick={() => {
                                            const select = document.getElementById('requisitionItemSelect')
                                            const qtyInput = document.getElementById('requisitionItemQty')
                                            const code = select.value
                                            const qty = Number(qtyInput.value) || 1
                                            const p = catalog.find((c) => c.itemCode === code)
                                            if (p) {
                                                setReqFormData((prev) => ({
                                                    ...prev,
                                                    selectedItems: [
                                                        ...prev.selectedItems.filter((x) => x.itemCode !== code),
                                                        { itemCode: code, itemName: p.name, requestedQuantity: qty, unit: p.unit }
                                                    ]
                                                }))
                                            }
                                        }}
                                        className='rounded-xl bg-slate-100 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-200'
                                    >
                                        Add
                                    </button>
                                </div>

                                {reqFormData.selectedItems.length > 0 && (
                                    <div className='mt-3 space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-2'>
                                        {reqFormData.selectedItems.map((it) => (
                                            <div key={it.itemCode} className='flex items-center justify-between text-[11px]'>
                                                <span className='font-medium text-slate-800'>{it.itemName} ({it.itemCode})</span>
                                                <div className='flex items-center gap-2'>
                                                    <span className='font-bold text-slate-900'>{it.requestedQuantity} {it.unit}</span>
                                                    <button
                                                        type='button'
                                                        onClick={() => {
                                                            setReqFormData((prev) => ({
                                                                ...prev,
                                                                selectedItems: prev.selectedItems.filter((x) => x.itemCode !== it.itemCode)
                                                            }))
                                                        }}
                                                        className='text-rose-500 hover:text-rose-700'
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsRequisitionModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700'
                                >
                                    Submit Requisition
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: ISSUE STOCK & GATE PASS DISPATCH                                   */}
            {/* ========================================================================= */}
            {isIssueModalOpen && selectedReqForIssue && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900'>Issue Material from Stores</h3>
                            <button onClick={() => setIsIssueModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleIssueStockSubmit} className='space-y-4 text-xs'>
                            <div className='p-3 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1'>
                                <div className='font-bold text-blue-900'>Requisition {selectedReqForIssue.id}</div>
                                <div className='text-slate-600'>Beneficiary: {selectedReqForIssue.requestingEmployeeName} ({selectedReqForIssue.department})</div>
                                <div className='text-slate-600 font-medium'>
                                    Items: {selectedReqForIssue.items.map((i) => `${i.itemName} (${i.requestedQuantity})`).join(', ')}
                                </div>
                            </div>

                            <div className='rounded-xl border border-slate-200 p-3 space-y-2'>
                                <label className='flex items-center gap-2 font-semibold text-slate-800 cursor-pointer'>
                                    <input
                                        type='checkbox'
                                        checked={issueFormData.isReturnable}
                                        onChange={(e) => setIssueFormData({ ...issueFormData, isReturnable: e.target.checked })}
                                        className='rounded text-blue-600 focus:ring-blue-500'
                                    />
                                    <span>Material is Returnable (e.g. Projector, Lab Apparatus)</span>
                                </label>
                                {issueFormData.isReturnable && (
                                    <div className='pt-2'>
                                        <label className='font-semibold text-slate-700 block mb-1'>Expected Return Date</label>
                                        <input
                                            type='date'
                                            value={issueFormData.expectedReturnDate}
                                            onChange={(e) => setIssueFormData({ ...issueFormData, expectedReturnDate: e.target.value })}
                                            className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                            required
                                        />
                                        <p className='text-[10px] text-amber-700 mt-1'>
                                            * An automated Returnable Gate Pass will be generated for security post exit verification.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Store Keeper Remarks</label>
                                <textarea
                                    rows={2}
                                    placeholder='Voucher notes or serial numbers...'
                                    value={issueFormData.remarks}
                                    onChange={(e) => setIssueFormData({ ...issueFormData, remarks: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsIssueModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700'
                                >
                                    Confirm Issue & Decrement Inventory
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: PO BUILDER WITH TAX & GST MATH                                     */}
            {/* ========================================================================= */}
            {isPOModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900'>Enterprise Purchase Order (PO) Builder</h3>
                            <button onClick={() => setIsPOModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePOSubmit} className='space-y-4 text-xs'>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Select Approved Vendor</label>
                                    <select
                                        value={poFormData.vendorId}
                                        onChange={(e) => setPOFormData({ ...poFormData, vendorId: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                    >
                                        {vendors.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} ({v.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Delivery Due Date</label>
                                    <input
                                        type='date'
                                        value={poFormData.deliveryDueDate}
                                        onChange={(e) => setPOFormData({ ...poFormData, deliveryDueDate: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                        required
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Payment Terms</label>
                                    <input
                                        type='text'
                                        value={poFormData.paymentTerms}
                                        onChange={(e) => setPOFormData({ ...poFormData, paymentTerms: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Special Discount (₹)</label>
                                    <input
                                        type='number'
                                        value={poFormData.discountAmount}
                                        onChange={(e) => setPOFormData({ ...poFormData, discountAmount: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>PO Line Items</label>
                                <div className='rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-2'>
                                    {poFormData.lineItems.map((li, idx) => (
                                        <div key={idx} className='grid grid-cols-12 gap-2 items-center text-xs'>
                                            <div className='col-span-5 font-medium text-slate-900'>{li.itemName}</div>
                                            <div className='col-span-2'>
                                                <input
                                                    type='number'
                                                    value={li.orderedQuantity}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value) || 1
                                                        const copy = [...poFormData.lineItems]
                                                        copy[idx].orderedQuantity = val
                                                        setPOFormData({ ...poFormData, lineItems: copy })
                                                    }}
                                                    className='w-full rounded-lg border border-slate-200 p-1 bg-white'
                                                />
                                            </div>
                                            <div className='col-span-2 font-mono text-slate-700'>₹{li.unitPrice}</div>
                                            <div className='col-span-2'>
                                                <select
                                                    value={li.gstPercentage}
                                                    onChange={(e) => {
                                                        const copy = [...poFormData.lineItems]
                                                        copy[idx].gstPercentage = Number(e.target.value)
                                                        setPOFormData({ ...poFormData, lineItems: copy })
                                                    }}
                                                    className='w-full rounded-lg border border-slate-200 p-1 bg-white'
                                                >
                                                    <option value={5}>5% GST</option>
                                                    <option value={12}>12% GST</option>
                                                    <option value={18}>18% GST</option>
                                                    <option value={28}>28% GST</option>
                                                </select>
                                            </div>
                                            <div className='col-span-1 text-right'>
                                                <button
                                                    type='button'
                                                    onClick={() => {
                                                        setPOFormData({
                                                            ...poFormData,
                                                            lineItems: poFormData.lineItems.filter((_, i) => i !== idx)
                                                        })
                                                    }}
                                                    className='text-rose-500 hover:text-rose-700'
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className='pt-2 border-t border-slate-200 flex gap-2'>
                                        <select id='addPoItemCode' className='flex-1 rounded-lg border border-slate-200 p-1.5 bg-white'>
                                            {catalog.map((c) => (
                                                <option key={c.itemCode} value={c.itemCode}>
                                                    {c.name} (₹{c.unitPrice})
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type='button'
                                            onClick={() => {
                                                const select = document.getElementById('addPoItemCode')
                                                const p = catalog.find((c) => c.itemCode === select.value)
                                                if (p) {
                                                    setPOFormData((prev) => ({
                                                        ...prev,
                                                        lineItems: [
                                                            ...prev.lineItems,
                                                            {
                                                                itemCode: p.itemCode,
                                                                itemName: p.name,
                                                                orderedQuantity: p.reorderQuantity || 10,
                                                                unitPrice: p.unitPrice,
                                                                gstPercentage: 18
                                                            }
                                                        ]
                                                    }))
                                                }
                                            }}
                                            className='rounded-lg bg-blue-50 px-3 py-1 font-semibold text-blue-700 hover:bg-blue-100'
                                        >
                                            + Add Item
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsPOModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700'
                                >
                                    Generate & Forward for Approval
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: GOODS RECEIPT NOTE (GRN)                                           */}
            {/* ========================================================================= */}
            {isGRNModalOpen && selectedPOForGRN && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900'>Process Goods Receipt Note (GRN)</h3>
                            <button onClick={() => setIsGRNModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleGRNSubmit} className='space-y-4 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2'>
                                <div className='flex items-center justify-between gap-2 flex-wrap'>
                                    <label className='font-bold text-slate-900'>Select Purchase Order to Receive:</label>
                                    <span className='text-slate-500'>Grand Total: ₹{(selectedPOForGRN.grandTotal || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <select
                                    value={selectedPOForGRN.id || selectedPOForGRN.poNumber}
                                    onChange={(e) => {
                                        const found = purchaseOrders.find((p) => (p.id || p.poNumber) === e.target.value)
                                        if (found) openGRNModalForPO(found)
                                    }}
                                    className='w-full rounded-xl border border-slate-200 p-2 font-semibold text-slate-800 bg-white'
                                >
                                    {purchaseOrders.map((p) => {
                                        const pId = p.id || p.poNumber
                                        const vName = p.vendor?.name || p.vendorName || 'Vendor'
                                        return (
                                            <option key={pId} value={pId}>
                                                {pId} — {vName} ({p.status})
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Vendor Invoice No.</label>
                                    <input
                                        type='text'
                                        value={grnFormData.invoiceNumber}
                                        onChange={(e) => setGRNFormData({ ...grnFormData, invoiceNumber: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Delivery Challan No.</label>
                                    <input
                                        type='text'
                                        value={grnFormData.deliveryChallanNumber}
                                        onChange={(e) => setGRNFormData({ ...grnFormData, deliveryChallanNumber: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                        required
                                    />
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <label className='font-semibold text-slate-700 block'>Inspection & Intake Verification</label>
                                {grnFormData.receivedItems.map((it, idx) => (
                                    <div key={idx} className='p-3 rounded-xl border border-slate-200 bg-white space-y-2'>
                                        <div className='flex items-center justify-between font-semibold text-slate-900'>
                                            <span>{it.itemName}</span>
                                            <span>Ordered: {it.orderedQuantity}</span>
                                        </div>
                                        <div className='grid grid-cols-3 gap-2'>
                                            <div>
                                                <label className='text-[10px] text-slate-500 block'>Accepted Qty</label>
                                                <input
                                                    type='number'
                                                    value={it.acceptedQuantity}
                                                    onChange={(e) => {
                                                        const copy = [...grnFormData.receivedItems]
                                                        copy[idx].acceptedQuantity = Number(e.target.value) || 0
                                                        setGRNFormData({ ...grnFormData, receivedItems: copy })
                                                    }}
                                                    className='w-full rounded-lg border border-slate-200 p-1 text-emerald-700 font-bold'
                                                />
                                            </div>
                                            <div>
                                                <label className='text-[10px] text-slate-500 block'>Damaged Qty</label>
                                                <input
                                                    type='number'
                                                    value={it.damagedQuantity}
                                                    onChange={(e) => {
                                                        const copy = [...grnFormData.receivedItems]
                                                        copy[idx].damagedQuantity = Number(e.target.value) || 0
                                                        setGRNFormData({ ...grnFormData, receivedItems: copy })
                                                    }}
                                                    className='w-full rounded-lg border border-slate-200 p-1 text-rose-600 font-bold'
                                                />
                                            </div>
                                            <div>
                                                <label className='text-[10px] text-slate-500 block'>Putaway Bin</label>
                                                <input
                                                    type='text'
                                                    value={it.storageLocation}
                                                    onChange={(e) => {
                                                        const copy = [...grnFormData.receivedItems]
                                                        copy[idx].storageLocation = e.target.value
                                                        setGRNFormData({ ...grnFormData, receivedItems: copy })
                                                    }}
                                                    className='w-full rounded-lg border border-slate-200 p-1 text-slate-700'
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsGRNModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700'
                                >
                                    Complete GRN & Auto-Increment Inventory
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: VIEW PO DETAILS                                                    */}
            {/* ========================================================================= */}
            {viewPODetail && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div>
                                <h3 className='text-base font-bold text-slate-900'>PO: {viewPODetail.poNumber}</h3>
                                <p className='text-xs text-slate-500'>{viewPODetail.vendorName} • {viewPODetail.poDate}</p>
                            </div>
                            <button onClick={() => setViewPODetail(null)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <div className='space-y-3 text-xs'>
                            <div className='grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 text-slate-700'>
                                <div><b>Created By:</b> {viewPODetail.createdByEmployeeName}</div>
                                <div><b>Status:</b> {viewPODetail.status}</div>
                                <div><b>Payment Terms:</b> {viewPODetail.paymentTerms}</div>
                                <div><b>Delivery Due:</b> {viewPODetail.deliveryDueDate}</div>
                            </div>

                            <div className='space-y-1.5'>
                                <div className='font-bold text-slate-800'>Line Items Breakdown</div>
                                {viewPODetail.items.map((i, idx) => (
                                    <div key={idx} className='flex items-center justify-between border-b border-slate-100 pb-1'>
                                        <div>
                                            <div className='font-semibold text-slate-900'>{i.itemName}</div>
                                            <div className='text-[11px] text-slate-500'>{i.orderedQuantity} × ₹{i.unitPrice} (+{i.gstPercentage}% GST)</div>
                                        </div>
                                        <div className='font-mono font-bold text-slate-900'>₹{i.totalPrice.toLocaleString('en-IN')}</div>
                                    </div>
                                ))}
                            </div>

                            <div className='p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-950 font-bold flex items-center justify-between'>
                                <span>Grand Total Payable:</span>
                                <span className='text-base'>₹{viewPODetail.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className='flex justify-end pt-2 border-t border-slate-100'>
                            <button
                                onClick={() => setViewPODetail(null)}
                                className='rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: ADD VENDOR                                                         */}
            {/* ========================================================================= */}
            {isAddVendorModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900'>Register New Supplier</h3>
                            <button onClick={() => setIsAddVendorModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddVendorSubmit} className='space-y-3 text-xs'>
                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Vendor Company Name</label>
                                <input
                                    type='text'
                                    value={vendorFormData.name}
                                    onChange={(e) => setVendorFormData({ ...vendorFormData, name: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                    required
                                />
                            </div>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Contact Person</label>
                                    <input
                                        type='text'
                                        value={vendorFormData.contactPerson}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, contactPerson: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Phone</label>
                                    <input
                                        type='text'
                                        value={vendorFormData.phone}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                        required
                                    />
                                </div>
                            </div>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Email</label>
                                    <input
                                        type='email'
                                        value={vendorFormData.email}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, email: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>GSTIN</label>
                                    <input
                                        type='text'
                                        value={vendorFormData.gstin}
                                        onChange={(e) => setVendorFormData({ ...vendorFormData, gstin: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                    />
                                </div>
                            </div>
                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Category</label>
                                <select
                                    value={vendorFormData.category}
                                    onChange={(e) => setVendorFormData({ ...vendorFormData, category: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2 focus:border-blue-500 focus:outline-hidden'
                                >
                                    <option value='Stationery & Printing'>Stationery & Printing</option>
                                    <option value='IT & Electronics'>IT & Electronics</option>
                                    <option value='Science Laboratory'>Science Laboratory</option>
                                    <option value='Housekeeping & Sanitation'>Housekeeping & Sanitation</option>
                                    <option value='Sports & Physical Education'>Sports & Physical Education</option>
                                </select>
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsAddVendorModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700'
                                >
                                    Save Supplier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: MARK READY TO COLLECT & DISPATCH ANNOUNCEMENT                       */}
            {/* ========================================================================= */}
            {isReadyModalOpen && selectedReqForReady && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div className='flex items-center gap-2'>
                                <div className='p-2 bg-emerald-50 text-emerald-600 rounded-lg'>
                                    <Package size={18} />
                                </div>
                                <div>
                                    <h3 className='text-base font-bold text-slate-900'>Mark Ready for Collection</h3>
                                    <p className='text-xs text-slate-500'>Notifies employee via announcement to collect items</p>
                                </div>
                            </div>
                            <button onClick={() => setIsReadyModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleMarkReadySubmit} className='space-y-3.5 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5'>
                                <div className='flex items-center justify-between'>
                                    <span className='font-mono font-bold text-slate-900'>{selectedReqForReady.id}</span>
                                    <span className='font-semibold text-blue-700'>{selectedReqForReady.department}</span>
                                </div>
                                <div className='text-slate-700'>
                                    Requester: <b>{selectedReqForReady.requestingEmployeeName}</b>
                                </div>
                                <div className='text-[11px] text-slate-500 pt-1'>
                                    Items: {selectedReqForReady.items.map(i => `${i.requestedQuantity || 1}x ${i.itemName}`).join(', ')}
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Stores Pickup Desk Location</label>
                                <input
                                    type='text'
                                    value={readyPickupLocation}
                                    onChange={(e) => setReadyPickupLocation(e.target.value)}
                                    className='w-full rounded-xl border border-slate-200 p-2 font-medium text-slate-800'
                                    placeholder='e.g. Central Academic Stores Desk #1'
                                    required
                                />
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Store Officer Notes / Remarks</label>
                                <textarea
                                    rows={2}
                                    value={readyRemarks}
                                    onChange={(e) => setReadyRemarks(e.target.value)}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                />
                            </div>

                            <div className='p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-2'>
                                <CheckCircle2 size={16} className='text-emerald-600 shrink-0 mt-0.5' />
                                <span>
                                    Marking ready automatically posts a notice to the school <b>Announcement</b> board under <i>Stores & Material Collection</i> so the requester knows to collect.
                                </span>
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsReadyModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 shadow-2xs'
                                >
                                    Confirm & Dispatch Notice 📦
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: AUDIT QUANTITIES RECONCILIATION (GIVE / RECEIVE)                   */}
            {/* ========================================================================= */}
            {isAuditModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <div>
                                <h3 className='text-base font-bold text-slate-900'>
                                    {auditModalMode === 'RECEIVE' ? 'Receive Audit Quantities into Stock' : 'Record Quantities Given to Audit'}
                                </h3>
                                <p className='text-xs text-slate-500'>
                                    {auditModalMode === 'RECEIVE'
                                        ? 'Adjust stock upwards upon completion of audit sample verification'
                                        : 'Deduct and log stock issued for physical verification testing'}
                                </p>
                            </div>
                            <button onClick={() => setIsAuditModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitAuditModal} className='space-y-4 text-xs'>
                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Catalog Item</label>
                                <select
                                    value={auditFormData.itemCode}
                                    onChange={(e) => setAuditFormData({ ...auditFormData, itemCode: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2.5 font-medium'
                                >
                                    {catalog.map((prod) => (
                                        <option key={prod.itemCode} value={prod.itemCode}>
                                            {prod.itemName} (Available: {prod.currentStock} {prod.uom})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Quantity ({auditModalMode === 'RECEIVE' ? 'Receiving' : 'Given'})</label>
                                    <input
                                        type='number'
                                        min='1'
                                        value={auditFormData.quantity}
                                        onChange={(e) => setAuditFormData({ ...auditFormData, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                                        className='w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Audit Reference #</label>
                                    <input
                                        type='text'
                                        value={auditFormData.auditRef}
                                        onChange={(e) => setAuditFormData({ ...auditFormData, auditRef: e.target.value })}
                                        className='w-full rounded-xl border border-slate-200 p-2.5 font-mono'
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Reconciliation Remarks & Inspection Notes</label>
                                <textarea
                                    rows={3}
                                    value={auditFormData.remarks}
                                    onChange={(e) => setAuditFormData({ ...auditFormData, remarks: e.target.value })}
                                    className='w-full rounded-xl border border-slate-200 p-2.5'
                                    placeholder='Enter details of verification, batch tested, or condition of returned goods...'
                                    required
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsAuditModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className={`rounded-xl px-4 py-2 font-semibold text-white shadow-xs ${
                                        auditModalMode === 'RECEIVE'
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {auditModalMode === 'RECEIVE' ? 'Post Receiving & Replenish Stock' : 'Confirm Issue to Audit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {isAdjustModalOpen && selectedItemForAdjust && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900 flex items-center gap-2'>
                                <Tag size={18} className='text-amber-600' />
                                Inventory Stock Adjustment
                            </h3>
                            <button type='button' onClick={() => setIsAdjustModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmStockAdjust} className='space-y-3.5 text-xs'>
                            <div className='p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1'>
                                <span className='font-bold text-slate-900 block text-sm'>{selectedItemForAdjust.name || selectedItemForAdjust.itemName}</span>
                                <span className='text-slate-500 font-mono'>SKU: {selectedItemForAdjust.itemCode} • Current Stock: {selectedItemForAdjust.currentStock || 0} {selectedItemForAdjust.unitOfMeasure || 'Units'}</span>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Adjustment Reason *</label>
                                <select
                                    value={adjustFormData.adjustmentType}
                                    onChange={(e) => setAdjustFormData(prev => ({ ...prev, adjustmentType: e.target.value }))}
                                    className='w-full rounded-xl border border-slate-200 p-2 font-medium text-slate-800'
                                >
                                    <option value='Physical Count Variance'>Physical Stock Take Count Variance</option>
                                    <option value='Damage / Expiry Write-Off'>Damaged Goods / Expiry Write-Off</option>
                                    <option value='Audit Baseline Correction'>Internal Audit Reconciliation Baseline</option>
                                </select>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Stock Direction *</label>
                                    <select
                                        value={adjustFormData.direction}
                                        onChange={(e) => setAdjustFormData(prev => ({ ...prev, direction: e.target.value }))}
                                        className='w-full rounded-xl border border-slate-200 p-2 font-bold text-indigo-700'
                                    >
                                        <option value='DECREASE'>DECREASE (-) Write-down</option>
                                        <option value='INCREASE'>INCREASE (+) Count Overage</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Adjustment Quantity *</label>
                                    <input
                                        type='number'
                                        min='1'
                                        required
                                        value={adjustFormData.quantity}
                                        onChange={(e) => setAdjustFormData(prev => ({ ...prev, quantity: e.target.value }))}
                                        className='w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-900'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Inspection & Verification Remarks *</label>
                                <textarea
                                    rows={2}
                                    required
                                    value={adjustFormData.remarks}
                                    onChange={(e) => setAdjustFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsAdjustModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl px-4 py-2 font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-xs cursor-pointer'
                                >
                                    Record Stock Movement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inter-Department Stock Transfer Modal */}
            {isTransferModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                        <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                            <h3 className='text-base font-bold text-slate-900 flex items-center gap-2'>
                                <Truck size={18} className='text-purple-600' />
                                Inter-Department Stock Transfer
                            </h3>
                            <button type='button' onClick={() => setIsTransferModalOpen(false)} className='text-slate-400 hover:text-slate-600'>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmTransfer} className='space-y-3.5 text-xs'>
                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Select Stock Item *</label>
                                <select
                                    required
                                    value={transferFormData.itemCode}
                                    onChange={(e) => setTransferFormData(prev => ({ ...prev, itemCode: e.target.value }))}
                                    className='w-full rounded-xl border border-slate-200 p-2 font-medium text-slate-800'
                                >
                                    <option value=''>-- Choose SKU --</option>
                                    {catalog.map((i) => (
                                        <option key={i.itemCode} value={i.itemCode}>
                                            {i.name || i.itemName} ({i.itemCode}) • Avail: {i.currentStock || 0}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Target Department *</label>
                                    <select
                                        value={transferFormData.targetDepartment}
                                        onChange={(e) => setTransferFormData(prev => ({ ...prev, targetDepartment: e.target.value }))}
                                        className='w-full rounded-xl border border-slate-200 p-2 font-medium text-slate-800'
                                    >
                                        <option value='Science Laboratory'>Science Laboratory</option>
                                        <option value='Computer Science Lab'>Computer Science Lab</option>
                                        <option value='Sports Pavilion'>Sports Pavilion</option>
                                        <option value='Administrative Office'>Administrative Office</option>
                                        <option value='Library Depot'>Library Depot</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='font-semibold text-slate-700 mb-1 block'>Transfer Quantity *</label>
                                    <input
                                        type='number'
                                        min='1'
                                        required
                                        value={transferFormData.quantity}
                                        onChange={(e) => setTransferFormData(prev => ({ ...prev, quantity: e.target.value }))}
                                        className='w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-900'
                                    />
                                </div>
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Department Custodian / Recipient Name *</label>
                                <input
                                    type='text'
                                    required
                                    value={transferFormData.recipientName}
                                    onChange={(e) => setTransferFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                />
                            </div>

                            <div>
                                <label className='font-semibold text-slate-700 mb-1 block'>Transfer Purpose & Remarks</label>
                                <textarea
                                    rows={2}
                                    value={transferFormData.remarks}
                                    onChange={(e) => setTransferFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                    className='w-full rounded-xl border border-slate-200 p-2'
                                />
                            </div>

                            <div className='flex justify-end gap-2 pt-2 border-t border-slate-100'>
                                <button
                                    type='button'
                                    onClick={() => setIsTransferModalOpen(false)}
                                    className='rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='rounded-xl px-4 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-xs cursor-pointer'
                                >
                                    Execute Transfer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

