'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdminSession } from '@/lib/auth'
import {
  appendProgressRowToSheet,
  getGoogleSheetsWebhookUrl,
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
    // 0. Verify authenticated admin
    const adminSession = await requireAdminSession()
    if (!adminSession) {
      return {
        success: false,
        error: 'Sesi admin telah berakhir. Silakan login kembali.',
      }
    }

    const supabase = createAdminClient()

    // 1. Extract and validate fields
    const sheepId = formData.get('sheep_id') as string
    const updateType = (formData.get('update_type') as string) || 'Mingguan'
    const recordDate = (formData.get('record_date') as string) || new Date().toISOString().split('T')[0]
    const healthStatus = (formData.get('health_status') as string) || 'Sehat'
    const notes = (formData.get('notes') as string) || null
    const mediaFile = formData.get('media') as File | null

    if (!sheepId) {
      return { success: false, error: 'ID domba tidak valid.' }
    }

    // 2. Fetch sheep record to obtain tracking_code, customer_name, and initial_weight
    const { data: sheep, error: sheepError } = await supabase
      .from('sheep')
      .select('id, tracking_code, customer_name, initial_weight, current_weight')
      .eq('id', sheepId)
      .single()

    if (sheepError || !sheep) {
      return { success: false, error: 'Data domba tidak ditemukan di sistem.' }
    }

    // Ambil log progress domba terakhir (atau initial_weight jika belum ada log)
    const { data: latestLogs } = await supabase
      .from('progress_logs')
      .select('current_weight, record_date, created_at')
      .eq('sheep_id', sheepId)
      .order('record_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)

    const initialWeight = Number(sheep.initial_weight) || 0
    let latestWeight = initialWeight

    if (
      latestLogs &&
      latestLogs.length > 0 &&
      latestLogs[0].current_weight !== null &&
      latestLogs[0].current_weight !== undefined
    ) {
      latestWeight = Number(latestLogs[0].current_weight)
    } else if (sheep.current_weight !== null && sheep.current_weight !== undefined) {
      latestWeight = Number(sheep.current_weight)
    }

    // Ambil nilai delta input (misal: 0, 0.5, 1.0)
    const deltaStr = (formData.get('delta_input') ?? formData.get('delta_weight')) as string | null
    let deltaInput = 0
    if (deltaStr !== null && deltaStr !== undefined && deltaStr.trim() !== '') {
      deltaInput = parseFloat(deltaStr)
      if (isNaN(deltaInput)) {
        return { success: false, error: 'Input penambahan bobot tidak valid.' }
      }
    } else {
      // Fallback jika dikirim via current_weight langsung
      const cwStr = formData.get('current_weight') as string | null
      if (cwStr !== null && cwStr !== undefined && cwStr.trim() !== '') {
        const directCw = parseFloat(cwStr)
        if (!isNaN(directCw)) {
          deltaInput = directCw - latestWeight
        }
      }
    }

    // Hitung weight_to_save = latest_weight + delta_input
    const weightToSave = Math.round((latestWeight + deltaInput) * 10) / 10
    if (weightToSave <= 0) {
      return { success: false, error: 'Bobot terbaru tidak boleh kurang dari atau sama dengan 0 kg.' }
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

    // 4. Insert record into Supabase progress_logs table with weight_to_save
    const { data: logData, error: logError } = await supabase
      .from('progress_logs')
      .insert({
        sheep_id: sheepId,
        update_type: updateType,
        record_date: recordDate,
        current_weight: weightToSave,
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

    // 4b. Update kolom current_weight pada tabel sheep dengan weight_to_save
    const { error: updateSheepError } = await supabase
      .from('sheep')
      .update({ current_weight: weightToSave })
      .eq('id', sheepId)

    if (updateSheepError) {
      console.warn('Gagal memperbarui current_weight pada tabel sheep:', updateSheepError.message)
    }

    // 5. POST ke Google Sheets Web App API (Sheet: Log_Titipan) secara asynchronous
    let sheetsSynced = false
    const sheetUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL || process.env.GOOGLE_APPS_SCRIPT_URL

    if (sheetUrl) {
      try {
        await fetch(sheetUrl.replace(/^hhttps:\/\//, 'https://').trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheet_name: 'Log_Titipan',
            action: 'insert',
            kode_tracking: sheep.tracking_code,
            nama_customer: sheep.customer_name,
            tgl_catatan: recordDate,
            bobot: Number(weightToSave),
            kesehatan: healthStatus,
            catatan: notes ? notes.trim() : '-',
            url_photo: mediaUrl || '',
            // Compatibility aliases
            sheet: 'Log_Titipan',
            type: 'titipan_log',
            tracking_code: sheep.tracking_code,
            customer_name: sheep.customer_name,
            date: recordDate,
            record_date: recordDate,
            weight: Number(weightToSave),
            current_weight: Number(weightToSave),
            health_status: healthStatus,
            notes: notes ? notes.trim() : '-',
            photo_url: mediaUrl || '',
          }),
          redirect: 'follow',
        })
        sheetsSynced = true
      } catch (err) {
        console.error('Gagal sync log harian ke Google Sheets:', err)
      }
    }

    // Direct Google Sheets API v4 fallback (non-blocking)
    if (!sheetsSynced) {
      try {
        const sheetRes = await appendProgressRowToSheet({
          trackingCode: sheep.tracking_code,
          customerName: sheep.customer_name,
          recordDate: recordDate,
          updateType: updateType,
          currentWeight: weightToSave,
          healthStatus: healthStatus,
          notes: notes,
          mediaUrl: mediaUrl,
        })
        if (sheetRes.success) sheetsSynced = true
      } catch (sheetCatchErr) {
        console.warn('[Sync Sheets Warning] Failed to sync progress to Google Sheets:', sheetCatchErr)
      }
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

/**
 * Server Action to sync all titipan progress logs to Google Sheets (Log_Titipan)
 */
export async function syncAllProgressLogsToSheets(): Promise<{
  success: boolean
  message: string
  syncedCount?: number
  error?: string
}> {
  try {
    const webhookUrl = getGoogleSheetsWebhookUrl()
    if (!webhookUrl) {
      return {
        success: false,
        message: 'URL Google Apps Script belum terkonfigurasi di server (GOOGLE_SHEETS_WEB_APP_URL atau GOOGLE_APPS_SCRIPT_URL).',
        error: 'GOOGLE_SHEETS_WEB_APP_URL not configured',
      }
    }

    const adminSession = await requireAdminSession()
    if (!adminSession) {
      return {
        success: false,
        message: 'Sesi admin telah berakhir. Silakan login kembali.',
        error: 'Unauthorized',
      }
    }

    const supabase = createAdminClient()

    // Ambil seluruh log progress beserta info dombanya
    const { data: logs, error: logsErr } = await supabase
      .from('progress_logs')
      .select(`
        id,
        record_date,
        update_type,
        current_weight,
        health_status,
        notes,
        media_url,
        sheep:sheep_id (
          tracking_code,
          customer_name,
          initial_weight
        )
      `)
      .order('record_date', { ascending: true })
      .order('created_at', { ascending: true })

    if (logsErr) {
      return {
        success: false,
        message: `Gagal mengambil log progress: ${logsErr.message}`,
        error: logsErr.message,
      }
    }

    let syncedCount = 0
    for (const log of logs || []) {
      const sheepInfo = Array.isArray(log.sheep) ? log.sheep[0] : log.sheep
      const trackingCode = (sheepInfo as { tracking_code?: string })?.tracking_code || '-'
      const customerName = (sheepInfo as { customer_name?: string })?.customer_name || '-'
      const initialWeight = Number((sheepInfo as { initial_weight?: number })?.initial_weight) || 0
      const weightVal = Number(log.current_weight) || 0
      const deltaVal = Math.round((weightVal - initialWeight) * 10) / 10

      const payload = {
        sheet_name: 'Log_Titipan',
        action: 'insert',
        kode_tracking: trackingCode,
        nama_customer: customerName,
        tgl_catatan: log.record_date,
        bobot: weightVal,
        kesehatan: log.health_status,
        catatan: log.notes ? log.notes.trim() : '-',
        url_photo: log.media_url || '',
        // Compatibility aliases
        sheet: 'Log_Titipan',
        type: 'titipan_log',
        tracking_code: trackingCode,
        code: trackingCode,
        tag_id: trackingCode,
        customer_name: customerName,
        name: customerName,
        record_date: log.record_date,
        date: log.record_date,
        update_type: (log as { update_type?: string })?.update_type || 'Mingguan',
        weight: weightVal,
        current_weight: weightVal,
        delta_weight: deltaVal,
        weight_gain: deltaVal,
        health_status: log.health_status,
        status: log.health_status,
        notes: log.notes ? log.notes.trim() : '-',
        keterangan: log.notes ? log.notes.trim() : '-',
        photo_url: log.media_url || '',
        media_url: log.media_url || '',
      }

      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          redirect: 'follow',
        })
        if (res.ok) {
          syncedCount++
        }
      } catch (err) {
        console.warn(`[SyncAllProgress] Gagal sync log ${log.id}:`, err)
      }
    }

    return {
      success: true,
      message: `Berhasil menyinkronkan ${syncedCount} log progress titipan ke Google Sheets!`,
      syncedCount,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sinkronisasi.'
    return { success: false, message: errorMsg, error: errorMsg }
  }
}
