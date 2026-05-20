import type { RaisedBed, BedPlantWithDetails } from '@/types'
import { BedCell } from './BedCell'

interface Props {
  bed: RaisedBed
  cells: BedPlantWithDetails[]
  onCellClick: (cell: BedPlantWithDetails) => void
}

export function BedGrid({ bed, cells, onCellClick }: Props) {
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${bed.cols}, minmax(0, 1fr))` }}
    >
      {cells.map(cell => (
        <BedCell key={cell.id} cell={cell} onClick={onCellClick} />
      ))}
    </div>
  )
}
