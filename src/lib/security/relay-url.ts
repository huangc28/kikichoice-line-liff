import type { RelayErrorCode, RelayValidationResult } from '../../features/relay/types'

const DEFAULT_ALLOWED_RELAY_HOSTS = ['myship.7-11.com.tw']

const RELAY_ERROR_MESSAGES: Record<RelayErrorCode, string> = {
  MISSING_TO: '缺少必要參數 to。',
  INVALID_TO_URL: 'to 不是合法網址。',
  INSECURE_PROTOCOL: '只允許 https 連結。',
  HOST_NOT_ALLOWED: '此連結網域不在允許清單內。',
}

export function getRelayErrorMessage(code: RelayErrorCode): string {
  return RELAY_ERROR_MESSAGES[code]
}

export function getAllowedRelayHostsFromEnv(): string[] {
  const rawHosts = import.meta.env.VITE_ALLOWED_RELAY_HOSTS

  if (typeof rawHosts !== 'string' || rawHosts.trim().length === 0) {
    return DEFAULT_ALLOWED_RELAY_HOSTS
  }

  const normalized = rawHosts
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter((host) => host.length > 0)

  return normalized.length > 0 ? [...new Set(normalized)] : DEFAULT_ALLOWED_RELAY_HOSTS
}

export function encodeRelayTarget(targetUrl: string): string {
  return encodeURIComponent(targetUrl)
}

export function validateRelayTarget(
  rawTo: string | undefined,
  allowedHosts: string[],
): RelayValidationResult {
  if (!rawTo || rawTo.trim().length === 0) {
    return {
      ok: false,
      code: 'MISSING_TO',
      message: getRelayErrorMessage('MISSING_TO'),
    }
  }

  let parsed: URL

  try {
    parsed = new URL(rawTo)
  } catch {
    return {
      ok: false,
      code: 'INVALID_TO_URL',
      message: getRelayErrorMessage('INVALID_TO_URL'),
      rawTo,
    }
  }

  if (parsed.protocol !== 'https:') {
    return {
      ok: false,
      code: 'INSECURE_PROTOCOL',
      message: getRelayErrorMessage('INSECURE_PROTOCOL'),
      rawTo,
    }
  }

  const hostname = parsed.hostname.toLowerCase()
  const normalizedAllowedHosts = allowedHosts.map((host) => host.toLowerCase())

  if (!normalizedAllowedHosts.includes(hostname)) {
    return {
      ok: false,
      code: 'HOST_NOT_ALLOWED',
      message: getRelayErrorMessage('HOST_NOT_ALLOWED'),
      rawTo,
    }
  }

  return {
    ok: true,
    targetUrl: parsed.toString(),
    hostname,
  }
}
