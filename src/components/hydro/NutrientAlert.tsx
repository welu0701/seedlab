import { AlertTriangle, CheckCircle } from 'lucide-react'
import { nutrientDaysRemaining } from '@/lib/utils'
import type { HydroSystem } from '@/types'

export function NutrientAlert({ system }: { system: HydroSystem }) {
  const days = nutrientDaysRemaining(system.nutrient_last_refilled, system.nutrient_refill_days)
  const overdue = days <= 0
  const soon = days > 0 && days <= 3

  if (!overdue && !soon) return null

  return (
    <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${overdue ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
      {overdue ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle className="h-4 w-4 shrink-0" />}
      <span>
        {overdue
          ? `Nutrients overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`
          : `Nutrients due in ${days} day${days !== 1 ? 's' : ''}`}
      </span>
    </div>
  )
}
