import { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { useCatalog } from '@/hooks/useCatalog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { VegetableCatalog } from '@/types'

interface Props { householdId: string }

const empty = { name: '', days_to_germinate: 7, days_to_harvest: 60, notes: '' }

export default function Catalog({ householdId }: Props) {
  const { vegetables, addVegetable, updateVegetable, deleteVegetable } = useCatalog(householdId)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<VegetableCatalog | null>(null)
  const [form, setForm] = useState(empty)

  function openAdd() { setEditing(null); setForm(empty); setOpen(true) }
  function openEdit(v: VegetableCatalog) {
    setEditing(v)
    setForm({ name: v.name, days_to_germinate: v.days_to_germinate, days_to_harvest: v.days_to_harvest, notes: v.notes ?? '' })
    setOpen(true)
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
                {v.notes && <p className="text-xs mt-2 italic">{v.notes}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add vegetable'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
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
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Growing tips, preferred conditions…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
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
