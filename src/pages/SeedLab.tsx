import { useState } from 'react'
import { Plus, Trash2, Sprout } from 'lucide-react'
import { useSeedLab } from '@/hooks/useSeedLab'
import { useCatalog } from '@/hooks/useCatalog'
import { TrayGrid } from '@/components/seedlab/TrayGrid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trayStatusLabel, trayStatusColor, daysSince } from '@/lib/utils'
import { toast } from 'sonner'
import type { TrayCellWithDetails } from '@/types'
import { supabase } from '@/lib/supabase'

interface Props { householdId: string }

export default function SeedLab({ householdId }: Props) {
  const { trays, addTray, deleteTray, seedCell, updateCellStatus, clearCell } = useSeedLab(householdId)
  const { vegetables } = useCatalog(householdId)
  const [trayOpen, setTrayOpen] = useState(false)
  const [trayName, setTrayName] = useState('')
  const [cellCount, setCellCount] = useState(72)
  const [selectedTray, setSelectedTray] = useState<string | null>(null)
  const [selectedCell, setSelectedCell] = useState<TrayCellWithDetails | null>(null)
  const [vegId, setVegId] = useState('')
  const [plantedAt, setPlantedAt] = useState(new Date().toISOString().slice(0, 10))

  // Per-tray cells — fetched lazily when a tray is expanded
  const [trayCells, setTrayCells] = useState<Record<string, TrayCellWithDetails[]>>({})

  async function loadCells(trayId: string) {
    if (trayCells[trayId]) return
    const { data, error } = await supabase
      .from('tray_cells')
      .select('*, vegetable:vegetable_catalog(*)')
      .eq('tray_id', trayId)
      .order('cell_number')
    if (!error && data) {
      setTrayCells(prev => ({ ...prev, [trayId]: data as TrayCellWithDetails[] }))
    }
  }

  async function refreshCells(trayId: string) {
    const { data, error } = await supabase
      .from('tray_cells')
      .select('*, vegetable:vegetable_catalog(*)')
      .eq('tray_id', trayId)
      .order('cell_number')
    if (!error && data) {
      setTrayCells(prev => ({ ...prev, [trayId]: data as TrayCellWithDetails[] }))
    }
  }

  function toggleTray(trayId: string) {
    if (selectedTray === trayId) {
      setSelectedTray(null)
    } else {
      setSelectedTray(trayId)
      loadCells(trayId)
    }
  }

  async function handleAddTray(e: React.FormEvent) {
    e.preventDefault()
    try {
      await addTray.mutateAsync({ name: trayName, cell_count: cellCount, household_id: householdId })
      toast.success(`Tray "${trayName}" created`)
      setTrayOpen(false)
      setTrayName('')
    } catch {
      toast.error('Could not create tray')
    }
  }

  async function handleSeedCell() {
    if (!selectedCell || !vegId) { toast.error('Select a vegetable'); return }
    try {
      await seedCell.mutateAsync({ cellId: selectedCell.id, vegetableId: vegId, plantedAt: new Date(plantedAt).toISOString() })
      if (selectedTray) await refreshCells(selectedTray)
      toast.success('Cell seeded')
      setSelectedCell(null)
    } catch {
      toast.error('Could not seed cell')
    }
  }

  async function handleMarkMoved() {
    if (!selectedCell) return
    try {
      await updateCellStatus.mutateAsync({ cellId: selectedCell.id, status: 'moved' })
      if (selectedTray) await refreshCells(selectedTray)
      toast.success('Marked as moved')
      setSelectedCell(null)
    } catch {
      toast.error('Could not update')
    }
  }

  async function handleClear() {
    if (!selectedCell) return
    try {
      await clearCell.mutateAsync(selectedCell.id)
      if (selectedTray) await refreshCells(selectedTray)
      toast.success('Cell cleared')
      setSelectedCell(null)
    } catch {
      toast.error('Could not clear')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seed Lab</h1>
          <p className="text-muted-foreground">Track germinating seeds in trays</p>
        </div>
        <Dialog open={trayOpen} onOpenChange={setTrayOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />Add tray</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New seed tray</DialogTitle></DialogHeader>
            <form onSubmit={handleAddTray} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Tray name</Label>
                <Input placeholder="e.g. Spring 2025" value={trayName} onChange={e => setTrayName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Cell count</Label>
                <Input type="number" min={1} max={288} value={cellCount} onChange={e => setCellCount(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground">Common sizes: 36, 50, 72, 128, 200</p>
              </div>
              <Button type="submit" className="w-full" disabled={addTray.isPending}>Create tray</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {trays.data?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Sprout className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="font-medium">No seed trays yet</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {trays.data?.map(tray => {
          const cells = trayCells[tray.id] ?? []
          const isOpen = selectedTray === tray.id
          const readyCount = cells.filter(c => {
            if (!c.planted_at || !c.vegetable) return false
            return daysSince(c.planted_at) >= c.vegetable.days_to_germinate && c.status === 'germinating'
          }).length

          return (
            <Card key={tray.id}>
              <CardHeader
                className="cursor-pointer select-none pb-3"
                onClick={() => toggleTray(tray.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-green-500" />
                      {tray.name}
                      {readyCount > 0 && (
                        <span className="rounded-full bg-amber-100 text-amber-800 text-xs px-2 py-0.5 font-semibold">
                          {readyCount} ready to move
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>{tray.cell_count} cells · click to {isOpen ? 'collapse' : 'expand'}</CardDescription>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); if (confirm(`Delete "${tray.name}"?`)) deleteTray.mutate(tray.id) }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              {isOpen && (
                <CardContent>
                  {cells.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Loading cells…</p>
                  ) : (
                    <TrayGrid cells={cells} onCellClick={cell => { setSelectedCell(cell); setVegId(''); setPlantedAt(new Date().toISOString().slice(0, 10)) }} />
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      <Dialog open={!!selectedCell} onOpenChange={open => !open && setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cell #{selectedCell?.cell_number}</DialogTitle>
          </DialogHeader>
          {selectedCell?.vegetable_id ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <p className="font-semibold">{selectedCell.vegetable?.name ?? 'Unknown'}</p>
                {selectedCell.planted_at && (
                  <p className="text-muted-foreground">Seeded {daysSince(selectedCell.planted_at)} days ago</p>
                )}
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${trayStatusColor(selectedCell.status)}`}>
                  {trayStatusLabel(selectedCell.status)}
                </span>
              </div>
              <div className="flex gap-2">
                {selectedCell.status !== 'moved' && (
                  <Button onClick={handleMarkMoved} className="flex-1">Mark as moved</Button>
                )}
                <Button variant="outline" onClick={handleClear} className="flex-1 text-destructive hover:text-destructive">Clear cell</Button>
              </div>
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
                <Label>Date seeded</Label>
                <Input type="date" value={plantedAt} onChange={e => setPlantedAt(e.target.value)} />
              </div>
              <Button onClick={handleSeedCell} className="w-full" disabled={seedCell.isPending}>Seed this cell</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
