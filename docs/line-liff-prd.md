# PRD：LINE 群組「商品清單 / 下單」LIFF（導到 7-11 賣貨便）— Google Sheet 免後端版

> 版本：v1.1（MVP，No Backend）
> 目標平台：LINE App（手機為主），LIFF Web App
> 主要入口：群組置頂訊息貼上 `https://liff.line.me/{liffId}`（點擊開啟 LIFF）

---

## 1. 背景與問題
你把蝦皮客人導到 LINE 群組，但群內無法直接下單。希望提供一個「商品清單」入口，讓客人在群組內點擊後可以：
1) 看到商品列表與詳情
2) 點擊商品後，開啟對應 **7-11 賣貨便**連結完成下單

同時你不想維運額外的後端（Go backend），希望資料可用表格快速更新。

---

## 2. 目標（Goals）
- 群組置頂提供穩定入口（LIFF URL），點擊後開啟商品清單頁
- LIFF 顯示商品列表 / 商品詳情（圖片、價格、賣點、注意事項）
- 商品詳情頁一鍵開啟對應的賣貨便連結完成下單（建議 external 開啟）
- **商品資料由 Google Sheet 管理**：更新商品 = 更新表格，不用改程式碼
- 基本事件追蹤：列表曝光、商品點擊、導出到賣貨便點擊（可用第三方分析）

---

## 3. 非目標（Non-Goals）
- 不在 LIFF 內完成金流/結帳（結帳由賣貨便處理）
- MVP 不做會員系統、點數、推薦等進階功能
- MVP 不做「自動偵測賣貨便訂單成立」webhook（通常沒有官方事件來源）

---

## 4. 使用者與情境（User Stories）

### 4.1 買家（群組成員）
1. 我在群組看到置頂「商品清單/下單」，點了就能看到商品列表。
2. 我點某個商品可以看到詳情與價格，並一鍵前往賣貨便下單。
3. 如果 LINE 內建瀏覽器打不開，我能看到「改用外部瀏覽器」提示並完成下單。

### 4.2 賣家/管理者
1. 我能在 Google Sheet 新增/下架商品並設定對應賣貨便連結。
2. 我能調整商品排序、標籤（熱賣/新品/預購）。
3. 我能看到基本點擊數（列表曝光、商品點擊、導出賣貨便點擊）。

---

## 5. 產品流程（User Flow）
1. 群組置頂訊息貼 LIFF URL：`https://liff.line.me/{liffId}`
2. 使用者點擊 → 開啟 LIFF（可能在 LINE 內建瀏覽器或外部瀏覽器）
3. LIFF 讀取商品資料（Google Sheet → JSON/CSV endpoint）
4. 點商品進詳情頁（`/p/:id`）
5. 按「前往賣貨便下單」→ `liff.openWindow({ url, external: true })`

---

## 6. 功能需求（Functional Requirements）

### 6.1 LIFF 前台（必做）
- **FR-1 商品列表**
  - 顯示：商品圖、品名、價格、簡短賣點、標籤
  - 支援：搜尋（關鍵字）、排序（新品/熱賣/價格）
- **FR-2 商品詳情**
  - 顯示：多圖（可先 1 張）、完整描述、價格、注意事項（運送/取貨）
  - 主要 CTA：「前往賣貨便下單」
- **FR-3 開啟賣貨便**
  - 使用 `liff.openWindow()` 開啟指定 URL
  - 預設 `external: true`（降低 LINE in-app browser 相容問題風險）
- **FR-4 相容性提示**
  - 提示「若無法操作，請用 Safari/Chrome 開啟」
  - 提供備援：顯示純連結＋「複製連結」
- **FR-5 分析追蹤（免後端）**
  - MVP 建議直接用 GA / Plausible 記錄：list_view / product_view / outbound_click
  - 若不用第三方分析，也可先不做追蹤

---

## 7. 商品資料來源（Google Sheet CMS，免後端）

### 7.1 Sheet 欄位（第一列為 Header）
建議欄位（欄位名請固定，方便前端對應）：

- `id`：slug（唯一值）
- `name`：商品名稱
- `price`：數字
- `currency`：TWD（預設）
- `image1`：主圖 URL
- `image2`：副圖 URL（可空）
- `shortDesc`：列表短文案
- `description`：完整描述（可用多行）
- `tags`：用逗號分隔（例：`新品,熱賣`）
- `myshipUrl`：7-11 賣貨便連結
- `status`：`ACTIVE` / `INACTIVE`
- `sort`：排序（數字越小越前）

### 7.2 資料輸出方式（二選一）
**選項 A：OpenSheet（最省事，直接 JSON）**
- 前提：Google Sheet 需開啟「知道連結的人可檢視」
- 讀取方式：
  - `https://opensheet.elk.sh/{spreadsheetId}/{tabName}`
- 優點：前端直接 fetch JSON，不用自己 parse CSV
- 風險：依賴第三方服務（建議加 fallback）

**選項 B：Google gviz CSV（更少第三方依賴）**
- 前提：Sheet 可被讀取（通常也是「知道連結的人可檢視」或已發佈）
- 讀取方式（CSV）：
  - `https://docs.google.com/spreadsheets/d/{spreadsheetId}/gviz/tq?tqx=out:csv&sheet={tabName}`
- 前端：抓 CSV 後在瀏覽器 parse 成 JSON（用 papaparse 等）

### 7.3 快取與更新
- 前端建議加 1~5 分鐘 cache（或 ETag），避免每次都打 Google
- 若你用 Vercel/Cloudflare，可用 Edge cache（不需要自建後端）

---

## 8. 技術方案（Technical Design）

### 8.1 架構（No Backend）
- 前端：LIFF（React/Vite 或 React Router 7 SPA 皆可）
- 資料：Google Sheet（單一 tab）
- 部署：Vercel / Cloudflare Pages（純靜態）

### 8.2 LIFF 設定
- 建立 LIFF app（取得 `liffId`）
- 設定 Endpoint URL 指向前端部署網址
- 群組入口使用：`https://liff.line.me/{liffId}`

---

## 9. UI/UX（MVP）
- 列表頁：搜尋列 + 分類 chips（新品/熱賣/預購），商品卡片（圖、品名、價格、短文案）
- 詳情頁：圖片、描述、注意事項；大 CTA「前往 7-11 賣貨便下單」
- 備援：顯示純連結與「複製連結」按鈕；提示「若無法下單請改用外部瀏覽器」

---

## 10. 風險與對策
- **R1：LINE 內建瀏覽器相容問題**
  - 對策：預設 `external: true` 外開；提供備援提示/複製連結
- **R2：OpenSheet 服務不可用**
  - 對策：提供 gviz CSV 作為 fallback；或把最後一次成功資料 cache 在 localStorage
- **R3：Sheet 權限/公開造成資料外洩**
  - 對策：Sheet 僅放「可公開」資訊（不要放成本、客資）；需要私有資料就改成有後端/有權限的方案

---

## 11. 驗收標準（Acceptance Criteria）
- 群組置頂 LIFF URL：手機點擊可開啟商品列表（成功率高、載入 < 3s）
- 商品詳情頁可正確開啟對應賣貨便連結（iOS Safari / Android Chrome 可用）
- 更新 Google Sheet 後，前端在 5 分鐘內反映（或刷新即可反映）

---

## 12. 里程碑（Milestones）
- M0：LIFF 基礎頁面 + OpenSheet/CSV endpoint 串接
- M1：列表/詳情 + `openWindow` 導出賣貨便
- M2：搜尋/排序/標籤 + 基本分析追蹤
- M3（選配）：我已下單回報（若未來需要半自動對單）
