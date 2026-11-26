import HRRoutes from '../Routes/HRRoutes'
import { useLocation } from 'react-router-dom'
import FinancialContextBar from '../Common/Finance/FinancialContextBar'
import { IntegrationNotice } from '../Common/ui'
import AppShell from './AppShell'

const HRLayout = () => {
    const { pathname } = useLocation()
    const isPayroll = pathname.startsWith('/hr/payroll')

    return (
        <AppShell roleKey='hr'>
            {isPayroll ? (
                <FinancialContextBar
                    label='Payroll processing context'
                    period='September 2026'
                    lockState='Open'
                    source='Browser-stored HR and payroll records'
                    integration='Disconnected'
                />
            ) : (
                <IntegrationNotice
                    state='demo'
                    title='Browser-stored HR workspace'
                    description='HR records and workflow changes in this frontend are local demonstration data. Production requires connected identity, document, attendance, payroll, communication and audit services.'
                />
            )}
            <HRRoutes />
        </AppShell>
    )
}

export default HRLayout

