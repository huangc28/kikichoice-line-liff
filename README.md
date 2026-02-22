# kikichoice-line-liff

LINE LIFF 商品清單 SPA（TanStack Router + Vite），部署目標為 Cloudflare Pages。test

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

請先在 Cloudflare 建立一個 Pages 專案（例如 `kikichoice-line-liff`），再把 GitHub repo 對應好。

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
