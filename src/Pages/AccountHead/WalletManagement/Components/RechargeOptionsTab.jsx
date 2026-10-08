import React from 'react'
import { Banknote, Check, CreditCard, Landmark, Plus, QrCode, X } from 'lucide-react'
import { methodStatusBadgeColor } from '../walletManagementData'
import { tdClass, thClass } from './WalletShared'
import { RECHARGE_METHODS } from '../walletManagementData'

const METHOD_ICONS = {
    qr: QrCode,
    card: CreditCard,
    bank: Landmark,
    cash: Banknote,
}

const RechargeOptionsTab = ({ onAddMethod }) => (
    <div className='space-y-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
                <h3 className='text-base font-semibold text-[#1E1E1E]'>Configured recharge options</h3>
                <p className='text-sm text-[#667085] mt-1'>
                    Payment modes & limits available to users for wallet top-ups
                </p>
            </div>
            <button
                type='button'
                onClick={onAddMethod}
                className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
            >
                <Plus size={16} />
                Add Recharge Method
            </button>
        </div>

        <div className='bg-white rounded-2xl shadow-md overflow-hidden p-4'>
            <table className='w-full text-sm text-left'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Method</th>
                        <th className={thClass}>Min. Amount</th>
                        <th className={thClass}>Max. Amount</th>
                        <th className={thClass}>Processing Fee</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} rounded-e-lg`}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {RECHARGE_METHODS.map((row) => {
                        const Icon = METHOD_ICONS[row.icon] ?? CreditCard
                        return (
                            <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${tdClass} rounded-s-lg`}>
                                    <div className='flex items-center gap-2 text-[#1E1E1E]'>
                                        <Icon size={16} className='text-[#667085]' />
                                        {row.method}
                                    </div>
                                </td>
                                <td className={tdClass}>{row.minAmount}</td>
                                <td className={tdClass}>{row.maxAmount}</td>
                                <td className={tdClass}>{row.processingFee}</td>
                                <td className={tdClass}>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${methodStatusBadgeColor[row.status]}`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className={`${tdClass} rounded-e-lg`}>
                                    <button type='button' className='text-sm font-medium text-[#515DEF] hover:underline cursor-pointer'>
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    </div>
)

export const AddRechargeMethodModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <h2 className='text-lg font-semibold text-[#1E1E1E]'>Add Recharge Method</h2>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer'
                        aria-label='Close modal'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='px-6 py-5 space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Method Name</label>
                            <input
                                type='text'
                                placeholder='e.g. Wallet App Top-up'
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Processing Fee (%)</label>
                            <input
                                type='number'
                                placeholder='0'
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
                        </div>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Min. Amount (₹)</label>
                            <input
                                type='number'
                                placeholder='0'
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <label className='text-sm font-medium text-[#808080]'>Max. Amount (₹)</label>
                            <input
                                type='number'
                                placeholder='0'
                                className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'
                            />
                        </div>
                    </div>
                </div>

                <div className='flex justify-end gap-3 px-6 py-4 border-t border-[#F2F4F7]'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                    >
                        <Check size={16} />
                        Save Method
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RechargeOptionsTab
