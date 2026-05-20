import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { SeedTray, TrayCellWithDetails } from '@/types'

export function useSeedLab(householdId?: string) {
  const qc = useQueryClient()

  const trays = useQuery({
    queryKey: ['trays', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seed_trays')
        .select('*')
        .eq('household_id', householdId!)
        .order('created_at')
      if (error) throw error
      return data as SeedTray[]
    },
  })

  const addTray = useMutation({
    mutationFn: async (tray: { name: string; cell_count: number; household_id: string }) => {
      const { data, error } = await supabase.from('seed_trays').insert(tray).select().single()
      if (error) throw error
      return data as SeedTray
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trays', householdId] }),
  })

  const deleteTray = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('seed_trays').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trays', householdId] }),
  })

  const trayWithCells = (trayId?: string) =>
    useQuery({
      queryKey: ['tray-cells', trayId],
      enabled: !!trayId,
      queryFn: async () => {
        const { data, error } = await supabase
          .from('tray_cells')
          .select('*, vegetable:vegetable_catalog(*)')
          .eq('tray_id', trayId!)
          .order('cell_number')
        if (error) throw error
        return data as TrayCellWithDetails[]
      },
    })

  const seedCell = useMutation({
    mutationFn: async ({
      cellId,
      vegetableId,
      plantedAt,
    }: {
      cellId: string
      vegetableId: string
      plantedAt: string
    }) => {
      const { error } = await supabase
        .from('tray_cells')
        .update({ vegetable_id: vegetableId, planted_at: plantedAt, status: 'germinating' })
        .eq('id', cellId)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      const trayId = vars.cellId
      qc.invalidateQueries({ queryKey: ['tray-cells'] })
      void trayId
    },
  })

  const updateCellStatus = useMutation({
    mutationFn: async ({ cellId, status }: { cellId: string; status: string }) => {
      const { error } = await supabase.from('tray_cells').update({ status }).eq('id', cellId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tray-cells'] }),
  })

  const clearCell = useMutation({
    mutationFn: async (cellId: string) => {
      const { error } = await supabase
        .from('tray_cells')
        .update({ vegetable_id: null, planted_at: null, status: 'germinating' })
        .eq('id', cellId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tray-cells'] }),
  })

  return { trays, addTray, deleteTray, trayWithCells, seedCell, updateCellStatus, clearCell }
}
