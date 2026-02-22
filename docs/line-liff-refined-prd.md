# PRD：LINE OA Rich Menu 六格商品 → LIFF 中繼頁 → 外部瀏覽器開啟賣貨便（Direct URL 版）

> 版本：v1.3（MVP，No Backend + No Google Sheet）
> 目標平台：LINE App（手機為主）
> 入口：LINE 官方帳號（OA）一對一聊天室 Rich Menu（六格商品）

---

## 0. 一句話目標
讓客人在 LINE 內點 Rich Menu 商品後，先進 LIFF 中繼頁，再由使用者點擊按鈕外開賣貨便，提升登入與下單成功率。

---

## 1. 背景與問題
- 你想用 Rich Menu 六格擺 6 個商品廣告。
- 直接在 LINE 內建瀏覽器開賣貨便時，LINE Login 可能失敗或卡住。
- 你要最短路徑上線，不用後端，也先不使用 Google Sheet。

---

## 2. 核心策略（最佳實務）
Rich Menu 不直連賣貨便頁面，而是先導到 LIFF 中繼頁。LIFF 讀取 Rich Menu 帶入的目標網址，使用者點「開啟賣貨便（外部瀏覽器）」後再外開。

為什麼要多這一下：
- iOS 與部分 WebView 對自動開新視窗限制嚴格，通常需要使用者手勢觸發。
- `liff.openWindow({ external: true })` 的外開成功率通常高於直接在 in-app 瀏覽器流程中登入。

---

## 3. 使用者流程（User Flow）

### 3.1 主流程（推薦）
1. 客人在 OA 一對一聊天室點 Rich Menu 某一格。
2. 開啟同一個 LIFF ID 的中繼頁，且 URL query 帶 `to` 參數。
3. 中繼頁顯示極簡畫面與主按鈕「開啟賣貨便（外部瀏覽器）」。
4. 客人點按鈕，LIFF 執行 `liff.openWindow({ url: to, external: true })`。
5. 客人在外部瀏覽器完成賣貨便登入與下單。

### 3.2 輔助流程（fallback）
- 若不在 LIFF 或 `openWindow` 不可用：
  - 顯示純連結
  - 顯示「複製連結」按鈕
  - 提示「請用 Safari/Chrome 開啟」

---

## 4. 功能需求（Functional Requirements）

### 4.1 Rich Menu（必做）
- **RM-1 六格商品圖**
  - 一張底圖（2x3 六格）
  - 每格綁定 URI action，導向同一 LIFF ID，不同 `to` 參數

### 4.2 LIFF 中繼頁（必做）
- **LIFF-1 解析 query 參數**
  - 例如：`?to=https%3A%2F%2Fmyship.7-11.com.tw%2F...`
- **LIFF-2 顯示極簡畫面**
  - 快速顯示主按鈕，不讓使用者等待太久
- **LIFF-3 外開賣貨便**
  - 按鈕 click 時呼叫 `liff.openWindow({ url: to, external: true })`
- **LIFF-4 fallback**
  - LIFF init 失敗或外開失敗時，保留手動連結與複製功能

### 4.3 安全需求（必做）
- **SEC-1 參數驗證**
  - `to` 必須可被解析成合法 URL
  - 協定必須為 `https`
- **SEC-2 網域白名單**
  - 只允許指定 host（例如 `myship.7-11.com.tw`）
  - 不在白名單則拒絕外開並顯示錯誤
- **SEC-3 防 open redirect**
  - 禁止任意外站連結透過 LIFF 被轉址

---

## 5. URL 與參數設計

### 5.1 Rich Menu → LIFF URL
- 每格 URI action：
  - `https://liff.line.me/{LIFF_ID}?to={urlEncodedMyshipUrl}`

### 5.2 `to` 參數規範
- 必填
- 值為 URL-encoded 完整賣貨便網址
- 僅允許白名單網域

### 5.3 路由設計（純 SPA）
- MVP 單頁：`/` 讀 query `to`
- 可選：保留測試路由，但正式流程以 `/` 為主

---

## 6. UI/UX 指南（中繼頁）
- 目標：低干擾，但明確引導「再點一下」
- 建議文案：
  - 標題：`即將開啟賣貨便下單`
  - 說明：`為避免 LINE 內建瀏覽器登入失敗，建議用 Safari/Chrome 開啟。`
  - 按鈕：`開啟賣貨便（外部瀏覽器）`
- 顯示節奏：
  - 立即可點
  - 若有 loading，建議不超過 300ms 到 800ms

---

## 7. 風險與對策
- **R1：無法 0 互動自動外開**
  - 對策：採一次點擊外開策略，保留 fallback
- **R2：`to` 被惡意帶入非預期網址**
  - 對策：強制 `https` + host allowlist
- **R3：賣貨便仍需登入**
  - 對策：中繼頁提示改用 Safari/Chrome，並可重試

---

## 8. 驗收標準（Acceptance Criteria）
- Rich Menu 六格點擊後可開啟 LIFF 中繼頁（iOS/Android）
- 中繼頁按鈕可外開到正確賣貨便網址
- `to` 缺失或不合法時，會顯示錯誤且不外開
- LIFF init 失敗時仍可用純連結 + 複製連結完成開啟

---

## 9. 里程碑（Milestones）
- **M0**：完成 `to` 參數規格與安全驗證（https + allowlist）
- **M1**：完成 LIFF 中繼頁（按鈕外開 + fallback）
- **M2**：完成 Rich Menu 六格對接（6 組 URI）
- **M3**：完成跨裝置測試與正式上線

---

## 10. 非目標（Non-Goals）
- 不做 Google Sheet 管理商品
- 不做後端 API / DB
- 不做 LIFF 內結帳流程
- 不做訂單狀態回傳與 webhook
