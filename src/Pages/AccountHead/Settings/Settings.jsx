import { useState } from 'react'
import { Save } from 'lucide-react'
import { IntegrationNotice, PageHeader } from '../../../Common/ui'
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
        <section className='space-y-5'>
            <PageHeader title='Finance settings' description='Review local frontend preferences and the authoritative configuration surfaces that require connected finance, identity and integration services.' context='Browser-local preview · production save disconnected' actions={<button type='button' disabled title='Saving authoritative settings requires the finance configuration API.' className='inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--erp-line-strong)] bg-white px-4 text-sm font-semibold text-[var(--erp-muted)] opacity-60'><Save aria-hidden='true' size={16} /> Save unavailable</button>} />
            <IntegrationNotice state='demo' title='Settings are not authoritative' description='Controls on these tabs are local UI previews unless explicitly described as browser-stored finance data. Production changes require server validation, RBAC, versioning and audit history.' />
            <div className='flex gap-2 overflow-x-auto border-b border-[var(--erp-line)]' role='tablist' aria-label='Finance settings views'>
                {SETTINGS_TABS.map((tab) => <button key={tab.id} type='button' role='tab' aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`min-h-11 whitespace-nowrap border-b-2 px-3 text-sm font-semibold ${activeTab === tab.id ? 'border-[var(--erp-indigo)] text-[var(--erp-indigo)]' : 'border-transparent text-[var(--erp-slate)]'}`}>{tab.label}</button>)}
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
