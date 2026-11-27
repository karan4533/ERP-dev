import React, { Suspense, lazy } from "react";
import { Navigate, useLocation } from "react-router-dom";
import ChangePassword from "./Pages/Authentication/ChangePassword";
import { ROLE_HOME_PATHS, ROLES, useAuth } from "./context/AuthContext";
import { isPathUnder } from "./utils/pathPrefix";
import './App.css'

const AuthLayout = lazy(() => import("./Layout/AuthLayout"));
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
const ProLayout = lazy(() => import("./Layout/ProLayout"));
const FileRoomLayout = lazy(() => import("./Layout/FileRoomLayout"));
const CctvRoomLayout = lazy(() => import("./Layout/CctvRoomLayout"));
const StudentLayout = lazy(() => import("./Layout/StudentLayout"));
const ParentLayout = lazy(() => import("./Layout/ParentLayout"));

const AUTH_ROUTES = ["/signin", "/signup", "/select-profile"];

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-sm text-[#667085]">
    Loading panel…
  </div>
);

const withSuspense = (node) => <Suspense fallback={<RouteFallback />}>{node}</Suspense>;

const App = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { isAuthenticated, role, mustChangePassword } = useAuth();

  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (pathname === "/change-password") {
    return <ChangePassword />;
  }

  if (isAuthRoute) {
    if (isAuthenticated && role) {
      if (mustChangePassword) {
        return <Navigate to="/change-password" replace />;
      }
      return <Navigate to={ROLE_HOME_PATHS[role] ?? "/dashboard"} replace />;
    }
    return withSuspense(<AuthLayout />);
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />;
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
    return withSuspense(<StudentLayout />);
  }

  if (role === ROLES.PARENT) {
    if (!pathname.startsWith("/parent")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.PARENT]} replace />;
    }
    return withSuspense(<ParentLayout />);
  }

  if (role === ROLES.LIBRARIAN) {
    if (!pathname.startsWith("/librarian")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.LIBRARIAN]} replace />;
    }
    return withSuspense(<LibrarianLayout />);
  }

  if (role === ROLES.PRO) {
    // Use segment match so `/process-auditor` is never treated as the PRO portal.
    if (!isPathUnder(pathname, "/pro")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.PRO]} replace />;
    }
    return withSuspense(<ProLayout />);
  }

  if (role === ROLES.PRM) {
    if (!isPathUnder(pathname, "/front-office")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.PRM]} replace />;
    }
    return withSuspense(<PRMLayout />);
  }

  if (role === ROLES.GATEKEEPER_MANAGER) {
    if (!pathname.startsWith("/gatekeeper-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.GATEKEEPER_MANAGER]} replace />;
    }
    return withSuspense(<GateKeeperManagerLayout />);
  }

  if (role === ROLES.GATEKEEPER) {
    if (!pathname.startsWith("/gate-keeper")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.GATEKEEPER]} replace />;
    }
    return withSuspense(<GateKeeperLayout />);
  }

  if (role === ROLES.DIRECTOR) {
    if (!pathname.startsWith("/director")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.DIRECTOR]} replace />;
    }
    return withSuspense(<DirectorLayout />);
  }

  if (role === ROLES.PRINCIPAL) {
    if (!pathname.startsWith("/principal")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.PRINCIPAL]} replace />;
    }
    return withSuspense(<PrincipalLayout />);
  }

  if (role === ROLES.CANTEEN_MANAGER) {
    if (!pathname.startsWith("/canteen-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.CANTEEN_MANAGER]} replace />;
    }
    return withSuspense(<CanteenManagerLayout />);
  }

  if (role === ROLES.IT_SUPPORT_MANAGER) {
    if (!pathname.startsWith("/it-support-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.IT_SUPPORT_MANAGER]} replace />;
    }
    return withSuspense(<ITSupportManagerLayout />);
  }

  if (role === ROLES.STATIONERY_STORE_MANAGER) {
    if (!pathname.startsWith("/stationery-store-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.STATIONERY_STORE_MANAGER]} replace />;
    }
    return withSuspense(<StationeryStoreManagerLayout />);
  }

  if (role === ROLES.HOUSEKEEPING_MANAGER) {
    if (!pathname.startsWith("/housekeeping-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.HOUSEKEEPING_MANAGER]} replace />;
    }
    return withSuspense(<HousekeepingManagerLayout />);
  }

  if (role === ROLES.MAINTENANCE_MANAGER) {
    if (!pathname.startsWith("/maintenance-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.MAINTENANCE_MANAGER]} replace />;
    }
    return withSuspense(<MaintenanceManagerLayout />);
  }

  if (role === ROLES.TRANSPORT_MANAGER) {
    if (!pathname.startsWith("/transport-manager")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.TRANSPORT_MANAGER]} replace />;
    }
    return withSuspense(<TransportManagerLayout />);
  }

  if (role === ROLES.COORDINATOR) {
    if (!pathname.startsWith("/coordinator")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.COORDINATOR]} replace />;
    }
    return withSuspense(<CoordinatorLayout />);
  }

  if (role === ROLES.TEACHER) {
    if (!pathname.startsWith("/teacher")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.TEACHER]} replace />;
    }
    return withSuspense(<TeacherLayout />);
  }

  if (role === ROLES.PROCESS_AUDITOR) {
    if (!pathname.startsWith("/process-auditor")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.PROCESS_AUDITOR]} replace />;
    }
    return withSuspense(<ProcessAuditorLayout />);
  }

  if (role === ROLES.QUALITY_AUDITOR) {
    if (!pathname.startsWith("/quality-auditor")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.QUALITY_AUDITOR]} replace />;
    }
    return withSuspense(<QualityAuditorLayout />);
  }

  if (role === ROLES.HR) {
    if (!pathname.startsWith("/hr")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.HR]} replace />;
    }
    return withSuspense(<HRLayout />);
  }

  if (role === ROLES.FILE_ROOM) {
    if (!pathname.startsWith("/file-room")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.FILE_ROOM]} replace />;
    }
    return withSuspense(<FileRoomLayout />);
  }

  if (role === ROLES.CCTV) {
    if (!pathname.startsWith("/cctv-room")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.CCTV]} replace />;
    }
    return withSuspense(<CctvRoomLayout />);
  }

  if (
    role === ROLES.ACCOUNT_HEAD
    || role === ROLES.FINANCE_MANAGER
    || role === ROLES.ACCOUNT_ASSISTANT
    || role === ROLES.FINANCE_ASSISTANT
  ) {
    if (!pathname.startsWith("/account-head")) {
      return <Navigate to={ROLE_HOME_PATHS[role] ?? ROLE_HOME_PATHS[ROLES.ACCOUNT_HEAD]} replace />;
    }
    return withSuspense(<AccountHeadLayout />);
  }

  if (role === ROLES.DRIVER) {
    if (!pathname.startsWith("/driver")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.DRIVER]} replace />;
    }
    return withSuspense(<DriverLayout />);
  }

  if (role === ROLES.JOINT_DIRECTOR_AUDIT) {
    if (!pathname.startsWith("/joint-director-audit")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.JOINT_DIRECTOR_AUDIT]} replace />;
    }
    return withSuspense(<JointDirectorAuditLayout />);
  }

  if (role === ROLES.JOINT_DIRECTOR_ASSISTANT) {
    if (!pathname.startsWith("/joint-director-assistant")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.JOINT_DIRECTOR_ASSISTANT]} replace />;
    }
    return withSuspense(<JointDirectorAssistantLayout />);
  }

  if (role === ROLES.JOINT_DIRECTOR) {
    if (
      !pathname.startsWith("/joint-director") ||
      pathname.startsWith("/joint-director-assistant") ||
      pathname.startsWith("/joint-director-audit")
    ) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.JOINT_DIRECTOR]} replace />;
    }
    return withSuspense(<JointDirectorLayout />);
  }

  if (role === ROLES.SUPER_ADMIN) {
    if (!pathname.startsWith("/super-admin")) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.SUPER_ADMIN]} replace />;
    }
    return withSuspense(<SuperAdminLayout />);
  }

  if (role === ROLES.ADMIN) {
    if (!pathname.startsWith("/admin") && pathname !== "/dashboard") {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.ADMIN]} replace />;
    }
    return withSuspense(<AdminLayout />);
  }

  if (
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/librarian") ||
    pathname.startsWith("/front-office") ||
    isPathUnder(pathname, "/pro") ||
    pathname.startsWith("/file-room") ||
    pathname.startsWith("/cctv-room") ||
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
    return <Navigate to={ROLE_HOME_PATHS[ROLES.ADMIN]} replace />;
  }

  return <Navigate to={ROLE_HOME_PATHS[ROLES.ADMIN]} replace />;
}

export default App
