import { Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import AuthLayout from "./Layout/AuthLayout";
import { ROLE_HOME_PATHS, ROLES, useAuth } from "./context/AuthContext";
import FeedbackState from './Common/ui/FeedbackState'
import './App.css'

const SuperAdminLayout = lazy(() => import("./Layout/SuperAdminLayout"));
const AdminLayout = lazy(() => import("./Layout/AdminLayout"));
const LibrarianLayout = lazy(() => import("./Layout/LibrarianLayout"));
const GateKeeperLayout = lazy(() => import("./Layout/GateKeeperLayout"));
const GateKeeperManagerLayout = lazy(() => import("./Layout/GateKeeperManagerLayout"));
const DirectorLayout = lazy(() => import("./Layout/DirectorLayout"));
const PrincipalLayout = lazy(() => import("./Layout/PrincipalLayout"));
const CanteenManagerLayout = lazy(() => import("./Layout/CanteenManagerLayout"));
const ITSupportManagerLayout = lazy(() => import("./Layout/ITSupportManagerLayout"));
const StationeryStoreManagerLayout = lazy(() => import("./Layout/StationeryStoreManagerLayout"));
const HousekeepingManagerLayout = lazy(() => import("./Layout/HousekeepingManagerLayout"));
const MaintenanceManagerLayout = lazy(() => import("./Layout/MaintenanceManagerLayout"));
const TransportManagerLayout = lazy(() => import("./Layout/TransportManagerLayout"));
const TeacherLayout = lazy(() => import("./Layout/TeacherLayout"));
const CoordinatorLayout = lazy(() => import("./Layout/CoordinatorLayout"));
const JointDirectorLayout = lazy(() => import("./Layout/JointDirectorLayout"));
const JointDirectorAssistantLayout = lazy(() => import("./Layout/JointDirectorAssistantLayout"));
const JointDirectorAuditLayout = lazy(() => import("./Layout/JointDirectorAuditLayout"));
const ProcessAuditorLayout = lazy(() => import("./Layout/ProcessAuditorLayout"));
const QualityAuditorLayout = lazy(() => import("./Layout/QualityAuditorLayout"));
const HRLayout = lazy(() => import("./Layout/HRLayout"));
const AccountHeadLayout = lazy(() => import("./Layout/AccountHeadLayout"));
const DriverLayout = lazy(() => import("./Layout/DriverLayout"));
const PRMLayout = lazy(() => import("./Layout/PRMLayout"));
const StudentLayout = lazy(() => import("./Layout/StudentLayout"));
const ParentLayout = lazy(() => import("./Layout/ParentLayout"));
const ProLayout = lazy(() => import('./Layout/ProLayout'));
const FileRoomLayout = lazy(() => import('./Layout/FileRoomLayout'));
const CctvLayout = lazy(() => import('./Layout/CctvLayout'));
const AppShell = lazy(() => import("./Layout/AppShell"));
const MyProfilePage = lazy(() => import("./Pages/Common/Profile/MyProfilePage"));
const EnterpriseSettingsPage = lazy(() => import("./Pages/Common/Settings/EnterpriseSettingsPage"));
const ApprovalCenterPage = lazy(() => import("./Pages/Common/Approvals/ApprovalCenterPage"));

const AUTH_ROUTES = ["/signin", "/login", "/signup", "/select-profile"];

const AppContent = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { isAuthenticated, isSessionReady, role } = useAuth();

  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (!isSessionReady) {
    return (
      <main className='grid min-h-screen place-items-center bg-[var(--erp-canvas)] p-4'>
        <FeedbackState kind='loading' title='Restoring your workspace' description='Checking the current browser session before loading role-specific information.' className='w-full max-w-xl' />
      </main>
    );
  }

  if (isAuthRoute) {
    if (isAuthenticated && role) {
      return <Navigate to={ROLE_HOME_PATHS[role] ?? "/dashboard"} replace />;
    }
    if (pathname === '/select-profile' || pathname === '/login') {
      return <Navigate to="/signin" replace state={location.state} />;
    }
    return <AuthLayout />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: { pathname, search: location.search } }} />;
  }

  if (pathname === '/my-profile') {
    return (
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading profile...</div>}>
        <AppShell roleKey={role} showBreadcrumb={true}>
          <MyProfilePage />
        </AppShell>
      </Suspense>
    );
  }

  if (pathname === '/settings') {
    return (
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading settings...</div>}>
        <AppShell roleKey={role} showBreadcrumb={true}>
          <EnterpriseSettingsPage />
        </AppShell>
      </Suspense>
    );
  }

  if (pathname === '/approvals') {
    return (
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading approval center...</div>}>
        <AppShell roleKey={role} showBreadcrumb={true}>
          <ApprovalCenterPage />
        </AppShell>
      </Suspense>
    );
  }

  if (pathname.startsWith("/van-driver")) {
    return <Navigate to={`${pathname.replace("/van-driver", "/driver")}${location.search}`} replace />;
  }

  if (pathname.startsWith("/admin/front-office/van-driver-list")) {
    return <Navigate to="/admin/front-office/driver-list" replace />;
  }

  if (pathname.startsWith("/admin/front-office/add-van-driver")) {
    return <Navigate to="/admin/front-office/add-driver" replace />;
  }

  if (pathname.startsWith("/admin/front-office/view-van-driver")) {
    return <Navigate to={`${pathname.replace("/admin/front-office/view-van-driver", "/admin/front-office/view-driver")}${location.search}`} replace />;
  }

  if (role === ROLES.STUDENT) {
    if (!pathname.startsWith("/student")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.STUDENT]} replace />;
    }
    return <StudentLayout />;
  }

  if (role === ROLES.PARENT) {
    if (!pathname.startsWith("/parent")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.PARENT]} replace />;
    }
    return <ParentLayout />;
  }

  if (role === ROLES.LIBRARIAN) {
    if (!pathname.startsWith("/librarian")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.LIBRARIAN]} replace />;
    }
    return <LibrarianLayout />;
  }

  if (role === ROLES.PRM) {
    if (!pathname.startsWith("/front-office")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.PRM]} replace />;
    }
    return <PRMLayout />;
  }

  if (role === ROLES.GATEKEEPER_MANAGER) {
    if (!pathname.startsWith("/gatekeeper-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.GATEKEEPER_MANAGER]} replace />;
    }
    return <GateKeeperManagerLayout />;
  }

  if (role === ROLES.GATEKEEPER) {
    if (!pathname.startsWith("/gate-keeper")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.GATEKEEPER]} replace />;
    }
    return <GateKeeperLayout />;
  }

  if (role === ROLES.DIRECTOR) {
    if (!pathname.startsWith("/director")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.DIRECTOR]} replace />;
    }
    return <DirectorLayout />;
  }

  if (role === ROLES.PRINCIPAL) {
    if (!pathname.startsWith("/principal")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.PRINCIPAL]} replace />;
    }
    return <PrincipalLayout />;
  }

  if (role === ROLES.CANTEEN_MANAGER) {
    if (!pathname.startsWith("/canteen-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.CANTEEN_MANAGER]} replace />;
    }
    return <CanteenManagerLayout />;
  }

  if (role === ROLES.IT_SUPPORT_MANAGER) {
    if (!pathname.startsWith("/it-support-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.IT_SUPPORT_MANAGER]} replace />;
    }
    return <ITSupportManagerLayout />;
  }

  if (role === ROLES.STATIONERY_STORE_MANAGER) {
    if (!pathname.startsWith("/stationery-store-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.STATIONERY_STORE_MANAGER]} replace />;
    }
    return <StationeryStoreManagerLayout />;
  }

  if (role === ROLES.HOUSEKEEPING_MANAGER) {
    if (!pathname.startsWith("/housekeeping-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.HOUSEKEEPING_MANAGER]} replace />;
    }
    return <HousekeepingManagerLayout />;
  }

  if (role === ROLES.MAINTENANCE_MANAGER) {
    if (!pathname.startsWith("/maintenance-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.MAINTENANCE_MANAGER]} replace />;
    }
    return <MaintenanceManagerLayout />;
  }

  if (role === ROLES.TRANSPORT_MANAGER) {
    if (!pathname.startsWith("/transport-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.TRANSPORT_MANAGER]} replace />;
    }
    return <TransportManagerLayout />;
  }

  if (role === ROLES.COORDINATOR) {
    if (!pathname.startsWith("/coordinator")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.COORDINATOR]} replace />;
    }
    return <CoordinatorLayout />;
  }

  if (role === ROLES.TEACHER) {
    if (!pathname.startsWith("/teacher")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.TEACHER]} replace />;
    }
    return <TeacherLayout />;
  }

  if (role === ROLES.PROCESS_AUDITOR) {
    if (!pathname.startsWith("/process-auditor")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.PROCESS_AUDITOR]} replace />;
    }
    return <ProcessAuditorLayout />;
  }

  if (role === ROLES.QUALITY_AUDITOR) {
    if (!pathname.startsWith("/quality-auditor")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.QUALITY_AUDITOR]} replace />;
    }
    return <QualityAuditorLayout />;
  }

  if (role === ROLES.HR) {
    if (!pathname.startsWith("/hr")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.HR]} replace />;
    }
    return <HRLayout />;
  }

  if (role === ROLES.ACCOUNT_HEAD) {
    if (!pathname.startsWith("/account-head")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.ACCOUNT_HEAD]} replace />;
    }
    return <AccountHeadLayout />;
  }

  if (role === ROLES.DRIVER) {
    if (!pathname.startsWith("/driver")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.DRIVER]} replace />;
    }
    return <DriverLayout />;
  }

  if (role === ROLES.JOINT_DIRECTOR_AUDIT) {
    if (!pathname.startsWith("/joint-director-audit")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.JOINT_DIRECTOR_AUDIT]} replace />;
    }
    return <JointDirectorAuditLayout />;
  }

  if (role === ROLES.JOINT_DIRECTOR_ASSISTANT) {
    if (!pathname.startsWith("/joint-director-assistant")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.JOINT_DIRECTOR_ASSISTANT]} replace />;
    }
    return <JointDirectorAssistantLayout />;
  }

  if (role === ROLES.JOINT_DIRECTOR) {
    if (
      !pathname.startsWith("/joint-director") ||
      pathname.startsWith("/joint-director-assistant") ||
      pathname.startsWith("/joint-director-audit")
    ) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.JOINT_DIRECTOR]} replace />;
    }
    return <JointDirectorLayout />;
  }

  if (role === ROLES.SUPER_ADMIN) {
    if (!pathname.startsWith("/super-admin")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.SUPER_ADMIN]} replace />;
    }
    return <SuperAdminLayout />;
  }

  if (role === ROLES.ADMIN) {
    if (!pathname.startsWith("/admin")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.ADMIN]} replace />;
    }
    return <AdminLayout />;
  }

  if (role === ROLES.PRO) {
    if (pathname !== "/pro" && !pathname.startsWith("/pro/")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.PRO]} replace />;
    }
    return <ProLayout />;
  }

  if (role === ROLES.FILE_ROOM) {
    if (!pathname.startsWith("/file-room")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.FILE_ROOM]} replace />;
    }
    return <FileRoomLayout />;
  }

  if (role === ROLES.CCTV) {
    if (!pathname.startsWith("/cctv")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.CCTV]} replace />;
    }
    return <CctvLayout />;
  }

  if (
    (pathname === "/pro" || pathname.startsWith("/pro/")) ||
    pathname.startsWith("/file-room") ||
    pathname.startsWith("/cctv") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/librarian") ||
    pathname.startsWith("/front-office") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/coordinator") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/gate-keeper") ||
    pathname.startsWith("/gatekeeper-manager") ||
    pathname.startsWith("/director") ||
    pathname.startsWith("/principal") ||
    pathname.startsWith("/canteen-manager") ||
    pathname.startsWith("/it-support-manager") ||
    pathname.startsWith("/stationery-store-manager") ||
    pathname.startsWith("/housekeeping-manager") ||
    pathname.startsWith("/maintenance-manager") ||
    pathname.startsWith("/transport-manager") ||
    pathname.startsWith("/process-auditor") ||
    pathname.startsWith("/quality-auditor") ||
    pathname.startsWith("/hr") ||
    pathname.startsWith("/account-head") ||
    pathname.startsWith("/driver") ||
    pathname.startsWith("/joint-director-audit") ||
    pathname.startsWith("/joint-director-assistant") ||
    pathname.startsWith("/joint-director")
  ) {
    return <Navigate to={ROLE_HOME_PATHS[role] ?? "/signin"} replace />;
  }

  return <Navigate to={ROLE_HOME_PATHS[role] ?? "/signin"} replace />;
}

const LayoutLoading = () => (
  <main className='grid min-h-screen place-items-center bg-[var(--erp-canvas)] p-4'>
    <FeedbackState
      kind='loading'
      title='Loading role workspace'
      description='Preparing the navigation and tools available to this signed-in role.'
      className='w-full max-w-xl'
    />
  </main>
)

const App = () => (
  <Suspense fallback={<LayoutLoading />}>
    <AppContent />
  </Suspense>
)

export default App
