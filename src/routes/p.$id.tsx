import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/p/$id')({
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { id } = Route.useParams()

  return (
    <section className="panel">
      <p className="eyebrow">商品詳情頁範例</p>
      <h1>{id}</h1>
      <p>這裡會在 M1 導入 Sheet 商品資料與 LIFF openWindow 行為。</p>
      <div className="actions">
        <Link className="button secondary" to="/">
          回商品列表
        </Link>
      </div>
    </section>
  )
}
