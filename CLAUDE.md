# kikichoice-line-liff

LINE **LIFF**(LINE Front-end Framework)內嵌的商品清單 SPA。
Vite + TanStack Router,部署到 **Cloudflare Pages**。後端 API 來自 `kikichoice-be`。
跨專案地圖見上一層 `../CLAUDE.md`。

## Stack

- **Vite** + **React**
- **TanStack Router**(`@tanstack/react-router`,file-based,routes 用 `tsr generate` 產生)
- **@line/liff** — LINE LIFF SDK

## 目錄結構

```
src/
  routes/
    __root.tsx        # root route
    index.tsx         # 商品清單
    p.$id.tsx         # 商品詳情
    types.ts
  features/relay/     # relay 功能頁(近期 UI 重點)
  lib/
    liff/             # LIFF 初始化 / 封裝
    security/
```

## 指令

```bash
npm install
npm run dev            # predev 會先跑 routes:generate (tsr generate)
npm run build          # tsc -b && vite build(prebuild 也會 routes:generate)
npm run lint           # eslint
npm run preview
npm run pages:preview  # 本機模擬 Cloudflare Pages(wrangler pages dev)
npm run pages:deploy   # 手動部署到 Cloudflare Pages
```

> 改 routes 後不必手動產生:`predev` / `prebuild` 會自動 `tsr generate`。
> 不要手改自動產生的 route tree 檔。

## 部署(Cloudflare Pages)

- push 到 `main` 會經 `.github/workflows/cloudflare-pages.yml` 自動部署。
- Cloudflare 上必須是 **Pages project**(不是 Worker app),否則 `wrangler pages deploy` 會報
  `Project not found ... [code: 8000007]`(詳見 README)。
- Vite env vars 由 GitHub workflow 注入 build step。

## 待補

- [ ] LIFF ID 與 API base 等環境變數清單(VITE_*)
- [ ] 後端 API 串接的進入點(`src/lib` 下哪支)

## Agent skills

> Configures Matt Pocock's engineering skills (to-issues, triage, to-prd, diagnose, tdd, improve-codebase-architecture, zoom-out) for this repo. Edit `docs/agents/*.md` to adjust.

### Issue tracker

Issues live as GitHub issues for this repo (use the `gh` CLI, inferred from `git remote`). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles; label strings equal their names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
