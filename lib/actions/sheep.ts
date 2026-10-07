'use server'

import { createClient } from '@/lib/supabase/server'
import { generateTrackingCode } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import type { Sheep } from '@/types/sheep'

export interface CreateSheepInput {
  tracking_code?: string
  customer_name: string
  customer_phone?: string
  breed: string
  gender: 'Jantan' | 'Betina'
  initial_weight: number
  target_weight: number
  entry_date: string
  status?: 'Penitipan' | 'Selesai/Terkirim' | 'Terjual'
}

export interface ActionResult<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

/**
 * Server Action to insert new sheep data into Supabase
 */
export async function createSheep(
  input: CreateSheepInput
): Promise<ActionResult<Sheep>> {
  try {
    const supabase = await createClient()

    // 0. Check authenticated admin session
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) {
      return {
        success: false,
        error: 'Sesi admin berakhir atau belum login. Silakan login kembali.',
      }
    }

    // 1. Validation
    const customerName = input.customer_name?.trim()
    if (!customerName) {
      return { success: false, error: 'Nama customer wajib diisi.' }
    }

    const breed = input.breed?.trim()
    if (!breed) {
      return { success: false, error: 'Ras domba wajib diisi.' }
    }

    if (!input.gender || !['Jantan', 'Betina'].includes(input.gender)) {
      return { success: false, error: 'Jenis kelamin harus Jantan atau Betina.' }
    }

    const initialWeight = Number(input.initial_weight)
    if (isNaN(initialWeight) || initialWeight <= 0) {
      return { success: false, error: 'Bobot awal harus berupa angka lebih dari 0 kg.' }
    }

    const targetWeight = Number(input.target_weight)
    if (isNaN(targetWeight) || targetWeight <= 0) {
      return { success: false, error: 'Target bobot harus berupa angka lebih dari 0 kg.' }
    }

    const entryDate = input.entry_date?.trim()
    if (!entryDate) {
      return { success: false, error: 'Tanggal masuk kandang wajib diisi.' }
    }

    // 2. Tracking code preparation
    const trackingCode = input.tracking_code?.trim() || generateTrackingCode()

    const payload = {
      tracking_code: trackingCode,
      customer_name: customerName,
      customer_phone: input.customer_phone?.trim() || null,
      breed: breed,
      gender: input.gender,
      initial_weight: initialWeight,
      target_weight: targetWeight,
      entry_date: entryDate,
      status: input.status || 'Penitipan',
    }

    // 3. Insert to Supabase sheep table
    const { data, error } = await supabase
      .from('sheep')
      .insert(payload)
      .select()
      .single()

    if (error) {
      // If collision on unique tracking_code (error code 23505), retry once with a freshly generated code
      if (error.code === '23505') {
        payload.tracking_code = generateTrackingCode()
        const retry = await supabase
          .from('sheep')
          .insert(payload)
          .select()
          .single()

        if (retry.error) {
          return { success: false, error: `Gagal menyimpan: ${retry.error.message}` }
        }

        revalidatePath('/admin/dashboard')
        return {
          success: true,
          message: `Domba berhasil ditambahkan dengan kode ${retry.data.tracking_code}`,
          data: retry.data as Sheep,
        }
      }

      return { success: false, error: `Gagal menyimpan data: ${error.message}` }
    }

    // 4. Revalidate cache
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      message: `Domba berhasil ditambahkan dengan kode ${data.tracking_code}`,
      data: data as Sheep,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kendala tak terduga pada server.'
    return { success: false, error: errorMsg }
  }
}
