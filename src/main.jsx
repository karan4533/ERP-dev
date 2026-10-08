import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { FinanceProvider } from './Pages/AccountHead/financeDomain/FinanceContext.jsx'
import { runAcademicsWipeIfNeeded } from './Common/RBAC/academicsWipe.js'
import { runFrontOfficePassWipeIfNeeded } from './Common/FrontOffice/frontOfficePassWipe.js'
import { runActivitiesWipeIfNeeded } from './Common/Activities/activitiesWipe.js'
import { runAnnouncementsWipeIfNeeded } from './Common/Announcement/announcementsWipe.js'
import { runLeaveRequestWipeIfNeeded } from './Common/LeaveRequest/leaveRequestWipe.js'
import { runTaskManagementWipeIfNeeded } from './Common/TaskManagement/taskManagementWipe.js'
import { runEscalationManagementWipeIfNeeded } from './Common/EscalationManagement/escalationManagementWipe.js'
import { runDocumentsWipeIfNeeded } from './Common/Documents/documentsWipe.js'
import {
    migrateLegacyLeaveRequestsIfNeeded,
    migrateSessionLeaveRequestsToLocalIfNeeded,
} from './Common/LeaveRequest/leaveRequestData.js'
import { bootstrapDemoStores } from './Common/demoDomain/bootstrap.js'

runAcademicsWipeIfNeeded()
runFrontOfficePassWipeIfNeeded()
runActivitiesWipeIfNeeded()
runAnnouncementsWipeIfNeeded()
runLeaveRequestWipeIfNeeded()
runTaskManagementWipeIfNeeded()
runEscalationManagementWipeIfNeeded()
runDocumentsWipeIfNeeded()
migrateLegacyLeaveRequestsIfNeeded()
migrateSessionLeaveRequestsToLocalIfNeeded()
bootstrapDemoStores()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FinanceProvider>
          <App />
          <ToastContainer position="top-right" autoClose={2500} newestOnTop closeOnClick />
        </FinanceProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
