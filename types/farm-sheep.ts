export type FarmSheepGender = 'Jantan' | 'Betina'
export type FarmSheepOrigin = 'Beli' | 'Beranak'
export type FarmSheepType = 'Pejantan' | 'Indukan' | 'Anakan'
export type FarmSheepStatus =
  | 'Hamil'
  | 'Kosongan'
  | 'Menyusui'
  | 'Kosongan/Menyusui'
  | 'Pemacek'
  | 'Siap Kawin'
  | 'Sehat'
  | 'Afkir'
  | 'Terjual'

export interface FarmSheep {
  id: string
  tag_code: string
  name: string
  gender: FarmSheepGender
  breed: string
  origin: FarmSheepOrigin
  entry_date: string
  initial_weight: number
  current_weight?: number | null
  status: FarmSheepStatus
  sheep_type: FarmSheepType
  notes?: string | null
  created_at: string
}

export type FarmEventType = 'Kelahiran' | 'Tindakan'

export interface FarmEvent {
  id: string
  sheep_id: string
  event_type: FarmEventType
  event_date: string
  lamb_count?: number | null
  action_name?: string | null
  notes?: string | null
  created_at: string
  sheep?: Pick<FarmSheep, 'id' | 'tag_code' | 'name' | 'gender' | 'breed' | 'sheep_type'>
}

export interface CreateFarmSheepInput {
  tag_code: string
  name: string
  gender: FarmSheepGender
  breed: string
  origin: FarmSheepOrigin
  entry_date: string
  initial_weight: number
  current_weight?: number | null
  status: FarmSheepStatus
  sheep_type: FarmSheepType
  notes?: string | null
}

export interface UpdateFarmSheepInput {
  tag_code?: string
  name?: string
  gender?: FarmSheepGender
  breed?: string
  origin?: FarmSheepOrigin
  entry_date?: string
  initial_weight?: number
  current_weight?: number | null
  status?: FarmSheepStatus
  sheep_type?: FarmSheepType
  notes?: string | null
}

export interface LambInputData {
  tag_code?: string
  name?: string
  gender: FarmSheepGender
  weight?: number | string | null
}

export interface CreateFarmEventInput {
  sheep_id: string
  event_type: FarmEventType
  event_date: string
  lamb_count?: number | null
  action_name?: string | null
  notes?: string | null
  sire_tag?: string | null
  sire_name?: string | null
  lambs?: LambInputData[]
  auto_register_lambs?: boolean
}

export interface FarmActionResult<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
  sheetsSynced?: boolean
  importedCount?: number
}
