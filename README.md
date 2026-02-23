# kikichoice-line-liff

LINE LIFF 商品清單 SPA（TanStack Router + Vite），部署目標為 Cloudflare Pages。

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Cloudflare Pages deployment

本 repo 內含 `.github/workflows/cloudflare-pages.yml`，push 到 `main` 會自動部署。

請先在 Cloudflare 建立一個 **Pages project**（不是 Worker app），再把 GitHub repo 對應好。

重要：若在 dashboard 建錯成 Worker app，`wrangler pages deploy` 會報：
- `Project not found ... [code: 8000007]`

可用以下指令檢查 Pages project 是否存在：

```bash
CLOUDFLARE_API_TOKEN=... \
CLOUDFLARE_ACCOUNT_ID=... \
npx wrangler pages project list
```

若清單為空，可先建立一個 Pages project：

```bash
CLOUDFLARE_API_TOKEN=... \
CLOUDFLARE_ACCOUNT_ID=... \
npx wrangler pages project create kikichoice-line-liff-pages --production-branch main
```

請先在 GitHub repo secrets 設定：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT_NAME`

另外已設定 `public/_redirects`，確保 SPA 深層路由（例如 `/p/demo-product`）在 Pages 正常 fallback 到 `index.html`。

## Relay URL spec (M0)

- Rich Menu URI format:
  - `https://liff.line.me/{LIFF_ID}?to={urlEncodedMyshipUrl}`
- `to` must be an `https` URL and pass hostname allowlist validation.
- Allowlist env:
  - `VITE_ALLOWED_RELAY_HOSTS=myship.7-11.com.tw`
  - Multiple hosts use comma-separated values.
- LIFF env:
  - `VITE_LIFF_ID=2000000000-xxxxxxxx`
