'use server'

import { createClient } from '@/lib/supabase/server'
import {
  appendProgressRowToSheet,
  syncProgressToAppsScriptWebhook,
} from '@/lib/google-sheets'
import { revalidatePath } from 'next/cache'
import type { ProgressLog } from '@/types/sheep'

export interface ProgressActionResult {
  success: boolean
  message?: string
  data?: ProgressLog
  error?: string
  sheetsSynced?: boolean
  mediaUrl?: string | null
}

/**
 * Combined Server Action to:
 * 1. Upload photo to Supabase Storage ('sheep-media')
 * 2. Insert log to Supabase ('progress_logs')
 * 3. Append row to Google Sheets simultaneously
 * 4. Revalidate cache
 */
export async function createProgressLog(
  formData: FormData
): Promise<ProgressActionResult> {
  try {
    const supabase = await createClient()

    // 0. Verify authenticated admin
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) {
      return {
        success: false,
        error: 'Sesi admin telah berakhir. Silakan login kembali.',
      }
    }

    // 1. Extract and validate fields
    const sheepId = formData.get('sheep_id') as string
    const updateType = (formData.get('update_type') as string) || 'Mingguan'
    const recordDate = (formData.get('record_date') as string) || new Date().toISOString().split('T')[0]
    const currentWeightStr = formData.get('current_weight') as string
    const healthStatus = (formData.get('health_status') as string) || 'Sehat'
    const notes = (formData.get('notes') as string) || null
    const mediaFile = formData.get('media') as File | null

    if (!sheepId) {
      return { success: false, error: 'ID domba tidak valid.' }
    }

    const currentWeight = parseFloat(currentWeightStr)
    if (isNaN(currentWeight) || currentWeight <= 0) {
      return { success: false, error: 'Bobot saat ini harus berupa angka lebih dari 0 kg.' }
    }

    // 2. Fetch sheep record to obtain tracking_code and customer_name
    const { data: sheep, error: sheepError } = await supabase
      .from('sheep')
      .select('id, tracking_code, customer_name')
      .eq('id', sheepId)
      .single()

    if (sheepError || !sheep) {
      return { success: false, error: 'Data domba tidak ditemukan di sistem.' }
    }

    // 3. Upload media file to Supabase Storage bucket 'sheep-media' if provided
    let mediaUrl: string | null = null
    if (mediaFile && mediaFile instanceof File && mediaFile.size > 0) {
      try {
        const fileExt = mediaFile.name.split('.').pop() || 'webp'
        const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '')
        const fileName = `${sheep.tracking_code}/${Date.now()}.${cleanExt}`

        const arrayBuffer = await mediaFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('sheep-media')
          .upload(fileName, buffer, {
            contentType: mediaFile.type || 'image/webp',
            upsert: true,
          })

        if (uploadError) {
          console.warn('Gagal upload ke Supabase Storage:', uploadError.message)
        } else if (uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('sheep-media')
            .getPublicUrl(fileName)
          mediaUrl = publicUrlData.publicUrl
        }
      } catch (uploadCatchErr) {
        console.warn('Error saat upload media:', uploadCatchErr)
      }
    }

    // 4. Insert record into Supabase progress_logs table
    const { data: logData, error: logError } = await supabase
      .from('progress_logs')
      .insert({
        sheep_id: sheepId,
        update_type: updateType,
        record_date: recordDate,
        current_weight: currentWeight,
        health_status: healthStatus,
        notes: notes,
        media_url: mediaUrl,
      })
      .select()
      .single()

    if (logError) {
      return {
        success: false,
        error: `Gagal menyimpan log: ${logError.message}`,
      }
    }

    // 4b. Update latest current_weight on the sheep record in Supabase
    const { error: updateSheepError } = await supabase
      .from('sheep')
      .update({ current_weight: currentWeight })
      .eq('id', sheepId)

    if (updateSheepError) {
      console.warn('Gagal memperbarui current_weight pada tabel sheep:', updateSheepError.message)
    }

    // 5. Append row to Google Sheets and/or Apps Script Webhook simultaneously (non-blocking)
    let sheetsSynced = false

    // A. Direct Google Sheets API v4
    try {
      const sheetRes = await appendProgressRowToSheet({
        trackingCode: sheep.tracking_code,
        customerName: sheep.customer_name,
        recordDate: recordDate,
        updateType: updateType,
        currentWeight: currentWeight,
        healthStatus: healthStatus,
        notes: notes,
        mediaUrl: mediaUrl,
      })
      if (sheetRes.success) sheetsSynced = true
    } catch (sheetCatchErr) {
      console.warn('Gagal sinkronisasi Google Sheets:', sheetCatchErr)
    }

    // B. Google Apps Script Webhook
    try {
      const webhookRes = await syncProgressToAppsScriptWebhook({
        tracking_code: sheep.tracking_code,
        customer_name: sheep.customer_name,
        record_date: recordDate,
        current_weight: currentWeight,
        health_status: healthStatus,
        notes: notes,
        media_url: mediaUrl,
      })
      if (webhookRes.success) sheetsSynced = true
    } catch (webhookCatchErr) {
      console.warn('Gagal sinkronisasi Apps Script Webhook:', webhookCatchErr)
    }

    // 6. Revalidate relevant paths
    revalidatePath('/admin/dashboard')
    revalidatePath(`/admin/sheep/${sheepId}/progress`)
    revalidatePath(`/track/${sheep.tracking_code}`)

    return {
      success: true,
      message: 'Catatan perkembangan berhasil disimpan!',
      data: logData as ProgressLog,
      sheetsSynced,
      mediaUrl,
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Terjadi kendala server saat menyimpan progress.'
    return { success: false, error: errorMsg }
  }
}
