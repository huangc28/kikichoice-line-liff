# 實作 PRD：LINE OA Rich Menu 六格商品 → LIFF 中繼頁（Direct URL Relay）

> 版本：v0.3（Implementation Plan, No Google Sheet）
> 對應產品需求：`docs/line-liff-refined-prd.md`（已依最新流程覆寫）
> 文件目的：把「Rich Menu 帶目標 URL，LIFF 直接外開」拆成可執行工程計畫

---

## 1. 文件定位與範圍

### 1.1 文件角色
- 本文件是工程實作計畫（How / When / Done）。
- 本版以「無 Google Sheet」為前提。

### 1.2 本文件涵蓋
- Rich Menu URL 參數設計
- LIFF 中繼頁外開流程
- 安全檢查（白名單）與 fallback
- M0-M3 任務拆解、驗收、上線

### 1.3 不涵蓋
- Google Sheet / CMS / API
- 站內結帳、訂單 webhook、會員系統

---

## 2. 核心架構（No Sheet）

### 2.1 主流程
1. 使用者點 Rich Menu 某格
2. 開啟 LIFF URL（query 帶 `to`）
3. LIFF 解析 `to`（賣貨便目標網址）
4. 點擊按鈕後 `liff.openWindow({ url: to, external: true })`
5. 外部瀏覽器進入賣貨便

### 2.2 參數規格
- 必填參數：`to`
- 格式：URL encode 後的完整賣貨便網址
- 範例：
  - `https://liff.line.me/{LIFF_ID}?to=https%3A%2F%2Fmyship.7-11.com.tw%2F...`

### 2.3 為何不用 `pid`
- 目前沒有 Sheet/CMS 查表需求。
- Rich Menu 可直接帶每格對應最終連結。
- 減少一層資料依賴，MVP 更快上線。

---

## 3. 功能需求對應

### 3.1 Rich Menu（必做）
- 六格各自帶不同 `to` 參數
- 每格都導向同一個 LIFF ID

### 3.2 LIFF 中繼頁（必做）
- 解析 query `to`
- 顯示極簡 UI（標題、說明、主按鈕）
- 主按鈕觸發外開（`external: true`）
- fallback：純連結 + copy + retry

### 3.3 安全限制（必做）
- 驗證 `to` 是否為 `https`
- 驗證 `to` host 是否在 allowlist（例如 `myship.7-11.com.tw`）
- 驗證失敗時不外開，顯示錯誤訊息

---

## 4. 路由與狀態

### 4.1 路由
- `/`：唯一中繼頁，讀取 `to`
- `/p/$id`：僅保留開發測試用途（可後續移除）

### 4.2 頁面狀態
- `loading`：LIFF 初始化中
- `ready`：可外開
- `error`：`to` 缺失 / 格式錯誤 / 不在白名單 / LIFF 初始化失敗

---

## 5. 中繼頁 UX 文案

- 標題：`即將開啟賣貨便下單`
- 說明：`為避免 LINE 內建瀏覽器登入失敗，建議用 Safari/Chrome 開啟。`
- 主按鈕：`開啟賣貨便（外部瀏覽器）`
- fallback：
  - `如果未成功開啟，請改用下方連結。`
  - `複製連結`

---

## 6. 技術設計

### 6.1 模組切分
- `src/features/relay/`：`to` 解析、驗證、外開流程
- `src/lib/liff/`：LIFF init、能力檢查
- `src/lib/security/`：URL 白名單驗證

### 6.2 外開流程（Pseudo）
1. 解析 `to`
2. 驗證 URL（protocol + hostname allowlist）
3. 按鈕 click：
   - 有 LIFF：`liff.openWindow({ url: to, external: true })`
   - 無 LIFF：`window.open(to, '_blank')`
4. 失敗時顯示手動連結與 copy

### 6.3 事件追蹤（選配）
- `relay_view`
- `relay_open_click`
- `relay_open_success`
- `relay_open_failed`

---

## 7. 里程碑與交付

### M0：參數與安全骨架（0.5-1 天）
- 定義 `to` 參數規格
- 完成 URL 驗證與 allowlist
- 交付：不合法 `to` 會被擋下

### M1：中繼頁外開流程（1 天）
- 完成 `to` 解析 + UI
- 完成 `liff.openWindow(external: true)`
- 完成 retry / fallback link / copy
- 交付：可穩定外開賣貨便

### M2：Rich Menu 對接（0.5-1 天）
- 產出六格對應 URL（encode 後）
- OA 後台設定與驗證
- 交付：六格皆可開到正確賣貨便

### M3：測試與上線（1 天）
- iOS/Android + LINE in-app 實測
- 發佈與回滾演練
- 交付：正式上線版本

---

## 8. 驗收清單（UAT）

### 功能驗收
- Rich Menu 六格皆能帶正確 `to` 到 LIFF
- 點主按鈕可外開對應賣貨便
- `to` 無效時有清楚錯誤與 fallback

### 相容性驗收
- iOS LINE in-app -> 外開 Safari
- Android LINE in-app -> 外開 Chrome
- LIFF 失敗時仍可用純連結完成開啟

---

## 9. 風險與對策

- 自動外開限制：採一次點擊策略
- 不當連結風險：強制 URL 驗證 + host allowlist
- 外開偶發失敗：保留 retry + copy link

---

## 10. 上線與回滾

### 10.1 上線
- merge `main` 觸發 Pages deploy
- 驗證 production URL（含 `?to=`）
- 更新 OA Rich Menu 六格 URI

### 10.2 回滾
- 回退 Cloudflare Pages 上一版
- 臨時將 Rich Menu 指回備援網址

---

## 11. 決策結論

- 本案採「Direct URL Relay」：Rich Menu 直接帶 `to`，LIFF 中繼外開。
- 不依賴 Google Sheet，先追求最短路徑上線。

---

## 12. TODOs（Progress Tracking）

> 狀態定義：`[ ]` 未開始、`[-]` 進行中、`[x]` 已完成、`[!]` 阻塞

### 12.1 基礎工程（已完成）
- [x] 建立 React + Vite + TanStack Router 專案
- [x] 建立 Cloudflare Pages deploy pipeline
- [x] 設定 SPA fallback

### 12.2 M0：參數與安全
- [x] 定義 `to` 參數格式與 URL encode 規則
- [x] 建立 URL parser 與驗證器（https + allowlist）
- [x] 定義錯誤碼與錯誤訊息（缺參數/不合法/不允許）

### 12.3 M1：LIFF 中繼頁
- [x] `/` 改為讀取 `to` 的中繼頁
- [x] 完成 `liff.init()` 與能力檢查
- [x] 完成「開啟賣貨便（外部瀏覽器）」按鈕
- [x] 完成 fallback：純連結 + copy + retry

### 12.4 M2：Rich Menu 對接
- [ ] 產出六格 URL encode 後 URI 清單
- [ ] 完成 OA 後台設定
- [ ] 完成六格實機點擊驗證

### 12.5 M3：上線
- [ ] iOS / Android / LINE in-app 實測
- [ ] 驗收清單全數通過
- [ ] 更新版本號與上線日期
