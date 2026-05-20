import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, parseISO } from 'date-fns'
import type { PlantStatus, TrayStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function daysSince(dateStr: string): number {
  return differenceInDays(new Date(), parseISO(dateStr))
}

export function daysUntilHarvest(plantedAt: string, daysToHarvest: number): number {
  const elapsed = daysSince(plantedAt)
  return daysToHarvest - elapsed
}

export function isReadyToGerminate(plantedAt: string, daysToGerminate: number): boolean {
  return daysSince(plantedAt) >= daysToGerminate
}

export function plantStatusLabel(status: PlantStatus): string {
  const labels: Record<PlantStatus, string> = {
    growing: 'Growing',
    ready_to_harvest: 'Ready to Harvest',
    harvested: 'Harvested',
    needs_trim: 'Needs Trim',
    died: 'Died',
  }
  return labels[status]
}

export function plantStatusColor(status: PlantStatus): string {
  const colors: Record<PlantStatus, string> = {
    growing: 'bg-green-100 text-green-800 border-green-200',
    ready_to_harvest: 'bg-amber-100 text-amber-800 border-amber-200',
    harvested: 'bg-gray-100 text-gray-600 border-gray-200',
    needs_trim: 'bg-orange-100 text-orange-800 border-orange-200',
    died: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[status]
}

export function plantCellBg(status: PlantStatus | undefined): string {
  if (!status) return 'bg-gray-50 border-gray-200 hover:bg-gray-100'
  const colors: Record<PlantStatus, string> = {
    growing: 'bg-green-50 border-green-200 hover:bg-green-100',
    ready_to_harvest: 'bg-amber-50 border-amber-300 hover:bg-amber-100',
    harvested: 'bg-gray-100 border-gray-200 hover:bg-gray-200',
    needs_trim: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    died: 'bg-red-50 border-red-200 hover:bg-red-100',
  }
  return colors[status]
}

export function trayStatusLabel(status: TrayStatus): string {
  const labels: Record<TrayStatus, string> = {
    germinating: 'Germinating',
    ready_to_move: 'Ready to Move',
    moved: 'Moved',
  }
  return labels[status]
}

export function trayStatusColor(status: TrayStatus): string {
  const colors: Record<TrayStatus, string> = {
    germinating: 'bg-blue-100 text-blue-800',
    ready_to_move: 'bg-amber-100 text-amber-800',
    moved: 'bg-gray-100 text-gray-600',
  }
  return colors[status]
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function nutrientDaysRemaining(lastRefilled: string | null, refillDays: number): number {
  if (!lastRefilled) return 0
  const elapsed = daysSince(lastRefilled)
  return refillDays - elapsed
}
