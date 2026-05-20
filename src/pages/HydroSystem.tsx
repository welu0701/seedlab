import { useState } from 'react'
import { Plus, Droplets, Trash2, RefreshCw } from 'lucide-react'
import { useHydro } from '@/hooks/useHydro'
import { useCatalog } from '@/hooks/useCatalog'
import { NutrientAlert } from '@/components/hydro/NutrientAlert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { plantStatusColor, plantStatusLabel, daysSince, nutrientDaysRemaining } from '@/lib/utils'
import { toast } from 'sonner'
import type { HydroSlotWithDetails } from '@/types'

interface Props { householdId: string }

export default function HydroSystem({ householdId }: Props) {
  const { systems, addSystem, deleteSystem, logNutrientRefill, slots, assignSlot, clearSlot } = useHydro(householdId)
  const { vegetables } = useCatalog(householdId)
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [slotCount, setSlotCount] = useState(8)
  const [refillDays, setRefillDays] = useState(14)
  const [selectedSlot, setSelectedSlot] = useState<HydroSlotWithDetails | null>(null)
  const [vegId, setVegId] = useState('')
  const [plantedAt, setPlantedAt] = useState(new Date().toISOString().slice(0, 10))

  async function handleAddSystem(e: React.FormEvent) {
    e.preventDefault()
    try {
      await addSystem.mutateAsync({ name, slot_count: slotCount, nutrient_refill_days: refillDays, household_id: householdId })
      toast.success(`System "${name}" created`)
      setAddOpen(false)
      setName('')
    } catch {
      toast.error('Could not create system')
    }
  }

  async function handleRefill(systemId: string) {
    try {
      await logNutrientRefill.mutateAsync(systemId)
      toast.success('Nutrient refill logged!')
    } catch {
      toast.error('Could not log refill')
    }
  }

  async function handleAssign() {
    if (!selectedSlot || !vegId) { toast.error('Select a vegetable'); return }
    try {
      await assignSlot.mutateAsync({
        slotId: selectedSlot.id,
        vegetableId: vegId,
        householdId,
        plantedAt: new Date(plantedAt).toISOString(),
      })
      toast.success('Slot assigned')
      setSelectedSlot(null)
    } catch {
      toast.error('Could not assign slot')
    }
  }

  async function handleClear() {
    if (!selectedSlot) return
    try {
      await clearSlot.mutateAsync(selectedSlot.id)
      toast.success('Slot cleared')
      setSelectedSlot(null)
    } catch {
      toast.error('Could not clear slot')
    }
  }

  const slotsMap = new Map<string, HydroSlotWithDetails[]>()
  for (const slot of slots.data ?? []) {
    const arr = slotsMap.get(slot.system_id) ?? []
    arr.push(slot)
    slotsMap.set(slot.system_id, arr)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hydroponics</h1>
          <p className="text-muted-foreground">Manage your hydroponic systems</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />Add system</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New hydroponic system</DialogTitle></DialogHeader>
            <form onSubmit={handleAddSystem} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>System name</Label>
                <Input placeholder="e.g. Basement NFT" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Slots</Label>
                  <Input type="number" min={1} max={100} value={slotCount} onChange={e => setSlotCount(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Refill every (days)</Label>
                  <Input type="number" min={1} max={90} value={refillDays} onChange={e => setRefillDays(Number(e.target.value))} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={addSystem.isPending}>Create system</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {systems.data?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Droplets className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="font-medium">No hydroponic systems yet</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {systems.data?.map(system => {
          const systemSlots = slotsMap.get(system.id) ?? []
          const daysRemaining = nutrientDaysRemaining(system.nutrient_last_refilled, system.nutrient_refill_days)
          return (
            <Card key={system.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      {system.name}
                    </CardTitle>
                    <CardDescription>{system.slot_count} slots · Nutrients every {system.nutrient_refill_days} days</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRefill(system.id)} disabled={logNutrientRefill.isPending}>
                      <RefreshCw className="h-3 w-3" />
                      Refilled
                    </Button>
                    <button
                      onClick={() => { if (confirm(`Delete "${system.name}"?`)) deleteSystem.mutate(system.id) }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <NutrientAlert system={system} />
                {system.nutrient_last_refilled && daysRemaining > 3 && (
                  <p className="text-xs text-muted-foreground">
                    Last refilled {daysSince(system.nutrient_last_refilled)} days ago · {daysRemaining} days remaining
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
                  {systemSlots.map(slot => {
                    const plant = slot.plant
                    return (
                      <button
                        key={slot.id}
                        onClick={() => { setSelectedSlot(slot); setVegId(''); setPlantedAt(new Date().toISOString().slice(0, 10)) }}
                        className={`relative flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-all hover:scale-105 aspect-square text-xs ${plant ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                      >
                        <span className="font-mono text-[9px] text-muted-foreground absolute top-0.5 left-1">{slot.slot_number}</span>
                        {plant ? (
                          <>
                            <span className="font-semibold text-[9px] mt-2 truncate w-full text-center">{plant.vegetable?.name ?? '?'}</span>
                            <Badge className={`mt-0.5 text-[7px] px-1 py-0 ${plantStatusColor(plant.status)}`}>{plantStatusLabel(plant.status)}</Badge>
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground mt-2">+</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!selectedSlot} onOpenChange={open => !open && setSelectedSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slot #{selectedSlot?.slot_number}</DialogTitle>
          </DialogHeader>
          {selectedSlot?.plant ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <p className="font-semibold">{selectedSlot.plant.vegetable?.name ?? 'Unknown'}</p>
                <p className="text-muted-foreground">Planted {daysSince(selectedSlot.plant.planted_at)} days ago</p>
                <Badge className={plantStatusColor(selectedSlot.plant.status)}>{plantStatusLabel(selectedSlot.plant.status)}</Badge>
              </div>
              <Button variant="outline" onClick={handleClear} className="w-full text-destructive hover:text-destructive">Clear slot</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Vegetable</Label>
                <Select value={vegId} onValueChange={setVegId}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {(vegetables.data ?? []).map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date planted</Label>
                <Input type="date" value={plantedAt} onChange={e => setPlantedAt(e.target.value)} />
              </div>
              <Button onClick={handleAssign} className="w-full" disabled={assignSlot.isPending}>Plant here</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
