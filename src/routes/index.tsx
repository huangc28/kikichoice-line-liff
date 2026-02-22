import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section className="panel">
      <p className="eyebrow">LINE LIFF 商品清單</p>
      <h1>TanStack SPA 已初始化</h1>
      <p>
        這是 12.1 的骨架頁。下一步會串接 Google Sheet，並在 LIFF 內提供完整商品列表與詳情。
      </p>
      <div className="actions">
        <Link className="button" params={{ id: 'demo-product' }} to="/p/$id">
          前往商品詳情範例
        </Link>
      </div>
    </section>
  )
}
