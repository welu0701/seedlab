import { useState } from 'react'
import { Home, Users } from 'lucide-react'
import { useHousehold } from '@/hooks/useHousehold'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function HouseholdSetup({ userId }: { userId: string }) {
  const { createHousehold, joinHousehold } = useHousehold(userId)
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await createHousehold.mutateAsync({ name, userId })
    } catch {
      toast.error('Could not create household')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await joinHousehold.mutateAsync({ inviteCode: code, userId })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid invite code')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'choose') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Welcome to SeedLab</h1>
            <p className="text-muted-foreground mt-1">Set up your household to get started</p>
          </div>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setMode('create')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Create a household</CardTitle>
                  <CardDescription>Start fresh and invite your partner</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setMode('join')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Join a household</CardTitle>
                  <CardDescription>Enter an invite code from your partner</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Name your household</CardTitle>
            <CardDescription>This is how your garden will be labelled</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="hname">Household name</Label>
                <Input id="hname" placeholder="e.g. The Weber Garden" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating…' : 'Create household'}</Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode('choose')}>Back</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Enter invite code</CardTitle>
          <CardDescription>Ask your partner for the 6-character code from their Settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Invite code</Label>
              <Input id="code" placeholder="ABC123" value={code} onChange={e => setCode(e.target.value)} required maxLength={6} className="uppercase tracking-widest text-center text-lg font-mono" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Joining…' : 'Join household'}</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setMode('choose')}>Back</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
