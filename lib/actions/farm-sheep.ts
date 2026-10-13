'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  syncFarmSheepToAppsScriptWebhook,
  appendFarmSheepRowToSheet,
  syncFarmEventToAppsScriptWebhook,
  appendFarmEventRowToSheet,
} from '@/lib/google-sheets'
import { revalidatePath } from 'next/cache'
import type {
  FarmSheep,
  FarmEvent,
  CreateFarmSheepInput,
  UpdateFarmSheepInput,
  CreateFarmEventInput,
  FarmActionResult,
} from '@/types/farm-sheep'

/**
 * Fetch all farm sheep and farm events for the management page
 */
export async function getFarmData(): Promise<{
  farmSheep: FarmSheep[]
  farmEvents: FarmEvent[]
  error?: string
}> {
  try {
    const db = createAdminClient()

    // 1. Fetch farm sheep
    const { data: sheepData, error: sheepError } = await db
      .from('farm_sheep')
      .select('*')
      .order('created_at', { ascending: false })

    if (sheepError) {
      console.warn('[FarmSheep] Note fetching farm_sheep:', sheepError.message)
    }

    // 2. Fetch farm events with joined sheep
    const { data: eventsData, error: eventsError } = await db
      .from('farm_events')
      .select(`
        *,
        sheep:farm_sheep (
          id,
          tag_code,
          name,
          gender,
          breed,
          sheep_type
        )
      `)
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (eventsError) {
      console.warn('[FarmSheep] Note fetching farm_events:', eventsError.message)
    }

    return {
      farmSheep: (sheepData as unknown as FarmSheep[]) || [],
      farmEvents: (eventsData as unknown as FarmEvent[]) || [],
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengambil data ternak kandang'
    console.error('[FarmSheep] Unexpected error:', msg)
    return {
      farmSheep: [],
      farmEvents: [],
      error: msg,
    }
  }
}

/**
 * Create a new farm sheep record
 */
export async function createFarmSheep(
  input: CreateFarmSheepInput
): Promise<FarmActionResult<FarmSheep>> {
  try {
    const supabase = await createClient()

    // Verify session
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) {
      return {
        success: false,
        error: 'Sesi admin telah berakhir atau belum login. Silakan login kembali.',
      }
    }

    // Validation
    const tagCode = input.tag_code?.trim()
    if (!tagCode) {
      return { success: false, error: 'ID/Tag Domba wajib diisi.' }
    }

    const name = input.name?.trim()
    if (!name) {
      return { success: false, error: 'Nama domba wajib diisi.' }
    }

    if (!input.gender || !['Jantan', 'Betina'].includes(input.gender)) {
      return { success: false, error: 'Jenis kelamin harus Jantan atau Betina.' }
    }

    const breed = input.breed?.trim()
    if (!breed) {
      return { success: false, error: 'Jenis/Ras domba wajib diisi.' }
    }

    const initialWeight = Number(input.initial_weight)
    if (isNaN(initialWeight) || initialWeight <= 0) {
      return { success: false, error: 'Bobot awal harus berupa angka lebih dari 0 kg.' }
    }

    const currentWeight =
      input.current_weight !== undefined && input.current_weight !== null
        ? Number(input.current_weight)
        : initialWeight

    const entryDate = input.entry_date?.trim() || new Date().toISOString().split('T')[0]

    const payload = {
      tag_code: tagCode,
      name,
      gender: input.gender,
      breed,
      origin: input.origin || 'Beli',
      entry_date: entryDate,
      initial_weight: initialWeight,
      current_weight: currentWeight,
      status: input.status || (input.gender === 'Betina' ? 'Kosongan' : 'Pemacek'),
      sheep_type: input.sheep_type || (input.gender === 'Betina' ? 'Indukan' : 'Pejantan'),
      notes: input.notes?.trim() || null,
    }

    const db = createAdminClient()
    const { data, error } = await db
      .from('farm_sheep')
      .insert(payload)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `ID Domba "${tagCode}" sudah terdaftar.` }
      }
      return { success: false, error: `Gagal menyimpan: ${error.message}` }
    }

    // Non-blocking Google Sheets / Apps Script Webhook sync
    let sheetsSynced = false
    try {
      const syncRes = await syncFarmSheepToAppsScriptWebhook({
        action: 'CREATE_FARM_SHEEP',
        tag_code: data.tag_code,
        name: data.name,
        gender: data.gender,
        breed: data.breed,
        origin: data.origin,
        entry_date: data.entry_date,
        initial_weight: data.initial_weight,
        current_weight: data.current_weight,
        status: data.status,
        sheep_type: data.sheep_type,
        notes: data.notes,
      })
      if (syncRes.success) sheetsSynced = true
    } catch (sheetErr) {
      console.warn('[FarmSheep] Apps Script sync non-blocking error:', sheetErr)
    }

    try {
      const appendRes = await appendFarmSheepRowToSheet({
        action: 'CREATE_FARM_SHEEP',
        tag_code: data.tag_code,
        name: data.name,
        gender: data.gender,
        breed: data.breed,
        origin: data.origin,
        entry_date: data.entry_date,
        initial_weight: data.initial_weight,
        current_weight: data.current_weight,
        status: data.status,
        sheep_type: data.sheep_type,
        notes: data.notes,
      })
      if (appendRes.success) sheetsSynced = true
    } catch {
      // Ignore direct sheet error
    }

    revalidatePath('/admin/farm-sheep')

    return {
      success: true,
      message: `Domba kandang "${data.name}" (${data.tag_code}) berhasil ditambahkan!`,
      data: data as FarmSheep,
      sheetsSynced,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kendala server saat menambah domba kandang.'
    return { success: false, error: errorMsg }
  }
}

/**
 * Update an existing farm sheep record
 */
export async function updateFarmSheep(
  id: string,
  input: UpdateFarmSheepInput
): Promise<FarmActionResult<FarmSheep>> {
  try {
    const supabase = await createClient()

    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) {
      return {
        success: false,
        error: 'Sesi admin telah berakhir. Silakan login kembali.',
      }
    }

    if (!id) {
      return { success: false, error: 'ID domba tidak valid.' }
    }

    const updatePayload: Record<string, unknown> = {}
    if (input.tag_code !== undefined) updatePayload.tag_code = input.tag_code.trim()
    if (input.name !== undefined) updatePayload.name = input.name.trim()
    if (input.gender !== undefined) updatePayload.gender = input.gender
    if (input.breed !== undefined) updatePayload.breed = input.breed.trim()
    if (input.origin !== undefined) updatePayload.origin = input.origin
    if (input.entry_date !== undefined) updatePayload.entry_date = input.entry_date
    if (input.initial_weight !== undefined) updatePayload.initial_weight = Number(input.initial_weight)
    if (input.current_weight !== undefined) updatePayload.current_weight = Number(input.current_weight)
    if (input.status !== undefined) updatePayload.status = input.status
    if (input.sheep_type !== undefined) updatePayload.sheep_type = input.sheep_type
    if (input.notes !== undefined) updatePayload.notes = input.notes?.trim() || null

    const db = createAdminClient()
    const { data, error } = await db
      .from('farm_sheep')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { success: false, error: `Gagal memperbarui domba: ${error.message}` }
    }

    // Non-blocking sync to Google Sheets
    try {
      await syncFarmSheepToAppsScriptWebhook({
        action: 'UPDATE_FARM_SHEEP',
        tag_code: data.tag_code,
        name: data.name,
        gender: data.gender,
        breed: data.breed,
        origin: data.origin,
        entry_date: data.entry_date,
        initial_weight: data.initial_weight,
        current_weight: data.current_weight,
        status: data.status,
        sheep_type: data.sheep_type,
        notes: data.notes,
      })
    } catch (sheetErr) {
      console.warn('[FarmSheep] Sync error on update:', sheetErr)
    }

    revalidatePath('/admin/farm-sheep')

    return {
      success: true,
      message: `Data domba "${data.name}" berhasil diperbarui.`,
      data: data as FarmSheep,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kendala saat update domba.'
    return { success: false, error: errorMsg }
  }
}

/**
 * Delete a farm sheep record
 */
export async function deleteFarmSheep(id: string): Promise<FarmActionResult> {
  try {
    const supabase = await createClient()

    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) {
      return { success: false, error: 'Sesi admin telah berakhir.' }
    }

    const db = createAdminClient()
    const { error } = await db.from('farm_sheep').delete().eq('id', id)

    if (error) {
      return { success: false, error: `Gagal menghapus domba: ${error.message}` }
    }

    revalidatePath('/admin/farm-sheep')
    return { success: true, message: 'Domba kandang berhasil dihapus.' }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus domba.'
    return { success: false, error: errorMsg }
  }
}

/**
 * Bulk import farm sheep from parsed CSV
 */
export async function importFarmSheepBulk(
  items: CreateFarmSheepInput[]
): Promise<FarmActionResult<FarmSheep[]>> {
  try {
    const supabase = await createClient()

    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) {
      return { success: false, error: 'Sesi admin telah berakhir.' }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, error: 'Data CSV kosong atau tidak ada baris yang valid.' }
    }

    // Clean and validate rows
    const cleanedRows = items.map((item, idx) => {
      const tagCode = item.tag_code?.trim() || `DK-${Date.now()}-${idx + 1}`
      const name = item.name?.trim() || `Domba ${tagCode}`
      const gender = (item.gender === 'Betina' ? 'Betina' : 'Jantan') as 'Jantan' | 'Betina'
      const breed = item.breed?.trim() || 'Garut'
      const origin = (item.origin === 'Beranak' ? 'Beranak' : 'Beli') as 'Beli' | 'Beranak'
      const initialWeight = Number(item.initial_weight) > 0 ? Number(item.initial_weight) : 25
      const currentWeight =
        item.current_weight && Number(item.current_weight) > 0
          ? Number(item.current_weight)
          : initialWeight
      const entryDate = item.entry_date?.trim() || new Date().toISOString().split('T')[0]
      const status = item.status || (gender === 'Betina' ? 'Kosongan' : 'Pemacek')
      const sheepType = item.sheep_type || (gender === 'Betina' ? 'Indukan' : 'Pejantan')
      const notes = item.notes?.trim() || null

      return {
        tag_code: tagCode,
        name,
        gender,
        breed,
        origin,
        entry_date: entryDate,
        initial_weight: initialWeight,
        current_weight: currentWeight,
        status,
        sheep_type: sheepType,
        notes,
      }
    })

    const db = createAdminClient()
    const { data, error } = await db
      .from('farm_sheep')
      .upsert(cleanedRows, { onConflict: 'tag_code' })
      .select()

    if (error) {
      return { success: false, error: `Gagal import CSV: ${error.message}` }
    }

    // Non-blocking sync to Google Sheets for bulk items
    cleanedRows.forEach(async (row) => {
      try {
        await syncFarmSheepToAppsScriptWebhook({
          action: 'BULK_IMPORT',
          ...row,
        })
      } catch {
        // Ignore
      }
    })

    revalidatePath('/admin/farm-sheep')

    return {
      success: true,
      message: `Berhasil mengimpor ${data?.length || cleanedRows.length} domba ke master kandang!`,
      importedCount: data?.length || cleanedRows.length,
      data: (data as unknown as FarmSheep[]) || [],
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kendala saat import CSV.'
    return { success: false, error: errorMsg }
  }
}

/**
 * Record a farm event: Kelahiran (Birth) or Tindakan (Medical/Treatment)
 * If Kelahiran: automatically updates Induk status to 'Kosongan/Menyusui'
 */
export async function createFarmEvent(
  input: CreateFarmEventInput
): Promise<FarmActionResult<FarmEvent>> {
  try {
    const supabase = await createClient()

    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) {
      return { success: false, error: 'Sesi admin telah berakhir.' }
    }

    if (!input.sheep_id) {
      return { success: false, error: 'Pilih domba terlebih dahulu.' }
    }

    if (!input.event_type || !['Kelahiran', 'Tindakan'].includes(input.event_type)) {
      return { success: false, error: 'Tipe event tidak valid.' }
    }

    const eventDate = input.event_date?.trim() || new Date().toISOString().split('T')[0]

    // Validate event specifics
    let lambCount: number | null = null
    let actionName: string | null = null

    if (input.event_type === 'Kelahiran') {
      lambCount = Number(input.lamb_count)
      if (isNaN(lambCount) || lambCount <= 0) {
        return { success: false, error: 'Jumlah anak harus berupa angka minimal 1.' }
      }
    } else {
      actionName = input.action_name?.trim() || null
      if (!actionName) {
        return { success: false, error: 'Nama/jenis tindakan medis wajib diisi.' }
      }
    }

    const db = createAdminClient()

    // 1. Fetch sheep record to verify and get tag/name
    const { data: sheep, error: sheepError } = await db
      .from('farm_sheep')
      .select('id, tag_code, name, gender, status, sheep_type')
      .eq('id', input.sheep_id)
      .single()

    if (sheepError || !sheep) {
      return { success: false, error: 'Domba yang dipilih tidak ditemukan.' }
    }

    // 2. Insert into farm_events
    const eventPayload = {
      sheep_id: input.sheep_id,
      event_type: input.event_type,
      event_date: eventDate,
      lamb_count: lambCount,
      action_name: actionName,
      notes: input.notes?.trim() || null,
    }

    const { data: eventData, error: eventInsertError } = await db
      .from('farm_events')
      .insert(eventPayload)
      .select()
      .single()

    if (eventInsertError) {
      return { success: false, error: `Gagal menyimpan event: ${eventInsertError.message}` }
    }

    // 3. If Kelahiran: Otomatis memperbarui status Induk menjadi "Kosongan/Menyusui"
    if (input.event_type === 'Kelahiran') {
      const { error: updateIndukError } = await db
        .from('farm_sheep')
        .update({ status: 'Kosongan/Menyusui' })
        .eq('id', input.sheep_id)

      if (updateIndukError) {
        console.warn('[FarmEvent] Gagal update status induk otomatis:', updateIndukError.message)
      }
    }

    // 4. Non-blocking sync to Google Sheets & Apps Script
    let sheetsSynced = false
    try {
      const webhookRes = await syncFarmEventToAppsScriptWebhook({
        action: 'RECORD_FARM_EVENT',
        event_type: input.event_type,
        tag_code: sheep.tag_code,
        sheep_name: sheep.name,
        event_date: eventDate,
        lamb_count: lambCount,
        action_name: actionName,
        notes: input.notes?.trim() || null,
      })
      if (webhookRes.success) sheetsSynced = true
    } catch (sheetErr) {
      console.warn('[FarmEvent] Apps Script sync non-blocking error:', sheetErr)
    }

    try {
      const appendRes = await appendFarmEventRowToSheet({
        action: 'RECORD_FARM_EVENT',
        event_type: input.event_type,
        tag_code: sheep.tag_code,
        sheep_name: sheep.name,
        event_date: eventDate,
        lamb_count: lambCount,
        action_name: actionName,
        notes: input.notes?.trim() || null,
      })
      if (appendRes.success) sheetsSynced = true
    } catch {
      // Ignore direct sheet error
    }

    revalidatePath('/admin/farm-sheep')

    const successMsg =
      input.event_type === 'Kelahiran'
        ? `Catatan kelahiran untuk Induk "${sheep.name}" (${lambCount} anak) berhasil disimpan dan status induk diperbarui ke Kosongan/Menyusui!`
        : `Tindakan "${actionName}" untuk domba "${sheep.name}" berhasil dicatat!`

    return {
      success: true,
      message: successMsg,
      data: eventData as FarmEvent,
      sheetsSynced,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kendala server saat menyimpan rekam medis/kelahiran.'
    return { success: false, error: errorMsg }
  }
}

/**
 * Delete a farm event record
 */
export async function deleteFarmEvent(id: string): Promise<FarmActionResult> {
  try {
    const supabase = await createClient()

    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) {
      return { success: false, error: 'Sesi admin telah berakhir.' }
    }

    const db = createAdminClient()
    const { error } = await db.from('farm_events').delete().eq('id', id)

    if (error) {
      return { success: false, error: `Gagal menghapus catatan: ${error.message}` }
    }

    revalidatePath('/admin/farm-sheep')
    return { success: true, message: 'Catatan kegiatan berhasil dihapus.' }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus event.'
    return { success: false, error: errorMsg }
  }
}
