import { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen, Search, Loader } from 'lucide-react'
import { useCatalog } from '@/hooks/useCatalog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { VegetableCatalog } from '@/types'

interface Props { householdId: string }

const empty: Omit<VegetableCatalog, 'id' | 'household_id' | 'created_at'> & { spacing_inches: number | null } = {
  name: '',
  days_to_germinate: 7,
  days_to_harvest: 60,
  spacing_inches: null,
  companion_plants: null,
  bolt_info: null,
  notes: null
}

interface TrefleResult {
  id: number
  common_name: string
  scientific_name?: string
  duration?: string
  edible?: boolean
  average_height?: { cm?: number }
  growth_months?: number[]
  bloom_months?: number[]
}

async function searchTrefle(query: string): Promise<TrefleResult[]> {
  if (!query.trim()) return []
  try {
    const res = await fetch('/api/search-trefle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
    const data = await res.json()
    return data.data?.slice(0, 5) || []
  } catch (err) {
    console.error('Trefle search failed:', err)
    toast.error('Could not search Trefle')
    return []
  }
}

export default function Catalog({ householdId }: Props) {
  const { vegetables, addVegetable, updateVegetable, deleteVegetable } = useCatalog(householdId)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<VegetableCatalog | null>(null)
  const [form, setForm] = useState(empty)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TrefleResult[]>([])
  const [searching, setSearching] = useState(false)

  function openAdd() { setEditing(null); setForm(empty); setSearchQuery(''); setSearchResults([]); setOpen(true) }
  function openEdit(v: VegetableCatalog) {
    setEditing(v)
    setForm({
      name: v.name,
      days_to_germinate: v.days_to_germinate,
      days_to_harvest: v.days_to_harvest,
      spacing_inches: v.spacing_inches,
      companion_plants: v.companion_plants,
      bolt_info: v.bolt_info,
      notes: v.notes
    })
    setSearchQuery('')
    setSearchResults([])
    setOpen(true)
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    const results = await searchTrefle(searchQuery)
    setSearchResults(results)
    setSearching(false)
  }

  function selectTrefleResult(result: TrefleResult) {
    setForm(f => ({
      ...f,
      name: result.common_name || '',
      days_to_harvest: result.growth_months ? Math.max(...result.growth_months) * 30 : 60,
      notes: result.edible ? 'Edible variety' : f.notes
    }))
    setSearchResults([])
    setSearchQuery('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        await updateVegetable.mutateAsync({ id: editing.id, ...form })
        toast.success('Vegetable updated')
      } else {
        await addVegetable.mutateAsync({ ...form, household_id: householdId })
        toast.success(`${form.name} added to catalog`)
      }
      setOpen(false)
    } catch {
      toast.error('Could not save vegetable')
    }
  }

  async function handleDelete(v: VegetableCatalog) {
    if (!confirm(`Remove "${v.name}" from catalog?`)) return
    try {
      await deleteVegetable.mutateAsync(v.id)
      toast.success('Removed')
    } catch {
      toast.error('Could not delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vegetable Catalog</h1>
          <p className="text-muted-foreground">Your growable vegetable library</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />Add vegetable
        </Button>
      </div>

      {vegetables.data?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="font-medium">No vegetables yet</p>
            <p className="text-sm mt-1">Add vegetables to track germination and harvest times</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vegetables.data?.map(v => (
          <Card key={v.id} className="group hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{v.name}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(v)} className="text-muted-foreground hover:text-foreground p-1">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(v)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Germination</span>
                  <span className="font-medium text-foreground">{v.days_to_germinate}d</span>
                </div>
                <div className="flex justify-between">
                  <span>Days to harvest</span>
                  <span className="font-medium text-foreground">{v.days_to_harvest}d</span>
                </div>
                {v.spacing_inches && (
                  <div className="flex justify-between">
                    <span>Spacing</span>
                    <span className="font-medium text-foreground">{v.spacing_inches}"</span>
                  </div>
                )}
                {v.companion_plants && <p className="text-xs mt-2"><span className="font-medium">Companions:</span> {v.companion_plants}</p>}
                {v.notes && <p className="text-xs mt-2 italic">{v.notes}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add vegetable'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {!editing && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Search Trefle Database (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. tomato, carrot, lettuce…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={handleSearch} disabled={searching}>
                    {searching ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs text-muted-foreground">Click a result to import:</p>
                    {searchResults.map(result => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => selectTrefleResult(result)}
                        className="w-full text-left p-2 rounded border border-border hover:bg-accent transition-colors text-sm"
                      >
                        <div className="font-medium">{result.common_name}</div>
                        {result.scientific_name && <div className="text-xs text-muted-foreground italic">{result.scientific_name}</div>}
                        {result.edible && <div className="text-xs text-green-600">✓ Edible</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="e.g. Tomato" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Days to germinate</Label>
                <Input type="number" min={1} value={form.days_to_germinate} onChange={e => setForm(f => ({ ...f, days_to_germinate: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Days to harvest</Label>
                <Input type="number" min={1} value={form.days_to_harvest} onChange={e => setForm(f => ({ ...f, days_to_harvest: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Spacing (inches) — optional</Label>
              <Input type="number" min={1} placeholder="Distance between plants" value={form.spacing_inches || ''} onChange={e => setForm(f => ({ ...f, spacing_inches: e.target.value ? Number(e.target.value) : null }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Companion plants — optional</Label>
              <Input placeholder="e.g. Basil, Marigolds" value={form.companion_plants || ''} onChange={e => setForm(f => ({ ...f, companion_plants: e.target.value || null }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Bolt sensitivity — optional</Label>
              <Textarea placeholder="When does it bolt? How to manage…" value={form.bolt_info || ''} onChange={e => setForm(f => ({ ...f, bolt_info: e.target.value || null }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes — optional</Label>
              <Textarea placeholder="Growing tips, preferred conditions…" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))} rows={2} />
            </div>
            <Button type="submit" className="w-full" disabled={addVegetable.isPending || updateVegetable.isPending}>
              {editing ? 'Save changes' : 'Add to catalog'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
