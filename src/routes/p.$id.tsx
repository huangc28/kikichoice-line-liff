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
      <p>這頁僅保留給開發測試使用，正式流程會在 `/` 走 `to` 參數中繼外開。</p>
      <div className="actions">
        <Link className="button secondary" search={{}} to="/">
          回商品列表
        </Link>
      </div>
    </section>
  )
}
