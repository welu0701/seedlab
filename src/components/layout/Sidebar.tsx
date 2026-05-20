import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Rows3, Droplets, Sprout, BookOpen, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/beds', icon: Rows3, label: 'Raised Beds' },
  { to: '/hydro', icon: Droplets, label: 'Hydroponics' },
  { to: '/seedlab', icon: Sprout, label: 'Seed Lab' },
  { to: '/catalog', icon: BookOpen, label: 'Catalog' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { signOut } = useAuth()

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-card">
      <div className="flex items-center gap-2 px-5 py-5 border-b">
        <Sprout className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight text-primary">SeedLab</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
