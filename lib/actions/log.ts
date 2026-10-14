'use server'

import {
  createProgressLog as _createProgressLog,
  syncAllProgressLogsToSheets as _syncAllProgressLogsToSheets,
} from './progress'

/**
 * Wrapper actions for log progress to ensure backwards compatibility
 */
export async function createProgressLog(formData: FormData) {
  return _createProgressLog(formData)
}

export async function syncAllProgressLogsToSheets() {
  return _syncAllProgressLogsToSheets()
}
