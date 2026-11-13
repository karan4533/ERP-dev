import { Banknote, CreditCard, Landmark, QrCode, Settings2 } from 'lucide-react'
import { DataTable, IntegrationNotice, StatusBadge } from '../../../../Common/ui'
import { RECHARGE_METHODS } from '../walletManagementData'

const METHOD_ICONS = { qr: QrCode, card: CreditCard, bank: Landmark, cash: Banknote }

const RechargeOptionsTab = () => {
    const columns = [
        { key: 'method', label: 'Method', required: true, render: (row) => { const Icon = METHOD_ICONS[row.icon] ?? CreditCard; return <span className='inline-flex items-center gap-2 font-semibold text-[var(--erp-ink)]'><Icon aria-hidden='true' size={16} /> {row.method}</span> } },
        { key: 'minAmount', label: 'Minimum' },
        { key: 'maxAmount', label: 'Maximum' },
        { key: 'processingFee', label: 'Processing fee' },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ]
    return (
        <div className='space-y-5'>
            <IntegrationNotice state='disconnected' title='Recharge-method configuration unavailable' description='These methods are a static configuration reference. Adding or editing a method requires the connected wallet, payment and RBAC services.' />
            <section className='overflow-hidden rounded-[var(--erp-radius-surface)] border border-[var(--erp-line)] bg-white' aria-labelledby='recharge-options-title'>
                <div className='flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5'>
                    <div><h3 id='recharge-options-title' className='text-base font-semibold text-[var(--erp-ink)]'>Configured recharge options</h3><p className='mt-1 text-xs text-[var(--erp-muted)]'>Static reference · no payment service connected</p></div>
                    <button type='button' disabled title='Configuration requires the connected wallet API.' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'><Settings2 aria-hidden='true' size={16} /> Configuration unavailable</button>
                </div>
                <DataTable caption='Configured recharge options' rows={RECHARGE_METHODS} columns={columns} rowKey='id' />
            </section>
        </div>
    )
}

export default RechargeOptionsTab
