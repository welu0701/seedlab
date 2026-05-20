import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { HydroSystem, HydroSlotWithDetails } from '@/types'

export function useHydro(householdId?: string) {
  const qc = useQueryClient()

  const systems = useQuery({
    queryKey: ['hydro', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hydro_systems')
        .select('*')
        .eq('household_id', householdId!)
        .order('created_at')
      if (error) throw error
      return data as HydroSystem[]
    },
  })

  const addSystem = useMutation({
    mutationFn: async (system: {
      name: string
      slot_count: number
      nutrient_refill_days: number
      household_id: string
    }) => {
      const { data, error } = await supabase.from('hydro_systems').insert(system).select().single()
      if (error) throw error
      return data as HydroSystem
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hydro', householdId] }),
  })

  const updateSystem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HydroSystem> & { id: string }) => {
      const { error } = await supabase.from('hydro_systems').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hydro', householdId] }),
  })

  const deleteSystem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hydro_systems').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hydro', householdId] }),
  })

  const logNutrientRefill = useMutation({
    mutationFn: async (systemId: string) => {
      const { error } = await supabase
        .from('hydro_systems')
        .update({ nutrient_last_refilled: new Date().toISOString() })
        .eq('id', systemId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hydro', householdId] }),
  })

  const slots = useQuery({
    queryKey: ['hydro-slots', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const systemIds = systems.data?.map(s => s.id) ?? []
      if (!systemIds.length) return []
      const { data, error } = await supabase
        .from('hydro_slots')
        .select('*, plant:plants(*, vegetable:vegetable_catalog(*))')
        .in('system_id', systemIds)
        .order('slot_number')
      if (error) throw error
      return data as HydroSlotWithDetails[]
    },
    enabled: !!systems.data?.length,
  })

  const assignSlot = useMutation({
    mutationFn: async ({
      slotId,
      vegetableId,
      householdId: hid,
      plantedAt,
    }: {
      slotId: string
      vegetableId: string
      householdId: string
      plantedAt: string
    }) => {
      const { data: plant, error: plantErr } = await supabase
        .from('plants')
        .insert({ vegetable_id: vegetableId, household_id: hid, planted_at: plantedAt, status: 'growing' })
        .select()
        .single()
      if (plantErr) throw plantErr
      const { error: slotErr } = await supabase
        .from('hydro_slots')
        .update({ plant_id: plant.id })
        .eq('id', slotId)
      if (slotErr) throw slotErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hydro-slots', householdId] })
      qc.invalidateQueries({ queryKey: ['hydro', householdId] })
    },
  })

  const clearSlot = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase.from('hydro_slots').update({ plant_id: null }).eq('id', slotId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hydro-slots', householdId] }),
  })

  return { systems, addSystem, updateSystem, deleteSystem, logNutrientRefill, slots, assignSlot, clearSlot }
}
