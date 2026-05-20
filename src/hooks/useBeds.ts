import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RaisedBed, BedPlantWithDetails } from '@/types'

export function useBeds(householdId?: string) {
  const qc = useQueryClient()

  const beds = useQuery({
    queryKey: ['beds', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raised_beds')
        .select('*')
        .eq('household_id', householdId!)
        .order('created_at')
      if (error) throw error
      return data as RaisedBed[]
    },
  })

  const addBed = useMutation({
    mutationFn: async (bed: { name: string; rows: number; cols: number; household_id: string }) => {
      const { data, error } = await supabase.from('raised_beds').insert(bed).select().single()
      if (error) throw error
      return data as RaisedBed
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beds', householdId] }),
  })

  const deleteBed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('raised_beds').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beds', householdId] }),
  })

  return { beds, addBed, deleteBed }
}

export function useBedDetail(bedId?: string) {
  const qc = useQueryClient()

  const bed = useQuery({
    queryKey: ['bed', bedId],
    enabled: !!bedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raised_beds')
        .select('*')
        .eq('id', bedId!)
        .single()
      if (error) throw error
      return data as RaisedBed
    },
  })

  const cells = useQuery({
    queryKey: ['bed-cells', bedId],
    enabled: !!bedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bed_plants')
        .select('*, plant:plants(*, vegetable:vegetable_catalog(*))')
        .eq('bed_id', bedId!)
        .order('row')
        .order('col')
      if (error) throw error
      return data as BedPlantWithDetails[]
    },
  })

  const assignPlant = useMutation({
    mutationFn: async ({
      cellId,
      plantId,
    }: {
      cellId: string
      plantId: string | null
    }) => {
      const { error } = await supabase
        .from('bed_plants')
        .update({ plant_id: plantId })
        .eq('id', cellId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bed-cells', bedId] }),
  })

  const updatePlantStatus = useMutation({
    mutationFn: async ({ plantId, status }: { plantId: string; status: string }) => {
      const { error } = await supabase.from('plants').update({ status }).eq('id', plantId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bed-cells', bedId] }),
  })

  const createAndAssignPlant = useMutation({
    mutationFn: async ({
      cellId,
      vegetableId,
      householdId,
      plantedAt,
    }: {
      cellId: string
      vegetableId: string
      householdId: string
      plantedAt: string
    }) => {
      const { data: plant, error: plantErr } = await supabase
        .from('plants')
        .insert({ vegetable_id: vegetableId, household_id: householdId, planted_at: plantedAt, status: 'growing' })
        .select()
        .single()
      if (plantErr) throw plantErr
      const { error: cellErr } = await supabase
        .from('bed_plants')
        .update({ plant_id: plant.id })
        .eq('id', cellId)
      if (cellErr) throw cellErr
      await supabase.from('plant_events').insert({
        plant_id: plant.id,
        event_type: 'planted',
        occurred_at: plantedAt,
      })
      return plant
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bed-cells', bedId] }),
  })

  const clearCell = useMutation({
    mutationFn: async (cellId: string) => {
      const { error } = await supabase
        .from('bed_plants')
        .update({ plant_id: null })
        .eq('id', cellId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bed-cells', bedId] }),
  })

  return { bed, cells, assignPlant, updatePlantStatus, createAndAssignPlant, clearCell }
}
