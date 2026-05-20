import { useBeds } from '@/hooks/useBeds'
import { useHydro } from '@/hooks/useHydro'
import { useSeedLab } from '@/hooks/useSeedLab'
import { useCatalog } from '@/hooks/useCatalog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { plantStatusColor, plantStatusLabel, nutrientDaysRemaining, daysSince, isReadyToGerminate } from '@/lib/utils'
import { Rows3, Droplets, Sprout, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  householdId: string
}

export default function Dashboard({ householdId }: Props) {
  const { beds } = useBeds(householdId)
  const { systems } = useHydro(householdId)
  const { trays } = useSeedLab(householdId)
  const { vegetables } = useCatalog(householdId)

  const hydroAlerts = (systems.data ?? []).filter(s => {
    const remaining = nutrientDaysRemaining(s.nutrient_last_refilled, s.nutrient_refill_days)
    return remaining <= 3
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your garden at a glance</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<Rows3 className="h-5 w-5 text-primary" />} label="Raised Beds" value={beds.data?.length ?? 0} href="/beds" />
        <StatCard icon={<Droplets className="h-5 w-5 text-blue-500" />} label="Hydro Systems" value={systems.data?.length ?? 0} href="/hydro" />
        <StatCard icon={<Sprout className="h-5 w-5 text-green-500" />} label="Seed Trays" value={trays.data?.length ?? 0} href="/seedlab" />
        <StatCard icon={<span className="text-lg">🌿</span>} label="Catalog" value={vegetables.data?.length ?? 0} href="/catalog" />
      </div>

      {/* Hydro alerts */}
      {hydroAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Nutrient Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hydroAlerts.map(s => {
              const days = nutrientDaysRemaining(s.nutrient_last_refilled, s.nutrient_refill_days)
              return (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <Link to="/hydro" className="font-medium text-amber-900 hover:underline">{s.name}</Link>
                  <span className={days <= 0 ? 'text-red-600 font-semibold' : 'text-amber-700'}>
                    {days <= 0 ? `${Math.abs(days)}d overdue` : `Due in ${days}d`}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Quick tips */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Getting started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Add vegetables to your <Link to="/catalog" className="text-primary hover:underline font-medium">Catalog</Link> with their growth times.</p>
          <p>2. Create your <Link to="/beds" className="text-primary hover:underline font-medium">Raised Beds</Link> and configure the grid size.</p>
          <p>3. Set up any <Link to="/hydro" className="text-primary hover:underline font-medium">Hydroponic Systems</Link> and their nutrient schedules.</p>
          <p>4. Track germinating seeds in the <Link to="/seedlab" className="text-primary hover:underline font-medium">Seed Lab</Link>.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: number; href: string }) {
  return (
    <Link to={href}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-full bg-muted p-2">{icon}</div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
