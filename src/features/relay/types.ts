export type RelayErrorCode =
  | 'MISSING_TO'
  | 'INVALID_TO_URL'
  | 'INSECURE_PROTOCOL'
  | 'HOST_NOT_ALLOWED'

export type RelayValidationError = {
  ok: false
  code: RelayErrorCode
  message: string
  rawTo?: string
}

export type RelayValidationSuccess = {
  ok: true
  targetUrl: string
  hostname: string
}

export type RelayValidationResult = RelayValidationSuccess | RelayValidationError
