import React from 'react'
import { useFinance } from '../../financeDomain/FinanceContext'
import { SettingsPanel, tdClass, thClass } from './SettingsShared'

const BankAccountsTab = () => {
    const { bankAccounts } = useFinance()
    return (
        <SettingsPanel title='Bank accounts' sub='Used for bank transfer collections, bank book, and BRS.'>
            <table className='w-full text-sm'>
                <thead className='text-xs bg-[#EDEEF5]'>
                    <tr>
                        <th className={`${thClass} rounded-s-lg`}>Name</th>
                        <th className={thClass}>Bank</th>
                        <th className={thClass}>Account No.</th>
                        <th className={`${thClass} rounded-e-lg`}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {bankAccounts.map((item) => (
                        <tr key={item.id} className='border-b border-[#F2F4F7]'>
                            <td className={tdClass}>{item.name}</td>
                            <td className={tdClass}>{item.bankName}</td>
                            <td className={`${tdClass} font-mono text-xs`}>{item.accountNumber}</td>
                            <td className={tdClass}>{item.enabled ? 'Enabled' : 'Disabled'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </SettingsPanel>
    )
}

export default BankAccountsTab
