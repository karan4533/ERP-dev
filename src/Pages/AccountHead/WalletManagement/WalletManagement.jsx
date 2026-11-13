import { useState } from 'react'
import { Download, Wallet } from 'lucide-react'
import { IntegrationNotice, PageHeader } from '../../../Common/ui'
import WalletOverviewTab from './Components/WalletOverviewTab'
import UserWalletsTab from './Components/UserWalletsTab'
import RechargeRecordsTab from './Components/RechargeRecordsTab'
import SpendingHistoryTab from './Components/SpendingHistoryTab'
import RechargeOptionsTab from './Components/RechargeOptionsTab'
import RechargeWalletModal from './Components/RechargeWalletModal'
import { useFinance } from '../financeDomain/FinanceContext'
import { PAYMENT_MODES, SOURCE_MODULES } from '../financeDomain/financeConstants'
import {
    RECHARGE_RECORDS,
    USER_WALLETS,
    WALLET_ROLE_FILTERS,
    WALLET_TABS,
    formatRupeeAmount,
    parseRupeeAmount,
} from './walletManagementData'

const formatRechargeDateTime = () => {
    const now = new Date()
    return now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

const WalletManagement = () => {
    const { postExternalInflow } = useFinance()
    const [activeTab, setActiveTab] = useState('wallet-overview')
    const [roleFilter, setRoleFilter] = useState(WALLET_ROLE_FILTERS[0])
    const [rechargeModal, setRechargeModal] = useState(false)
    const [userWallets, setUserWallets] = useState(USER_WALLETS)
    const [rechargeRecords, setRechargeRecords] = useState(RECHARGE_RECORDS)

    const handleOfflineRecharge = ({ email, amount }) => {
        const walletIndex = userWallets.findIndex(
            (wallet) => wallet.email.toLowerCase() === email.toLowerCase(),
        )

        if (walletIndex === -1) {
            return {
                success: false,
                message: 'No wallet found for this email ID. Please verify and try again.',
            }
        }

        const wallet = userWallets[walletIndex]
        const updatedBalance = parseRupeeAmount(wallet.balance) + amount
        const updatedWallet = {
            ...wallet,
            balance: formatRupeeAmount(updatedBalance),
            lastRecharge: formatRechargeDateTime().split(',')[0],
            status: updatedBalance > 0 && wallet.status === 'Zero Balance' ? 'Active' : wallet.status,
        }

        const newRecord = {
            id: `RCG-${Date.now().toString().slice(-5)}`,
            user: wallet.name,
            initials: wallet.initials,
            role: wallet.role,
            mode: 'Offline',
            amount: formatRupeeAmount(amount),
            dateTime: formatRechargeDateTime(),
            status: 'Success',
        }

        setUserWallets((prev) => prev.map((item, index) => (
            index === walletIndex ? updatedWallet : item
        )))
        setRechargeRecords((prev) => [newRecord, ...prev])
        postExternalInflow({
            amount,
            category: 'Wallet Recharge',
            paymentMode: PAYMENT_MODES.CASH,
            reference: newRecord.id,
            narration: `Offline wallet recharge — ${wallet.name}`,
            sourceModule: SOURCE_MODULES.WALLET,
        })

        return {
            success: true,
            message: `${formatRupeeAmount(amount)} added to ${wallet.name}'s wallet.`,
        }
    }

    return (
        <section className='space-y-5'>
            <PageHeader
                title='Wallet management'
                description='Review browser-stored wallet balances and record independently received cash credits without implying a connected wallet or payment service.'
                context='Local wallet workspace · external payments disconnected'
                actions={(
                    <>
                        <select
                            aria-label='Wallet role filter'
                            value={roleFilter}
                            onChange={(event) => setRoleFilter(event.target.value)}
                            className='min-h-10 rounded-lg border border-[var(--erp-line-strong)] bg-white px-3 text-sm'
                        >
                            {WALLET_ROLE_FILTERS.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <button
                            type='button'
                            onClick={() => setRechargeModal(true)}
                            className='inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--erp-indigo)] px-4 text-sm font-semibold text-white'
                        >
                            <Wallet size={16} />
                            Record wallet credit
                        </button>
                        <button
                            type='button'
                            disabled
                            title='Export requires the connected wallet reporting API.'
                            className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'
                        >
                            <Download size={16} />
                            Export unavailable
                        </button>
                    </>
                )}
            />
            <IntegrationNotice state='demo' title='Browser-stored wallet register' description='Balances, credits and records remain in this browser. Production requires a wallet ledger, idempotent transactions, RBAC, immutable audit events and settlement reconciliation.' />

                <div className='flex gap-2 overflow-x-auto border-b border-[var(--erp-line)]' role='tablist' aria-label='Wallet management views'>
                    {WALLET_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type='button'
                            role='tab'
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`min-h-11 whitespace-nowrap border-b-2 px-3 text-sm font-semibold ${
                                activeTab === tab.id
                                    ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]'
                                    : 'border-transparent text-[var(--erp-slate)]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
            </div>

            {activeTab === 'wallet-overview' && <WalletOverviewTab />}
            {activeTab === 'user-wallets' && <UserWalletsTab userWallets={userWallets} initialRole={roleFilter} />}
            {activeTab === 'recharge-records' && <RechargeRecordsTab rechargeRecords={rechargeRecords} initialRole={roleFilter} />}
            {activeTab === 'spending-history' && <SpendingHistoryTab initialRole={roleFilter} />}
            {activeTab === 'recharge-options' && (
                <RechargeOptionsTab />
            )}

            <RechargeWalletModal
                isOpen={rechargeModal}
                onClose={() => setRechargeModal(false)}
                onOfflineRecharge={handleOfflineRecharge}
            />
        </section>
    )
}

export default WalletManagement
