import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useBedDetail } from '@/hooks/useBeds'
import { useCatalog } from '@/hooks/useCatalog'
import { BedGrid } from '@/components/beds/BedGrid'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { plantStatusColor, plantStatusLabel, daysSince, daysUntilHarvest } from '@/lib/utils'
import { toast } from 'sonner'
import type { BedPlantWithDetails, PlantStatus } from '@/types'

interface Props { householdId: string }

const ALL_STATUSES: PlantStatus[] = ['growing', 'ready_to_harvest', 'harvested', 'needs_trim', 'died']

export default function BedDetail({ householdId }: Props) {
  const { id } = useParams<{ id: string }>()
  const { bed, cells, createAndAssignPlant, updatePlantStatus, clearCell } = useBedDetail(id)
  const { vegetables } = useCatalog(householdId)
  const [selected, setSelected] = useState<BedPlantWithDetails | null>(null)
  const [vegId, setVegId] = useState('')
  const [plantedAt, setPlantedAt] = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState<PlantStatus>('growing')

  function openCell(cell: BedPlantWithDetails) {
    setSelected(cell)
    setVegId(cell.plant?.vegetable_id ?? '')
    setPlantedAt(cell.plant?.planted_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
    setStatus(cell.plant?.status ?? 'growing')
  }

  async function handleSave() {
    if (!selected) return
    try {
      if (selected.plant) {
        await updatePlantStatus.mutateAsync({ plantId: selected.plant.id, status })
        toast.success('Status updated')
      } else {
        if (!vegId) { toast.error('Select a vegetable'); return }
        await createAndAssignPlant.mutateAsync({
          cellId: selected.id,
          vegetableId: vegId,
          householdId,
          plantedAt: new Date(plantedAt).toISOString(),
        })
        toast.success('Plant added')
      }
      setSelected(null)
    } catch {
      toast.error('Could not save')
    }
  }

  async function handleClear() {
    if (!selected) return
    try {
      await clearCell.mutateAsync(selected.id)
      toast.success('Cell cleared')
      setSelected(null)
    } catch {
      toast.error('Could not clear cell')
    }
  }

  if (bed.isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (!bed.data) return <p className="text-muted-foreground">Bed not found</p>

  const plant = selected?.plant
  const vegetable = plant?.vegetable
  const daysPlanted = plant ? daysSince(plant.planted_at) : null
  const daysLeft = plant && vegetable ? daysUntilHarvest(plant.planted_at, vegetable.days_to_harvest) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/beds">
          <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{bed.data.name}</h1>
          <p className="text-muted-foreground text-sm">{bed.data.rows} × {bed.data.cols} grid</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {ALL_STATUSES.map(s => (
          <span key={s} className={`rounded-full border px-2 py-0.5 ${plantStatusColor(s)}`}>
            {plantStatusLabel(s)}
          </span>
        ))}
      </div>

      {cells.isLoading ? (
        <p className="text-muted-foreground">Loading cells…</p>
      ) : (
        <BedGrid bed={bed.data} cells={cells.data ?? []} onCellClick={openCell} />
      )}

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Cell ({selected?.row}, {selected?.col})
            </DialogTitle>
          </DialogHeader>

          {plant ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <p className="font-semibold">{vegetable?.name ?? 'Unknown plant'}</p>
                {daysPlanted !== null && <p className="text-muted-foreground">Planted {daysPlanted} days ago</p>}
                {daysLeft !== null && (
                  <p className={daysLeft <= 0 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                    {daysLeft <= 0 ? 'Ready to harvest!' : `~${daysLeft} days to harvest`}
                  </p>
                )}
                <Badge className={`mt-1 ${plantStatusColor(plant.status)}`}>{plantStatusLabel(plant.status)}</Badge>
              </div>

              <div className="space-y-1.5">
                <Label>Update status</Label>
                <Select value={status} onValueChange={v => setStatus(v as PlantStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{plantStatusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1" disabled={updatePlantStatus.isPending}>Save</Button>
                <Button variant="outline" onClick={handleClear} className="flex-1 text-destructive hover:text-destructive">Clear cell</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Vegetable</Label>
                <Select value={vegId} onValueChange={setVegId}>
                  <SelectTrigger><SelectValue placeholder="Select a vegetable…" /></SelectTrigger>
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
              <Button onClick={handleSave} className="w-full" disabled={createAndAssignPlant.isPending}>
                {createAndAssignPlant.isPending ? 'Planting…' : 'Plant here'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
