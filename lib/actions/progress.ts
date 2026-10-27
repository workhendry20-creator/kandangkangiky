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

    // Ambil nilai penambahan bobot murni (misal: 0, 0.5, 1.0) dari penambahan_bobot / weight_gain / delta_input
    const gainStr = (
      formData.get('penambahan_bobot') ??
      formData.get('weight_gain') ??
      formData.get('delta_input') ??
      formData.get('delta_weight')
    ) as string | null

    let weightGain = 0
    if (gainStr !== null && gainStr !== undefined && gainStr.trim() !== '') {
      weightGain = parseFloat(gainStr)
      if (isNaN(weightGain)) {
        return { success: false, error: 'Input penambahan bobot tidak valid.' }
      }
    } else {
      // Fallback jika dikirim via current_weight langsung
      const cwStr = formData.get('current_weight') as string | null
      if (cwStr !== null && cwStr !== undefined && cwStr.trim() !== '') {
        const directCw = parseFloat(cwStr)
        if (!isNaN(directCw)) {
          weightGain = directCw - latestWeight
        }
      }
    }

    weightGain = Math.round(weightGain * 10) / 10

    // Hitung weight_to_save = latest_weight + weight_gain
    const weightToSave = Math.round((latestWeight + weightGain) * 10) / 10
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

    // 4. Insert record into Supabase progress_logs table with current_weight & weight_gain
    let { data: logData, error: logError } = await supabase
      .from('progress_logs')
      .insert({
        sheep_id: sheepId,
        update_type: updateType,
        record_date: recordDate,
        current_weight: weightToSave,
        weight_gain: weightGain,
        health_status: healthStatus,
        notes: notes,
        media_url: mediaUrl,
      })
      .select()
      .single()

    // Fallback if weight_gain column is not yet present in Supabase table schema
    if (
      logError &&
      (logError.message?.includes('weight_gain') ||
        logError.code === '42703' ||
        logError.code === 'PGRST204')
    ) {
      const fallbackInsert = await supabase
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

      if (!fallbackInsert.error) {
        logData = fallbackInsert.data
        logError = null
      }
    }

    if (logError) {
      return {
        success: false,
        error: `Gagal menyimpan log: ${logError.message}`,
      }
    }

    // 4b. Check if this log completes the care period / marks as Terjual
    const markSold = formData.get('mark_sold') === 'true' || formData.get('status') === 'Terjual'
    const newStatus = markSold ? 'Terjual' : undefined

    const sheepUpdatePayload: Record<string, unknown> = { current_weight: weightToSave }
    if (newStatus) {
      sheepUpdatePayload.status = newStatus
    }

    const { error: updateSheepError } = await supabase
      .from('sheep')
      .update(sheepUpdatePayload)
      .eq('id', sheepId)

    if (updateSheepError) {
      console.warn('Gagal memperbarui tabel sheep:', updateSheepError.message)
    }

    // Update tabel farm_sheep jika ada (sinkronisasi dua arah database)
    if (newStatus) {
      try {
        await supabase
          .from('farm_sheep')
          .update({ current_weight: weightToSave, status: 'Terjual' })
          .or(`id.eq.${sheepId},tag_code.eq.${sheep.tracking_code}`)
      } catch (fErr) {
        console.warn('[FarmSheep Sync Warning]:', fErr)
      }
    }

    // 5. POST ke Google Sheets Web App API (Sheet: Log_Titipan) secara asynchronous
    let sheetsSynced = false
    const sheetUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL || process.env.GOOGLE_APPS_SCRIPT_URL

    if (sheetUrl) {
      try {
        const cleanWebhookUrl = sheetUrl.replace(/^hhttps:\/\//, 'https://').trim()
        await fetch(cleanWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheet_name: 'Log_Titipan',
            action: 'insert',
            kode_tracking: sheep.tracking_code,
            nama_customer: sheep.customer_name,
            tgl_catatan: recordDate,
            bobot: Number(weightToSave),             // Total bobot terbaru
            penambahan_bobot: Number(weightGain),    // Angka penambahan murni
            kesehatan: healthStatus,
            catatan: notes ? notes.trim() : (markSold ? 'Masa penitipan selesai / Terjual' : '-'),
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
            delta_weight: Number(weightGain),
            weight_gain: Number(weightGain),
            health_status: healthStatus,
            notes: notes ? notes.trim() : (markSold ? 'Masa penitipan selesai / Terjual' : '-'),
            photo_url: mediaUrl || '',
          }),
          redirect: 'follow',
        })
        sheetsSynced = true

        // Jika markSold, kirim update status real-time ke Master_Titipan dan Master_Kandang
        if (markSold) {
          // 1. Update status pada Master_Titipan
          fetch(cleanWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'UPDATE_STATUS',
              sheet_name: 'Master_Titipan',
              sheet: 'Master_Titipan',
              type: 'titipan_sheep',
              tracking_code: sheep.tracking_code,
              code: sheep.tracking_code,
              customer_name: sheep.customer_name,
              current_weight: Number(weightToSave),
              status: 'Terjual',
            }),
            redirect: 'follow',
          }).catch((err) => console.warn('[Webhook Master_Titipan Update Warning]:', err))

          // 2. Update status pada Master_Kandang
          fetch(cleanWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'UPSERT_FARM_SHEEP',
              sheet_name: 'Master_Kandang',
              sheet: 'Master_Kandang',
              tag_code: sheep.tracking_code,
              code: sheep.tracking_code,
              status: 'Terjual',
              current_weight: Number(weightToSave),
            }),
            redirect: 'follow',
          }).catch((err) => console.warn('[Webhook Master_Kandang Update Warning]:', err))
        }
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
      message: markSold
        ? 'Masa penitipan selesai! Status domba berhasil diubah menjadi Terjual.'
        : 'Catatan perkembangan berhasil disimpan!',
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
    let logs: Array<Record<string, any>> = []
    const firstQuery = await supabase
      .from('progress_logs')
      .select(`
        id,
        record_date,
        update_type,
        current_weight,
        weight_gain,
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

    // Fallback query jika kolom weight_gain belum tersedia di Supabase
    if (
      firstQuery.error &&
      (firstQuery.error.message?.includes('weight_gain') || firstQuery.error.code === '42703')
    ) {
      const fallback = await supabase
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

      if (fallback.error) {
        return {
          success: false,
          message: `Gagal mengambil log progress: ${fallback.error.message}`,
          error: fallback.error.message,
        }
      }
      logs = (fallback.data as Array<Record<string, any>>) || []
    } else if (firstQuery.error) {
      return {
        success: false,
        message: `Gagal mengambil log progress: ${firstQuery.error.message}`,
        error: firstQuery.error.message,
      }
    } else {
      logs = (firstQuery.data as Array<Record<string, any>>) || []
    }

    let syncedCount = 0
    for (const log of logs || []) {
      const sheepInfo = Array.isArray(log.sheep) ? log.sheep[0] : log.sheep
      const trackingCode = (sheepInfo as { tracking_code?: string })?.tracking_code || '-'
      const customerName = (sheepInfo as { customer_name?: string })?.customer_name || '-'
      const initialWeight = Number((sheepInfo as { initial_weight?: number })?.initial_weight) || 0
      const weightVal = Number(log.current_weight) || 0
      const deltaVal = Math.round((weightVal - initialWeight) * 10) / 10
      const gainVal =
        (log as { weight_gain?: number | null })?.weight_gain !== null &&
        (log as { weight_gain?: number | null })?.weight_gain !== undefined
          ? Number((log as { weight_gain?: number | null })?.weight_gain)
          : deltaVal

      const payload = {
        sheet_name: 'Log_Titipan',
        action: 'insert',
        kode_tracking: trackingCode,
        nama_customer: customerName,
        tgl_catatan: log.record_date,
        bobot: weightVal,                        // Total bobot terbaru
        penambahan_bobot: gainVal,               // Angka penambahan murni
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
        delta_weight: gainVal,
        weight_gain: gainVal,
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
