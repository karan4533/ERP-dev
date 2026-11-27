import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Loader2, ShieldCheck, X } from 'lucide-react'
import { formatCurrency } from '../../financeDomain/financeHelpers'
import { openRazorpayCheckout } from '../../../../services/razorpayCheckout'

/**
 * Real Razorpay Checkout: create intent → open Checkout → confirm.
 * Polls server sync while Checkout is open so Success that skips the JS handler
 * still posts the receipt and closes this overlay automatically.
 */
const RazorpayCheckoutModal = ({
    isOpen,
    onClose,
    amount,
    student,
    createIntent,
    confirmPayment,
    onPaid,
}) => {
    const [busy, setBusy] = useState(false)
    const [statusText, setStatusText] = useState('')
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)
    const startedRef = useRef(false)
    const intentRef = useRef(null)
    const doneRef = useRef(false)
    const pollRef = useRef(null)

    const clearPoll = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
    }

    const finishPaid = (result) => {
        if (doneRef.current) return
        doneRef.current = true
        clearPoll()
        toast.success(
            `Payment recorded${result?.receipt?.receiptNo ? `. Receipt ${result.receipt.receiptNo}` : ''}.`,
        )
        onPaid?.(result)
        onClose?.()
        // Hard refresh so fee cards / totals always match the ledger after Checkout.
        window.setTimeout(() => {
            window.location.reload()
        }, 400)
    }

    const trySync = async (intent, { quiet = false } = {}) => {
        if (!intent?.providerOrderId || doneRef.current) return null
        const synced = await confirmPayment({
            reference: intent.reference,
            linkId: intent.id,
            razorpay_order_id: intent.providerOrderId,
            syncFromProvider: true,
        })
        if (synced?.success) {
            finishPaid(synced)
            return synced
        }
        if (!quiet && synced?.errors?.[0]) {
            return synced
        }
        return synced
    }

    useEffect(() => {
        if (!isOpen) {
            startedRef.current = false
            doneRef.current = false
            clearPoll()
            setBusy(false)
            setStatusText('')
            setError('')
            setAttempt(0)
            intentRef.current = null
            return undefined
        }
        if (startedRef.current) return undefined
        startedRef.current = true
        doneRef.current = false

        let cancelled = false
        const run = async () => {
            setBusy(true)
            setError('')
            setStatusText('Creating payment order…')
            try {
                const intent = await createIntent()
                if (cancelled || doneRef.current) return
                intentRef.current = intent
                if (!intent?.providerOrderId || !intent?.razorpayKeyId) {
                    throw new Error(
                        intent?.message
                        || 'Payment order was not created. Check Razorpay keys on the server.',
                    )
                }

                setStatusText('Complete payment in the Razorpay window…')
                // While Checkout is open, keep asking Razorpay (via our API) if the order was paid.
                clearPoll()
                const probe = async () => {
                    if (cancelled || doneRef.current) return
                    const synced = await trySync(intent, { quiet: true }).catch(() => null)
                    if (synced?.success) {
                        setStatusText('Payment successful — reloading…')
                    }
                }
                pollRef.current = setInterval(probe, 2000)
                // First probe shortly after open (covers fast Success + dismiss).
                window.setTimeout(probe, 1200)

                let payment
                try {
                    payment = await openRazorpayCheckout({
                        key: intent.razorpayKeyId,
                        orderId: intent.providerOrderId,
                        amount: intent.amount ?? amount,
                        name: 'School Fee Payment',
                        description: intent.reference || 'Fee payment',
                        prefill: {
                            name: student?.name || '',
                            email: student?.email || student?.parentEmail || '',
                            contact: student?.mobile || student?.phone || student?.parentPhone || '',
                        },
                        notes: {
                            reference: String(intent.reference || ''),
                            studentId: String(student?.id || ''),
                        },
                    })
                } catch (checkoutErr) {
                    if (doneRef.current || cancelled) return
                    setStatusText('Confirming payment with Razorpay…')
                    const synced = await trySync(intent, { quiet: true })
                    if (synced?.success || doneRef.current) return
                    if (checkoutErr?.code === 'CHECKOUT_CLOSED' || /CHECKOUT_CLOSED/i.test(checkoutErr?.message || '')) {
                        // One more delayed attempt — capture can lag a second behind Success UI.
                        await new Promise((r) => setTimeout(r, 1200))
                        if (cancelled || doneRef.current) return
                        const again = await trySync(intent, { quiet: true })
                        if (again?.success || doneRef.current) return
                        throw new Error(
                            'If you already paid, wait a moment — we are confirming with Razorpay. Or close and reopen this page.',
                        )
                    }
                    throw checkoutErr
                }
                if (cancelled || doneRef.current) return

                setStatusText('Recording payment on school ledger…')
                const result = await confirmPayment({
                    reference: intent.reference,
                    linkId: intent.id,
                    razorpay_order_id: payment.razorpay_order_id,
                    razorpay_payment_id: payment.razorpay_payment_id,
                    razorpay_signature: payment.razorpay_signature,
                })
                if (cancelled || doneRef.current) return
                if (result?.success) {
                    finishPaid(result)
                    return
                }
                const synced = await trySync(intent, { quiet: true })
                if (synced?.success || doneRef.current) return
                throw new Error(result?.errors?.[0] || 'Payment could not be confirmed on the school ledger.')
            } catch (err) {
                if (cancelled || doneRef.current) return
                clearPoll()
                const message = err?.message || 'Payment failed.'
                setError(message)
                if (!/already paid|confirming with Razorpay/i.test(message)) {
                    toast.error(message)
                }
            } finally {
                if (!cancelled && !doneRef.current) {
                    setBusy(false)
                    setStatusText('')
                }
            }
        }
        run()
        return () => {
            cancelled = true
            clearPoll()
        }
    }, [amount, attempt, confirmPayment, createIntent, isOpen, onClose, onPaid, student])

    if (!isOpen) return null

    const retry = () => {
        clearPoll()
        startedRef.current = false
        doneRef.current = false
        setError('')
        setAttempt((n) => n + 1)
    }

    const syncOnly = async () => {
        const intent = intentRef.current
        if (!intent?.providerOrderId) {
            retry()
            return
        }
        setBusy(true)
        setError('')
        setStatusText('Syncing paid order from Razorpay…')
        try {
            const synced = await trySync(intent, { quiet: false })
            if (!synced?.success && !doneRef.current) {
                throw new Error(synced?.errors?.[0] || 'No captured payment found yet.')
            }
        } catch (err) {
            if (!doneRef.current) {
                setError(err?.message || 'Sync failed.')
                toast.error(err?.message || 'Sync failed.')
            }
        } finally {
            if (!doneRef.current) {
                setBusy(false)
                setStatusText('')
            }
        }
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div
                className='absolute inset-0 bg-black/40'
                onClick={() => {
                    if (busy) return
                    clearPoll()
                    onClose?.()
                }}
                aria-hidden='true'
            />
            <div className='relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden'>
                <div className='bg-[#515DEF] text-white px-6 py-8 text-center'>
                    <p className='text-xs tracking-wide opacity-80'>RAZORPAY CHECKOUT</p>
                    <p className='text-3xl font-semibold mt-2'>{formatCurrency(amount)}</p>
                    {student?.name && (
                        <p className='text-sm mt-2 opacity-90'>{student.name}</p>
                    )}
                </div>
                <div className='p-5 space-y-4'>
                    <div className='flex items-center justify-between'>
                        <h3 className='font-semibold text-[#1E1E1E] inline-flex items-center gap-2'>
                            <ShieldCheck size={18} className='text-[#515DEF]' />
                            Secure online payment
                        </h3>
                        <button
                            type='button'
                            onClick={() => {
                                clearPoll()
                                onClose?.()
                            }}
                            className='text-[#667085] cursor-pointer'
                            aria-label='Close'
                        >
                            <X size={18} />
                        </button>
                    </div>
                    {busy && (
                        <p className='text-sm text-[#667085] inline-flex items-center gap-2'>
                            <Loader2 size={16} className='animate-spin text-[#515DEF]' />
                            {statusText || 'Processing…'}
                        </p>
                    )}
                    {error && !busy && (
                        <div className='space-y-3'>
                            <p className='text-sm text-[#C62828]'>{error}</p>
                            <div className='flex flex-col gap-2'>
                                <button
                                    type='button'
                                    onClick={syncOnly}
                                    className='w-full text-sm bg-[#515DEF] text-white px-4 py-2 rounded-md cursor-pointer'
                                >
                                    I already paid — sync &amp; reload
                                </button>
                                <div className='flex gap-2'>
                                    <button
                                        type='button'
                                        onClick={retry}
                                        className='flex-1 text-sm border border-[#515DEF] text-[#515DEF] px-4 py-2 rounded-md cursor-pointer'
                                    >
                                        Try again
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            clearPoll()
                                            onClose?.()
                                        }}
                                        className='flex-1 text-sm border border-[#D9D9D9] text-[#667085] px-4 py-2 rounded-md cursor-pointer'
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default RazorpayCheckoutModal
