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
  tracking_code: string
  customer_name: string
  record_date: string
  current_weight: number
  health_status: string
  notes?: string | null
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
 * Send POST request to Google Apps Script Webhook URL
 * (Non-blocking fallback when GOOGLE_APPS_SCRIPT_URL is provided)
 */
export async function syncProgressToAppsScriptWebhook(
  payload: WebhookProgressPayload
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_URL
    if (!webhookUrl) {
      return {
        success: false,
        error: 'GOOGLE_APPS_SCRIPT_URL not configured',
      }
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
