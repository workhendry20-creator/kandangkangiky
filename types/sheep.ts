export interface ProgressLog {
  id: string
  sheep_id: string
  update_type: 'Harian' | 'Mingguan' | 'Bulanan'
  record_date: string
  current_weight: number
  health_status: string
  notes?: string | null
  media_url?: string | null
  created_at: string
}

export interface Sheep {
  id: string
  tracking_code: string
  customer_name: string
  customer_phone?: string | null
  breed: string
  gender: 'Jantan' | 'Betina'
  initial_weight: number
  target_weight: number
  entry_date: string
  status: 'Penitipan' | 'Selesai/Terkirim' | 'Terjual'
  created_at: string
  progress_logs?: Array<Pick<ProgressLog, 'current_weight' | 'record_date' | 'created_at'>>
  current_weight?: number
}
