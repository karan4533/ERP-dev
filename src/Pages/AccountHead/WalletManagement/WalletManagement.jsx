import React, { useState } from 'react'
import { Download, Wallet } from 'lucide-react'
import ExportModal from '../../../Common/CommonComponents/ExportModal'
import WalletOverviewTab from './Components/WalletOverviewTab'
import UserWalletsTab from './Components/UserWalletsTab'
import RechargeRecordsTab from './Components/RechargeRecordsTab'
import SpendingHistoryTab from './Components/SpendingHistoryTab'
import RechargeOptionsTab, { AddRechargeMethodModal } from './Components/RechargeOptionsTab'
import RechargeWalletModal from './Components/RechargeWalletModal'
import { useFinance } from '../financeDomain/FinanceContext'
import { WALLET_ROLE_FILTERS, WALLET_TABS } from './walletManagementData'

const WalletManagement = () => {
    const { rechargeWallet, wallets: userWallets, walletRecharges: rechargeRecords } = useFinance()
    const [activeTab, setActiveTab] = useState('wallet-overview')
    const [roleFilter, setRoleFilter] = useState(WALLET_ROLE_FILTERS[0])
    const [exportModal, setExportModal] = useState(false)
    const [addMethodModal, setAddMethodModal] = useState(false)
    const [rechargeModal, setRechargeModal] = useState(false)

    const handleOfflineRecharge = ({ email, amount }) => {
        const result = rechargeWallet({ email, amount })
        if (!result.success) {
            return {
                success: false,
                message: result.message || 'No wallet found for this email ID. Please verify and try again.',
            }
        }
        return { success: true, message: 'Wallet recharged.' }
    }

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Wallet Management</h2>
                        <p className='text-sm text-[#667085] mt-1'>
                            Platform-wide digital wallets
                            {' · '}
                            All Roles
                        </p>
                    </div>
                    <div className='flex flex-wrap items-center gap-3'>
                        <select
                            value={roleFilter}
                            onChange={(event) => setRoleFilter(event.target.value)}
                            className='text-sm border border-[#D9D9D9] rounded-md px-3 py-2 min-w-[120px]'
                        >
                            {WALLET_ROLE_FILTERS.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <button
                            type='button'
                            onClick={() => setRechargeModal(true)}
                            className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                        >
                            <Wallet size={16} />
                            Recharge Wallet
                        </button>
                        <button
                            type='button'
                            onClick={() => setExportModal(true)}
                            className='inline-flex items-center gap-2 text-sm font-medium text-[#515DEF] border border-[#515DEF] px-4 py-2 rounded-md hover:bg-[#515DEF] hover:text-white transition-colors cursor-pointer'
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                <div className='flex gap-6 overflow-x-auto no-scrollbar mt-6 border-b border-[#F2F4F7]'>
                    {WALLET_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type='button'
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap px-1 pb-3 text-sm md:text-base font-medium cursor-pointer transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'text-[#515DEF] border-b-2 border-[#515DEF] font-semibold'
                                    : 'text-[#808080]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'wallet-overview' && <WalletOverviewTab />}
            {activeTab === 'user-wallets' && <UserWalletsTab userWallets={userWallets} />}
            {activeTab === 'recharge-records' && <RechargeRecordsTab rechargeRecords={rechargeRecords} />}
            {activeTab === 'spending-history' && <SpendingHistoryTab />}
            {activeTab === 'recharge-options' && (
                <RechargeOptionsTab onAddMethod={() => setAddMethodModal(true)} />
            )}

            <ExportModal exportModal={exportModal} setExportModal={setExportModal} />
            <AddRechargeMethodModal isOpen={addMethodModal} onClose={() => setAddMethodModal(false)} />
            <RechargeWalletModal
                isOpen={rechargeModal}
                onClose={() => setRechargeModal(false)}
                onOfflineRecharge={handleOfflineRecharge}
            />
        </section>
    )
}

export default WalletManagement
