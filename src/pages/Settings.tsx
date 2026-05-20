import { Copy, RotateCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useHousehold } from '@/hooks/useHousehold'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

interface Props {
  householdId: string
}

export default function Settings({ householdId }: Props) {
  const { user } = useAuth()
  const { household, role, regenerateInviteCode } = useHousehold(user?.id)

  async function handleCopyCode() {
    if (!household?.invite_code) return
    await navigator.clipboard.writeText(household.invite_code)
    toast.success('Invite code copied!')
  }

  async function handleRegenerate() {
    if (!confirm('Generate a new invite code? The old one will stop working.')) return
    try {
      await regenerateInviteCode.mutateAsync(householdId)
      toast.success('New invite code generated')
    } catch {
      toast.error('Could not generate new code')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your household</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Household</CardTitle>
          <CardDescription>Share this code with your partner to invite them</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Household name</p>
            <p className="text-lg font-semibold">{household?.name}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Your role</p>
            <p className="text-lg font-semibold capitalize">{role}</p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Invite code</p>
            <div className="flex items-center gap-2">
              <code className="text-2xl font-mono font-bold tracking-widest">
                {household?.invite_code}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Share this 6-character code with your partner to invite them to your household
            </p>
          </div>

          {role === 'owner' && (
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={regenerateInviteCode.isPending}
              className="w-full"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Generate new code
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
