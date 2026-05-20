import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, ChevronRight } from 'lucide-react'
import { useBeds } from '@/hooks/useBeds'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Props { householdId: string }

export default function RaisedBeds({ householdId }: Props) {
  const { beds, addBed, deleteBed } = useBeds(householdId)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [rows, setRows] = useState(4)
  const [cols, setCols] = useState(4)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    try {
      await addBed.mutateAsync({ name, rows, cols, household_id: householdId })
      toast.success(`Bed "${name}" created`)
      setOpen(false)
      setName('')
      setRows(4)
      setCols(4)
    } catch {
      toast.error('Could not create bed')
    }
  }

  async function handleDelete(id: string, bedName: string) {
    if (!confirm(`Delete "${bedName}"? This will remove all plant assignments.`)) return
    try {
      await deleteBed.mutateAsync(id)
      toast.success('Bed deleted')
    } catch {
      toast.error('Could not delete bed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Raised Beds</h1>
          <p className="text-muted-foreground">Manage your outdoor garden beds</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Add bed
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New raised bed</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Bed name</Label>
                <Input placeholder="e.g. North Bed" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Rows</Label>
                  <Input type="number" min={1} max={20} value={rows} onChange={e => setRows(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Columns</Label>
                  <Input type="number" min={1} max={20} value={cols} onChange={e => setCols(Number(e.target.value))} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{rows * cols} cells will be created</p>
              <Button type="submit" className="w-full" disabled={addBed.isPending}>
                {addBed.isPending ? 'Creating…' : 'Create bed'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {beds.isLoading && <p className="text-muted-foreground">Loading…</p>}

      {beds.data?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="mb-2 font-medium">No beds yet</p>
            <p className="text-sm">Add your first raised bed to get started</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {beds.data?.map(bed => (
          <Card key={bed.id} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{bed.name}</CardTitle>
                <button
                  onClick={() => handleDelete(bed.id, bed.name)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{bed.rows} × {bed.cols} grid · {bed.rows * bed.cols} cells</p>
            </CardHeader>
            <CardContent>
              {/* Mini grid preview */}
              <div
                className="grid gap-0.5 mb-3"
                style={{ gridTemplateColumns: `repeat(${Math.min(bed.cols, 8)}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: Math.min(bed.rows * bed.cols, 32) }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-sm bg-green-100 border border-green-200" />
                ))}
                {bed.rows * bed.cols > 32 && (
                  <div className="aspect-square rounded-sm bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <span className="text-[8px] text-gray-400">…</span>
                  </div>
                )}
              </div>
              <Link to={`/beds/${bed.id}`}>
                <Button variant="outline" size="sm" className="w-full gap-1">
                  Open grid <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
