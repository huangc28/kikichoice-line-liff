import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { RelayLiffClient } from '../lib/liff/client'
import { getLiffIdFromEnv, initRelayLiff, openExternalWithLiff } from '../lib/liff/client'
import { getAllowedRelayHostsFromEnv, validateRelayTarget } from '../lib/security/relay-url'

type RelaySearch = {
  to?: string
}

type LiffState = {
  mode: 'initializing' | 'ready' | 'fallback'
}

type InlineNotice = {
  tone: 'success' | 'error'
  text: string
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): RelaySearch => {
    if (typeof search.to === 'string') {
      return { to: search.to }
    }

    if (typeof search['liff.state'] === 'string') {
      const toFromLiffState = extractToFromLiffState(search['liff.state'])

      if (toFromLiffState) {
        return { to: toFromLiffState }
      }
    }

    return {}
  },
  component: HomePage,
})

function HomePage() {
  const { to } = Route.useSearch()
  const allowedHosts = useMemo(() => getAllowedRelayHostsFromEnv(), [])
  const validation = validateRelayTarget(to, allowedHosts)
  const liffRef = useRef<RelayLiffClient | null>(null)
  const requestIdRef = useRef<string>(createRequestId())
  const initialToRef = useRef<string | undefined>(to)
  const [liffState, setLiffState] = useState<LiffState>({
    mode: 'initializing',
  })
  const [openError, setOpenError] = useState<string | null>(null)
  const [copyNotice, setCopyNotice] = useState<InlineNotice | null>(null)
  const validationOk = validation.ok
  const validationHostname = validation.ok ? validation.hostname : undefined
  const validationCode = validation.ok ? undefined : validation.code

  function logRelayEvent(event: string, payload: Record<string, unknown> = {}) {
    console.info('[relay]', event, {
      requestId: requestIdRef.current,
      ...payload,
    })
  }

  useEffect(() => {
    logRelayEvent('page_opened', {
      hasToParam: typeof initialToRef.current === 'string' && initialToRef.current.length > 0,
    })
  }, [])

  useEffect(() => {
    logRelayEvent('validation_result', validationOk ? { ok: true, hostname: validationHostname } : { ok: false, code: validationCode })

    if (!validationOk) {
      liffRef.current = null
      setLiffState({
        mode: 'fallback',
      })
      return
    }

    const liffId = getLiffIdFromEnv()

    if (!liffId) {
      liffRef.current = null
      logRelayEvent('liff_init_result', {
        ok: false,
        reason: 'LIFF_ID_MISSING',
      })
      setLiffState({
        mode: 'fallback',
      })
      return
    }

    let cancelled = false
    liffRef.current = null
    setLiffState({
      mode: 'initializing',
    })

    void (async () => {
      const result = await initRelayLiff(liffId)

      if (cancelled) {
        return
      }

      if (!result.ok) {
        liffRef.current = null
        logRelayEvent('liff_init_result', {
          ok: false,
          reason: result.message,
        })
        setLiffState({
          mode: 'fallback',
        })
        return
      }

      liffRef.current = result.liff
      logRelayEvent('liff_init_result', {
        ok: true,
        isInClient: result.isInClient,
      })
      setLiffState({
        mode: 'ready',
      })
    })()

    return () => {
      cancelled = true
    }
  }, [validationOk, validationHostname, validationCode])

  const targetUrl = validation.ok ? validation.targetUrl : null
  const targetHostname = validationHostname
  const isInvalidLink = !validationOk
  const canOpen = Boolean(targetUrl) && liffState.mode !== 'initializing'
  const showAssist = Boolean(targetUrl) && !isInvalidLink && liffState.mode !== 'initializing'
  const shouldShowRetry = Boolean(openError) && canOpen

  const instruction = isInvalidLink ? '連結已失效，請回到 LINE 重新點一次。' : '請點下方按鈕，使用 Safari 或 Chrome 繼續下單。'
  const statusTitle = isInvalidLink
    ? '目前無法開啟連結'
    : liffState.mode === 'initializing'
      ? '正在準備開啟頁面…'
      : openError
        ? '沒有成功開啟'
        : '已準備完成'
  const statusHint = isInvalidLink
    ? '請從 LINE 聊天視窗重新進入。'
    : liffState.mode === 'initializing'
      ? '請稍候 1 到 2 秒。'
      : openError
        ? '請改用複製連結到 Safari/Chrome。'
        : '點一下即可前往下單頁。'
  const statusClass = isInvalidLink || openError ? 'error' : 'success'

  async function handleOpenRelay() {
    if (!targetUrl) {
      return
    }

    setOpenError(null)
    setCopyNotice(null)
    logRelayEvent('open_clicked', {
      hostname: targetHostname,
      source: liffRef.current ? 'liff' : 'window_open',
    })

    try {
      if (liffRef.current) {
        await openExternalWithLiff(liffRef.current, targetUrl)
        logRelayEvent('open_succeeded', {
          hostname: targetHostname,
          source: 'liff',
        })
        return
      }

      const opened = window.open(targetUrl, '_blank', 'noopener,noreferrer')

      if (!opened) {
        throw new Error('BROWSER_POPUP_BLOCKED')
      }

      logRelayEvent('open_succeeded', {
        hostname: targetHostname,
        source: 'window_open',
      })
    } catch {
      logRelayEvent('open_failed', {
        hostname: targetHostname,
      })
      setOpenError('沒有成功開啟，請先複製連結再到 Safari/Chrome 開啟。')
    }
  }

  async function handleCopyLink() {
    if (!targetUrl) {
      return
    }

    setCopyNotice(null)
    logRelayEvent('copy_link_clicked', {
      hostname: targetHostname,
    })

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(targetUrl)
      } else {
        const copied = copyByExecCommand(targetUrl)

        if (!copied) {
          throw new Error('CLIPBOARD_UNAVAILABLE')
        }
      }

      setCopyNotice({
        tone: 'success',
        text: '連結已複製。',
      })
    } catch {
      logRelayEvent('copy_link_failed', {
        hostname: targetHostname,
      })
      setCopyNotice({
        tone: 'error',
        text: '無法自動複製，請直接點下方連結後用 Safari/Chrome 開啟。',
      })
    }
  }

  return (
    <section className="relay-shell">
      <article className="relay-card">
        <p className="relay-eyebrow">KikiChoice Checkout</p>
        <h1>準備前往下單</h1>
        <p className="relay-instruction">{instruction}</p>
        <div aria-live="polite" className={`relay-status ${statusClass}`}>
          <p className="relay-status-title">{statusTitle}</p>
          <p>{statusHint}</p>
        </div>
        <div className="relay-actions">
          <button className="relay-primary button-reset" disabled={!canOpen} onClick={handleOpenRelay} type="button">
            開啟 Safari/Chrome
          </button>
        </div>
        {showAssist ? (
          <div className="relay-assist" role="group">
            <p>若沒有自動開啟：</p>
            <div className="relay-assist-actions">
              <button className="relay-secondary button-reset" onClick={handleCopyLink} type="button">
                複製連結
              </button>
              {shouldShowRetry ? (
                <button className="relay-link button-reset" onClick={handleOpenRelay} type="button">
                  重新嘗試
                </button>
              ) : null}
            </div>
            {targetUrl ? (
              <p className="relay-manual-link">
                手動開啟：<a href={targetUrl}>前往下單頁</a>
              </p>
            ) : null}
          </div>
        ) : null}
        {openError ? (
          <p aria-live="polite" className="relay-inline-error">
            {openError}
          </p>
        ) : null}
        {copyNotice ? (
          <p aria-live="polite" className={`relay-inline-message ${copyNotice.tone}`}>
            {copyNotice.text}
          </p>
        ) : null}
        <p className="relay-footnote">開啟後可返回 LINE 繼續查看訊息。</p>
      </article>
    </section>
  )
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `relay-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function copyByExecCommand(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'

  document.body.appendChild(textarea)
  textarea.select()

  let copied = false

  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  } finally {
    document.body.removeChild(textarea)
  }

  return copied
}

function extractToFromLiffState(liffState: string): string | undefined {
  const candidates = [liffState]

  try {
    candidates.push(decodeURIComponent(liffState))
  } catch {
    // ignore decode failure and continue with original value
  }

  for (const candidate of candidates) {
    const normalized = candidate.startsWith('?') ? candidate.slice(1) : candidate
    const nestedSearch = new URLSearchParams(normalized)
    const to = nestedSearch.get('to')

    if (to && to.trim().length > 0) {
      return to
    }
  }

  return undefined
}
