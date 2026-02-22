export type RelayLiffClient = {
  init: (config: { liffId: string }) => Promise<void>
  openWindow: (config: { url: string; external?: boolean }) => void
  isInClient: () => boolean
}

export type LiffInitResult =
  | {
      ok: true
      liff: RelayLiffClient
      isInClient: boolean
    }
  | {
      ok: false
      message: string
    }

export function getLiffIdFromEnv(): string | undefined {
  const liffId = import.meta.env.VITE_LIFF_ID

  if (typeof liffId !== 'string') {
    return undefined
  }

  const trimmed = liffId.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export async function initRelayLiff(liffId: string): Promise<LiffInitResult> {
  try {
    const module = await import('@line/liff')
    const liff = module.default as RelayLiffClient

    await liff.init({ liffId })

    return {
      ok: true,
      liff,
      isInClient: liff.isInClient(),
    }
  } catch {
    return {
      ok: false,
      message: 'LIFF 初始化失敗，將改用一般瀏覽器開啟。',
    }
  }
}

export async function openExternalWithLiff(liff: RelayLiffClient, url: string): Promise<void> {
  liff.openWindow({ url, external: true })
}
