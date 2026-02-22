import { Link, createFileRoute } from '@tanstack/react-router'

import { encodeRelayTarget, getAllowedRelayHostsFromEnv, validateRelayTarget } from '../lib/security/relay-url'

type RelaySearch = {
  to?: string
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): RelaySearch => {
    if (typeof search.to === 'string') {
      return { to: search.to }
    }

    return {}
  },
  component: HomePage,
})

function HomePage() {
  const { to } = Route.useSearch()
  const allowedHosts = getAllowedRelayHostsFromEnv()
  const validation = validateRelayTarget(to, allowedHosts)
  const exampleTarget = 'https://myship.7-11.com.tw/general/detail/GM1234567890'
  const exampleRelayUrl = `https://liff.line.me/{LIFF_ID}?to=${encodeRelayTarget(exampleTarget)}`

  return (
    <section className="panel">
      <p className="eyebrow">M0 參數與安全驗證</p>
      <h1>LIFF 中繼 `to` 參數檢查</h1>
      <p>這一版先完成 12.2：`to` 解析、https 驗證、網域白名單驗證與錯誤碼定義。</p>
      {validation.ok ? (
        <div className="status success">
          <strong>驗證結果：通過</strong>
          <p>可用於 M1 外開流程。</p>
          <p>
            target: <code>{validation.targetUrl}</code>
          </p>
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
      <p>
        允許網域：<code>{allowedHosts.join(', ')}</code>
      </p>
      <p>
        範例 URI：<code>{exampleRelayUrl}</code>
      </p>
      <div className="actions">
        <Link className="button" params={{ id: 'demo-product' }} to="/p/$id">
          前往測試頁
        </Link>
      </div>
    </section>
  )
}
