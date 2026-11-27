import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import IssueReturnInfo from './Components/IssueReturnInfo'
import { getIssueReturns, hydrateIssueReturnsFromApi, saveIssueReturns } from './issueReturnsData'
import { getInventoryItems, hydrateInventoryItemsFromApi, saveInventoryItems } from '../Inventory/inventoryData'
import { canUseOpsApi, stationeryIssueReturnApi } from '../../../services/opsApi'

const deriveStatus = (qty, reorder) => {
    if (qty <= 0) return 'Out of Stock'
    if (Number.isFinite(reorder) && qty <= reorder) return 'Low Stock'
    return 'Available'
}

const formatDisplayDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
    }
    return date.toLocaleDateString('en-GB').replace(/\//g, '-')
}

const AddIssueReturn = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        activityType: 'Issue',
        employeeName: '',
        employeeId: '',
        department: '',
        remarks: '',
        purpose: '',
        originalIssueRef: '',
        condition: 'Good',
        returnable: false,
        expectedReturnDate: '',
        requestId: '',
        materialGatePassId: '',
        issueDate: new Date(),
        returnDate: new Date(),
        lines: [{ itemName: '', quantity: '', availableStock: '—' }],
    })
    const [saving, setSaving] = useState(false)

    const saveOffline = async (activityType, lines) => {
        await Promise.all([hydrateIssueReturnsFromApi(), hydrateInventoryItemsFromApi()])
        let inventory = getInventoryItems()

        for (const line of lines) {
            const qty = Number(line.quantity)
            const item = inventory.find((row) => row.itemName === line.itemName)
            if (!item) {
                toast.error(`Item not found in inventory: ${line.itemName}`)
                return false
            }
            const available = Number(item.availableQuantity) || 0
            let nextQty = available
            const outbound = activityType === 'Issue' || activityType === 'Given'
            if (outbound) {
                if (qty > available) {
                    toast.error(`Cannot issue ${qty} of ${line.itemName}. Only ${available} available. Raise a purchase instead.`)
                    return false
                }
                nextQty = available - qty
            } else if (form.condition !== 'Lost' && form.condition !== 'Damaged') {
                nextQty = available + qty
            }
            const unit = Number(String(item.unitCost || '').replace(/[^\d.]/g, '')) || 0
            inventory = inventory.map((row) => (
                row.itemId === item.itemId
                    ? {
                        ...row,
                        availableQuantity: nextQty,
                        status: deriveStatus(nextQty, Number(row.reorderLevel)),
                        stockValue: `₹${(nextQty * unit).toLocaleString('en-IN')}`,
                    }
                    : row
            ))
        }

        const inventorySaved = await saveInventoryItems(inventory)
        if (inventorySaved === false || inventorySaved?.success === false) {
            toast.error(inventorySaved?.message || 'Could not update inventory quantity.')
            return false
        }

        const batchId = `IR-${Date.now()}`
        const records = lines.map((line, index) => {
            const item = inventory.find((row) => row.itemName === line.itemName)
            return {
                id: lines.length === 1 ? batchId : `${batchId}-${index + 1}`,
                batchId,
                activityType,
                requestedBy: form.employeeName,
                employeeId: form.employeeId,
                department: form.department,
                itemName: line.itemName,
                quantity: Number(line.quantity),
                remarks: form.remarks,
                purpose: form.purpose,
                status: activityType === 'Return' ? 'Returned' : activityType === 'Receiving' ? 'Received' : 'Issued',
                issueDate: (activityType === 'Issue' || activityType === 'Given') ? formatDisplayDate(form.issueDate) : '—',
                returnDate: (activityType === 'Return' || activityType === 'Receiving') ? formatDisplayDate(form.returnDate) : '—',
                availableStock: item?.availableQuantity ?? null,
                originalIssueRef: activityType === 'Return' ? form.originalIssueRef : null,
                condition: (activityType === 'Return' || activityType === 'Receiving') ? (form.condition || 'Good') : null,
                returnable: Boolean(form.returnable),
                expectedReturnDate: form.expectedReturnDate || '',
                requestId: form.requestId || null,
                materialGatePassId: form.materialGatePassId || null,
            }
        })

        const saved = await saveIssueReturns([...records, ...getIssueReturns()])
        if (!saved) {
            toast.error('The stock movement could not be saved.')
            return false
        }
        return true
    }

    const save = async () => {
        const activityType = form.activityType || 'Issue'
        const lines = (form.lines || []).filter((row) => row.itemName && Number(row.quantity) > 0)
        if (!form.employeeName || !form.department || !lines.length) {
            toast.error('Employee, department, and at least one product with quantity are required.')
            return
        }
        if (activityType === 'Return' && !form.originalIssueRef) {
            toast.error('Original Issue Reference is required for returns.')
            return
        }
        // Receiving (inbound / audit quantities) does not need an original issue reference.

        setSaving(true)
        try {
            if (canUseOpsApi()) {
                const clientRequestId = `IR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
                const result = await stationeryIssueReturnApi({
                    activityType,
                    clientRequestId,
                    requestedBy: form.employeeName,
                    employeeId: form.employeeId,
                    department: form.department,
                    remarks: form.remarks,
                    purpose: form.purpose,
                    originalIssueRef: form.originalIssueRef,
                    condition: form.condition,
                    returnable: Boolean(form.returnable),
                    expectedReturnDate: form.expectedReturnDate || '',
                    requestId: form.requestId || undefined,
                    materialGatePassId: form.materialGatePassId || undefined,
                    issueDate: activityType === 'Issue' ? formatDisplayDate(form.issueDate) : undefined,
                    returnDate: activityType === 'Return' ? formatDisplayDate(form.returnDate) : undefined,
                    lines: lines.map((line) => ({
                        itemName: line.itemName,
                        quantity: Number(line.quantity),
                    })),
                })
                if (!result?.success) {
                    toast.error(result?.message || 'Could not record issue/return.')
                    return
                }
                await Promise.all([hydrateIssueReturnsFromApi(), hydrateInventoryItemsFromApi()])
                toast.success(
                    activityType === 'Issue'
                        ? `Issued ${lines.length} product line(s). Inventory updated.`
                        : `Return recorded for ${lines.length} product line(s). Inventory updated.`,
                )
                navigate('/stationery-store-manager/issue-returns')
                return
            }

            const ok = await saveOffline(activityType, lines)
            if (!ok) return
            toast.success(
                activityType === 'Issue'
                    ? `Issued ${lines.length} product line(s). Inventory updated.`
                    : `Return recorded for ${lines.length} product line(s). Inventory updated.`,
            )
            navigate('/stationery-store-manager/issue-returns')
        } catch (err) {
            toast.error(err?.message || 'Could not record issue/return.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Record Issue / Return</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Add multiple products in one transaction. Issue deducts stock; Good returns restore stock.
                    Live API mode uses the server stock ledger (no client-only deductions).
                </p>
                <IssueReturnInfo value={form} onChange={setForm} />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button type='button' onClick={() => navigate('/stationery-store-manager/issue-returns')} className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Discard Changes
                </button>
                <button type='button' disabled={saving} onClick={save} className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'>
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>
        </section>
    )
}

export default AddIssueReturn
