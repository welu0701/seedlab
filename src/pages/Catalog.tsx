import { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen, Loader } from 'lucide-react'
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

const empty: Omit<VegetableCatalog, 'id' | 'household_id' | 'created_at'> = {
  name: '',
  days_to_germinate: 7,
  days_to_harvest: 60,
  spacing_inches: null,
  companion_plants: null,
  bolt_info: null,
  notes: null
}

const SEED_DATA: Array<Omit<VegetableCatalog, 'id' | 'household_id' | 'created_at'>> = [
  // Direct sow NOW
  { name: 'Peas', days_to_germinate: 7, days_to_harvest: 60, spacing_inches: 3, companion_plants: 'Sunflowers, squash (Three Sisters)', bolt_info: 'N/A - cool season', notes: 'Frost hardy. Direct sow NOW. Use teepee trellis. Needs cold to germinate.' },
  { name: 'Spinach', days_to_germinate: 5, days_to_harvest: 40, spacing_inches: 6, companion_plants: 'Any vegetable', bolt_info: 'Bolts in heat - plant in shade edges', notes: 'Direct sow NOW. Ready in 3-6 weeks. Plant in shadier edges near birch.' },
  { name: 'Mesclun Mix', days_to_germinate: 5, days_to_harvest: 20, spacing_inches: 8, companion_plants: 'Any vegetable', bolt_info: 'Ready in 20 days before bolting', notes: 'Direct sow NOW. Fastest win - ready to eat in 3 weeks. Great for kids!' },
  { name: 'Arugula', days_to_germinate: 5, days_to_harvest: 30, spacing_inches: 6, companion_plants: 'Any vegetable', bolt_info: 'Bolts quickly in heat', notes: 'Direct sow NOW. Plant in shade edges. Peppery flavor.' },
  { name: 'Kale', days_to_germinate: 5, days_to_harvest: 50, spacing_inches: 18, companion_plants: 'Brassicas, herbs', bolt_info: 'Slow to bolt - frost improves flavor', notes: 'Direct sow NOW. Cold hardy. Plant in shadier edges.' },
  { name: 'Mustard', days_to_germinate: 5, days_to_harvest: 45, spacing_inches: 6, companion_plants: 'Any vegetable', bolt_info: 'Bolts in heat', notes: 'Direct sow NOW. Peppery. Prefers cooler weather.' },
  { name: 'Lettuce', days_to_germinate: 5, days_to_harvest: 50, spacing_inches: 8, companion_plants: 'Any vegetable', bolt_info: 'Bolts in heat - long daylight triggers bolting', notes: 'Direct sow NOW. Plant in shade edges. Lasts longer before bolting.' },
  // Indoor start
  { name: 'Tomato', days_to_germinate: 7, days_to_harvest: 70, spacing_inches: 24, companion_plants: 'Basil, parsley, carrot', bolt_info: 'Heat lover - plant in center bed', notes: 'Start indoors NOW. Transplant after May 15. Center bed real estate.' },
  { name: 'Cherry Tomato', days_to_germinate: 7, days_to_harvest: 65, spacing_inches: 18, companion_plants: 'Basil', bolt_info: 'Heat lover', notes: 'Start indoors NOW. Great for kids! Pick your own section.' },
  { name: 'Pepper', days_to_germinate: 10, days_to_harvest: 75, spacing_inches: 18, companion_plants: 'Basil, onion', bolt_info: 'Heat lover - plant in center bed', notes: 'Start indoors NOW. Slow grower. Transplant after May 15.' },
  { name: 'Eggplant', days_to_germinate: 8, days_to_harvest: 70, spacing_inches: 24, companion_plants: 'Thyme, basil', bolt_info: 'Heat lover - full sun', notes: 'Start indoors NOW. Needs warmth. Slow to mature.' },
  { name: 'Brussels Sprouts', days_to_germinate: 5, days_to_harvest: 90, spacing_inches: 24, companion_plants: 'Brassicas, herbs', bolt_info: 'Cool season - harvest after first frost for sweetness', notes: 'Start indoors NOW. Fall crop. Frost improves taste.' },
  { name: 'Broccoli', days_to_germinate: 5, days_to_harvest: 60, spacing_inches: 18, companion_plants: 'Brassicas, herbs', bolt_info: 'Cool season - bolt in heat', notes: 'Start indoors NOW. Prefers cool weather.' },
  { name: 'Cabbage', days_to_germinate: 5, days_to_harvest: 70, spacing_inches: 18, companion_plants: 'Brassicas', bolt_info: 'Cool season crop', notes: 'Start indoors NOW. Dense heads need space.' },
  // After May 15
  { name: 'Cucumber', days_to_germinate: 7, days_to_harvest: 60, spacing_inches: 12, companion_plants: 'Radish, nasturtium', bolt_info: 'Repels beetles', notes: 'Direct sow after May 15. Use teepee trellis for vertical growth.' },
  { name: 'Asparagus Beans', days_to_germinate: 7, days_to_harvest: 55, spacing_inches: 4, companion_plants: 'Corn, squash (Three Sisters)', bolt_info: 'Nitrogen fixer - dramatic and fast', notes: 'Direct sow after May 15. Use teepee. Great for kids!' },
  { name: 'Yard-Long Beans', days_to_germinate: 10, days_to_harvest: 70, spacing_inches: 4, companion_plants: 'Corn, squash', bolt_info: 'Nitrogen fixer', notes: 'Direct sow after May 15. Teepee support. Asian variety.' },
  { name: 'Zucchini', days_to_germinate: 5, days_to_harvest: 50, spacing_inches: 36, companion_plants: 'Corn, beans (Three Sisters ground cover)', bolt_info: 'Heat lover - prolific producer', notes: 'Direct sow after May 15. One per center bed. Spreads wide.' },
  { name: 'Sugar Snap Peas', days_to_germinate: 7, days_to_harvest: 65, spacing_inches: 3, companion_plants: 'Sunflowers, squash', bolt_info: 'Cool season', notes: 'Direct sow NOW or after peas. Sweet pods. Great for kids!' },
  // Herbs
  { name: 'Rosemary', days_to_germinate: 14, days_to_harvest: 120, spacing_inches: 24, companion_plants: 'Cabbage, beans', bolt_info: 'Perennial - bring indoors for winter', notes: 'Start indoors NOW. Slow to germinate. Woody perennial.' },
  { name: 'Lavender', days_to_germinate: 14, days_to_harvest: 180, spacing_inches: 18, companion_plants: 'Most plants', bolt_info: 'Attracts pollinators', notes: 'Start indoors NOW. Slow. Fragrant companion flower.' },
  { name: 'Peppermint', days_to_germinate: 10, days_to_harvest: 60, spacing_inches: 12, companion_plants: 'Deters pests', bolt_info: 'INVASIVE - pot only! Will take over bed', notes: 'Pot only - never in ground. Spreads via rhizomes.' },
  // Flowers
  { name: 'Chamomile', days_to_germinate: 7, days_to_harvest: 60, spacing_inches: 12, companion_plants: 'All vegetables - strengthens neighbors', bolt_info: 'Attracts beneficial insects', notes: 'Direct sow NOW. Cold tolerant. Between pavers and edges.' },
  { name: 'Bachelor Button', days_to_germinate: 7, days_to_harvest: 50, spacing_inches: 6, companion_plants: 'All vegetables', bolt_info: 'Attracts predatory wasps', notes: 'Direct sow NOW. Scatter throughout bed. Fast blooming.' },
  { name: 'California Poppy', days_to_germinate: 7, days_to_harvest: 40, spacing_inches: 6, companion_plants: 'All vegetables', bolt_info: 'Repels some pests', notes: 'Direct sow NOW. Bright color. Cold tolerant.' },
  { name: 'Calendula', days_to_germinate: 7, days_to_harvest: 45, spacing_inches: 12, companion_plants: 'All vegetables - repels aphids', bolt_info: 'Edible petals', notes: 'Scatter throughout. Bright orange. Repels aphids.' },
  { name: 'Butterfly Weed', days_to_germinate: 14, days_to_harvest: 90, spacing_inches: 18, companion_plants: 'None - host plant', bolt_info: 'Monarch butterfly host plant', notes: 'Start indoors or direct sow. Supports monarchs.' },
  { name: 'Sunflower', days_to_germinate: 7, days_to_harvest: 80, spacing_inches: 12, companion_plants: 'Beans, squash (Three Sisters corn)', bolt_info: 'Wind shelter - north end of bed', notes: 'Direct sow after May 15. Plant north end - won\'t shade. Tall barrier.' },
  { name: 'Sweet Alyssum', days_to_germinate: 7, days_to_harvest: 40, spacing_inches: 6, companion_plants: 'All plants', bolt_info: 'Attracts pollinators', notes: 'Direct sow NOW. Between pavers. Ground cover flowers.' },
]

export default function Catalog({ householdId }: Props) {
  const { vegetables, addVegetable, updateVegetable, deleteVegetable } = useCatalog(householdId)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<VegetableCatalog | null>(null)
  const [form, setForm] = useState(empty)
  const [seeding, setSeeding] = useState(false)

  function openAdd() { setEditing(null); setForm(empty); setOpen(true) }
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
    setOpen(true)
  }

  async function handleSeedCatalog() {
    if (!confirm(`Add ${SEED_DATA.length} vegetables from the Victory Garden plan?`)) return
    setSeeding(true)
    try {
      for (const plant of SEED_DATA) {
        await addVegetable.mutateAsync({ ...plant, household_id: householdId })
      }
      toast.success(`Seeded catalog with ${SEED_DATA.length} plants!`)
    } catch (error) {
      console.error('Seed error:', error)
      toast.error('Could not seed catalog')
    } finally {
      setSeeding(false)
    }
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
        <div className="flex gap-2">
          {vegetables.data?.length === 0 && (
            <Button onClick={handleSeedCatalog} disabled={seeding} variant="outline">
              {seeding ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
              Seed default plants
            </Button>
          )}
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />Add vegetable
          </Button>
        </div>
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
