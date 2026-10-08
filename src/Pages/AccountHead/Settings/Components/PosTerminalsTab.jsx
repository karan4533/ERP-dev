import React from 'react'
import { useFinance } from '../../financeDomain/FinanceContext'
import { SettingsPanel, tdClass, thClass } from './SettingsShared'

const PosTerminalsTab = () => {
    const { posTerminals } = useFinance()
    return (
        <SettingsPanel title='POS / swipe terminals' sub='Vendor-neutral terminal master. Gateway credentials are not stored in this demo.'>
            <table className='w-full text-sm'>
                <thead className='text-xs bg-[#EDEEF5]'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Name</th>
                        <th className={thClass}>Terminal ID</th>
                        <th className={thClass}>Provider</th>
                        <th className={`${thClass} rounded-e-lg`}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {posTerminals.map((item) => (
                        <tr key={item.id} className='border-b border-[#F2F4F7]'>
                            <td className={tdClass}>{item.name}</td>
                            <td className={`${tdClass} font-mono text-xs`}>{item.terminalId}</td>
                            <td className={tdClass}>{item.provider}</td>
                            <td className={tdClass}>{item.enabled ? 'Enabled' : 'Disabled'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </SettingsPanel>
    )
}

export default PosTerminalsTab
