'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminSession } from '@/lib/auth'
import {
  extractTrackingNumber,
  formatTrackingCode,
  generateTrackingCode,
} from '@/lib/utils'
import { getGoogleSheetsWebhookUrl } from '@/lib/google-sheets'
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
 * Mencari angka tertinggi dari tracking_code yang ada di tabel:
 * 1. sheep (tracking_code)
 * 2. sheep_sold (tracking_code)
 * 3. farm_sheep (tag_id / tag_code / tracking_code / code)
 *
 * Mengambil angka dari format KKY-XXXX (misal: KKY-0012 -> 12),
 * menambahkan +1 (13), dan memformat ulang menjadi 4 digit leading zero (KKY-0013).
 * Jika belum ada data sama sekali atau tidak ada angka, mulai dari KKY-0001.
 */
export async function getNextTrackingCode(): Promise<string> {
  try {
    const supabase = createAdminClient()
    let maxNumber = 0

    // 1. Cek tabel sheep
    try {
      const { data: sheepData, error: sheepErr } = await supabase
        .from('sheep')
        .select('tracking_code')
        .ilike('tracking_code', 'KKY-%')

      if (!sheepErr && sheepData) {
        for (const row of sheepData) {
          const num = extractTrackingNumber(row.tracking_code)
          if (num !== null && num > maxNumber) {
            maxNumber = num
          }
        }
      }
    } catch (sErr) {
      console.warn('[TrackingCode] Note fetching sheep codes:', sErr)
    }

    // 2. Cek tabel sheep_sold
    try {
      const { data: soldData, error: soldErr } = await supabase
        .from('sheep_sold')
        .select('tracking_code')
        .ilike('tracking_code', 'KKY-%')

      if (!soldErr && soldData) {
        for (const row of soldData) {
          const num = extractTrackingNumber(row.tracking_code)
          if (num !== null && num > maxNumber) {
            maxNumber = num
          }
        }
      }
    } catch (soldEx) {
      console.warn('[TrackingCode] Note fetching sheep_sold codes:', soldEx)
    }

    // 3. Cek tabel farm_sheep
    try {
      const { data: farmData, error: farmErr } = await supabase
        .from('farm_sheep')
        .select('*')

      if (!farmErr && farmData) {
        for (const row of farmData) {
          const rawCode = (row.tracking_code || row.tag_id || row.tag_code || row.code) as string | undefined
          const num = extractTrackingNumber(rawCode)
          if (num !== null && num > maxNumber) {
            maxNumber = num
          }
        }
      }
    } catch (farmEx) {
      console.warn('[TrackingCode] Note fetching farm_sheep codes:', farmEx)
    }

    return formatTrackingCode(maxNumber + 1)
  } catch (err) {
    console.warn('[TrackingCode] Error calculating next tracking code:', err)
    return 'KKY-0001'
  }
}

export const generateNextTrackingCode = getNextTrackingCode

/**
 * Server Action to insert new sheep data into Supabase
 */
export async function createSheep(
  input: CreateSheepInput
): Promise<ActionResult<Sheep>> {
  try {
    // 0. Check authenticated admin session
    const adminSession = await requireAdminSession()
    if (!adminSession) {
      return {
        success: false,
        error: 'Sesi admin berakhir atau belum login. Silakan login kembali.',
      }
    }

    const supabase = createAdminClient()

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
    const trackingCode = input.tracking_code?.trim() || (await getNextTrackingCode())

    const payload = {
      tracking_code: trackingCode,
      customer_name: customerName,
      customer_phone: input.customer_phone?.trim() || null,
      breed: breed,
      gender: input.gender,
      initial_weight: initialWeight,
      current_weight: initialWeight,
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
      // If collision on unique tracking_code (error code 23505), retry once with a freshly calculated sequential code
      if (error.code === '23505') {
        const nextFreshCode = await getNextTrackingCode()
        const collidingNum = extractTrackingNumber(payload.tracking_code) || 0
        const freshNum = extractTrackingNumber(nextFreshCode) || 1
        payload.tracking_code = formatTrackingCode(Math.max(collidingNum + 1, freshNum))

        const retry = await supabase
          .from('sheep')
          .insert(payload)
          .select()
          .single()

        if (retry.error) {
          return { success: false, error: `Gagal menyimpan: ${retry.error.message}` }
        }

        const finalSheep = retry.data as Sheep
        // Non-blocking Google Sheets sync for new sheep
        try {
          const webhookUrl = getGoogleSheetsWebhookUrl()
          if (webhookUrl) {
            fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sheet_name: 'Master_Titipan',
                sheet: 'Master_Titipan',
                type: 'titipan_sheep',
                action: 'create',
                tracking_code: finalSheep.tracking_code,
                code: finalSheep.tracking_code,
                customer_name: finalSheep.customer_name,
                customer_phone: finalSheep.customer_phone || '-',
                breed: finalSheep.breed,
                gender: finalSheep.gender,
                initial_weight: finalSheep.initial_weight,
                current_weight: finalSheep.current_weight,
                target_weight: finalSheep.target_weight,
                entry_date: finalSheep.entry_date,
                status: finalSheep.status,
              }),
              redirect: 'follow',
            }).catch((err) => console.warn('[Sheep Webhook Warning]:', err))
          }
        } catch (sheetErr) {
          console.warn('[Sheep] Sheet sync error:', sheetErr)
        }

        revalidatePath('/admin/dashboard')
        return {
          success: true,
          message: `Domba berhasil ditambahkan dengan kode ${retry.data.tracking_code}`,
          data: finalSheep,
        }
      }

      return { success: false, error: `Gagal menyimpan data: ${error.message}` }
    }

    const finalSheep = data as Sheep
    // Non-blocking Google Sheets sync for new sheep
    try {
      const webhookUrl = getGoogleSheetsWebhookUrl()
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheet_name: 'Master_Titipan',
            sheet: 'Master_Titipan',
            type: 'titipan_sheep',
            action: 'create',
            tracking_code: finalSheep.tracking_code,
            code: finalSheep.tracking_code,
            customer_name: finalSheep.customer_name,
            customer_phone: finalSheep.customer_phone || '-',
            breed: finalSheep.breed,
            gender: finalSheep.gender,
            initial_weight: finalSheep.initial_weight,
            current_weight: finalSheep.current_weight,
            target_weight: finalSheep.target_weight,
            entry_date: finalSheep.entry_date,
            status: finalSheep.status,
          }),
          redirect: 'follow',
        }).catch((err) => console.warn('[Sheep Webhook Warning]:', err))
      }
    } catch (sheetErr) {
      console.warn('[Sheep] Sheet sync error:', sheetErr)
    }

    // 4. Revalidate cache
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      message: `Domba berhasil ditambahkan dengan kode ${data.tracking_code}`,
      data: finalSheep,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kendala tak terduga pada server.'
    return { success: false, error: errorMsg }
  }
}
