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

請先在 Cloudflare 建立一個 Pages 專案（例如 `kikichoice-line-liff`），再把 GitHub repo 對應好。

請先在 GitHub repo secrets 設定：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT_NAME`

另外已設定 `public/_redirects`，確保 SPA 深層路由（例如 `/p/demo-product`）在 Pages 正常 fallback 到 `index.html`。
