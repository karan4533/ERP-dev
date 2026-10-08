import React, { useEffect, useState } from 'react'
import { Check, Wallet, X } from 'lucide-react'
import { PAYMENT_GATEWAY_URL } from '../walletManagementData'

const fieldClass =
    'w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2.5 focus:outline-none focus:border-[#515DEF]'

const RechargeWalletModal = ({ isOpen, onClose, onOfflineRecharge }) => {
    const [email, setEmail] = useState('')
    const [amount, setAmount] = useState('')
    const [paymentMode, setPaymentMode] = useState('online')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        if (!isOpen) return undefined

        setEmail('')
        setAmount('')
        setPaymentMode('online')
        setError('')
        setSuccess('')

        return undefined
    }, [isOpen])

    if (!isOpen) return null

    const handleSubmit = (event) => {
        event.preventDefault()
        setError('')
        setSuccess('')

        const trimmedEmail = email.trim().toLowerCase()
        const rechargeAmount = Number(amount)

        if (!trimmedEmail) {
            setError('Please enter a user email ID.')
            return
        }

        if (!Number.isFinite(rechargeAmount) || rechargeAmount <= 0) {
            setError('Please enter a valid amount greater than zero.')
            return
        }

        if (paymentMode === 'online') {
            const gatewayUrl = `${PAYMENT_GATEWAY_URL}?email=${encodeURIComponent(trimmedEmail)}&amount=${rechargeAmount}`
            window.open(gatewayUrl, '_blank', 'noopener,noreferrer')
            onClose()
            return
        }

        const result = onOfflineRecharge({ email: trimmedEmail, amount: rechargeAmount })

        if (!result.success) {
            setError(result.message)
            return
        }

        setSuccess(result.message)
        setTimeout(() => {
            onClose()
        }, 1200)
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={onClose} aria-hidden='true' />

            <div className='relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl'>
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#F2F4F7]'>
                    <div className='flex items-center gap-2'>
                        <div className='p-2 rounded-xl bg-[#515DEF1A] text-[#515DEF]'>
                            <Wallet size={18} />
                        </div>
                        <h2 className='text-lg font-semibold text-[#1E1E1E]'>Recharge Wallet</h2>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='text-[#667085] hover:text-[#FF5722] transition-colors cursor-pointer'
                        aria-label='Close modal'
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className='px-6 py-5 space-y-4'>
                    <div className='flex flex-col gap-y-2'>
                        <label className='text-sm font-medium text-[#808080]'>User Email ID</label>
                        <input
                            type='email'
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder='e.g. arun.raj@student.school.com'
                            className={fieldClass}
                        />
                    </div>

                    <div className='flex flex-col gap-y-2'>
                        <label className='text-sm font-medium text-[#808080]'>Amount (₹)</label>
                        <input
                            type='number'
                            min='1'
                            step='1'
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            placeholder='Enter recharge amount'
                            className={fieldClass}
                        />
                    </div>

                    <div className='flex flex-col gap-y-2'>
                        <label className='text-sm font-medium text-[#808080]'>Mode of Payment</label>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                            <label className={`flex items-center gap-2 border rounded-md px-3 py-2.5 cursor-pointer transition-colors ${
                                paymentMode === 'online'
                                    ? 'border-[#515DEF] bg-[#515DEF0D]'
                                    : 'border-[#D9D9D9]'
                            }`}>
                                <input
                                    type='radio'
                                    name='paymentMode'
                                    value='online'
                                    checked={paymentMode === 'online'}
                                    onChange={() => setPaymentMode('online')}
                                    className='accent-[#515DEF]'
                                />
                                <span className='text-sm text-[#1E1E1E]'>Online</span>
                            </label>
                            <label className={`flex items-center gap-2 border rounded-md px-3 py-2.5 cursor-pointer transition-colors ${
                                paymentMode === 'offline'
                                    ? 'border-[#515DEF] bg-[#515DEF0D]'
                                    : 'border-[#D9D9D9]'
                            }`}>
                                <input
                                    type='radio'
                                    name='paymentMode'
                                    value='offline'
                                    checked={paymentMode === 'offline'}
                                    onChange={() => setPaymentMode('offline')}
                                    className='accent-[#515DEF]'
                                />
                                <span className='text-sm text-[#1E1E1E]'>Offline</span>
                            </label>
                        </div>
                        <p className='text-xs text-[#667085]'>
                            {paymentMode === 'online'
                                ? 'You will be redirected to the payment gateway to complete the recharge.'
                                : 'The amount will be added to the wallet immediately after confirmation.'}
                        </p>
                    </div>

                    {error && (
                        <p className='text-sm text-[#FF5722] bg-[#FF57221A] border border-[#FF572233] rounded-md px-3 py-2'>
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className='text-sm text-[#4CAF50] bg-[#4CAF501A] border border-[#4CAF5033] rounded-md px-3 py-2'>
                            {success}
                        </p>
                    )}

                    <div className='flex justify-end gap-3 pt-2 border-t border-[#F2F4F7]'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                        >
                            Cancel
                        </button>
                        <button
                            type='submit'
                            className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                        >
                            <Check size={16} />
                            {paymentMode === 'online' ? 'Proceed to Gateway' : 'Add Amount'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default RechargeWalletModal
