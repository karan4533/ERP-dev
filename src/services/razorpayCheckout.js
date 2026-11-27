/**
 * Load Razorpay Checkout.js once and open the payment modal for a server-created order.
 * Success returns { razorpay_order_id, razorpay_payment_id, razorpay_signature }.
 * If Checkout closes after Success without the JS handler (common in Test Mode),
 * rejects with code CHECKOUT_CLOSED so the caller can sync the order from the server.
 */

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

let scriptPromise = null

export function loadRazorpayScript() {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Razorpay checkout requires a browser.'))
    }
    if (window.Razorpay) return Promise.resolve(window.Razorpay)
    if (scriptPromise) return scriptPromise

    scriptPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`)
        if (existing) {
            existing.addEventListener('load', () => resolve(window.Razorpay))
            existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay Checkout.')))
            if (window.Razorpay) resolve(window.Razorpay)
            return
        }
        const script = document.createElement('script')
        script.src = CHECKOUT_SCRIPT
        script.async = true
        script.onload = () => {
            if (!window.Razorpay) {
                reject(new Error('Razorpay Checkout loaded but Razorpay is missing.'))
                return
            }
            resolve(window.Razorpay)
        }
        script.onerror = () => {
            scriptPromise = null
            reject(new Error('Failed to load Razorpay Checkout.'))
        }
        document.body.appendChild(script)
    })
    return scriptPromise
}

/**
 * @param {{
 *   key: string,
 *   orderId: string,
 *   amount: number,
 *   currency?: string,
 *   name?: string,
 *   description?: string,
 *   prefill?: { name?: string, email?: string, contact?: string },
 *   notes?: Record<string, string>,
 * }} options
 */
export async function openRazorpayCheckout(options) {
    const {
        key,
        orderId,
        amount,
        currency = 'INR',
        name = 'School Fees',
        description = 'Fee payment',
        prefill = {},
        notes = {},
    } = options || {}

    if (!key || !orderId) {
        throw new Error('Razorpay key and order id are required.')
    }

    const Razorpay = await loadRazorpayScript()
    const paise = Math.round(Number(amount || 0) * 100)

    return new Promise((resolve, reject) => {
        let settled = false
        let dismissTimer = null

        const finishOk = (response) => {
            if (settled) return
            settled = true
            if (dismissTimer) clearTimeout(dismissTimer)
            resolve({
                razorpay_order_id: response.razorpay_order_id || orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
            })
        }

        const finishClosed = () => {
            if (settled) return
            settled = true
            const err = new Error('CHECKOUT_CLOSED')
            err.code = 'CHECKOUT_CLOSED'
            err.orderId = orderId
            reject(err)
        }

        const rzp = new Razorpay({
            key,
            amount: paise,
            currency,
            name,
            description,
            order_id: orderId,
            prefill,
            notes,
            theme: { color: '#515DEF' },
            config: {
                display: {
                    blocks: {
                        upi: {
                            name: 'Pay using UPI',
                            instruments: [{ method: 'upi' }],
                        },
                        card: {
                            name: 'Pay using Card',
                            instruments: [{ method: 'card' }],
                        },
                        netbanking: {
                            name: 'Netbanking',
                            instruments: [{ method: 'netbanking' }],
                        },
                    },
                    sequence: ['block.upi', 'block.card', 'block.netbanking'],
                    preferences: { show_default_blocks: true },
                },
            },
            handler(response) {
                finishOk(response)
            },
            modal: {
                // Success screen often closes before handler runs — wait briefly, then sync by order.
                ondismiss() {
                    if (settled) return
                    dismissTimer = setTimeout(finishClosed, 800)
                },
            },
        })
        rzp.on('payment.failed', (event) => {
            if (settled) return
            settled = true
            if (dismissTimer) clearTimeout(dismissTimer)
            const reason = event?.error?.description || event?.error?.reason || 'Payment failed.'
            reject(new Error(reason))
        })
        rzp.open()
    })
}
