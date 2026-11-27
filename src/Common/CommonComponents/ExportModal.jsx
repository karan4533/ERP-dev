import React, { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { runTableExport } from '../exportDownload'
import { filterListRows, formatListDate } from '../listFiltering'

const ExportModal = ({
    exportModal,
    setExportModal,
    onExport,
    rows,
    columns,
    filename = 'export',
    title,
    exportDescription = (
        <>
            Export the currently filtered records. Optionally narrow further by date range before download.
        </>
    ),
    enableDateRange = false,
    dateKeys = ['createdDate', 'date', 'requestDate', 'issueDate'],
    // Set when the page has no live dataset (sample-only screens): export is disabled with this message.
    unavailableReason = '',
}) => {
    const [format, setFormat] = useState('excel')
    const [exporting, setExporting] = useState(false)
    // Date range starts empty — never hard-code a 7-day (or today) window.
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)

    useEffect(() => {
        if (!exportModal) return
        setFormat('excel')
        setFromDate(null)
        setToDate(null)
        setExporting(false)
    }, [exportModal])

    const sourceRows = Array.isArray(rows) ? rows : []
    const exportRows = useMemo(() => {
        if (!enableDateRange || (!fromDate && !toDate)) return sourceRows
        return filterListRows(sourceRows, {
            fromDate,
            toDate,
            dateKeys,
        })
    }, [sourceRows, enableDateRange, fromDate, toDate, dateKeys])

    const handleExport = async () => {
        if (exporting || unavailableReason) return
        setExporting(true)
        try {
            const exportFormat = format === 'pdf' ? 'pdf' : 'excel'
            if (typeof onExport === 'function') {
                onExport(exportFormat, {
                    fromDate,
                    toDate,
                    rows: exportRows,
                })
                setExportModal(false)
                return
            }
            const rangeLabel = [
                fromDate ? formatListDate(fromDate) : null,
                toDate ? formatListDate(toDate) : null,
            ].filter(Boolean).join(' to ')
            const result = await runTableExport(exportFormat, {
                filename,
                rows: exportRows,
                columns,
                title: rangeLabel ? `${title || filename} (${rangeLabel})` : (title || filename),
            })
            if (!result.ok) {
                const message = result.reason === 'empty'
                    ? 'No records to export for the selected range.'
                    : result.reason === 'pdf'
                        ? 'The PDF window was blocked. Allow pop-ups for this site and try again.'
                        : 'Export failed.'
                toast.error(message)
                return
            }
            toast.success(
                exportFormat === 'pdf'
                    ? `PDF preview opened (${exportRows.length} record(s)). Use Print to save the file.`
                    : `Exported ${exportRows.length} record(s) as Excel.`,
            )
            setExportModal(false)
        } catch (error) {
            toast.error(error?.message || 'Export failed.')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div>
            {exportModal && (
                <div className='fixed inset-0 z-500 flex items-center justify-center'>
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setExportModal(false)}
                    />

                    <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-lg p-5 py-4">
                        <div className='flex justify-between items-center'>
                            <h2 className='text-xl font-semibold text-black'>Export List</h2>
                            <button type='button' onClick={() => setExportModal(false)} className='hover:text-red-500 cursor-pointer'>
                                <X />
                            </button>
                        </div>
                        <div className='pt-4'>
                            {unavailableReason ? (
                                <p className='text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FDA29B] rounded-md px-3 py-2'>{unavailableReason}</p>
                            ) : (
                                <>
                                    <p className='text-sm font-normal'>{exportDescription}</p>
                                    <p className='text-xs text-[#667085] mt-2'>
                                        {exportRows.length} record(s) ready to export
                                        {sourceRows.length !== exportRows.length ? ` (from ${sourceRows.length} filtered rows)` : ''}.
                                    </p>
                                </>
                            )}

                            {enableDateRange ? (
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4'>
                                    <div className='flex flex-col gap-y-2'>
                                        <label className='text-sm font-medium text-[#1E1E1E]'>From date</label>
                                        <div className='relative w-full'>
                                            <DatePicker
                                                selected={fromDate}
                                                onChange={setFromDate}
                                                isClearable
                                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                                            />
                                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                                        </div>
                                    </div>
                                    <div className='flex flex-col gap-y-2'>
                                        <label className='text-sm font-medium text-[#1E1E1E]'>To date</label>
                                        <div className='relative w-full'>
                                            <DatePicker
                                                selected={toDate}
                                                onChange={setToDate}
                                                isClearable
                                                className='w-full text-sm text-[#808080] border border-[#D9D9D9] rounded-md px-3 py-2 pr-10 focus:outline-none'
                                            />
                                            <Calendar size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none' />
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className='flex flex-col gap-x-2'>
                                <label htmlFor="" className='text-base font-medium text-[#1E1E1E] my-4'>Choose Format</label>
                                <div className='flex w-full items-center gap-x-6'>
                                    <div className='flex items-center gap-x-2'>
                                        <input type="radio" name="format" id="excel" checked={format === 'excel'} onChange={() => setFormat('excel')} className='w-4 h-4 cursor-pointer border-[#515DEF] text-[#515DEF]' />
                                        <label htmlFor="excel">Excel (XLSX)</label>
                                    </div>
                                    <div className='flex items-center gap-x-2'>
                                        <input type="radio" name="format" id="pdf" checked={format === 'pdf'} onChange={() => setFormat('pdf')} className='w-4 h-4 cursor-pointer border-[#515DEF] text-[#515DEF]' />
                                        <label htmlFor="pdf">PDF</label>
                                    </div>
                                </div>
                            </div>

                            <div className='flex gap-x-4 mt-10'>
                                <button type='button' onClick={() => setExportModal(false)} className='bg-white text-[#77767A] text-sm text-center px-4 py-2.5 rounded-md border border-[#77767A] hover:bg-[#515DEF] hover:text-white hover:border-[#515DEF] transition-all duration-200 cursor-pointer w-full'>
                                    Cancel
                                </button>
                                <button
                                    type='button'
                                    disabled={exporting || Boolean(unavailableReason)}
                                    onClick={handleExport}
                                    className='bg-[#515DEF] text-white text-sm text-center px-4 py-2.5 rounded-md border border-[#515DEF] hover:opacity-90 transition-all duration-200 cursor-pointer w-full disabled:opacity-60'
                                >
                                    {exporting ? 'Exporting…' : 'Export'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default ExportModal
