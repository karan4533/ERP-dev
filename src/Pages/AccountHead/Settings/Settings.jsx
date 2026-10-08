import React, { useState } from 'react'
import { Check } from 'lucide-react'
import GeneralTab from './Components/GeneralTab'
import PaymentConfigurationTab from './Components/PaymentConfigurationTab'
import FineRulesTab from './Components/FineRulesTab'
import BankAccountsTab from './Components/BankAccountsTab'
import PosTerminalsTab from './Components/PosTerminalsTab'
import RolesPermissionsTab from './Components/RolesPermissionsTab'
import NotificationsTab from './Components/NotificationsTab'
import IntegrationsTab from './Components/IntegrationsTab'
import { SETTINGS_TABS } from './settingsData'

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general')

    return (
        <section className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-md p-4'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                    <div>
                        <h2 className='text-xl font-semibold text-black'>Settings</h2>
                        <p className='text-sm text-[#667085] mt-1'>Finance module configuration</p>
                    </div>
                    <button
                        type='button'
                        className='inline-flex items-center gap-2 bg-[#515DEF] text-white text-sm px-4 py-2 rounded-md hover:opacity-90 transition-all cursor-pointer'
                    >
                        <Check size={16} />
                        Save Changes
                    </button>
                </div>

                <div className='flex gap-6 overflow-x-auto no-scrollbar mt-6 border-b border-[#F2F4F7]'>
                    {SETTINGS_TABS.map((tab) => (
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

            {activeTab === 'general' && <GeneralTab />}
            {activeTab === 'payment-configuration' && <PaymentConfigurationTab />}
            {activeTab === 'fine-rules' && <FineRulesTab />}
            {activeTab === 'bank-accounts' && <BankAccountsTab />}
            {activeTab === 'pos-terminals' && <PosTerminalsTab />}
            {activeTab === 'roles-permissions' && <RolesPermissionsTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'integrations' && <IntegrationsTab />}
        </section>
    )
}

export default Settings
