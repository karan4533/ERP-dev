import React from 'react'
import {
    Building2,
    FileSpreadsheet,
    Fingerprint,
    Mail,
    MessageCircle,
    QrCode,
} from 'lucide-react'
import { INTEGRATIONS, integrationStatusBadgeColor } from '../settingsData'
import { SettingsPanel, tdClass, thClass } from './SettingsShared'

const INTEGRATION_ICONS = {
    bank: Building2,
    qr: QrCode,
    whatsapp: MessageCircle,
    mail: Mail,
    fingerprint: Fingerprint,
    spreadsheet: FileSpreadsheet,
}

const IntegrationsTab = () => (
    <SettingsPanel title='Connected services'>
        <div className='relative overflow-x-auto'>
            <table className='w-full text-sm text-left min-w-[640px]'>
                <thead className='text-xs bg-[#EDEEF5] whitespace-nowrap rounded-lg'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Service</th>
                        <th className={thClass}>Purpose</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} rounded-e-lg`}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {INTEGRATIONS.map((row) => {
                        const Icon = INTEGRATION_ICONS[row.icon] ?? Building2
                        return (
                            <tr key={row.id} className='border-b border-[#f2f4f7] hover:bg-[#f2f4f7]'>
                                <td className={`${tdClass} rounded-s-lg`}>
                                    <div className='flex items-center gap-2 text-[#1E1E1E]'>
                                        <Icon size={16} className='text-[#667085] shrink-0' />
                                        {row.service}
                                    </div>
                                </td>
                                <td className={tdClass}>{row.purpose}</td>
                                <td className={tdClass}>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${integrationStatusBadgeColor[row.status]}`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className={`${tdClass} rounded-e-lg`}>
                                    <button
                                        type='button'
                                        className='text-sm font-medium text-[#515DEF] hover:opacity-80 cursor-pointer'
                                    >
                                        {row.action}
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    </SettingsPanel>
)

export default IntegrationsTab
