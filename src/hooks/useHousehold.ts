import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { generateInviteCode } from '@/lib/utils'
import type { Household } from '@/types'

export function useHousehold(userId?: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['household', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('household_members')
        .select('household_id, role, households(*)')
        .eq('user_id', userId!)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data ?? null
    },
  })

  const createHousehold = useMutation({
    mutationFn: async ({ name, userId: uid }: { name: string; userId: string }) => {
      const { data: hh, error: hhErr } = await supabase
        .from('households')
        .insert({ name, invite_code: generateInviteCode() })
        .select()
        .single()
      if (hhErr) throw hhErr
      const { error: memErr } = await supabase
        .from('household_members')
        .insert({ household_id: hh.id, user_id: uid, role: 'owner' })
      if (memErr) throw memErr
      return hh as Household
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['household', userId] }),
  })

  const joinHousehold = useMutation({
    mutationFn: async ({ inviteCode, userId: uid }: { inviteCode: string; userId: string }) => {
      const { data: hh, error: hhErr } = await supabase
        .from('households')
        .select()
        .eq('invite_code', inviteCode.toUpperCase())
        .single()
      if (hhErr) throw new Error('Invalid invite code')
      const { error: memErr } = await supabase
        .from('household_members')
        .insert({ household_id: hh.id, user_id: uid, role: 'member' })
      if (memErr) throw memErr
      return hh as Household
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['household', userId] }),
  })

  const regenerateInviteCode = useMutation({
    mutationFn: async (householdId: string) => {
      const { error } = await supabase
        .from('households')
        .update({ invite_code: generateInviteCode() })
        .eq('id', householdId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['household', userId] }),
  })

  return {
    householdMembership: query.data,
    household: query.data?.households as Household | undefined,
    householdId: (query.data?.households as Household | undefined)?.id,
    role: query.data?.role,
    loading: query.isLoading,
    createHousehold,
    joinHousehold,
    regenerateInviteCode,
  }
}
