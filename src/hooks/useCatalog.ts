import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { VegetableCatalog } from '@/types'

export function useCatalog(householdId?: string) {
  const qc = useQueryClient()

  const vegetables = useQuery({
    queryKey: ['catalog', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vegetable_catalog')
        .select('*')
        .eq('household_id', householdId!)
        .order('name')
      if (error) throw error
      return data as VegetableCatalog[]
    },
  })

  const addVegetable = useMutation({
    mutationFn: async (veg: Omit<VegetableCatalog, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('vegetable_catalog').insert(veg).select().single()
      if (error) throw error
      return data as VegetableCatalog
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', householdId] }),
  })

  const updateVegetable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VegetableCatalog> & { id: string }) => {
      const { error } = await supabase.from('vegetable_catalog').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', householdId] }),
  })

  const deleteVegetable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vegetable_catalog').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog', householdId] }),
  })

  return { vegetables, addVegetable, updateVegetable, deleteVegetable }
}
