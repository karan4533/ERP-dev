import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { createEmptyGoodsRow } from '../goodsReceivedPassData'

const inputClass =
    'text-sm font-normal text-[#1E1E1E] border border-[#D9D9D9] rounded-md px-2 py-2 w-full min-w-0'

const GoodsItemsTable = ({ materials, onChange, errors = {} }) => {
    const updateRow = (index, field, value) => {
        const next = materials.map((row, i) =>
            i === index ? { ...row, [field]: field === 'quantity' ? Number(value) || 0 : value } : row
        )
        onChange(next)
    }

    const addRow = () => onChange([...materials, createEmptyGoodsRow()])

    const removeRow = (index) => {
        if (materials.length === 1) return
        onChange(materials.filter((_, i) => i !== index))
    }

    return (
        <div className='space-y-3'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <h3 className='text-base font-semibold text-[#0C1E5B]'>Goods Details</h3>
                <button
                    type='button'
                    onClick={addRow}
                    className='inline-flex items-center gap-2 self-start rounded-md border border-[#515DEF] px-3 py-2 text-sm font-medium text-[#515DEF] hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                >
                    <Plus size={16} />
                    Add More
                </button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-[#D9D9D9]'>
                <table className='w-full min-w-[860px] text-sm'>
                    <thead className='bg-[#EDEEF5] text-xs uppercase text-[#0C1E5B]'>
                        <tr>
                            <th className='px-3 py-3 w-16 text-left font-medium'>S.No.</th>
                            <th className='px-3 py-3 text-left font-medium'>Name of the Description</th>
                            <th className='px-3 py-3 w-24 text-left font-medium'>Qty.</th>
                            <th className='px-3 py-3 text-left font-medium'>Remarks</th>
                            <th className='px-3 py-3 w-28 text-left font-medium'>L.P.No.</th>
                            <th className='px-3 py-3 w-16 text-center font-medium'>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materials.map((row, index) => (
                            <tr key={row.id} className='border-t border-[#E4E7EC] align-top'>
                                <td className='px-3 py-3 font-medium text-[#1E1E1E]'>{index + 1}</td>
                                <td className='px-3 py-3'>
                                    <input
                                        type='text'
                                        value={row.description}
                                        onChange={(e) => updateRow(index, 'description', e.target.value)}
                                        placeholder='Item description'
                                        className={inputClass}
                                    />
                                    {errors[`materials.${index}.description`] && (
                                        <p className='mt-1 text-xs text-[#FF0000]'>{errors[`materials.${index}.description`]}</p>
                                    )}
                                </td>
                                <td className='px-3 py-3'>
                                    <input
                                        type='number'
                                        min='1'
                                        value={row.quantity}
                                        onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                                        className={inputClass}
                                    />
                                </td>
                                <td className='px-3 py-3'>
                                    <input
                                        type='text'
                                        value={row.remarks}
                                        onChange={(e) => updateRow(index, 'remarks', e.target.value)}
                                        placeholder='Remarks'
                                        className={inputClass}
                                    />
                                </td>
                                <td className='px-3 py-3'>
                                    <input
                                        type='text'
                                        value={row.lpNo}
                                        onChange={(e) => updateRow(index, 'lpNo', e.target.value)}
                                        placeholder='L.P.No.'
                                        className={inputClass}
                                    />
                                </td>
                                <td className='px-3 py-3 text-center'>
                                    <button
                                        type='button'
                                        onClick={() => removeRow(index)}
                                        disabled={materials.length === 1}
                                        className='inline-flex items-center justify-center rounded-md p-2 text-[#FF0000] hover:bg-[#FF000015] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer'
                                        aria-label='Remove row'
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default GoodsItemsTable
