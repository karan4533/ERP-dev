import React from 'react'
import { Check } from 'lucide-react'
import { FEE_INSTALLMENT_STATUSES, installmentStatusBadgeColor } from '../../financeDomain/financeConstants'
import { formatCurrency } from '../../financeDomain/financeHelpers'

const Row = ({ label, value, muted }) => (
    <div className='flex items-center justify-between text-sm py-1'>
        <span className='text-[#667085]'>{label}</span>
        <span className={muted ? 'text-[#667085]' : 'font-medium text-[#1E1E1E]'}>{value}</span>
    </div>
)

const FeeInstallmentCard = ({
    installment,
    selected,
    onToggle,
    partialAmount,
    onPartialAmountChange,
    allowPartial,
}) => {
    const isPaid = installment.status === FEE_INSTALLMENT_STATUSES.PAID
        || installment.status === FEE_INSTALLMENT_STATUSES.WAIVED
        || installment.status === FEE_INSTALLMENT_STATUSES.CANCELLED
    const disabled = isPaid || !installment.payable

    return (
        <div className={`rounded-2xl border p-4 transition-colors ${
            isPaid
                ? 'border-[#4CAF5033] bg-[#4CAF500A]'
                : selected
                    ? 'border-[#515DEF] bg-[#515DEF08]'
                    : 'border-[#EDEEF5] bg-white'
        }`}>
            <div className='flex items-start justify-between gap-3 mb-3'>
                <label className={`inline-flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                    <input
                        type='checkbox'
                        checked={isPaid ? true : selected}
                        disabled={disabled}
                        onChange={() => onToggle(installment)}
                        className='size-4 accent-[#515DEF]'
                    />
                    <span className='font-semibold text-[#1E1E1E]'>{installment.feeHead}</span>
                </label>
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${installmentStatusBadgeColor[installment.status]}`}>
                    {installment.status.replaceAll('_', ' ')}
                </span>
            </div>

            {isPaid ? (
                <div className='space-y-1'>
                    <Row label='Concession' value={formatCurrency(installment.concessionAmount)} />
                    <Row label='Fee Amount' value={formatCurrency(installment.feeAmount)} />
                    <Row label='Net Amount (After concession)' value={formatCurrency(installment.netAmount)} />
                    <Row label='Pay Status' value='PAID' />
                    <Row label='Paid Amount' value={formatCurrency(installment.paidAmount)} />
                    <Row label='Balance Amount' value={formatCurrency(0)} />
                </div>
            ) : (
                <div className='space-y-1'>
                    <Row label='Concession' value={formatCurrency(installment.concessionAmount)} />
                    <Row label='Fee Amount' value={formatCurrency(installment.feeAmount)} />
                    <Row label='Net Amount' value={formatCurrency(installment.netAmount)} />
                    <Row label='Paid Amount' value={formatCurrency(installment.paidAmount)} />
                    <Row label='Balance Amount' value={formatCurrency(installment.balanceAmount)} />
                    <Row label='Late Fee' value={formatCurrency(installment.fineAmount)} />
                    {allowPartial && selected && (
                        <div className='pt-2'>
                            <label className='block text-xs text-[#667085] mb-1'>Collect amount</label>
                            <input
                                type='number'
                                min={1}
                                max={installment.balanceAmount}
                                value={partialAmount ?? installment.balanceAmount}
                                onChange={(event) => onPartialAmountChange(installment.id, event.target.value)}
                                className='w-full text-sm border border-[#D9D9D9] rounded-md px-3 py-2 focus:outline-none focus:border-[#515DEF]'
                            />
                            <p className='text-[11px] text-[#808080] mt-1'>
                                Pay full outstanding or enter a partial amount up to {formatCurrency(installment.balanceAmount)}.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {isPaid && (
                <p className='mt-3 text-xs text-[#4CAF50] inline-flex items-center gap-1'>
                    <Check size={12} /> Settled — not included in Pay Now
                </p>
            )}
        </div>
    )
}

export default FeeInstallmentCard
