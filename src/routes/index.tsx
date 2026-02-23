import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { RelayLiffClient } from '../lib/liff/client'
import { getLiffIdFromEnv, initRelayLiff, openExternalWithLiff } from '../lib/liff/client'
import { encodeRelayTarget, getAllowedRelayHostsFromEnv, validateRelayTarget } from '../lib/security/relay-url'

type RelaySearch = {
  to?: string
}

type LiffState = {
  mode: 'initializing' | 'ready' | 'fallback'
  message: string
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
  const exampleTarget = 'https://myship.7-11.com.tw/general/detail/GM1234567890'
  const exampleRelayUrl = `https://liff.line.me/{LIFF_ID}?to=${encodeRelayTarget(exampleTarget)}`
  const liffRef = useRef<RelayLiffClient | null>(null)
  const [liffState, setLiffState] = useState<LiffState>({
    mode: 'initializing',
    message: '正在初始化 LIFF...',
  })
  const [openError, setOpenError] = useState<string | null>(null)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  const canOpen = validation.ok

  useEffect(() => {
    if (!validation.ok) {
      setLiffState({
        mode: 'fallback',
        message: '參數驗證失敗，請改用下方連結手動開啟。',
      })
      return
    }

    const liffId = getLiffIdFromEnv()

    if (!liffId) {
      setLiffState({
        mode: 'fallback',
        message: '未設定 VITE_LIFF_ID，將改用一般瀏覽器開啟。',
      })
      return
    }

    let cancelled = false
    setLiffState({
      mode: 'initializing',
      message: '正在初始化 LIFF...',
    })

    void (async () => {
      const result = await initRelayLiff(liffId)

      if (cancelled) {
        return
      }

      if (!result.ok) {
        liffRef.current = null
        setLiffState({
          mode: 'fallback',
          message: result.message,
        })
        return
      }

      liffRef.current = result.liff
      setLiffState({
        mode: 'ready',
        message: result.isInClient
          ? 'LIFF 初始化成功，可用外部瀏覽器開啟。'
          : '目前不在 LINE 內，但仍可嘗試外開。',
      })
    })()

    return () => {
      cancelled = true
    }
  }, [validation.ok])

  const targetUrl = validation.ok ? validation.targetUrl : null

  async function handleOpenRelay() {
    if (!targetUrl) {
      return
    }

    setOpenError(null)

    try {
      if (liffRef.current) {
        await openExternalWithLiff(liffRef.current, targetUrl)
        return
      }

      const opened = window.open(targetUrl, '_blank', 'noopener,noreferrer')

      if (!opened) {
        throw new Error('BROWSER_POPUP_BLOCKED')
      }
    } catch {
      setOpenError('外開失敗，請使用下方純連結或複製連結後在 Safari/Chrome 開啟。')
    }
  }

  async function handleCopyLink() {
    if (!targetUrl) {
      return
    }

    setCopyMessage(null)

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(targetUrl)
      } else {
        const copied = copyByExecCommand(targetUrl)

        if (!copied) {
          throw new Error('CLIPBOARD_UNAVAILABLE')
        }
      }

      setCopyMessage('連結已複製。')
    } catch {
      setCopyMessage('無法自動複製，請長按下方連結手動複製。')
    }
  }

  return (
    <section className="panel">
      <p className="eyebrow">LIFF Relay</p>
      <h1>即將開啟賣貨便下單</h1>
      <p>為避免 LINE 內建瀏覽器登入失敗，建議用 Safari/Chrome 開啟。</p>
      {validation.ok ? (
        <div className="status success">
          <strong>驗證結果：通過</strong>
          <p>連結可用，已通過 https 與白名單檢查。</p>
          <p>
            host: <code>{validation.hostname}</code>
          </p>
        </div>
      ) : (
        <div className="status error">
          <strong>驗證結果：失敗</strong>
          <p>
            [{validation.code}] {validation.message}
          </p>
        </div>
      )}
      <div className={`status ${liffState.mode === 'ready' ? 'success' : 'error'}`}>
        <strong>LIFF 狀態</strong>
        <p>{liffState.message}</p>
      </div>
      {openError ? (
        <div className="status error">
          <strong>外開失敗</strong>
          <p>{openError}</p>
        </div>
      ) : null}
      {copyMessage ? (
        <div className="status success">
          <strong>複製狀態</strong>
          <p>{copyMessage}</p>
        </div>
      ) : null}
      <p>
        允許網域：<code>{allowedHosts.join(', ')}</code>
      </p>
      {targetUrl ? (
        <p>
          目標連結：<a href={targetUrl}>{targetUrl}</a>
        </p>
      ) : null}
      <p>
        範例 URI：<code>{exampleRelayUrl}</code>
      </p>
      <div className="actions">
        <button className="button button-reset" disabled={!canOpen} onClick={handleOpenRelay} type="button">
          開啟賣貨便（外部瀏覽器）
        </button>
        <button className="button secondary button-reset" disabled={!canOpen} onClick={handleCopyLink} type="button">
          複製連結
        </button>
        <Link className="button" params={{ id: 'demo-product' }} to="/p/$id">
          前往測試頁
        </Link>
      </div>
    </section>
  )
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
