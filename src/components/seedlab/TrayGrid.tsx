import { trayStatusColor, trayStatusLabel, daysSince, isReadyToGerminate } from '@/lib/utils'
import type { TrayCellWithDetails } from '@/types'

interface Props {
  cells: TrayCellWithDetails[]
  onCellClick: (cell: TrayCellWithDetails) => void
}

export function TrayGrid({ cells, onCellClick }: Props) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))' }}>
      {cells.map(cell => {
        const hasSeed = !!cell.vegetable_id
        const computedReady =
          hasSeed &&
          cell.planted_at &&
          cell.vegetable &&
          isReadyToGerminate(cell.planted_at, cell.vegetable.days_to_germinate)
        const displayStatus = computedReady && cell.status === 'germinating' ? 'ready_to_move' : cell.status

        return (
          <button
            key={cell.id}
            onClick={() => onCellClick(cell)}
            className={`relative flex flex-col items-center justify-center rounded border p-1 text-center transition-all hover:scale-105 aspect-square text-xs ${hasSeed ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
          >
            <span className="font-mono text-[9px] text-muted-foreground absolute top-0.5 left-1">
              {cell.cell_number}
            </span>
            {hasSeed ? (
              <>
                <span className="font-semibold leading-tight truncate w-full text-center mt-2 text-[9px]">
                  {cell.vegetable?.name ?? '?'}
                </span>
                {cell.planted_at && (
                  <span className="text-[8px] text-muted-foreground">{daysSince(cell.planted_at)}d</span>
                )}
                <span className={`mt-0.5 rounded-full px-1 text-[7px] font-semibold ${trayStatusColor(displayStatus)}`}>
                  {trayStatusLabel(displayStatus)}
                </span>
              </>
            ) : (
              <span className="text-[10px] text-muted-foreground mt-2">+</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
