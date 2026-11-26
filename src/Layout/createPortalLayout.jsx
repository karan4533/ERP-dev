import AppShell from './AppShell'

const createPortalLayout = ({ roleKey, RoutesComponent, showBreadcrumb }) => {
    const PortalLayout = () => (
        <AppShell roleKey={roleKey} showBreadcrumb={showBreadcrumb}>
            <RoutesComponent />
        </AppShell>
    )

    PortalLayout.displayName = `${RoutesComponent.displayName || RoutesComponent.name || 'Portal'}Layout`
    return PortalLayout
}

export default createPortalLayout
