import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useHousehold } from '@/hooks/useHousehold'
import { Layout } from '@/components/layout/Layout'
import Login from '@/pages/Login'
import HouseholdSetup from '@/pages/HouseholdSetup'
import Dashboard from '@/pages/Dashboard'
import RaisedBeds from '@/pages/RaisedBeds'
import BedDetail from '@/pages/BedDetail'
import HydroSystem from '@/pages/HydroSystem'
import SeedLab from '@/pages/SeedLab'
import Catalog from '@/pages/Catalog'
import Settings from '@/pages/Settings'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading…</div>
    </div>
  )
}

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { household, householdId, loading: householdLoading } = useHousehold(user?.id)

  if (authLoading || (user && householdLoading)) return <LoadingScreen />
  if (!user) return <Login />
  if (!household) return <HouseholdSetup userId={user.id} />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard householdId={householdId!} />} />
        <Route path="/beds" element={<RaisedBeds householdId={householdId!} />} />
        <Route path="/beds/:id" element={<BedDetail householdId={householdId!} />} />
        <Route path="/hydro" element={<HydroSystem householdId={householdId!} />} />
        <Route path="/seedlab" element={<SeedLab householdId={householdId!} />} />
        <Route path="/catalog" element={<Catalog householdId={householdId!} />} />
        <Route path="/settings" element={<Settings householdId={householdId!} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
