import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import RequestInfo from './Components/RequestInfo'
import RequestModal from './Components/RequestModal'
import { AUTO_FILLED, createStoreRequest } from './requestsData'

const read = (id) => String(document.getElementById(id)?.value ?? '').trim()

const newSubmissionKey = () =>
    (globalThis.crypto?.randomUUID?.() || `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`)

const AddRequest = () => {
    const navigate = useNavigate()
    const [requestModal, setRequestModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [submissionKey] = useState(newSubmissionKey)

    const save = async () => {
        const title = read('request-title') || read('title')
        const requestType = read('request-type') || 'Purchase'
        const estimatedAmount = read('estimated-amount') || read('amount') || '₹0'
        if (!title) {
            toast.error('Request title is required.')
            return
        }
        setSaving(true)
        try {
            const draft = {
                requestType,
                title,
                amount: estimatedAmount,
                vendor: read('vendor-name') || read('vendor') || '—',
                vendorContact: read('vendor-contact') || '—',
                submittedDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
                currentStage: 'JD Operations',
                priority: read('priority') || 'Medium',
                description: read('description') || title,
                budgetCategory: read('budget-category') || 'Consumables',
                estimatedAmount,
                requestedBy: AUTO_FILLED.requestedBy,
                department: AUTO_FILLED.department,
                sentTo: AUTO_FILLED.sentTo,
                poNumber: read('po-number') || '',
                lineItems: [{
                    item: read('item-name') || title,
                    quantity: Number(read('quantity') || 1),
                    estimatedCost: estimatedAmount,
                }],
                attachments: [],
            }
            const result = await createStoreRequest(draft, submissionKey)
            if (!result.success) {
                toast.error(result.message || 'Request could not be saved.')
                return
            }
            setRequestModal(true)
        } finally {
            setSaving(false)
        }
    }

    return (
        <section>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Request</h2>
                <p className='text-sm text-[#667085] mt-1'>
                    Choose Purchase or Restock (Stock Replenishment). Saved requests appear in Requests & Approvals with status tracking.
                </p>
                <RequestInfo />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button type='button' onClick={() => navigate('/stationery-store-manager/requests-approvals')} className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Discard Changes
                </button>
                <button type='button' disabled={saving} onClick={save} className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full disabled:opacity-60'>
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>

            <RequestModal requestModal={requestModal} setRequestModal={setRequestModal} />
        </section>
    )
}

export default AddRequest
