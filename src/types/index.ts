export type PlantStatus = 'growing' | 'ready_to_harvest' | 'harvested' | 'needs_trim' | 'died'
export type TrayStatus = 'germinating' | 'ready_to_move' | 'moved'
export type HouseholdRole = 'owner' | 'member'
export type EventType = 'planted' | 'harvested' | 'trimmed' | 'died' | 'transplanted'

export interface Profile {
  id: string
  user_id: string
  display_name: string
  created_at: string
}

export interface Household {
  id: string
  name: string
  invite_code: string
  created_at: string
}

export interface HouseholdMember {
  id: string
  household_id: string
  user_id: string
  role: HouseholdRole
}

export interface VegetableCatalog {
  id: string
  household_id: string
  name: string
  days_to_germinate: number
  days_to_harvest: number
  spacing_inches: number | null
  companion_plants: string | null
  bolt_info: string | null
  notes: string | null
  created_at: string
}

export interface RaisedBed {
  id: string
  household_id: string
  name: string
  rows: number
  cols: number
  created_at: string
}

export interface BedPlant {
  id: string
  bed_id: string
  row: number
  col: number
  plant_id: string | null
}

export interface HydroSystem {
  id: string
  household_id: string
  name: string
  slot_count: number
  nutrient_last_refilled: string | null
  nutrient_refill_days: number
  created_at: string
}

export interface HydroSlot {
  id: string
  system_id: string
  slot_number: number
  plant_id: string | null
}

export interface SeedTray {
  id: string
  household_id: string
  name: string
  cell_count: number
  created_at: string
}

export interface TrayCell {
  id: string
  tray_id: string
  cell_number: number
  vegetable_id: string | null
  planted_at: string | null
  status: TrayStatus
}

export interface Plant {
  id: string
  household_id: string
  vegetable_id: string
  planted_at: string
  status: PlantStatus
  notes: string | null
}

export interface PlantEvent {
  id: string
  plant_id: string
  event_type: EventType
  occurred_at: string
  notes: string | null
}

export interface BedPlantWithDetails extends BedPlant {
  plant?: Plant & { vegetable?: VegetableCatalog }
}

export interface HydroSlotWithDetails extends HydroSlot {
  plant?: Plant & { vegetable?: VegetableCatalog }
}

export interface TrayCellWithDetails extends TrayCell {
  vegetable?: VegetableCatalog
}
