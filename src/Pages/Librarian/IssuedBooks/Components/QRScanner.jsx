import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, Camera, X, CheckCircle2 } from 'lucide-react'
import qrPlaceholder from '../../../../assets/images/qr-code.svg'

const SCANNER_ELEMENT_ID = 'qr-scanner-region'

const QRScanner = ({ onScan }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState(null)
    const [result, setResult] = useState(null)

    const scannerRef = useRef(null)

    const stopScanner = async () => {
        const scanner = scannerRef.current
        if (!scanner) return
        try {
            if (scanner.isScanning) {
                await scanner.stop()
            }
            scanner.clear()
        } catch {
            // Ignore errors raised while tearing down the scanner.
        }
        scannerRef.current = null
    }

    const handleClose = async () => {
        await stopScanner()
        setIsOpen(false)
        setError(null)
    }

    const startCamera = () => {
        setError(null)
        setIsOpen(true)
    }

    useEffect(() => {
        if (!isOpen) return

        let cancelled = false

        const init = async () => {
            try {
                const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
                scannerRef.current = scanner

                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 220, height: 220 } },
                    (decodedText) => {
                        if (cancelled) return
                        setResult(decodedText)
                        onScan?.(decodedText)
                        handleClose()
                    },
                    () => {
                        // Per-frame scan failures are expected; ignore them.
                    }
                )
            } catch (err) {
                if (cancelled) return
                const name = err?.name || ''
                if (name === 'NotAllowedError') {
                    setError('Camera permission denied. Please allow camera access and try again.')
                } else if (name === 'NotFoundError') {
                    setError('No camera device was found on this device.')
                } else {
                    setError('Unable to start the camera. Please try again.')
                }
            }
        }

        init()

        return () => {
            cancelled = true
            stopScanner()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    return (
        <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-gray-200 bg-white py-6 px-4">
            <div className="flex flex-col items-center gap-2">
                <img
                    src={qrPlaceholder}
                    alt="Sample QR code"
                    className="w-28 h-28 rounded-lg ring-1 ring-gray-100 p-2"
                />
                {result ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        Scanned: <span className="max-w-[200px] truncate">{result}</span>
                    </span>
                ) : (
                    <span className="text-xs text-gray-400 text-center">
                        Scan a book QR code to auto-fill details
                    </span>
                )}
            </div>

            <button
                type="button"
                onClick={startCamera}
                className="flex items-center gap-2 bg-[#515DEF] text-white text-sm px-6 py-2.5 rounded-md hover:opacity-90 transition-all duration-200 cursor-pointer"
            >
                <QrCode className="w-4 h-4" />
                Scan QR
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                            <h3 className="flex items-center gap-2 text-base font-semibold text-black">
                                <Camera className="w-5 h-5 text-[#515DEF]" />
                                Scan QR Code
                            </h3>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5">
                            {error && (
                                <div className="flex flex-col items-center gap-3 pb-4 text-center">
                                    <p className="text-sm text-red-500">{error}</p>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="text-sm text-[#515DEF] font-medium cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}

                            <div
                                id={SCANNER_ELEMENT_ID}
                                className={`w-full overflow-hidden rounded-xl ${error ? 'hidden' : ''}`}
                            />

                            {!error && (
                                <p className="mt-3 text-xs text-gray-400 text-center">
                                    Point your camera at the QR code
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default QRScanner
