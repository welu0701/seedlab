import { plantCellBg, plantStatusLabel } from '@/lib/utils'
import type { BedPlantWithDetails } from '@/types'

interface Props {
  cell: BedPlantWithDetails
  onClick: (cell: BedPlantWithDetails) => void
}

export function BedCell({ cell, onClick }: Props) {
  const plant = cell.plant
  const status = plant?.status

  return (
    <button
      onClick={() => onClick(cell)}
      title={plant ? `${plant.vegetable?.name ?? 'Unknown'} — ${plantStatusLabel(plant.status)}` : 'Empty'}
      className={`relative flex flex-col items-center justify-center rounded border p-1 text-center transition-all hover:scale-105 aspect-square ${plantCellBg(status)}`}
    >
      {plant ? (
        <>
          <span className="text-xs font-semibold leading-tight truncate w-full text-center px-0.5">
            {plant.vegetable?.name ?? '?'}
          </span>
          <span className="text-[9px] text-muted-foreground leading-tight mt-0.5">
            {plantStatusLabel(plant.status)}
          </span>
        </>
      ) : (
        <span className="text-[10px] text-muted-foreground">+</span>
      )}
    </button>
  )
}
