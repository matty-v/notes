export const API_BASE_URL = 'https://sheetsapi-g56q77hy2a-uc.a.run.app'

export const LOCAL_STORAGE_KEYS = {
  SPREADSHEET_ID: 'notesSpreadsheetId',
  ANTHROPIC_API_KEY: 'notesAnthropicApiKey',
  SOURCES: 'notesSources',
  ACTIVE_SOURCE_ID: 'notesActiveSourceId',
}

export const SERVICE_ACCOUNT_EMAIL = 'sheets-db-api@kinetic-object-322814.iam.gserviceaccount.com'

export const SHEETS_CONFIG = {
  notes: ['id', 'title', 'content', 'tags', 'createdAt', 'updatedAt'],
}
