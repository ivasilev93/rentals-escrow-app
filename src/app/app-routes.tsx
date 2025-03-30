import { UiLayout } from '@/components/ui/ui-layout'
import { lazy } from 'react'
import { Navigate, RouteObject, useRoutes } from 'react-router-dom'
// import { RentalescrowFeature } from '../components/rentalescrow/rentalescrow-feature'

const AccountListFeature = lazy(() => import('../components/account/account-list-feature'))
const AccountDetailFeature = lazy(() => import('../components/account/account-detail-feature'))
const ClusterFeature = lazy(() => import('../components/cluster/cluster-feature'))
const RentalescrowFeature = lazy(() => import('../components/rentalescrow/rentalescrow-feature'))
const DashboardFeature = lazy(() => import('../components/dashboard/dashboard-feature'))
const HostFeature = lazy(() => import('../components/host/host-feature'))

const links: { label: string; path: string }[] = [
  { label: 'Account', path: '/account' },
  { label: 'Clusters', path: '/clusters' },
  { label: 'Book', path: '/book' },
  { label: 'Withdraw', path: '/host-withdraw' },
]

const routes: RouteObject[] = [
  { path: '/account/', element: <AccountListFeature /> },
  { path: '/account/:address', element: <AccountDetailFeature /> },
  { path: '/book', element: <RentalescrowFeature /> },
  { path: '/clusters', element: <ClusterFeature /> },
  { path: '/host-withdraw', element: <HostFeature /> },
]

export function AppRoutes() {
  const router = useRoutes([
    { index: true, element: <Navigate to={'/dashboard'} replace={true} /> },
    { path: '/dashboard', element: <DashboardFeature /> },
    ...routes,
    { path: '*', element: <Navigate to={'/dashboard'} replace={true} /> },
  ])
  return <UiLayout links={links}>{router}</UiLayout>
}
