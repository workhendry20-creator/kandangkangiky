'use server'

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdminSession } from '@/lib/auth'
import {
  appendFarmSheepRowToSheet,
  appendFarmEventRowToSheet,
  getGoogleSheetsWebhookUrl,
} from '@/lib/google-sheets'
import { syncAllProgressLogsToSheets } from '@/lib/actions/progress'
import { revalidatePath } from 'next/cache'
import type {
  FarmSheep,
  FarmEvent,
  FarmSheepGender,
  FarmSheepOrigin,
  FarmSheepStatus,
  FarmSheepType,
  FarmEventType,
  CreateFarmSheepInput,
  UpdateFarmSheepInput,
  CreateFarmEventInput,
  FarmActionResult,
} from '@/types/farm-sheep'

/**
 * Helper to execute Supabase insert with dynamic column tolerance.
 * Automatically adapts if schema differs (e.g. tag_id vs tag_code, arrival_date vs entry_date,
 * type vs sheep_type, notes vs description, or missing current_weight).
 */
async function resilientInsert(
  client: ReturnType<typeof createAdminClient>,
  table: string,
  initialPayload: Record<string, unknown>
): Promise<{ data: Record<string, unknown> | null; error: Error | null }> {
  const payload = { ...initialPayload }
  const maxRetries = 5

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await client.from(table).insert(payload).select().single()

    if (!res.error) {
      return { data: res.data as Record<string, unknown>, error: null }
    }

    const msg = res.error.message || ''
    const match = msg.match(/Could not find the '([^']+)' column of '([^']+)' in the schema cache/)

    if (match) {
      const missingCol = match[1]

      // Handle column mismatches
      if (missingCol === 'current_weight') {
        delete payload.current_weight
        continue
      } else if (missingCol === 'tag_id') {
        payload.tag_code = payload.tag_id
        delete payload.tag_id
        continue
      } else if (missingCol === 'tag_code') {
        payload.tag_id = payload.tag_code
        delete payload.tag_code
        continue
      } else if (missingCol === 'arrival_date') {
        payload.entry_date = payload.arrival_date
        delete payload.arrival_date
        continue
      } else if (missingCol === 'entry_date') {
        payload.arrival_date = payload.entry_date
        delete payload.entry_date
        continue
      } else if (missingCol === 'type') {
        payload.sheep_type = payload.type
        delete payload.type
        continue
      } else if (missingCol === 'sheep_type') {
        payload.type = payload.sheep_type
        delete payload.sheep_type
        continue
      } else if (missingCol === 'description') {
        payload.notes = payload.description
        delete payload.description
        continue
      } else if (missingCol === 'notes') {
        payload.description = payload.notes
        delete payload.notes
        continue
      } else if (missingCol === 'child_count') {
        payload.lamb_count = payload.child_count
        delete payload.child_count
        continue
      } else if (missingCol === 'lamb_count') {
        payload.child_count = payload.lamb_count
        delete payload.lamb_count
        continue
      } else if (missingCol === 'farm_sheep_id') {
        payload.sheep_id = payload.farm_sheep_id
        delete payload.farm_sheep_id
        continue
      } else if (missingCol === 'sheep_id') {
        payload.farm_sheep_id = payload.sheep_id
        delete payload.sheep_id
        continue
      } else {
        // Unknown missing column: drop it and retry
        delete payload[missingCol]
        continue
      }
    }

    // Other error
    return { data: null, error: new Error(res.error.message) }
  }

  return { data: null, error: new Error('Gagal menyimpan: melebihi batas percobaan adaptasi skema') }
}

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
    const { data: rawSheepData, error: sheepError } = await db
      .from('farm_sheep')
      .select('*')
      .order('created_at', { ascending: false })

    if (sheepError) {
      console.warn('[FarmSheep] Note fetching farm_sheep:', sheepError.message)
    }

    // Map sheep to uniform shape
    const farmSheep: FarmSheep[] = (rawSheepData || []).map((s: Record<string, unknown>) => {
      const initialWeight = Number(s.initial_weight) || 0
      const currentWeight =
        s.current_weight !== undefined && s.current_weight !== null
          ? Number(s.current_weight)
          : initialWeight

      return {
        id: String(s.id),
        tag_code: String(s.tag_id || s.tag_code || s.code || s.id),
        name: String(s.name || ''),
        gender: (s.gender as FarmSheepGender) || 'Betina',
        breed: String(s.breed || 'Garut'),
        origin: (s.origin as FarmSheepOrigin) || 'Beli',
        entry_date: String(s.arrival_date || s.entry_date || s.created_at || '').split('T')[0],
        initial_weight: initialWeight,
        current_weight: currentWeight,
        status: (s.status as FarmSheepStatus) || 'Kosongan',
        sheep_type: ((s.type || s.sheep_type || 'Indukan') as FarmSheepType),
        notes: (s.notes || s.description || null) as string | null,
        created_at: String(s.created_at || new Date().toISOString()),
      }
    })

    // 2. Fetch farm events with relation
    let rawEventsData: Record<string, unknown>[] = []

    // Try relational query with farm_sheep
    const { data: eventsWithRel, error: relError } = await db
      .from('farm_events')
      .select('*, farm_sheep(*)')
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (relError || !eventsWithRel) {
      // Fallback query without relation
      const { data: fallbackEvents } = await db
        .from('farm_events')
        .select('*')
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false })

      rawEventsData = (fallbackEvents as Record<string, unknown>[]) || []
    } else {
      rawEventsData = eventsWithRel as Record<string, unknown>[]
    }

    const farmEvents: FarmEvent[] = rawEventsData.map((e: Record<string, unknown>) => {
      const sheepRel = (e.farm_sheep || e.sheep) as Record<string, unknown> | undefined

      return {
        id: String(e.id),
        sheep_id: String(e.farm_sheep_id || e.sheep_id || ''),
        event_type: (e.event_type as FarmEventType) || 'Kelahiran',
        event_date: String(e.event_date || e.created_at || '').split('T')[0],
        lamb_count:
          e.child_count !== undefined && e.child_count !== null
            ? Number(e.child_count)
            : e.lamb_count !== undefined && e.lamb_count !== null
            ? Number(e.lamb_count)
            : null,
        action_name: (e.action_name || null) as string | null,
        notes: (e.description || e.notes || null) as string | null,
        created_at: String(e.created_at || new Date().toISOString()),
        sheep: sheepRel
          ? {
              id: String(sheepRel.id),
              tag_code: String(sheepRel.tag_id || sheepRel.tag_code || ''),
              name: String(sheepRel.name || ''),
              gender: sheepRel.gender as FarmSheepGender,
              breed: String(sheepRel.breed || ''),
              sheep_type: ((sheepRel.type || sheepRel.sheep_type || 'Indukan') as FarmSheepType),
            }
          : undefined,
      }
    })

    return { farmSheep, farmEvents }
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
    // Verify session
    const adminSession = await requireAdminSession()
    if (!adminSession) {
      return {
        success: false,
        error: 'Sesi admin telah berakhir atau belum login. Silakan login kembali.',
      }
    }

    const supabase = createAdminClient()

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

    const entryDate = input.entry_date?.trim() || new Date().toISOString().split('T')[0]
    const status = input.status || (input.gender === 'Betina' ? 'Kosongan' : 'Pemacek')
    const sheepType = input.sheep_type || (input.gender === 'Betina' ? 'Indukan' : 'Pejantan')
    const notes = input.notes?.trim() || null

    // Build payload using initial_weight and set current_weight = initial_weight if available
    const payload: Record<string, unknown> = {
      tag_id: tagCode,
      name,
      gender: input.gender,
      breed,
      origin: input.origin || 'Beli',
      arrival_date: entryDate,
      initial_weight: initialWeight,
      current_weight: initialWeight,
      status,
      type: sheepType,
      notes: notes,
    }

    const { data, error } = await resilientInsert(supabase, 'farm_sheep', payload)

    if (error || !data) {
      const errMsg = error?.message || 'Gagal menyimpan domba ke database'
      if (errMsg.includes('23505') || errMsg.includes('duplicate key') || errMsg.includes('already exists')) {
        return { success: false, error: `ID Domba "${tagCode}" sudah terdaftar.` }
      }
      return { success: false, error: errMsg }
    }

    // Construct returned FarmSheep object
    const createdSheep: FarmSheep = {
      id: String(data.id),
      tag_code: String(data.tag_id || data.tag_code || tagCode),
      name: String(data.name || name),
      gender: (data.gender as FarmSheepGender) || input.gender,
      breed: String(data.breed || breed),
      origin: (data.origin as FarmSheepOrigin) || (input.origin || 'Beli'),
      entry_date: String(data.arrival_date || data.entry_date || entryDate).split('T')[0],
      initial_weight: Number(data.initial_weight) || initialWeight,
      current_weight:
        data.current_weight !== undefined && data.current_weight !== null
          ? Number(data.current_weight)
          : initialWeight,
      status: (data.status as FarmSheepStatus) || status,
      sheep_type: ((data.type || data.sheep_type || sheepType) as FarmSheepType),
      notes: (data.notes || data.description || notes) as string | null,
      created_at: String(data.created_at || new Date().toISOString()),
    }

    // Non-blocking Google Sheets / Apps Script Webhook sync
    let sheetsSynced = false
    try {
      const webhookUrl = getGoogleSheetsWebhookUrl()
      if (webhookUrl) {
        const payloadJson = {
          sheet_name: 'Master_Kandang',
          type: 'farm_sheep',
          tag_id: createdSheep.tag_code,
          name: createdSheep.name,
          gender: createdSheep.gender,
          breed: createdSheep.breed,
          origin: createdSheep.origin,
          arrival_date: createdSheep.entry_date,
          initial_weight: createdSheep.initial_weight,
          status: createdSheep.status,
          farm_type: createdSheep.sheep_type,
        }

        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadJson),
        })
        if (res.ok) sheetsSynced = true
      }
    } catch (sheetErr) {
      console.warn('[FarmSheep] Apps Script sync non-blocking error:', sheetErr)
    }

    try {
      const appendRes = await appendFarmSheepRowToSheet({
        tag_code: createdSheep.tag_code,
        name: createdSheep.name,
        gender: createdSheep.gender,
        breed: createdSheep.breed,
        origin: createdSheep.origin,
        entry_date: createdSheep.entry_date,
        initial_weight: createdSheep.initial_weight,
        status: createdSheep.status,
        sheep_type: createdSheep.sheep_type,
        notes: createdSheep.notes,
      })
      if (appendRes.success) sheetsSynced = true
    } catch {
      // Ignore direct sheet error
    }

    revalidatePath('/admin/farm-sheep')

    return {
      success: true,
      message: `Domba kandang "${createdSheep.name}" (${createdSheep.tag_code}) berhasil ditambahkan!`,
      data: createdSheep,
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
    const adminSession = await requireAdminSession()
    if (!adminSession) {
      return {
        success: false,
        error: 'Sesi admin telah berakhir. Silakan login kembali.',
      }
    }

    const supabase = createAdminClient()

    if (!id) {
      return { success: false, error: 'ID domba tidak valid.' }
    }

    const updatePayload: Record<string, unknown> = {}
    if (input.tag_code !== undefined) {
      updatePayload.tag_id = input.tag_code.trim()
    }
    if (input.name !== undefined) updatePayload.name = input.name.trim()
    if (input.gender !== undefined) updatePayload.gender = input.gender
    if (input.breed !== undefined) updatePayload.breed = input.breed.trim()
    if (input.origin !== undefined) updatePayload.origin = input.origin
    if (input.entry_date !== undefined) {
      updatePayload.arrival_date = input.entry_date
    }
    if (input.initial_weight !== undefined) {
      updatePayload.initial_weight = Number(input.initial_weight)
    }
    if (input.current_weight !== undefined) {
      updatePayload.current_weight = Number(input.current_weight)
    }
    if (input.status !== undefined) updatePayload.status = input.status
    if (input.sheep_type !== undefined) {
      updatePayload.type = input.sheep_type
    }
    if (input.notes !== undefined) {
      updatePayload.notes = input.notes?.trim() || null
    }

    let resultData: Record<string, unknown> | null = null
    const maxRetries = 5

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { data, error } = await supabase
        .from('farm_sheep')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        resultData = data as Record<string, unknown>
        break
      }

      if (error) {
        const msg = error.message || ''
        const match = msg.match(/Could not find the '([^']+)' column of '([^']+)' in the schema cache/)
        if (match) {
          const missingCol = match[1]
          if (missingCol === 'current_weight') {
            delete updatePayload.current_weight
            continue
          } else if (missingCol === 'tag_id') {
            updatePayload.tag_code = updatePayload.tag_id
            delete updatePayload.tag_id
            continue
          } else if (missingCol === 'arrival_date') {
            updatePayload.entry_date = updatePayload.arrival_date
            delete updatePayload.arrival_date
            continue
          } else if (missingCol === 'type') {
            updatePayload.sheep_type = updatePayload.type
            delete updatePayload.type
            continue
          } else if (missingCol === 'notes') {
            updatePayload.description = updatePayload.notes
            delete updatePayload.notes
            continue
          } else {
            delete updatePayload[missingCol]
            continue
          }
        }

        return { success: false, error: `Gagal memperbarui domba: ${error.message}` }
      }
    }

    if (!resultData) {
      return { success: false, error: 'Gagal memperbarui data domba di database.' }
    }

    const updatedSheep: FarmSheep = {
      id: String(resultData.id),
      tag_code: String(resultData.tag_id || resultData.tag_code || input.tag_code || ''),
      name: String(resultData.name || input.name || ''),
      gender: (resultData.gender as FarmSheepGender) || 'Betina',
      breed: String(resultData.breed || ''),
      origin: (resultData.origin as FarmSheepOrigin) || 'Beli',
      entry_date: String(resultData.arrival_date || resultData.entry_date || '').split('T')[0],
      initial_weight: Number(resultData.initial_weight) || 0,
      current_weight:
        resultData.current_weight !== undefined && resultData.current_weight !== null
          ? Number(resultData.current_weight)
          : Number(resultData.initial_weight) || 0,
      status: (resultData.status as FarmSheepStatus) || 'Kosongan',
      sheep_type: ((resultData.type || resultData.sheep_type || input.sheep_type || 'Indukan') as FarmSheepType),
      notes: (resultData.notes || resultData.description || null) as string | null,
      created_at: String(resultData.created_at || new Date().toISOString()),
    }

    // Non-blocking sync to Google Sheets
    try {
      const webhookUrl = getGoogleSheetsWebhookUrl()
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheet_name: 'Master_Kandang',
            type: 'farm_sheep',
            tag_id: updatedSheep.tag_code,
            name: updatedSheep.name,
            gender: updatedSheep.gender,
            breed: updatedSheep.breed,
            origin: updatedSheep.origin,
            arrival_date: updatedSheep.entry_date,
            initial_weight: updatedSheep.initial_weight,
            status: updatedSheep.status,
            farm_type: updatedSheep.sheep_type,
          }),
        }).catch(() => {})
      }
    } catch (sheetErr) {
      console.warn('[FarmSheep] Sync error on update:', sheetErr)
    }

    revalidatePath('/admin/farm-sheep')

    return {
      success: true,
      message: `Data domba "${updatedSheep.name}" berhasil diperbarui.`,
      data: updatedSheep,
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
    const adminSession = await requireAdminSession()
    if (!adminSession) {
      return { success: false, error: 'Sesi admin telah berakhir.' }
    }

    const supabase = createAdminClient()

    // 1. Get tag_id of sheep before deletion
    const { data: sheep } = await supabase
      .from('farm_sheep')
      .select('tag_id, tag_code')
      .eq('id', id)
      .single()

    const tagId = sheep ? String(sheep.tag_id || sheep.tag_code || id) : id

    // 2. Delete from Supabase
    const { error } = await supabase.from('farm_sheep').delete().eq('id', id)

    if (error) {
      return { success: false, error: `Gagal menghapus domba: ${error.message}` }
    }

    // 3. Non-blocking delete sync to Google Sheets Webhook
    try {
      const webhookUrl = getGoogleSheetsWebhookUrl()
      if (webhookUrl && tagId) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            sheet_name: 'Master_Kandang',
            tag_id: tagId,
          }),
        })
      }
    } catch (sheetErr) {
      console.warn('[FarmSheep] Apps Script delete sync error:', sheetErr)
    }

    revalidatePath('/admin/farm-sheep')
    return { success: true, message: `Domba kandang "${tagId}" berhasil dihapus.` }
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
    const adminSession = await requireAdminSession()
    if (!adminSession) {
      return { success: false, error: 'Sesi admin telah berakhir.' }
    }

    const supabase = createAdminClient()

    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, error: 'Data CSV kosong atau tidak ada baris yang valid.' }
    }

    let successCount = 0
    const insertedSheep: FarmSheep[] = []

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx]
      const tagCode = item.tag_code?.trim() || `DK-${Date.now()}-${idx + 1}`
      const name = item.name?.trim() || `Domba ${tagCode}`
      const gender = (item.gender === 'Betina' ? 'Betina' : 'Jantan') as FarmSheepGender
      const breed = item.breed?.trim() || 'Garut'
      const origin = (item.origin === 'Beranak' ? 'Beranak' : 'Beli') as FarmSheepOrigin
      const initialWeight = Number(item.initial_weight) > 0 ? Number(item.initial_weight) : 25
      const entryDate = item.entry_date?.trim() || new Date().toISOString().split('T')[0]
      const status = item.status || (gender === 'Betina' ? 'Kosongan' : 'Pemacek')
      const sheepType = item.sheep_type || (gender === 'Betina' ? 'Indukan' : 'Pejantan')
      const notes = item.notes?.trim() || null

      const payload: Record<string, unknown> = {
        tag_id: tagCode,
        name,
        gender,
        breed,
        origin,
        arrival_date: entryDate,
        initial_weight: initialWeight,
        current_weight: initialWeight,
        status,
        type: sheepType,
        notes,
      }

      const { data, error } = await resilientInsert(supabase, 'farm_sheep', payload)

      if (!error && data) {
        successCount++
        insertedSheep.push({
          id: String(data.id),
          tag_code: String(data.tag_id || data.tag_code || tagCode),
          name: String(data.name || name),
          gender,
          breed,
          origin,
          entry_date: entryDate,
          initial_weight: initialWeight,
          current_weight: initialWeight,
          status,
          sheep_type: sheepType,
          notes,
          created_at: String(data.created_at || new Date().toISOString()),
        })

        // Non-blocking sync to Google Sheets for bulk items
        try {
          const webhookUrl = getGoogleSheetsWebhookUrl()
          if (webhookUrl) {
            fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sheet_name: 'Master_Kandang',
                type: 'farm_sheep',
                tag_id: tagCode,
                name,
                gender,
                breed,
                origin,
                arrival_date: entryDate,
                initial_weight: initialWeight,
                status,
                farm_type: sheepType,
              }),
            }).catch(() => {})
          }
        } catch {
          // Ignore
        }
      }
    }

    revalidatePath('/admin/farm-sheep')

    return {
      success: true,
      message: `Berhasil mengimpor ${successCount} domba ke master kandang!`,
      importedCount: successCount,
      data: insertedSheep,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kendala saat import CSV.'
    return { success: false, error: errorMsg }
  }
}

/**
 * Record a farm event: Kelahiran (Birth) or Tindakan (Medical/Treatment)
 * Automatically updates Induk status to 'Kosongan/Menyusui' if Kelahiran
 */
export async function createFarmEvent(
  input: CreateFarmEventInput
): Promise<FarmActionResult<FarmEvent>> {
  try {
    const adminSession = await requireAdminSession()
    if (!adminSession) {
      return { success: false, error: 'Sesi admin telah berakhir.' }
    }

    const supabase = createAdminClient()

    if (!input.sheep_id) {
      return { success: false, error: 'Pilih domba terlebih dahulu.' }
    }

    if (!input.event_type || !['Kelahiran', 'Tindakan'].includes(input.event_type)) {
      return { success: false, error: 'Tipe event tidak valid.' }
    }

    const eventDate = input.event_date?.trim() || new Date().toISOString().split('T')[0]

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

    // 1. Fetch sheep record to verify and get tag/name
    const { data: rawSheep, error: sheepError } = await supabase
      .from('farm_sheep')
      .select('*')
      .eq('id', input.sheep_id)
      .single()

    if (sheepError || !rawSheep) {
      return { success: false, error: 'Domba yang dipilih tidak ditemukan di database.' }
    }

    const sheepTag = String(rawSheep.tag_id || rawSheep.tag_code || '')
    const sheepName = String(rawSheep.name || '')

    // 2. Insert into farm_events with column resilience
    const eventPayload: Record<string, unknown> = {
      farm_sheep_id: input.sheep_id,
      event_type: input.event_type,
      event_date: eventDate,
      child_count: lambCount,
      action_name: actionName,
      description: input.notes?.trim() || null,
    }

    const { data: eventData, error: eventInsertError } = await resilientInsert(
      supabase,
      'farm_events',
      eventPayload
    )

    if (eventInsertError || !eventData) {
      return { success: false, error: `Gagal menyimpan event: ${eventInsertError?.message}` }
    }

    // 3. If Kelahiran: Otomatis memperbarui status Induk menjadi "Kosongan/Menyusui"
    if (input.event_type === 'Kelahiran') {
      const { error: updateIndukError } = await supabase
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
      const webhookUrl = getGoogleSheetsWebhookUrl()
      if (webhookUrl) {
        const payloadJson = {
          sheet_name: 'Kelahiran_Tindakan',
          type: 'farm_event',
          tag_id: sheepTag,
          event_type: input.event_type,
          event_date: eventDate,
          child_count: lambCount,
          action_name: actionName,
          description: input.notes?.trim() || null,
        }

        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadJson),
        })
        if (res.ok) sheetsSynced = true
      }
    } catch (sheetErr) {
      console.warn('[FarmEvent] Apps Script sync non-blocking error:', sheetErr)
    }

    try {
      const appendRes = await appendFarmEventRowToSheet({
        action: 'RECORD_FARM_EVENT',
        event_type: input.event_type,
        tag_code: sheepTag,
        sheep_name: sheepName,
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
        ? `Catatan kelahiran untuk Induk "${sheepName}" (${lambCount} anak) berhasil disimpan dan status induk diperbarui ke Kosongan/Menyusui!`
        : `Tindakan "${actionName}" untuk domba "${sheepName}" berhasil dicatat!`

    return {
      success: true,
      message: successMsg,
      data: eventData as unknown as FarmEvent,
      sheetsSynced,
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : 'Terjadi kendala server saat menyimpan rekam medis/kelahiran.'
    return { success: false, error: errorMsg }
  }
}

/**
 * Delete a farm event record
 */
export async function deleteFarmEvent(id: string): Promise<FarmActionResult> {
  try {
    const adminSession = await requireAdminSession()
    if (!adminSession) {
      return { success: false, error: 'Sesi admin telah berakhir.' }
    }

    const supabase = createAdminClient()

    // 1. Get tag_id from associated sheep before deletion
    let tagId = ''
    const { data: eventData } = await supabase
      .from('farm_events')
      .select('*, farm_sheep(tag_id, tag_code)')
      .eq('id', id)
      .single()

    if (eventData) {
      if (eventData.farm_sheep) {
        const s = eventData.farm_sheep as Record<string, unknown>
        tagId = String(s.tag_id || s.tag_code || '')
      } else if (eventData.farm_sheep_id || eventData.sheep_id) {
        const sheepId = eventData.farm_sheep_id || eventData.sheep_id
        const { data: s } = await supabase
          .from('farm_sheep')
          .select('tag_id, tag_code')
          .eq('id', sheepId)
          .single()
        if (s) {
          tagId = String(s.tag_id || s.tag_code || '')
        }
      }
    }

    // 2. Delete from Supabase
    const { error } = await supabase.from('farm_events').delete().eq('id', id)

    if (error) {
      return { success: false, error: `Gagal menghapus catatan: ${error.message}` }
    }

    // 3. Non-blocking delete sync to Google Sheets Webhook
    try {
      const webhookUrl = getGoogleSheetsWebhookUrl()
      if (webhookUrl && tagId) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            sheet_name: 'Kelahiran_Tindakan',
            tag_id: tagId,
          }),
        })
      }
    } catch (sheetErr) {
      console.warn('[FarmEvent] Apps Script delete sync error:', sheetErr)
    }

    revalidatePath('/admin/farm-sheep')
    return { success: true, message: 'Catatan kegiatan berhasil dihapus.' }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus event.'
    return { success: false, error: errorMsg }
  }
}

/**
 * Sync all existing farm sheep and farm events from Supabase to Google Sheets Webhook
 */
export async function syncAllFarmDataToSheets(): Promise<{
  success: boolean
  message: string
  syncedSheepCount?: number
  syncedEventsCount?: number
  error?: string
}> {
  try {
    const webhookUrl = getGoogleSheetsWebhookUrl()
    if (!webhookUrl) {
      return {
        success: false,
        message: 'URL Google Apps Script belum terkonfigurasi di server (GOOGLE_SHEETS_WEB_APP_URL atau GOOGLE_APPS_SCRIPT_URL).',
        error: 'GOOGLE_SHEETS_WEB_APP_URL is not configured',
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

    // 1. Fetch all farm sheep
    const { data: rawSheep, error: sheepErr } = await supabase
      .from('farm_sheep')
      .select('*')
      .order('created_at', { ascending: true })

    if (sheepErr) {
      return {
        success: false,
        message: `Gagal mengambil data domba dari database: ${sheepErr.message}`,
        error: sheepErr.message,
      }
    }

    // 2. Fetch all farm events
    const { data: rawEvents, error: eventsErr } = await supabase
      .from('farm_events')
      .select('*')
      .order('event_date', { ascending: true })
      .order('created_at', { ascending: true })

    if (eventsErr) {
      return {
        success: false,
        message: `Gagal mengambil data kegiatan dari database: ${eventsErr.message}`,
        error: eventsErr.message,
      }
    }

    const sheepList = rawSheep || []
    const eventList = rawEvents || []

    // Build map for resolving sheep tag_id
    const sheepTagMap = new Map<string, string>()
    sheepList.forEach((s) => {
      const tag = String(s.tag_id || s.tag_code || s.code || s.id)
      sheepTagMap.set(String(s.id), tag)
    })

    let syncedSheepCount = 0
    let syncedEventsCount = 0

    // Send each sheep to Master_Kandang
    for (const s of sheepList) {
      const tagId = String(s.tag_id || s.tag_code || s.code || s.id)
      const initialWeight = Number(s.initial_weight) || 0
      const payload = {
        sheet_name: 'Master_Kandang',
        type: 'farm_sheep',
        tag_id: tagId,
        name: String(s.name || ''),
        gender: String(s.gender || 'Betina'),
        breed: String(s.breed || 'Garut'),
        origin: String(s.origin || 'Beli'),
        arrival_date: String(s.arrival_date || s.entry_date || s.created_at || '').split('T')[0],
        initial_weight: initialWeight,
        status: String(s.status || 'Kosongan'),
        farm_type: String(s.type || s.sheep_type || 'Indukan'),
      }

      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          syncedSheepCount++
        }
      } catch (err) {
        console.warn(`[SyncAll] Error syncing sheep ${tagId}:`, err)
      }
    }

    // Send each event to Kelahiran_Tindakan
    for (const e of eventList) {
      const sheepId = String(e.farm_sheep_id || e.sheep_id || '')
      const tagId = sheepTagMap.get(sheepId) || sheepId || '-'
      const lambCount =
        e.child_count !== null && e.child_count !== undefined
          ? Number(e.child_count)
          : e.lamb_count !== null && e.lamb_count !== undefined
          ? Number(e.lamb_count)
          : null

      const payload = {
        sheet_name: 'Kelahiran_Tindakan',
        type: 'farm_event',
        tag_id: tagId,
        event_type: String(e.event_type || 'Tindakan'),
        event_date: String(e.event_date || e.created_at || '').split('T')[0],
        child_count: lambCount,
        action_name: e.action_name || null,
        description: e.description || e.notes || null,
      }

      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          syncedEventsCount++
        }
      } catch (err) {
        console.warn(`[SyncAll] Error syncing event ${e.id}:`, err)
      }
    }

    // Sync Log_Titipan (progress_logs)
    let syncedLogsCount = 0
    try {
      const logsRes = await syncAllProgressLogsToSheets()
      if (logsRes.success && logsRes.syncedCount) {
        syncedLogsCount = logsRes.syncedCount
      }
    } catch (logErr) {
      console.warn('[SyncAll] Error syncing progress logs:', logErr)
    }

    revalidatePath('/admin/farm-sheep')

    return {
      success: true,
      message: `Berhasil sinkronisasi ${syncedSheepCount} domba, ${syncedEventsCount} kegiatan, dan ${syncedLogsCount} log titipan ke Google Sheets!`,
      syncedSheepCount,
      syncedEventsCount,
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Terjadi kendala saat sinkronisasi ke Google Sheets.'
    return {
      success: false,
      message: errorMsg,
      error: errorMsg,
    }
  }
}

/**
 * Full clear and sync to Google Sheets (clears old sheet data then repopulates all records)
 */
export async function fullSyncToSheets(): Promise<{
  success: boolean
  message: string
  syncedSheepCount?: number
  syncedEventsCount?: number
  error?: string
}> {
  try {
    const webhookUrl = getGoogleSheetsWebhookUrl()
    if (!webhookUrl) {
      return {
        success: false,
        message: 'URL Google Apps Script belum terkonfigurasi di server (GOOGLE_SHEETS_WEB_APP_URL atau GOOGLE_APPS_SCRIPT_URL).',
        error: 'GOOGLE_SHEETS_WEB_APP_URL is not configured',
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

    // 1. Fetch all active sheep from Supabase
    const { data: rawSheep, error: sheepErr } = await supabase
      .from('farm_sheep')
      .select('*')
      .order('created_at', { ascending: true })

    if (sheepErr) {
      return {
        success: false,
        message: `Gagal mengambil data domba dari database: ${sheepErr.message}`,
        error: sheepErr.message,
      }
    }

    // 2. Fetch all events from Supabase
    const { data: rawEvents, error: eventsErr } = await supabase
      .from('farm_events')
      .select('*')
      .order('event_date', { ascending: true })
      .order('created_at', { ascending: true })

    if (eventsErr) {
      return {
        success: false,
        message: `Gagal mengambil data kegiatan dari database: ${eventsErr.message}`,
        error: eventsErr.message,
      }
    }

    const sheepList = rawSheep || []
    const eventList = rawEvents || []

    // 3. Clear old data on sheet Master_Kandang
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_and_sync',
          sheet_name: 'Master_Kandang',
        }),
      })
    } catch (clearErr) {
      console.warn('[FullSync] Gagal reset sheet Master_Kandang:', clearErr)
    }

    let syncedSheepCount = 0
    let syncedEventsCount = 0

    // 4. Loop POST seluruh data domba aktif ke Master_Kandang
    for (const s of sheepList) {
      const tagId = String(s.tag_id || s.tag_code || s.code || s.id)
      const initialWeight = Number(s.initial_weight) || 0
      const payload = {
        sheet_name: 'Master_Kandang',
        type: 'farm_sheep',
        tag_id: tagId,
        name: String(s.name || ''),
        gender: String(s.gender || 'Betina'),
        breed: String(s.breed || 'Garut'),
        origin: String(s.origin || 'Beli'),
        arrival_date: String(s.arrival_date || s.entry_date || s.created_at || '').split('T')[0],
        initial_weight: initialWeight,
        status: String(s.status || 'Kosongan'),
        farm_type: String(s.type || s.sheep_type || 'Indukan'),
      }

      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          syncedSheepCount++
        }
      } catch (err) {
        console.warn(`[FullSync] Error syncing sheep ${tagId}:`, err)
      }
    }

    // 5. Clear old data on sheet Kelahiran_Tindakan
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_and_sync',
          sheet_name: 'Kelahiran_Tindakan',
        }),
      })
    } catch (clearEventErr) {
      console.warn('[FullSync] Gagal reset sheet Kelahiran_Tindakan:', clearEventErr)
    }

    // Build map for tag_id lookup
    const sheepTagMap = new Map<string, string>()
    sheepList.forEach((s) => {
      const tag = String(s.tag_id || s.tag_code || s.code || s.id)
      sheepTagMap.set(String(s.id), tag)
    })

    // 6. Loop POST seluruh data kegiatan ke Kelahiran_Tindakan
    for (const e of eventList) {
      const sheepId = String(e.farm_sheep_id || e.sheep_id || '')
      const tagId = sheepTagMap.get(sheepId) || sheepId || '-'
      const lambCount =
        e.child_count !== null && e.child_count !== undefined
          ? Number(e.child_count)
          : e.lamb_count !== null && e.lamb_count !== undefined
          ? Number(e.lamb_count)
          : null

      const payload = {
        sheet_name: 'Kelahiran_Tindakan',
        type: 'farm_event',
        tag_id: tagId,
        event_type: String(e.event_type || 'Tindakan'),
        event_date: String(e.event_date || e.created_at || '').split('T')[0],
        child_count: lambCount,
        action_name: e.action_name || null,
        description: e.description || e.notes || null,
      }

      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          syncedEventsCount++
        }
      } catch (err) {
        console.warn(`[FullSync] Error syncing event ${e.id}:`, err)
      }
    }

    // 7. Sync Log_Titipan from progress_logs
    let syncedLogsCount = 0
    try {
      const titipanRes = await syncAllProgressLogsToSheets()
      if (titipanRes.success && titipanRes.syncedCount) {
        syncedLogsCount = titipanRes.syncedCount
      }
    } catch (titipanErr) {
      console.warn('[FullSync] Gagal sync log titipan:', titipanErr)
    }

    revalidatePath('/admin/farm-sheep')

    return {
      success: true,
      message: `Full Sync Berhasil: ${syncedSheepCount} domba, ${syncedEventsCount} kegiatan, & ${syncedLogsCount} log titipan disinkronkan ke Google Sheets!`,
      syncedSheepCount,
      syncedEventsCount,
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Terjadi kendala saat melakukan full sync ke Google Sheets.'
    return {
      success: false,
      message: errorMsg,
      error: errorMsg,
    }
  }
}


