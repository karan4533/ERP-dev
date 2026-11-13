import AccountHeadRoutes from '../Routes/AccountHeadRoutes'
import FinancialContextBar from '../Common/Finance/FinancialContextBar'
import AppShell from './AppShell'

const AccountHeadLayout = () => (
    <AppShell roleKey='accounthead'>
        <FinancialContextBar
            period='September 2026'
            lockState='Open'
            source='Browser-stored finance ledger'
            integration='Disconnected'
        />
        <AccountHeadRoutes />
    </AppShell>
)

export default AccountHeadLayout

