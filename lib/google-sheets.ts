import { google } from 'googleapis'

export interface SheetRowData {
  trackingCode: string
  customerName: string
  recordDate: string
  updateType: string
  currentWeight: number
  healthStatus: string
  notes?: string | null
  mediaUrl?: string | null
}

export interface WebhookProgressPayload {
  sheet_name?: string
  type?: string
  tracking_code: string
  customer_name: string
  record_date: string
  weight?: number
  current_weight?: number
  health_status: string
  notes?: string | null
  photo_url?: string | null
  media_url?: string | null
}

/**
 * Append progress log row to Google Sheets via direct Google Sheets API v4
 */
export async function appendProgressRowToSheet(
  data: SheetRowData
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    let privateKey = process.env.GOOGLE_PRIVATE_KEY
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    // Check if credentials exist
    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return {
        success: false,
        error: 'Google Sheets credentials not configured',
      }
    }

    // Format escaped newlines in private key if necessary
    privateKey = privateKey.replace(/\\n/g, '\n')

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    const timestamp = new Date().toISOString()
    const rowValues = [
      timestamp,
      data.trackingCode,
      data.customerName,
      data.recordDate,
      data.updateType,
      data.currentWeight,
      data.healthStatus,
      data.notes || '-',
      data.mediaUrl || '-',
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:I',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowValues],
      },
    })

    return {
      success: true,
      message: 'Berhasil append row ke Google Sheets',
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Gagal sinkronisasi ke Google Sheets'
    console.warn('[Google Sheets Error]:', errorMsg)
    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Helper to get Google Sheets / Apps Script Webhook URL
 * Supports both GOOGLE_SHEETS_WEB_APP_URL and GOOGLE_APPS_SCRIPT_URL
 */
export function getGoogleSheetsWebhookUrl(): string | undefined {
  const rawUrl =
    process.env.GOOGLE_SHEETS_WEB_APP_URL ||
    process.env.GOOGLE_APPS_SCRIPT_URL
  if (!rawUrl) return undefined
  return rawUrl.replace(/^hhttps:\/\//, 'https://').trim()
}

/**
 * Send POST request to Google Apps Script Webhook URL
 * (Non-blocking fallback when GOOGLE_SHEETS_WEB_APP_URL or GOOGLE_APPS_SCRIPT_URL is provided)
 */
export async function syncProgressToAppsScriptWebhook(
  payload: WebhookProgressPayload
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const webhookUrl = getGoogleSheetsWebhookUrl()
    if (!webhookUrl) {
      return {
        success: false,
        error: 'GOOGLE_SHEETS_WEB_APP_URL / GOOGLE_APPS_SCRIPT_URL not configured',
      }
    }

    const bodyPayload = {
      sheet_name: payload.sheet_name || 'Log_Titipan',
      sheet: payload.sheet_name || 'Log_Titipan',
      action: 'insert',
      type: payload.type || 'titipan_log',
      tracking_code: payload.tracking_code,
      code: payload.tracking_code,
      tag_id: payload.tracking_code,
      customer_name: payload.customer_name,
      name: payload.customer_name,
      record_date: payload.record_date,
      date: payload.record_date,
      weight: Number(payload.weight ?? payload.current_weight ?? 0),
      current_weight: Number(payload.weight ?? payload.current_weight ?? 0),
      health_status: payload.health_status,
      status: payload.health_status,
      notes: payload.notes ? payload.notes.trim() : '-',
      keterangan: payload.notes ? payload.notes.trim() : '-',
      photo_url: payload.photo_url || payload.media_url || '',
      media_url: payload.photo_url || payload.media_url || '',
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
      redirect: 'follow',
    })

    if (!response.ok) {
      const statusText = response.statusText || `HTTP ${response.status}`
      console.warn('[Google Apps Script Webhook Warning]:', statusText)
      return { success: false, error: statusText }
    }

    return {
      success: true,
      message: 'Berhasil sinkronisasi ke Google Apps Script Webhook',
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : 'Gagal mengirim data ke Google Apps Script'
    console.warn('[Google Apps Script Webhook Error]:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

export interface WebhookFarmSheepPayload {
  sheet?: 'Master_Kandang'
  action?: string
  tag_code: string
  name: string
  gender: string
  breed: string
  origin: string
  entry_date: string
  initial_weight: number
  current_weight?: number | null
  status: string
  sheep_type: string
  notes?: string | null
}

export interface WebhookFarmEventPayload {
  sheet?: 'Kelahiran_Tindakan'
  action?: string
  event_type: 'Kelahiran' | 'Tindakan'
  tag_code: string
  sheep_name: string
  event_date: string
  lamb_count?: number | null
  action_name?: string | null
  notes?: string | null
}

/**
 * Append row to Master_Kandang sheet via direct Google Sheets API v4
 */
export async function appendFarmSheepRowToSheet(
  data: WebhookFarmSheepPayload
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    let privateKey = process.env.GOOGLE_PRIVATE_KEY
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return { success: false, error: 'Google Sheets credentials not configured' }
    }

    privateKey = privateKey.replace(/\\n/g, '\n')
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const timestamp = new Date().toISOString()
    const rowValues = [
      timestamp,
      data.tag_code,
      data.name,
      data.gender,
      data.breed,
      data.origin,
      data.entry_date,
      data.initial_weight,
      data.current_weight ?? data.initial_weight,
      data.status,
      data.sheep_type,
      data.notes || '-',
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Master_Kandang!A:L',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [rowValues] },
    })

    return { success: true, message: 'Berhasil append ke Master_Kandang Google Sheets' }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Gagal sinkronisasi ke Master_Kandang'
    console.warn('[Google Sheets Master_Kandang Error]:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Send POST request to Google Apps Script Webhook for Master_Kandang
 */
export async function syncFarmSheepToAppsScriptWebhook(
  payload: WebhookFarmSheepPayload
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const webhookUrl = getGoogleSheetsWebhookUrl()
    if (!webhookUrl) {
      return { success: false, error: 'GOOGLE_SHEETS_WEB_APP_URL / GOOGLE_APPS_SCRIPT_URL not configured' }
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheet: 'Master_Kandang',
        action: payload.action || 'UPSERT_FARM_SHEEP',
        ...payload,
      }),
      redirect: 'follow',
    })

    if (!response.ok) {
      const statusText = response.statusText || `HTTP ${response.status}`
      console.warn('[Google Apps Script Master_Kandang Warning]:', statusText)
      return { success: false, error: statusText }
    }

    return { success: true, message: 'Berhasil sinkronisasi Master_Kandang ke Webhook' }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Gagal kirim Master_Kandang ke Webhook'
    console.warn('[Google Apps Script Master_Kandang Error]:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Append row to Kelahiran_Tindakan sheet via direct Google Sheets API v4
 */
export async function appendFarmEventRowToSheet(
  data: WebhookFarmEventPayload
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    let privateKey = process.env.GOOGLE_PRIVATE_KEY
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return { success: false, error: 'Google Sheets credentials not configured' }
    }

    privateKey = privateKey.replace(/\\n/g, '\n')
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const timestamp = new Date().toISOString()
    const rowValues = [
      timestamp,
      data.event_type,
      data.tag_code,
      data.sheep_name,
      data.event_date,
      data.lamb_count ?? '-',
      data.action_name ?? '-',
      data.notes || '-',
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Kelahiran_Tindakan!A:H',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [rowValues] },
    })

    return { success: true, message: 'Berhasil append ke Kelahiran_Tindakan Google Sheets' }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Gagal sinkronisasi ke Kelahiran_Tindakan'
    console.warn('[Google Sheets Kelahiran_Tindakan Error]:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Send POST request to Google Apps Script Webhook for Kelahiran_Tindakan
 */
export async function syncFarmEventToAppsScriptWebhook(
  payload: WebhookFarmEventPayload
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const webhookUrl = getGoogleSheetsWebhookUrl()
    if (!webhookUrl) {
      return { success: false, error: 'GOOGLE_SHEETS_WEB_APP_URL / GOOGLE_APPS_SCRIPT_URL not configured' }
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheet: 'Kelahiran_Tindakan',
        action: payload.action || 'RECORD_FARM_EVENT',
        ...payload,
      }),
      redirect: 'follow',
    })

    if (!response.ok) {
      const statusText = response.statusText || `HTTP ${response.status}`
      console.warn('[Google Apps Script Kelahiran_Tindakan Warning]:', statusText)
      return { success: false, error: statusText }
    }

    return { success: true, message: 'Berhasil sinkronisasi Kelahiran_Tindakan ke Webhook' }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Gagal kirim Kelahiran_Tindakan ke Webhook'
    console.warn('[Google Apps Script Kelahiran_Tindakan Error]:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

