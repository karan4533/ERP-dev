import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AssetInfo from './Components/AssetInfo'
import AssetModal from './Components/AssetModal'
import { addAsset } from './assetData'

const AddAsset = () => {
    const navigate = useNavigate()
    const [assetModal, setAssetModal] = useState(false)

    const handleSave = (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const assetName = String(data.get('assetName') || '').trim()
        const category = String(data.get('category') || '')
        if (!assetName || !category) return
        addAsset({
            assetName,
            category,
            brand: String(data.get('brand') || ''),
            model: String(data.get('model') || ''),
            serialNumber: String(data.get('serialNumber') || ''),
            assetTagNumber: String(data.get('assetTag') || ''),
            status: String(data.get('status') || 'Active'),
            vendorName: String(data.get('vendorName') || ''),
            purchaseCost: String(data.get('purchaseCost') || ''),
            invoiceNumber: String(data.get('invoiceNumber') || ''),
            department: '',
            custodian: '',
        })
        setAssetModal(true)
    }

    return (
        <form onSubmit={handleSave}>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <h2 className='text-xl font-semibold text-black'>Add Asset</h2>
                <AssetInfo />
            </div>

            <div className='flex sm:justify-end justify-center gap-x-4 mt-6'>
                <button type='button' onClick={() => navigate('/it-support-manager/asset-management')} className='bg-white text-[#515DEF] text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Discard Changes
                </button>
                <button type='submit' className='bg-[#515DEF] text-white text-sm text-center px-12 py-2 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer md:w-auto w-full'>
                    Save Changes
                </button>
            </div>

            <AssetModal assetModal={assetModal} setAssetModal={setAssetModal} />
        </form>
    )
}

export default AddAsset
