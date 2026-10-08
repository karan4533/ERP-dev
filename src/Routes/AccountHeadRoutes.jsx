import React from 'react'
import { Route, Routes as ReactRoutes, Navigate } from 'react-router-dom'
import Dashboard from '../Pages/AccountHead/Dashboard/Dashboard'
import FeesManagement from '../Pages/AccountHead/FeesManagement/FeesManagement'
import TransportFinance from '../Pages/AccountHead/TransportFinance/TransportFinance'
import Collections from '../Pages/AccountHead/Collections/Collections'
import WalletManagement from '../Pages/AccountHead/WalletManagement/WalletManagement'
import Accounting from '../Pages/AccountHead/Accounting/Accounting'
import Approvals from '../Pages/AccountHead/Approvals/Approvals'
import ReportsAnalytics from '../Pages/AccountHead/ReportsAnalytics/ReportsAnalytics'
import Settings from '../Pages/AccountHead/Settings/Settings'
import { TaskManagementRoutes } from '../Common/TaskManagement/TaskManagementRoutes'
import { BookFeePage, BudgetPage, FeeProjectionPanel, MfpPlaceholder } from '../Common/demoDomain/DemoScreens'
import PaymentVouchers from '../Pages/AccountHead/PaymentVouchers/PaymentVouchers'

const AccountHeadRoutes = () => {
    return (
        <ReactRoutes>
            <Route path="/account-head/dashboard" element={<Dashboard />} />
            <Route path="/account-head/fees-management" element={<FeesManagement />} />
            <Route path="/account-head/transport-finance" element={<TransportFinance />} />
            <Route path="/account-head/collections" element={<Collections />} />
            <Route path="/account-head/wallet-management" element={<WalletManagement />} />
            <Route path="/account-head/accounting" element={<Navigate to="/account-head/accounting/day-book" replace />} />
            <Route path="/account-head/accounting/:section" element={<Accounting />} />
            <Route path="/account-head/approvals" element={<Approvals />} />
            <Route path="/account-head/reports-analytics" element={<ReportsAnalytics />} />
            <Route path="/account-head/settings" element={<Settings />} />
            <Route path="/account-head/payment-vouchers" element={<PaymentVouchers />} />
            <Route path="/account-head/book-fee" element={<BookFeePage />} />
            <Route path="/account-head/annual-budget" element={<BudgetPage />} />
            <Route path="/account-head/mfp" element={<MfpPlaceholder />} />
            <Route path="/account-head/fee-projection" element={<FeeProjectionPanel />} />
            {TaskManagementRoutes({ basePath: '/account-head' })}
            <Route path="*" element={<Navigate to="/account-head/dashboard" replace />} />
        </ReactRoutes>
    )
}

export default AccountHeadRoutes
