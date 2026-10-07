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

/**
 * Append progress log row to Google Sheets
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
      console.warn(
        '[Google Sheets] Kredensial belum lengkap di environment variable. Sinkronisasi dilewati.'
      )
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
    console.error('[Google Sheets Error]:', errorMsg)
    return {
      success: false,
      error: errorMsg,
    }
  }
}
